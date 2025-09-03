import { serverEnv } from "@packages/environment/server";

export const POLAR_PLAN_SLUGS = {
   BASIC: "basic",
   HOBBY: "hobby",
} as const;
export const POLAR_PLANS = {
   [POLAR_PLAN_SLUGS.BASIC]: {
      slug: POLAR_PLAN_SLUGS.BASIC,
      productId: serverEnv.POLAR_PAID_PLAN_ID,
   },
   [POLAR_PLAN_SLUGS.HOBBY]: {
      slug: POLAR_PLAN_SLUGS.HOBBY,
      productId: serverEnv.POLAR_FREE_PLAN_ID,
   },
};
