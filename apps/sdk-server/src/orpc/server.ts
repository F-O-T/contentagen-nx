import { ORPCError, os } from "@orpc/server";
import type { PlanName } from "@packages/stripe/constants";
import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import type { posthog } from "../integrations/posthog";
import { checkDomainAllowed } from "../utils/sdk-auth";

interface BaseContext {
   db: typeof db;
   posthog: typeof posthog;
   request: Request;
}

interface SdkContext extends BaseContext {
   organizationId: string;
   teamId?: string;
   plan: PlanName;
   sdkMode: "static" | "ssr";
   remaining: number | null;
   userId?: string;
   apiKeyType: "public" | "private";
}

const baseProcedure = os.$context<BaseContext>();

export const sdkProcedure = baseProcedure.use(async ({ context, next }) => {
   const { request } = context;

   const apiKeyHeader = request.headers.get("sdk-api-key");
   if (!apiKeyHeader) {
      throw new ORPCError("UNAUTHORIZED", { message: "Missing API Key" });
   }

   // Verify API key via Better Auth
   const result = await auth.api.verifyApiKey({
      body: { key: apiKeyHeader },
   });

   if (!result.valid || !result.key) {
      const isRateLimited = result.error?.code === "RATE_LIMITED";
      throw new ORPCError(
         isRateLimited ? "TOO_MANY_REQUESTS" : "UNAUTHORIZED",
         { message: isRateLimited ? "Rate limit exceeded" : "Invalid API Key" },
      );
   }

   const { plan, organizationId, sdkMode, teamId, apiKeyType } =
      result.key.metadata ?? {};

   // Validate organizationId exists
   if (!organizationId || typeof organizationId !== "string") {
      throw new ORPCError("FORBIDDEN", {
         message: "API key has no associated organization",
      });
   }

   // Check domain allowlist
   const resolvedTeamId = typeof teamId === "string" ? teamId : undefined;
   const domainCheck = await checkDomainAllowed(request, resolvedTeamId, db);
   if (!domainCheck.allowed) {
      throw new ORPCError("FORBIDDEN", { message: "Origin not allowed" });
   }

   return next({
      context: {
         ...context,
         organizationId,
         teamId: resolvedTeamId,
         plan: (plan as PlanName) ?? "FREE",
         sdkMode: (sdkMode as "static" | "ssr") ?? "static",
         remaining: result.key.remaining,
         userId: result.key.userId,
         apiKeyType: (apiKeyType as "public" | "private") ?? "private",
      },
   });
});

export const router = os.router;
export type { SdkContext };
