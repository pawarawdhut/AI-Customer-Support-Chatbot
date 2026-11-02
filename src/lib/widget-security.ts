import { createHash } from "node:crypto";
import { RateLimit, Site } from "@/lib/models";
import { normalizeDomain } from "@/lib/site-input";

export function getWidgetCorsOrigin(origin: string | null) {
  if (!origin) return null;

  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
      return null;
    }
    return parsedOrigin.origin;
  } catch {
    return null;
  }
}

export function withWidgetCorsHeaders<T extends Response>(
  response: T,
  origin: string | null,
) {
  if (origin) {
    for (const [name, value] of Object.entries(widgetCorsHeaders(origin))) {
      response.headers.set(name, value);
    }
  }
  return response;
}

export async function getAuthorizedSite(siteId: string, origin: string | null) {
  const corsOrigin = getWidgetCorsOrigin(origin);
  if (!corsOrigin) return null;
  const requestHost = new URL(corsOrigin).hostname.toLowerCase();

  const site = await Site.findOne({ siteId }).lean();
  if (!site || normalizeDomain(site.domain) !== requestHost) return null;
  return site;
}

export function widgetCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export async function enforceWidgetRateLimit(siteId: string, ip: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60_000);
  const expiresAt = new Date(now.getTime() + 120_000);
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const key = createHash("sha256").update(`${siteId}:${ipHash}`).digest("hex");
  const expiredWindow = {
    $lte: [{ $ifNull: ["$windowStart", new Date(0)] }, windowStart],
  };

  const limit = await RateLimit.findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          count: {
            $cond: [
              expiredWindow,
              1,
              { $add: [{ $ifNull: ["$count", 0] }, 1] },
            ],
          },
          windowStart: {
            $cond: [expiredWindow, now, "$windowStart"],
          },
          expiresAt,
        },
      },
    ],
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: false,
      updatePipeline: true,
    },
  ).lean();

  return (limit?.count ?? 1) <= 100;
}
