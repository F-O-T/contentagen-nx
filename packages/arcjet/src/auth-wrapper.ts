import type { AuthInstance } from "@packages/authentication/server";
import { PlanName } from "@packages/stripe/constants";
import { Feature, planHasFeature } from "@packages/stripe/features";

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

      return authInstance.handler(request);
   };
}
