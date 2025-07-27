import type { DatabaseInstance } from "@packages/database/client";
import { POLAR_PLANS, POLAR_PLAN_SLUGS } from "@packages/payment/plans";
import {
  sendEmailOTP,
  type SendEmailOTPOptions,
  type ResendClient,
} from "@packages/transactional/client";
import { checkout, polar, portal, usage } from "@polar-sh/better-auth";
import type { Polar } from "@polar-sh/sdk";
import { serverEnv } from "@packages/environment/server";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, openAPI, organization } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";

export function getSocialProviders() {
  return {
    google: {
      prompt: "select_account" as const,
      clientId: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
      clientSecret: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
    },
  };
}

// Database Adapter
export function getDatabaseAdapter(db: DatabaseInstance) {
  return drizzleAdapter(db, {
    provider: "pg",
  });
}

// Email and Password Options
export function getEmailAndPasswordOptions() {
  return {
    enabled: true,
    requireEmailVerification: true,
  };
}

// Email Verification Options
export function getEmailVerificationOptions() {
  return {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  };
}

export function getPlugins(client: ResendClient, polarClient: Polar) {
  return [
    getEmailOTPPlugin(client),
    getPolarPlugin(polarClient),
    openAPI(),
    apiKey(),
    organization({ organizationLimit: 1 }),
  ];
}

export function getEmailOTPPlugin(client: ResendClient) {
  return emailOTP({
    expiresIn: 60 * 10,
    otpLength: 6,
    sendVerificationOnSignUp: true,
    async sendVerificationOTP({ email, otp, type }: SendEmailOTPOptions) {
      await sendEmailOTP(client, { email, otp, type });
    },
  });
}

export function getPolarPlugin(polarClient: Polar) {
  const prodcuts = () => {
    if (
      !POLAR_PLANS[POLAR_PLAN_SLUGS.BASIC] ||
      !POLAR_PLANS[POLAR_PLAN_SLUGS.TEAM]
    ) {
      throw new Error(
        "Polar plans are not defined. Please check your payment plans configuration.",
      );
    }
    return [
      POLAR_PLANS[POLAR_PLAN_SLUGS.BASIC],
      POLAR_PLANS[POLAR_PLAN_SLUGS.TEAM],
    ];
  };
  return polar({
    client: polarClient,
    createCustomerOnSignUp: true,
    use: [
      portal(),
      checkout({
        successUrl: "http://localhost:3000/profile",
        authenticatedUsersOnly: true,
        products: prodcuts(),
      }),
      usage(),
    ],
  });
}
