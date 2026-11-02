import type { NextRequest } from "next/server";
import { getScalekitAuth, isAuthConfigured } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return Response.json(
      { error: "Scalekit authentication is not configured." },
      { status: 503 },
    );
  }
  return getScalekitAuth().createCallbackHandler()(request);
}
