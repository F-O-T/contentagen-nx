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
import { sendEmailOTP } from "@packages/transactional/client";
export interface AuthOptions {
   db: DatabaseInstance;
   polarClient: Polar;
   env: Static<typeof EnvSchema>;
}

export const getBaseOptions = (db: DatabaseInstance) => ({
   database: getDatabaseAdapter(db),
});
export type AuthInstance = ReturnType<typeof createAuth>;
export const createAuth = ({ db, polarClient, env }: AuthOptions) => {
   return betterAuth({
      socialProviders: getSocialProviders(env),
      appName: "ContentaGen-Auth",
      database: getDatabaseAdapter(db),
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
