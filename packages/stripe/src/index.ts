import type { ServerEnv } from "@packages/environment/server";
import { AppError } from "@packages/utils/errors";
import Stripe from "stripe";

export const getStripeClient = (
   STRIPE_SECRET_KEY: ServerEnv["STRIPE_SECRET_KEY"],
): Stripe => {
   if (!STRIPE_SECRET_KEY) throw AppError.validation("Stripe key is required");
   return new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover", // Latest API version as of Stripe SDK v20.0.0
   });
};

export type StripeClient = ReturnType<typeof getStripeClient>;
