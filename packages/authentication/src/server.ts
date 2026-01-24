import { stripe as stripePlugin } from "@better-auth/stripe";
import { createBetterAuthStorage } from "./cache";
import { createRedisConnection } from "./redis-connection";
import type { DatabaseInstance } from "@packages/database/client";
import {
   createDefaultOrganization,
   findMemberByUserId,
} from "@packages/database/repositories/auth-repository";
import { getDomain, isProduction } from "@packages/environment/helpers";
import type { ServerEnv } from "@packages/environment/server";
import { getElysiaPosthogConfig } from "@packages/posthog/server";
import { getStripeClient } from "@packages/stripe";
import { PlanName } from "@packages/stripe/constants";
import {
   getResendClient,
   type SendEmailOTPOptions,
   sendEmailOTP,
   sendMagicLinkEmail,
   sendOrganizationInvitation,
} from "@packages/transactional/client";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import {
   admin,
   anonymous,
   apiKey,
   emailOTP,
   lastLoginMethod,
   magicLink,
   openAPI,
   organization,
   twoFactor,
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import type Stripe from "stripe";

export const ORGANIZATION_LIMIT = 3;

export interface SimplifiedAuthConfig {
   db: DatabaseInstance;
   env: ServerEnv;
}

const getCrossSubDomainCookiesConfig = () => {
   if (isProduction) {
      return {
         domain: ".contentta.co",
         enabled: true,
      };
   }
   return { enabled: false };
};

export function createAuth(config: SimplifiedAuthConfig) {
   const { db, env } = config;

   // Create Redis connection for session caching
   const redis = env.REDIS_URL
      ? createRedisConnection(env.REDIS_URL)
      : createRedisConnection("redis://localhost:6379");

   // Create PostHog client (REQUIRED)
   const posthogClient = getElysiaPosthogConfig({
      POSTHOG_HOST: env.POSTHOG_HOST,
      POSTHOG_KEY: env.POSTHOG_KEY,
   });

   // Create Resend client (OPTIONAL - for development without email)
   const resendClient = env.RESEND_API_KEY
      ? getResendClient(env.RESEND_API_KEY)
      : null;

   // Create Stripe client (OPTIONAL - for development without payments)
   const stripeClient =
      env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
         ? getStripeClient(env.STRIPE_SECRET_KEY)
         : null;

   // Build plugins array conditionally
   const plugins = [
      // Core plugins (always included)
      admin(),
      anonymous({
         emailDomainName: "anon.contentta.co",
         onLinkAccount: async ({ anonymousUser, newUser }) => {
            console.log(
               `Anonymous user ${anonymousUser.user.id} linked to ${newUser.user.id}`,
            );
         },
      }),
      magicLink({
         expiresIn: 60 * 15, // 15 minutes
         async sendMagicLink({ email, url }) {
            if (resendClient) {
               await sendMagicLinkEmail(resendClient, {
                  email,
                  magicLinkUrl: url,
               });
            } else {
               console.log(`[DEV] Magic link for ${email}: ${url}`);
            }
         },
      }),
      emailOTP({
         expiresIn: 60 * 10,
         otpLength: 6,
         sendVerificationOnSignUp: true,
         async sendVerificationOTP({ email, otp, type }: SendEmailOTPOptions) {
            if (resendClient) {
               await sendEmailOTP(resendClient, { email, otp, type });
            } else {
               console.log(`[DEV] OTP for ${email} (${type}): ${otp}`);
            }
         },
      }),
      openAPI(),
      lastLoginMethod(),
      organization({
         organizationLimit: ORGANIZATION_LIMIT,
         schema: {
            organization: {
               additionalFields: {
                  context: {
                     defaultValue: "personal",
                     input: true,
                     required: false,
                     type: "string",
                  },
                  description: {
                     defaultValue: "",
                     input: true,
                     required: false,
                     type: "string",
                  },
                  onboardingCompleted: {
                     defaultValue: false,
                     input: true,
                     required: false,
                     type: "boolean",
                  },
               },
            },
            team: {
               additionalFields: {
                  description: {
                     defaultValue: "",
                     input: true,
                     required: false,
                     type: "string",
                  },
               },
            },
         },
         async sendInvitationEmail(data) {
            const inviteLink = `${getDomain()}/callback/organization/invitation/${data.id}`;
            if (resendClient) {
               await sendOrganizationInvitation(resendClient, {
                  email: data.email,
                  invitedByEmail: data.inviter.user.email,
                  invitedByUsername: data.inviter.user.name,
                  inviteLink,
                  teamName: data.organization.name,
               });
            } else {
               console.log(
                  `[DEV] Organization invitation for ${data.email}: ${inviteLink}`,
               );
            }
         },
         teams: {
            allowRemovingAllTeams: false,
            enabled: true,
            maximumMembersPerTeam: 50,
            maximumTeams: 10,
         },
      }),
      twoFactor({
         issuer: "Contentta",
         skipVerificationOnEnable: false,
         totpOptions: {
            digits: 6,
            period: 30,
         },
         backupCodeOptions: {
            amount: 10,
            length: 10,
         },
      }),
      apiKey({
         enableSessionForAPIKeys: true,
         enableMetadata: true,
         defaultPrefix: "contentta",
         apiKeyHeaders: ["sdk-api-key", "x-api-key"],
         rateLimit: {
            enabled: true,
            timeWindow: 1000 * 60, // 1 minute
            maxRequests: 100, // Default (overridden per-key)
         },
      }),

      // Conditional: Stripe plugin (only if Stripe is configured)
      ...(stripeClient && env.STRIPE_WEBHOOK_SECRET
         ? [
              stripePlugin({
                 createCustomerOnSignUp: true,
                 stripeClient,
                 stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,

                 subscription: {
                    authorizeReference: async ({ user, referenceId }) => {
                       const membership = await db.query.member.findFirst({
                          where: (member, { eq, and }) =>
                             and(
                                eq(member.organizationId, referenceId),
                                eq(member.userId, user.id),
                             ),
                       });
                       if (!membership) {
                          return false;
                       }
                       return (
                          membership.role === "owner" ||
                          membership.role === "admin"
                       );
                    },
                    enabled: true,
                    getCheckoutSessionParams: async () => ({
                       params: {
                          allow_promotion_codes: true,
                       },
                    }),
                    plans: [
                       {
                          annualDiscountPriceId: env.STRIPE_PRO_ANNUAL_PRICE_ID,
                          name: PlanName.PRO,
                          priceId: env.STRIPE_PRO_PRICE_ID,
                       },
                    ],
                 },

                 // PostHog Revenue Analytics - Track subscription lifecycle events
                 onSubscriptionComplete: async ({
                    subscription,
                    stripeSubscription,
                 }: {
                    subscription: {
                       id: string;
                       plan: string;
                       referenceId: string;
                    };
                    stripeSubscription: Stripe.Subscription;
                 }) => {
                    try {
                       const invoice = await stripeClient.invoices.retrieve(
                          stripeSubscription.latest_invoice as string,
                       );

                       posthogClient.capture({
                          distinctId: subscription.referenceId,
                          event: "subscription_started",
                          groups: { organization: subscription.referenceId },
                          properties: {
                             $currency: invoice.currency.toUpperCase(),
                             $revenue: invoice.amount_paid / 100,
                             interval:
                                stripeSubscription.items.data[0]?.plan.interval,
                             organization_id: subscription.referenceId,
                             plan_name: subscription.plan,
                             subscription_id: subscription.id,
                          },
                       });
                    } catch (error) {
                       console.error(
                          "PostHog: Failed to capture subscription_started event:",
                          error,
                       );
                    }
                 },

                 onSubscriptionCancel: async ({
                    subscription,
                 }: {
                    subscription: {
                       id: string;
                       plan: string;
                       referenceId: string;
                    };
                 }) => {
                    try {
                       posthogClient.capture({
                          distinctId: subscription.referenceId,
                          event: "subscription_canceled",
                          groups: { organization: subscription.referenceId },
                          properties: {
                             organization_id: subscription.referenceId,
                             plan_name: subscription.plan,
                             subscription_id: subscription.id,
                          },
                       });
                    } catch (error) {
                       console.error(
                          "PostHog: Failed to capture subscription_canceled event:",
                          error,
                       );
                    }
                 },

                 onEvent: async (event: Stripe.Event) => {
                    // Track recurring subscription payments (renewals)
                    if (event.type === "invoice.paid") {
                       const invoice = event.data.object as Stripe.Invoice;

                       // Only track recurring payments, not initial subscription
                       if (invoice.billing_reason === "subscription_cycle") {
                          try {
                             // Get subscription to find the organization (referenceId)
                             const subscription = (invoice as any).subscription;
                             const subscriptionId =
                                typeof subscription === "string"
                                   ? subscription
                                   : null;
                             if (!subscriptionId) return;

                             const stripeSubscription =
                                await stripeClient.subscriptions.retrieve(
                                   subscriptionId,
                                );
                             const referenceId =
                                stripeSubscription.metadata?.referenceId;

                             if (referenceId) {
                                posthogClient.capture({
                                   distinctId: referenceId,
                                   event: "subscription_renewed",
                                   groups: { organization: referenceId },
                                   properties: {
                                      $currency:
                                         invoice.currency?.toUpperCase(),
                                      $revenue: invoice.amount_paid / 100,
                                      organization_id: referenceId,
                                      subscription_id: subscriptionId,
                                   },
                                });
                             }
                          } catch (error) {
                             console.error(
                                "PostHog: Failed to capture subscription_renewed event:",
                                error,
                             );
                          }
                       }
                    }
                 },
              }),
           ]
         : []),

      // Must be last - enables proper cookie handling for TanStack Start
      tanstackStartCookies(),
   ];

   return betterAuth({
      account: {
         accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
         },
      },
      advanced: {
         crossSubDomainCookies: getCrossSubDomainCookiesConfig(),
         database: { generateId: "uuid" },
      },
      secondaryStorage: createBetterAuthStorage(redis),
      database: drizzleAdapter(db, {
         provider: "pg",
      }),
      databaseHooks: {
         session: {
            create: {
               before: async (session) => {
                  try {
                     let member = await findMemberByUserId(db, session.userId);

                     // If no member found, create default organization first
                     // This handles the race condition where user.create.after
                     // may not have completed before session creation
                     if (!member) {
                        const foundUser = await db.query.user.findFirst({
                           where: (user, { eq }) => eq(user.id, session.userId),
                        });

                        if (foundUser) {
                           console.log(
                              `No organization found for user ${session.userId}, creating default organization`,
                           );
                           await createDefaultOrganization(
                              db,
                              session.userId,
                              foundUser.name ?? "Workspace",
                           );
                           // Fetch the newly created membership
                           member = await findMemberByUserId(
                              db,
                              session.userId,
                           );
                        }
                     }

                     if (member?.organizationId) {
                        console.log(
                           `Setting activeOrganizationId for user ${session.userId} to ${member.organizationId}`,
                        );
                        return {
                           data: {
                              ...session,
                              activeOrganizationId: member.organizationId,
                           },
                        };
                     }
                  } catch (error) {
                     console.error(
                        "Error in session create before hook:",
                        error,
                     );
                     return {
                        data: {
                           ...session,
                        },
                     };
                  }
               },
            },
         },
         user: {
            create: {
               after: async (user) => {
                  // Organization creation is now handled in session.create.before
                  // to avoid race conditions. This hook is kept for backwards
                  // compatibility but the session hook will handle the actual creation.
                  try {
                     const member = await findMemberByUserId(db, user.id);
                     if (!member) {
                        await createDefaultOrganization(db, user.id, user.name);
                     }
                  } catch (error) {
                     console.error(
                        "Error creating default organization for user:",
                        error,
                     );
                  }
               },
            },
         },
      },
      emailAndPassword: {
         enabled: true,
         requireEmailVerification: true,
      },
      emailVerification: {
         autoSignInAfterVerification: true,
         sendOnSignUp: true,
      },
      experimental: {
         joins: true,
      },
      plugins,
      secret: env.BETTER_AUTH_SECRET,
      session: {
         storeSessionInDatabase: true,
         cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
         },
      },
      socialProviders: {
         google:
            env.BETTER_AUTH_GOOGLE_CLIENT_ID &&
            env.BETTER_AUTH_GOOGLE_CLIENT_SECRET
               ? {
                    clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
                    clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
                    prompt: "select_account" as const,
                 }
               : undefined,
      },
      trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
      user: {
         changeEmail: {
            enabled: true,
         },
         additionalFields: {
            telemetryConsent: {
               defaultValue: false,
               input: true,
               required: true,
               type: "boolean",
            },
            contentCreationMode: {
               defaultValue: "plan",
               input: true,
               required: false,
               type: "string",
            },
         },
      },
   });
}

export type AuthInstance = ReturnType<typeof createAuth>;
