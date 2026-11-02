import ScalekitClient from "@scalekit-sdk/node";
import { ScalekitAuthNext } from "@scalekit-sdk/node/next";

let authClient: ScalekitAuthNext | undefined;

export function isAuthConfigured() {
  return Boolean(
    process.env.SCALEKIT_ENVIRONMENT_URL &&
      process.env.SCALEKIT_CLIENT_ID &&
      process.env.SCALEKIT_CLIENT_SECRET &&
      process.env.COOKIE_ENCRYPTION_SECRET &&
      process.env.REDIRECT_URI,
  );
}

export function getScalekitAuth() {
  if (authClient) return authClient;

  const envUrl = process.env.SCALEKIT_ENVIRONMENT_URL;
  const clientId = process.env.SCALEKIT_CLIENT_ID;
  const clientSecret = process.env.SCALEKIT_CLIENT_SECRET;
  const cookieEncryptionSecret = process.env.COOKIE_ENCRYPTION_SECRET;
  const redirectUri = process.env.REDIRECT_URI;

  if (!envUrl || !clientId || !clientSecret || !cookieEncryptionSecret || !redirectUri) {
    throw new Error("Scalekit authentication environment variables are not configured.");
  }

  const client = new ScalekitClient(envUrl, clientId, clientSecret);
  authClient = new ScalekitAuthNext({
    client,
    redirectUri,
    cookieEncryptionSecret,
    postLoginRedirect: "/dashboard",
    postLogoutRedirectUri:
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });

  return authClient;
}

export async function getCurrentUser() {
  return getScalekitAuth().currentUser();
}

export function getTenantId(user: Record<string, unknown>) {
  const organizationId =
    user.org_id ?? user.organization_id ?? user.organizationId;
  const tenantId =
    typeof organizationId === "string" && organizationId.length > 0
      ? organizationId
      : user.sub;

  if (typeof tenantId !== "string" || tenantId.length === 0) {
    throw new Error("The authenticated Scalekit user has no tenant identifier.");
  }

  return tenantId;
}

export function getDisplayName(user: Record<string, unknown>) {
  const name = user.name ?? user.email;
  return typeof name === "string" && name.length > 0 ? name : "Workspace";
}
