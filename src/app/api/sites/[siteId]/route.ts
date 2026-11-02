import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase, databaseErrorResponse } from "@/lib/db";
import { Site } from "@/lib/models";
import { withWorkspaceAuth } from "@/lib/protected-route";
import {
  hasRequestBodyOverLimit,
  isValidSiteId,
  normalizeDomain,
  siteInputSchema,
} from "@/lib/site-input";

type RouteContext = { params: Promise<{ siteId: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  return withWorkspaceAuth(request, async (_request, _user, tenantId) => {
    if (hasRequestBodyOverLimit(request, 20_000)) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    const { siteId } = await context.params;
    if (!isValidSiteId(siteId)) {
      return NextResponse.json({ error: "Invalid site identifier." }, { status: 400 });
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
      const site = await Site.findOneAndUpdate(
        { siteId, tenantId },
        { ...parsed.data, domain },
        { new: true, runValidators: true },
      )
        .select(
          "siteId name domain assistantName greeting primaryColor knowledgeBase createdAt updatedAt",
        )
        .lean();

      if (!site) {
        return NextResponse.json({ error: "Site not found." }, { status: 404 });
      }

      return NextResponse.json({ site });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        return NextResponse.json(
          { error: "A site with that domain already exists in this workspace." },
          { status: 409 },
        );
      }
      return databaseErrorResponse(error, "Could not update workspace site.");
    }
  });
}
