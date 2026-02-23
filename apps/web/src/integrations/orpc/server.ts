import { ORPCError, os } from "@orpc/server";
import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { PostHog } from "@packages/posthog/server";
import { captureError, identifyUser, setGroup } from "@packages/posthog/server";
import type { StripeClient } from "@packages/stripe";
import { sanitizeData } from "@packages/utils/sanitization";

// =============================================================================
// Context Types
// =============================================================================

/**
 * Client-side context - minimal context for isomorphic client
 */
export interface ORPCContext {
   headers: Headers;
}

/**
 * Base ORPC context - includes auth, db, session, and posthog (from route handler)
 */
export interface ORPCContextWithAuth {
   headers: Headers;
   request: Request;
   auth: AuthInstance;
   db: DatabaseInstance;
   session: Awaited<ReturnType<AuthInstance["api"]["getSession"]>> | null;
   posthog?: PostHog;
   stripeClient?: StripeClient;
}

/**
 * Context after auth middleware - session is guaranteed to be non-null
 */
export interface ORPCContextAuthenticated extends ORPCContextWithAuth {
   session: NonNullable<ORPCContextWithAuth["session"]>;
   userId: string;
}

/**
 * Context after organization middleware - includes organizationId and teamId
 */
export interface ORPCContextWithOrganization extends ORPCContextAuthenticated {
   organizationId: string;
   teamId: string;
}

// =============================================================================
// Procedures
// =============================================================================

// Base procedure builder with pre-populated context (auth, db, session)
const baseProcedure = os.$context<ORPCContextWithAuth>();

/**
 * Procedure requiring authentication
 */
const withAuth = baseProcedure.use(async ({ context, next }) => {
   const { session } = context;

   if (!session?.user) {
      throw new ORPCError("UNAUTHORIZED", {
         message: "You must be logged in to access this resource",
      });
   }

   return next({
      context: {
         ...context,
         session,
         userId: session.user.id,
      },
   });
});

/**
 * Procedure requiring active organization and team
 */
const withOrganization = withAuth.use(async ({ context, next }) => {
   const { session } = context;

   const organizationId = session.session.activeOrganizationId;

   if (!organizationId) {
      throw new ORPCError("FORBIDDEN", {
         message: "No active organization selected",
      });
   }

   // Extract team/project ID (now required)
   const teamId = session.session.activeTeamId;

   if (!teamId) {
      throw new ORPCError("FORBIDDEN", {
         message: "No active team selected",
      });
   }

   return next({
      context: {
         ...context,
         organizationId,
         teamId,
      },
   });
});

/**
 * Telemetry middleware - captures request metrics and identifies users
 */
const withTelemetry = withOrganization.use(
   async ({ context, path, next }, input) => {
      const startDate = new Date();
      const { posthog } = context;
      const userId = context.session?.user?.id;
      const userEmail = context.session?.user?.email;
      const userName = context.session?.user?.name;
      const hasConsent = context.session?.user?.telemetryConsent;
      const organizationId = context.organizationId;

      // Identify user if consented
      if (userId && hasConsent && posthog) {
         identifyUser(posthog, userId, {
            email: userEmail,
            name: userName,
         });

         if (organizationId) {
            setGroup(posthog, organizationId, {});
         }
      }

      let isSuccess = true;
      let error: Error | null = null;

      try {
         const result = await next();
         return result;
      } catch (err) {
         isSuccess = false;
         error = err instanceof Error ? err : new Error(String(err));
         throw err;
      } finally {
         // Capture telemetry for all requests
         if (userId && hasConsent && posthog) {
            try {
               const durationMs = Date.now() - startDate.getTime();
               const rootPath = path[0];

               if (!isSuccess && error) {
                  const errorId = crypto.randomUUID();

                  captureError(posthog, {
                     code: "INTERNAL_SERVER_ERROR",
                     errorId,
                     input: sanitizeData(input),
                     message: error.message,
                     organizationId: organizationId || undefined,
                     path: path.join("."),
                     userId,
                  });
               }

               posthog.capture({
                  distinctId: userId,
                  event: "orpc_request",
                  properties: {
                     durationMs,
                     endAt: new Date().toISOString(),
                     input: sanitizeData(input),
                     path: path.join("."),
                     rootPath,
                     startAt: startDate.toISOString(),
                     success: isSuccess,
                     ...(organizationId
                        ? { $groups: { organization: organizationId } }
                        : {}),
                     ...(isSuccess
                        ? {}
                        : {
                             errorMessage: error?.message,
                             errorName: error?.name,
                          }),
                  },
               });
            } catch {
               // Silently fail telemetry to not affect the main request
            }
         }
      }
   },
);

// =============================================================================
// Exported Procedures
// =============================================================================

/**
 * Public procedure - no authentication required
 * Context includes auth, db, and session (may be null)
 * Use this for publicly accessible endpoints (e.g., shared content, public pages)
 */
export const publicProcedure = os.$context<ORPCContextWithAuth>();

/**
 * Authenticated procedure - requires authenticated session (userId only)
 * Use this for endpoints that need a logged-in user but NOT org/team context
 * (e.g., listing organizations, account settings)
 */
export const authenticatedProcedure = withAuth;

/**
 * Protected procedure - requires authenticated session with active organization
 * Use this for all workspace-scoped operations (most endpoints)
 * Automatically provides userId and organizationId in context
 * Includes telemetry middleware for PostHog analytics
 */
export const protectedProcedure = withTelemetry;
