import type { DatabaseInstance } from "@packages/database/client";
import {
   sendEmailOTP,
   type ResendClient,
   type SendEmailOTPOptions,
} from "@packages/transactional/client";
import { serverEnv } from "@packages/environment/server";

import type { Polar } from "@polar-sh/sdk";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import {
   getDatabaseAdapter,
   getEmailAndPasswordOptions,
   getEmailVerificationOptions,
   getPlugins,
   getSocialProviders,
} from "./helpers";
import { emailOTP, openAPI, organization, apiKey } from "better-auth/plugins";
export interface AuthOptions {
   db: DatabaseInstance;
   polarClient: Polar;
   resendClient: ResendClient;
}

export const getBaseOptions = (db: DatabaseInstance): BetterAuthOptions =>
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
}: AuthOptions): ReturnType<typeof betterAuth> => {
   return betterAuth({
      socialProviders: getSocialProviders(),
      database: getDatabaseAdapter(db),
      emailAndPassword: getEmailAndPasswordOptions(),
      emailVerification: getEmailVerificationOptions(),
      plugins: getPlugins(resendClient, polarClient),
      secret: serverEnv.BETTER_AUTH_SECRET,
      trustedOrigins: serverEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
      session: {
         cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
            sameSite: "none",
            secure: true,
         },
      },
   });
};
