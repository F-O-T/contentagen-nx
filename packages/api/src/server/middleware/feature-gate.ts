import { PlanName } from "@packages/stripe/constants";
import { APIError } from "@packages/utils/errors";
import {
   FEATURE_DISPLAY_NAMES,
   type Feature,
   PLAN_FEATURES,
} from "../features";
import { t } from "../trpc";

/**
 * Get the user's current plan from their subscription.
 * Defaults to FREE if no active subscription.
 */
export async function getUserPlan(ctx: {
   organizationId: string;
   auth: {
      api: {
         listActiveSubscriptions: (options: {
            headers: Headers;
            query: { referenceId: string };
         }) => Promise<Array<{ status: string; plan?: string }>>;
      };
   };
   headers: Headers;
}): Promise<PlanName> {
   if (!ctx.organizationId) {
      return PlanName.FREE;
   }

   try {
      // Get subscription from auth API
      const subscriptions = await ctx.auth.api.listActiveSubscriptions({
         headers: ctx.headers,
         query: { referenceId: ctx.organizationId },
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

/**
 * Check if a plan has access to a specific feature.
 */
export function planHasFeature(plan: PlanName, feature: Feature): boolean {
   return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

/**
 * Require a specific feature for a tRPC procedure.
 * Throws APIError.forbidden if the user's plan doesn't include the feature.
 *
 * @example
 * ```ts
 * myProcedure: protectedProcedure
 *   .use(requireFeature(Feature.CHAT))
 *   .mutation(async ({ ctx }) => { ... })
 * ```
 */
export function requireFeature(feature: Feature) {
   return t.middleware(async ({ ctx, next }) => {
      const resolvedCtx = await ctx;
      const plan = await getUserPlan(resolvedCtx);

      if (!planHasFeature(plan, feature)) {
         const featureName = FEATURE_DISPLAY_NAMES[feature] ?? feature;
         throw APIError.forbidden(
            `A funcionalidade "${featureName}" não está disponível no seu plano atual. Faça upgrade para acessar.`,
         );
      }

      return next();
   });
}

/**
 * Get the minimum plan required for a feature.
 */
export function getMinimumPlanForFeature(feature: Feature): PlanName {
   const planOrder: PlanName[] = [PlanName.FREE, PlanName.LITE, PlanName.PRO];

   for (const plan of planOrder) {
      if (PLAN_FEATURES[plan].includes(feature)) {
         return plan;
      }
   }

   return PlanName.PRO;
}
