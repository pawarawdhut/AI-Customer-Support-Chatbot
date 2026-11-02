import { z } from "zod";

export const siteInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  domain: z.string().trim().min(1).max(253),
  assistantName: z.string().trim().min(1).max(40),
  greeting: z.string().trim().min(1).max(240),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  knowledgeBase: z.string().max(12000),
});

export type SiteInput = z.infer<typeof siteInputSchema>;

export function normalizeDomain(value: string) {
  const input = value.trim();
  const address = /^[a-z][a-z\d+.-]*:\/\//i.test(input)
    ? input
    : `https://${input}`;

  let url: URL;
  try {
    url = new URL(address);
  } catch {
    return null;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname.includes("..") || hostname.length > 253) {
    return null;
  }

  return hostname;
}

export function isValidSiteId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function hasRequestBodyOverLimit(request: Request, maximumBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (contentLength === null) return false;

  const bytes = Number(contentLength);
  return !Number.isSafeInteger(bytes) || bytes < 0 || bytes > maximumBytes;
}
