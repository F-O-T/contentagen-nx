import type { DatabaseInstance } from "@packages/database/client";
import { POLAR_PLANS } from "@packages/payment/plans";
import { checkout, polar, portal, usage } from "@polar-sh/better-auth";
import type { Polar } from "@polar-sh/sdk";
import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, openAPI, organization } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";

export const EnvSchema = Type.Object({
   BETTER_AUTH_SECRET: Type.String(),
   BETTER_AUTH_TRUSTED_ORIGINS: Type.String(),
   DATABASE_URL: Type.String(),
   RESEND_API_KEY: Type.String(),
   POLAR_ACCESS_TOKEN: Type.String(),
   BETTER_AUTH_GOOGLE_CLIENT_ID: Type.String(),
   BETTER_AUTH_GOOGLE_CLIENT_SECRET: Type.String(),
});
export function getSocialProviders(env: Static<typeof EnvSchema>) {
   return {
      google: {
         prompt: "select_account" as const,
         clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
         clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
      },
   };
}

// Database Adapter
export function getDatabaseAdapter(
   db: DatabaseInstance,
   authSchema: Record<string, unknown>,
) {
   return drizzleAdapter(db, {
      provider: "pg",
      schema: {
         ...authSchema,
      },
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

export function getPlugins(
   sendEmailOTP: (email: string, otp: string, type: string) => Promise<void>,
   polarClient: Polar,
) {
   return [
      getEmailOTPPlugin(sendEmailOTP),
      getOpenAPIPlugin(),
      getPolarPlugin(polarClient),
      getAPIKeyPlugin(),
      getOrganizationPlugin(),
   ];
}

// Trusted Origins
export function getTrustedOrigins(env: Static<typeof EnvSchema>) {
   return env.BETTER_AUTH_TRUSTED_ORIGINS.split(",");
}

// Helper for emailOTP plugin
export function getEmailOTPPlugin(
   sendEmailOTP: (email: string, otp: string, type: string) => Promise<void>,
) {
   return emailOTP({
      expiresIn: 60 * 10,
      otpLength: 6,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({
         email,
         otp,
         type,
      }: {
         email: string;
         otp: string;
         type: string;
      }) {
         await sendEmailOTP(email, otp, type);
      },
   });
}

// Helper for openAPI plugin
export function getOpenAPIPlugin() {
   return openAPI();
}
export function getAPIKeyPlugin() {
   return apiKey();
}
export function getOrganizationPlugin() {
   return organization();
}

// Helper for polar plugin
export function getPolarPlugin(polarClient: Polar) {
   const prodcuts = () => {
      if (!POLAR_PLANS.BASIC || !POLAR_PLANS.PRO) {
         throw new Error(
            "Polar plans are not defined. Please check your payment plans configuration.",
         );
      }
      return [POLAR_PLANS.BASIC, POLAR_PLANS.PRO];
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
