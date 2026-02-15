import type { DatabaseInstance } from "@packages/database/client";
import { team } from "@packages/database/schemas/auth";
import { captureSDKAuthFailed } from "@packages/posthog/sdk/server";
import { eq } from "drizzle-orm";
import { auth } from "../integrations/auth";
import { posthog } from "../integrations/posthog";

/**
 * Resolves an API key from the request, checking multiple sources:
 * 1. `X-API-Key` header (preferred by SDK clients)
 * 2. `sdk-api-key` header (legacy SDK clients)
 * 3. `apiKey` query parameter (sendBeacon fallback)
 */
export function resolveApiKey(request: Request): string | null {
   const xApiKey = request.headers.get("X-API-Key");
   if (xApiKey) return xApiKey;

   const sdkApiKey = request.headers.get("sdk-api-key");
   if (sdkApiKey) return sdkApiKey;

   const url = new URL(request.url);
   const queryApiKey = url.searchParams.get("apiKey");
   if (queryApiKey) return queryApiKey;

   return null;
}

/**
 * Authenticates the request using the API key and returns the organizationId
 * and userId. Sets the appropriate error status on failure.
 */
export async function authenticateRequest(
   request: Request,
   set: { status?: number | string },
): Promise<
   | {
        success: true;
        organizationId: string;
        teamId: string | undefined;
        userId: string | undefined;
     }
   | { success: false; error: string }
> {
   const endpoint = new URL(request.url).pathname;
   const apiKeyValue = resolveApiKey(request);

   if (!apiKeyValue) {
      captureSDKAuthFailed(posthog, {
         reason: "missing_api_key",
         endpoint,
      });
      set.status = 401;
      return { success: false, error: "Missing API Key." };
   }

   const result = await auth.api.verifyApiKey({
      body: { key: apiKeyValue },
   });

   if (!result.valid || !result.key) {
      const isRateLimited = result.error?.code === "RATE_LIMITED";
      const reason = isRateLimited ? "rate_limited" : "invalid_key";

      captureSDKAuthFailed(posthog, {
         reason,
         endpoint,
         organizationId: result.key?.metadata?.organizationId as
            | string
            | undefined,
         plan: result.key?.metadata?.plan as string | undefined,
         remaining: result.key?.remaining ?? undefined,
      });

      if (isRateLimited) {
         set.status = 429;
         return {
            success: false,
            error: "Rate limit exceeded. Please try again later.",
         };
      }

      set.status = 401;
      return { success: false, error: "Invalid API Key." };
   }

   const { organizationId, teamId } = result.key.metadata ?? {};

   if (!organizationId || typeof organizationId !== "string") {
      set.status = 403;
      return {
         success: false,
         error: "API key has no associated organization.",
      };
   }

   return {
      success: true,
      organizationId,
      teamId: typeof teamId === "string" ? teamId : undefined,
      userId: result.key.userId ?? undefined,
   };
}

/**
 * Checks whether the given origin hostname matches any of the allowed domain patterns.
 * Supports exact matches and wildcard subdomains (e.g. `*.example.com`).
 */
function matchesDomain(origin: string, patterns: string[]): boolean {
   try {
      const hostname = new URL(origin).hostname;
      return patterns.some((pattern) => {
         if (pattern.startsWith("*.")) {
            const suffix = pattern.slice(2);
            return hostname === suffix || hostname.endsWith(`.${suffix}`);
         }
         return hostname === pattern;
      });
   } catch {
      return false; // malformed URL
   }
}

/**
 * Soft domain filtering for SDK requests. When a team has `allowedDomains`
 * configured, the request's Origin/Referer header is checked against them.
 *
 * Returns `{ allowed: true }` when:
 * - No teamId (backwards compat with old keys)
 * - Team has no allowedDomains configured (opt-in behaviour)
 * - No Origin/Referer header present (server-side calls)
 * - Origin matches one of the allowed patterns
 */
export async function checkDomainAllowed(
   request: Request,
   teamId: string | undefined,
   db: DatabaseInstance,
): Promise<{ allowed: boolean; reason?: string }> {
   // No teamId — backwards compat with old keys
   if (!teamId) {
      return { allowed: true };
   }

   const row = await db
      .select({ allowedDomains: team.allowedDomains })
      .from(team)
      .where(eq(team.id, teamId))
      .then((rows) => rows[0]);

   // Team not found or no domains configured — allow (opt-in)
   if (!row?.allowedDomains || row.allowedDomains.length === 0) {
      return { allowed: true };
   }

   // Extract origin from headers; fallback to Referer
   const origin =
      request.headers.get("Origin") ?? request.headers.get("Referer");

   // No origin header at all — allow (server-side calls won't have it)
   if (!origin) {
      return { allowed: true };
   }

   if (matchesDomain(origin, row.allowedDomains)) {
      return { allowed: true };
   }

   return { allowed: false, reason: "Origin not allowed" };
}
