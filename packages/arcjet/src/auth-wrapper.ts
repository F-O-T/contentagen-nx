import type { ArcjetDecision } from "@arcjet/bun";
import { Feature, planHasFeature } from "@packages/stripe/features";
import type { AuthInstance } from "@packages/authentication/server";
import { PlanName } from "@packages/stripe/constants";
import {
   arcjetInstance,
   BOT_DETECTION,
   EMAIL_VALIDATION,
   getAuthEndpointRateLimit,
   isSignupEndpoint,
} from "./config";

async function extractEmailFromRequest(
   request: Request,
): Promise<{ email: string | undefined }> {
   try {
      const body = (await request.clone().json()) as Record<string, unknown>;
      const email = typeof body?.email === "string" ? body.email : undefined;
      return { email };
   } catch {
      return { email: undefined };
   }
}

/**
 * Check if the request is an API key creation endpoint.
 */
function isApiKeyCreationEndpoint(pathname: string): boolean {
   return pathname === "/api/auth/api-key/create";
}

/**
 * Check if the request is a Stripe webhook endpoint.
 * Stripe webhooks are legitimate automated requests and should bypass bot detection.
 */
function isStripeWebhookEndpoint(pathname: string): boolean {
   return pathname === "/api/auth/stripe/webhook";
}

/**
 * Get the user's plan from their subscription.
 */
async function getUserPlanFromAuth(
   authInstance: AuthInstance,
   request: Request,
): Promise<PlanName> {
   try {
      const session = await authInstance.api.getSession({
         headers: request.headers,
      });

      if (!session?.session?.activeOrganizationId) {
         return PlanName.FREE;
      }

      const subscriptions = await authInstance.api.listActiveSubscriptions({
         headers: request.headers,
         query: { referenceId: session.session.activeOrganizationId },
      });

      const activeSubscription = subscriptions.find(
         (sub) => sub.status === "active" || sub.status === "trialing",
      );

      if (!activeSubscription) {
         return PlanName.FREE;
      }

      const planName = activeSubscription.plan?.toLowerCase();
      if (planName === PlanName.LITE) return PlanName.LITE;
      if (planName === PlanName.PRO) return PlanName.PRO;

      return PlanName.FREE;
   } catch {
      return PlanName.FREE;
   }
}

export async function wrapAuthHandler(
   authInstance: AuthInstance,
): Promise<(request: Request) => Promise<Response>> {
   return async (request: Request): Promise<Response> => {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Check feature access for API key creation (before any other checks)
      if (isApiKeyCreationEndpoint(pathname) && request.method === "POST") {
         const plan = await getUserPlanFromAuth(authInstance, request);
         if (!planHasFeature(plan, Feature.API_ACCESS)) {
            return new Response(
               JSON.stringify({
                  error: "Acesso à API não está disponível no seu plano atual. Faça upgrade para o plano Lite ou superior.",
                  code: "FEATURE_NOT_AVAILABLE",
               }),
               {
                  status: 403,
                  headers: {
                     "Content-Type": "application/json",
                  },
               },
            );
         }
      }

      // Skip Arcjet protection for Stripe webhooks - they're legitimate automated requests
      // verified via signature, not IP-based detection
      if (isStripeWebhookEndpoint(pathname)) {
         return authInstance.handler(request);
      }

      if (!arcjetInstance) {
         return authInstance.handler(request);
      }

      try {
         const rateLimitRule = getAuthEndpointRateLimit(pathname);
         const isSignup = isSignupEndpoint(pathname);

         let decision: ArcjetDecision;

         if (isSignup && request.method === "POST") {
            const { email } = await extractEmailFromRequest(request);
            const trimmedEmail = email?.trim();

            if (trimmedEmail) {
               const aj = arcjetInstance
                  .withRule(rateLimitRule)
                  .withRule(BOT_DETECTION)
                  .withRule(EMAIL_VALIDATION);

               decision = await aj.protect(request, {
                  requested: 1,
                  email: trimmedEmail,
               });
            } else {
               const aj = arcjetInstance
                  .withRule(rateLimitRule)
                  .withRule(BOT_DETECTION);

               decision = await aj.protect(request, { requested: 1 });
            }
         } else {
            const aj = arcjetInstance
               .withRule(rateLimitRule)
               .withRule(BOT_DETECTION);

            decision = await aj.protect(request, { requested: 1 });
         }

         console.log(
            `[Arcjet Auth] ${pathname} - ${decision.conclusion} - ${decision.reason.type}`,
         );

         if (decision.isDenied()) {
            const reason = decision.reason;

            if (reason.isRateLimit()) {
               const retryAfterSeconds = reason.resetTime
                  ? Math.max(
                       0,
                       Math.ceil(
                          (reason.resetTime.getTime() - Date.now()) / 1000,
                       ),
                    )
                  : 60;

               return new Response(
                  JSON.stringify({
                     error: "Too many requests. Please try again later.",
                     retryAfter: retryAfterSeconds,
                  }),
                  {
                     status: 429,
                     headers: {
                        "Content-Type": "application/json",
                        "Retry-After": retryAfterSeconds.toString(),
                     },
                  },
               );
            }

            if (reason.isBot()) {
               return new Response(
                  JSON.stringify({
                     error: "Automated requests are not permitted.",
                  }),
                  {
                     status: 403,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            if (reason.isEmail()) {
               return new Response(
                  JSON.stringify({
                     error: "Invalid email address.",
                     details: {
                        emailTypes: reason.emailTypes,
                     },
                  }),
                  {
                     status: 400,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            if (reason.isShield()) {
               return new Response(
                  JSON.stringify({
                     error: "Request blocked for security reasons.",
                  }),
                  {
                     status: 403,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            return new Response(
               JSON.stringify({
                  error: "Access denied.",
               }),
               {
                  status: 403,
                  headers: {
                     "Content-Type": "application/json",
                  },
               },
            );
         }

         return authInstance.handler(request);
      } catch (error) {
         console.error("[Arcjet Auth] Error during protection:", error);
         return authInstance.handler(request);
      }
   };
}
