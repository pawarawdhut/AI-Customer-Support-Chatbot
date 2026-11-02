import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase, databaseErrorResponse } from "@/lib/db";
import { Site } from "@/lib/models";
import { withWorkspaceAuth } from "@/lib/protected-route";
import {
  hasRequestBodyOverLimit,
  normalizeDomain,
  siteInputSchema,
} from "@/lib/site-input";

export async function GET(request: NextRequest) {
  return withWorkspaceAuth(request, async (_request, _user, tenantId) => {
    try {
      await connectToDatabase();
      const sites = await Site.find({ tenantId })
        .sort({ createdAt: -1 })
        .select(
          "siteId name domain assistantName greeting primaryColor knowledgeBase createdAt updatedAt",
        )
        .lean();

      return NextResponse.json({ sites });
    } catch (error) {
      return databaseErrorResponse(error, "Could not load workspace sites.");
    }
  });
}

export async function POST(request: NextRequest) {
  return withWorkspaceAuth(request, async (_request, _user, tenantId) => {
    if (hasRequestBodyOverLimit(request, 20_000)) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = siteInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the site details.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const domain = normalizeDomain(parsed.data.domain);
    if (!domain) {
      return NextResponse.json(
        { error: "Enter a domain only, such as example.com." },
        { status: 400 },
      );
    }

    try {
      await connectToDatabase();
      const site = await Site.create({
        ...parsed.data,
        domain,
        tenantId,
        siteId: randomUUID(),
      });

      return NextResponse.json({ site }, { status: 201 });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        return NextResponse.json(
          { error: "A site with that domain already exists in this workspace." },
          { status: 409 },
        );
      }
      return databaseErrorResponse(error, "Could not create workspace site.");
    }
  });
}
