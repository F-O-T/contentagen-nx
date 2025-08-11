import { isProduction } from "@packages/environment/helpers";

export const POLAR_PLAN_SLUGS = {
   BASIC: "basic",
   TEAM: "team",
} as const;
export const POLAR_PLAN_IDS = {
   [POLAR_PLAN_SLUGS.BASIC]: {
      production: "cae61f16-602f-434f-9efc-e147cf3df027",
      sandbox: "61adf73c-3209-4346-96e3-31f370486c9a",
   },
   [POLAR_PLAN_SLUGS.TEAM]: {
      production: "221b5093-a650-4e7d-8183-a1ee83234a40",
      sandbox: "221b5093-a650-4e7d-8183-a1ee83234a40",
   },
};
export const POLAR_PLANS = {
   [POLAR_PLAN_SLUGS.BASIC]: {
      slug: POLAR_PLAN_SLUGS.BASIC,
      productId: isProduction
         ? POLAR_PLAN_IDS[POLAR_PLAN_SLUGS.BASIC].production
         : POLAR_PLAN_IDS[POLAR_PLAN_SLUGS.BASIC].sandbox,
   },
   [POLAR_PLAN_SLUGS.TEAM]: {
      slug: POLAR_PLAN_SLUGS.TEAM,
      productId: isProduction
         ? POLAR_PLAN_IDS[POLAR_PLAN_SLUGS.TEAM].production
         : POLAR_PLAN_IDS[POLAR_PLAN_SLUGS.TEAM].sandbox,
   },
};
