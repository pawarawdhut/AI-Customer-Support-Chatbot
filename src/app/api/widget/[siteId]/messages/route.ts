import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAssistantReply } from "@/lib/ai";
import { connectToDatabase, databaseErrorResponse } from "@/lib/db";
import { Conversation } from "@/lib/models";
import { hasRequestBodyOverLimit, isValidSiteId } from "@/lib/site-input";
import {
  enforceWidgetRateLimit,
  getAuthorizedSite,
  getWidgetCorsOrigin,
  widgetCorsHeaders,
  withWidgetCorsHeaders,
} from "@/lib/widget-security";

const messageSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  conversationId: z.string().uuid().optional(),
});

export const maxDuration = 30;

type RouteContext = { params: Promise<{ siteId: string }> };

async function authorizedSite(request: NextRequest, siteId: string) {
  const origin = request.headers.get("origin");
  if (!origin || !isValidSiteId(siteId)) return null;

  const site = await getAuthorizedSite(siteId, origin);
  return site ? { site, origin } : null;
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  const corsOrigin = getWidgetCorsOrigin(request.headers.get("origin"));
  const { siteId } = await context.params;
  if (!isValidSiteId(siteId)) {
    return withWidgetCorsHeaders(
      NextResponse.json({ error: "Invalid site identifier." }, { status: 400 }),
      corsOrigin,
    );
  }
  if (!corsOrigin) {
    return NextResponse.json(
      { error: "An authorized website origin is required." },
      { status: 403 },
    );
  }

  try {
    await connectToDatabase();
    const result = await authorizedSite(request, siteId);
    if (!result) {
      return withWidgetCorsHeaders(
        NextResponse.json({ error: "This website is not authorized." }, { status: 403 }),
        corsOrigin,
      );
    }
    return new Response(null, {
      status: 204,
      headers: widgetCorsHeaders(corsOrigin),
    });
  } catch (error) {
    return withWidgetCorsHeaders(
      databaseErrorResponse(error, "Could not authorize widget preflight request."),
      corsOrigin,
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const corsOrigin = getWidgetCorsOrigin(request.headers.get("origin"));
  const { siteId } = await context.params;
  if (!isValidSiteId(siteId)) {
    return withWidgetCorsHeaders(
      NextResponse.json({ error: "Invalid site identifier." }, { status: 400 }),
      corsOrigin,
    );
  }
  if (hasRequestBodyOverLimit(request, 16_384)) {
    return withWidgetCorsHeaders(
      NextResponse.json({ error: "Request body is too large." }, { status: 413 }),
      corsOrigin,
    );
  }
  if (!corsOrigin) {
    return NextResponse.json(
      { error: "An authorized website origin is required." },
      { status: 403 },
    );
  }

  try {
    await connectToDatabase();
    const authorized = await authorizedSite(request, siteId);
    if (!authorized) {
      return withWidgetCorsHeaders(
        NextResponse.json({ error: "This website is not authorized." }, { status: 403 }),
        corsOrigin,
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp =
      request.headers.get("x-real-ip") ??
      forwardedFor?.split(",").at(-1)?.trim() ??
      "unknown";
    const withinLimit = await enforceWidgetRateLimit(siteId, clientIp);
    const headers = widgetCorsHeaders(corsOrigin);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a moment and try again." },
        { status: 429, headers },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400, headers },
      );
    }

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Send a message of up to 1,200 characters." },
        { status: 400, headers },
      );
    }

    const conversationId = parsed.data.conversationId ?? randomUUID();
    const conversation = await Conversation.findOne({
      siteId,
      conversationId,
    }).lean();
    const history = (conversation?.messages ?? [])
      .slice(-12)
      .map((item: { role: "user" | "assistant"; content: string }) => ({
        role: item.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: item.content }],
      }));

    history.push({ role: "user", parts: [{ text: parsed.data.message }] });
    const reply = await createAssistantReply(
      authorized.site.knowledgeBase,
      authorized.site.assistantName,
      history,
    );

    await Conversation.findOneAndUpdate(
      { siteId, conversationId },
      {
        $setOnInsert: { tenantId: authorized.site.tenantId },
        $push: {
          messages: {
            $each: [
              { role: "user", content: parsed.data.message },
              { role: "assistant", content: reply },
            ],
            $slice: -40,
          },
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    return NextResponse.json(
      { conversationId, reply },
      { headers },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AI is not configured.")) {
      return withWidgetCorsHeaders(
        NextResponse.json({ error: error.message }, { status: 503 }),
        corsOrigin,
      );
    }
    if (error instanceof Error && error.message.startsWith("The AI service")) {
      return withWidgetCorsHeaders(
        NextResponse.json({ error: error.message }, { status: 502 }),
        corsOrigin,
      );
    }
    return withWidgetCorsHeaders(
      databaseErrorResponse(error, "Widget message could not be processed."),
      corsOrigin,
    );
  }
}
