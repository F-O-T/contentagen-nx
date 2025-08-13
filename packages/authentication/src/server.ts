import type { DatabaseInstance } from "@packages/database/client";
import {
   sendEmailOTP,
   sendOrganizationInvitation,
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
   getSocialProviders,
} from "./helpers";
import { emailOTP, openAPI, organization, apiKey } from "better-auth/plugins";
import { getDomain, isProduction } from "@packages/environment/helpers";
import { POLAR_PLANS, POLAR_PLAN_SLUGS } from "@packages/payment/plans";
import { polar, portal, checkout, usage } from "@polar-sh/better-auth";
export interface AuthOptions {
   db: DatabaseInstance;
   polarClient: Polar;
   resendClient: ResendClient;
}

export interface AuthPluginOptions {
   polar: ReturnType<typeof polar>;
   emailOTP: ReturnType<typeof emailOTP>;
   openAPI: ReturnType<typeof openAPI>;
   organization: ReturnType<typeof organization>;
   apiKey: ReturnType<typeof apiKey>;
}
export const getAuthOptions = (
   db: DatabaseInstance,
   resendClient: ResendClient,
   polarClient: Polar,
) =>
   ({
      database: getDatabaseAdapter(db),
      plugins: [
         polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
               portal(),
               checkout({
                  successUrl: `${getDomain()}/profile`,
                  authenticatedUsersOnly: true,
                  products: [
                     POLAR_PLANS[POLAR_PLAN_SLUGS.BASIC],
                     POLAR_PLANS[POLAR_PLAN_SLUGS.TEAM],
                  ],
               }),
               usage(),
            ],
         }),
         emailOTP({
            expiresIn: 60 * 10,
            otpLength: 6,
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({
               email,
               otp,
               type,
            }: SendEmailOTPOptions) {
               await sendEmailOTP(resendClient, { email, otp, type });
            },
         }),
         openAPI(),
         organization({
            organizationLimit: 1,
            async sendInvitationEmail(data) {
               const inviteLink = `${getDomain()}/callback/organization/invite/${data.id}`;
               await sendOrganizationInvitation(resendClient, {
                  email: data.email,
                  invitedByUsername: data.inviter.user.name,
                  invitedByEmail: data.inviter.user.email,
                  teamName: data.organization.name,
                  inviteLink,
               });
            },
         }),
         apiKey({
            rateLimit: {
               enabled: true,
               timeWindow: 1000 * 60 * 60 * 24, // 1 day
               maxRequests: 500, // 1000 requests per day
            },
            enableMetadata: true,
            apiKeyHeaders: "sdk-api-key",
         }),
      ],
      socialProviders: getSocialProviders(),
      emailAndPassword: getEmailAndPasswordOptions(),
      emailVerification: getEmailVerificationOptions(),
      secret: serverEnv.BETTER_AUTH_SECRET,
      trustedOrigins: serverEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
      advanced: {
         crossSubDomainCookies: {
            enabled: isProduction,
            domain: ".contentagen.com",
         },
      },
      session: {
         cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
         },
      },
   }) satisfies BetterAuthOptions;

export const createAuth = (options: AuthOptions) => {
   const authOptions = getAuthOptions(
      options.db,
      options.resendClient,
      options.polarClient,
   );
   return betterAuth(authOptions);
};
export type AuthInstance = ReturnType<typeof createAuth>;
