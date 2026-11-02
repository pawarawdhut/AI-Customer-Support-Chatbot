import { NextResponse, type NextRequest } from "next/server";
import { getScalekitAuth, getTenantId, isAuthConfigured } from "@/lib/auth";

type RouteHandler = (
  request: NextRequest,
  user: Record<string, unknown>,
  tenantId: string,
) => Promise<NextResponse>;

export async function withWorkspaceAuth(
  request: NextRequest,
  handler: RouteHandler,
) {
  const origin = request.headers.get("origin");
  if (origin) {
    let requestOrigin: string;
    let expectedOrigin: string;
    try {
      requestOrigin = new URL(origin).origin;
      const protocol =
        request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
        request.nextUrl.protocol.replace(/:$/, "");
      const host = request.headers.get("host");
      expectedOrigin = host ? new URL(`${protocol}://${host}`).origin : "";
    } catch {
      requestOrigin = "";
      expectedOrigin = "";
    }
    if (!requestOrigin || requestOrigin !== expectedOrigin) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
  } else if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.json({ error: "Request origin is required." }, { status: 403 });
  }
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Scalekit authentication is not configured." },
      { status: 503 },
    );
  }

  const protectedHandler = getScalekitAuth().withAuth(
    async (authenticatedRequest, { user }) => {
      if (!user) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }

      return handler(authenticatedRequest, user, getTenantId(user));
    },
  );

  return protectedHandler(request);
}
