import type { DatabaseInstance } from "@packages/database/client";
import {
   sendEmailOTP,
   type ResendClient,
   type SendEmailOTPOptions,
} from "@packages/transactional/client";
import type { Polar } from "@polar-sh/sdk";
import type { Static } from "@sinclair/typebox";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import {
   getDatabaseAdapter,
   getEmailAndPasswordOptions,
   getEmailVerificationOptions,
   getPlugins,
   getSocialProviders,
   getTrustedOrigins,
   type EnvSchema,
} from "./helpers";
import { emailOTP, openAPI, organization, apiKey } from "better-auth/plugins";
export interface AuthOptions {
   db: DatabaseInstance;
   polarClient: Polar;
   resendClient: ResendClient;
   env: Static<typeof EnvSchema>;
}

export const getBaseOptions = (db: DatabaseInstance) =>
   ({
      database: getDatabaseAdapter(db),
      plugins: [
         emailOTP({
            async sendVerificationOTP({
               email,
               otp,
               type,
            }: SendEmailOTPOptions) {
               await sendEmailOTP({} as ResendClient, { email, otp, type });
            },
         }),
         openAPI(),
         organization(),
         apiKey(),
      ],
   }) satisfies BetterAuthOptions;
export type AuthInstance = ReturnType<typeof createAuth>;
export const createAuth = ({
   db,
   resendClient,
   polarClient,
   env,
}: AuthOptions) => {
   return betterAuth({
      socialProviders: getSocialProviders(env),
      appName: "ContentaGen-Auth",
      database: getDatabaseAdapter(db),
      emailAndPassword: getEmailAndPasswordOptions(),
      emailVerification: getEmailVerificationOptions(),
      plugins: getPlugins(resendClient, polarClient),
      secret: env.BETTER_AUTH_SECRET,
      trustedOrigins: getTrustedOrigins(env),
      session: {
         cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
         },
      },
   });
};
