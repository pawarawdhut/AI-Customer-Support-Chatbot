import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase, databaseErrorResponse } from "@/lib/db";
import { isValidSiteId } from "@/lib/site-input";
import {
  getAuthorizedSite,
  getWidgetCorsOrigin,
  widgetCorsHeaders,
  withWidgetCorsHeaders,
} from "@/lib/widget-security";

type RouteContext = { params: Promise<{ siteId: string }> };

async function findSite(request: NextRequest, context: RouteContext) {
  const origin = getWidgetCorsOrigin(request.headers.get("origin"));
  if (!origin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "An authorized website origin is required." },
        { status: 403 },
      ),
    };
  }

  const { siteId } = await context.params;
  if (!isValidSiteId(siteId)) {
    return {
      ok: false as const,
      response: withWidgetCorsHeaders(
        NextResponse.json({ error: "Invalid site identifier." }, { status: 400 }),
        origin,
      ),
    };
  }

  try {
    await connectToDatabase();
    const site = await getAuthorizedSite(siteId, origin);
    if (!site) {
      return {
        ok: false as const,
        response: withWidgetCorsHeaders(
          NextResponse.json(
            { error: "This website is not authorized." },
            { status: 403 },
          ),
          origin,
        ),
      };
    }
    return { ok: true as const, site, origin };
  } catch (error) {
    const databaseError = withWidgetCorsHeaders(
      databaseErrorResponse(error, "Could not load public widget settings."),
      origin,
    );
    return {
      ok: false as const,
      response: databaseError,
    };
  }
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  const result = await findSite(request, context);
  if (!result.ok) return result.response;
  return new Response(null, { status: 204, headers: widgetCorsHeaders(result.origin) });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const result = await findSite(request, context);
  if (!result.ok) return result.response;

  return NextResponse.json(
    {
      assistantName: result.site.assistantName,
      greeting: result.site.greeting,
      primaryColor: result.site.primaryColor,
    },
    { headers: widgetCorsHeaders(result.origin) },
  );
}
