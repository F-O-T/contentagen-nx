import { betterAuth } from "better-auth";
import type { DatabaseInstance } from "@packages/database/client";
import type { Polar } from "@polar-sh/sdk";
import {
   getSocialProviders,
   getDatabaseAdapter,
   getEmailAndPasswordOptions,
   getEmailVerificationOptions,
   getPlugins,
   getTrustedOrigins,
   type EnvSchema,
} from "./helpers";
import type { Static } from "@sinclair/typebox";
export interface AuthOptions {
   db: DatabaseInstance;
   authSchema: Record<string, unknown>;
   sendEmailOTP: (email: string, otp: string, type: string) => Promise<void>;
   polarClient: Polar;
   env: Static<typeof EnvSchema>;
}

export const getBaseOptions = (db: DatabaseInstance) => ({
   database: getDatabaseAdapter(db, {}),
});
export type AuthInstance = ReturnType<typeof createAuth>;
export const createAuth = ({
   db,
   authSchema,
   sendEmailOTP,
   polarClient,
   env,
}: AuthOptions) => {
   return betterAuth({
      socialProviders: getSocialProviders(env),
      appName: "ContentaGen-Auth",
      database: getDatabaseAdapter(db, authSchema),
      emailAndPassword: getEmailAndPasswordOptions(),
      emailVerification: getEmailVerificationOptions(),
      plugins: getPlugins(sendEmailOTP, polarClient),
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
