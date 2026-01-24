import { o as originCheck, m as mergeSchema, H as HIDE_METADATA, s as sessionMiddleware, g as getSessionFromCtx } from "../../../_libs/better-auth.mjs";
import { A as APIError } from "../../../_libs/better-call.mjs";
import { d as defineErrorCodes, c as createAuthEndpoint, a as createAuthMiddleware } from "./core.mjs";
import { d as defu } from "../../../_libs/defu.mjs";
import { o as object, r as record, e as optional, c as boolean, a as string, _ as _enum, f as custom, g as any, n as number } from "../../../_libs/zod.mjs";
const STRIPE_ERROR_CODES = defineErrorCodes({
  UNAUTHORIZED: "Unauthorized access",
  INVALID_REQUEST_BODY: "Invalid request body",
  SUBSCRIPTION_NOT_FOUND: "Subscription not found",
  SUBSCRIPTION_PLAN_NOT_FOUND: "Subscription plan not found",
  ALREADY_SUBSCRIBED_PLAN: "You're already subscribed to this plan",
  REFERENCE_ID_NOT_ALLOWED: "Reference id is not allowed",
  CUSTOMER_NOT_FOUND: "Stripe customer not found for this user",
  UNABLE_TO_CREATE_CUSTOMER: "Unable to create customer",
  UNABLE_TO_CREATE_BILLING_PORTAL: "Unable to create billing portal session",
  STRIPE_SIGNATURE_NOT_FOUND: "Stripe signature not found",
  STRIPE_WEBHOOK_SECRET_NOT_FOUND: "Stripe webhook secret not found",
  STRIPE_WEBHOOK_ERROR: "Stripe webhook error",
  FAILED_TO_CONSTRUCT_STRIPE_EVENT: "Failed to construct Stripe event",
  FAILED_TO_FETCH_PLANS: "Failed to fetch plans",
  EMAIL_VERIFICATION_REQUIRED: "Email verification is required before you can subscribe to a plan",
  SUBSCRIPTION_NOT_ACTIVE: "Subscription is not active",
  SUBSCRIPTION_NOT_SCHEDULED_FOR_CANCELLATION: "Subscription is not scheduled for cancellation",
  ORGANIZATION_NOT_FOUND: "Organization not found",
  ORGANIZATION_SUBSCRIPTION_NOT_ENABLED: "Organization subscription is not enabled",
  ORGANIZATION_HAS_ACTIVE_SUBSCRIPTION: "Cannot delete organization with active subscription",
  ORGANIZATION_REFERENCE_ID_REQUIRED: "Reference ID is required. Provide referenceId or set activeOrganizationId in session"
});
async function getPlans(subscriptionOptions) {
  if (subscriptionOptions?.enabled) return typeof subscriptionOptions.plans === "function" ? await subscriptionOptions.plans() : subscriptionOptions.plans;
  throw new Error("Subscriptions are not enabled in the Stripe options.");
}
async function getPlanByPriceInfo(options, priceId, priceLookupKey) {
  return await getPlans(options.subscription).then((res) => res?.find((plan) => plan.priceId === priceId || plan.annualDiscountPriceId === priceId || priceLookupKey && (plan.lookupKey === priceLookupKey || plan.annualDiscountLookupKey === priceLookupKey)));
}
async function getPlanByName(options, name) {
  return await getPlans(options.subscription).then((res) => res?.find((plan) => plan.name.toLowerCase() === name.toLowerCase()));
}
function isActiveOrTrialing(sub) {
  return sub.status === "active" || sub.status === "trialing";
}
function isPendingCancel(sub) {
  return !!(sub.cancelAtPeriodEnd || sub.cancelAt);
}
function isStripePendingCancel(stripeSub) {
  return !!(stripeSub.cancel_at_period_end || stripeSub.cancel_at);
}
function escapeStripeSearchValue(value) {
  return value.replace(/"/g, '\\"');
}
async function findReferenceByStripeCustomerId(ctx, options, stripeCustomerId) {
  if (options.organization?.enabled) {
    const org = await ctx.context.adapter.findOne({
      model: "organization",
      where: [{
        field: "stripeCustomerId",
        value: stripeCustomerId
      }]
    });
    if (org) return {
      customerType: "organization",
      referenceId: org.id
    };
  }
  const user$1 = await ctx.context.adapter.findOne({
    model: "user",
    where: [{
      field: "stripeCustomerId",
      value: stripeCustomerId
    }]
  });
  if (user$1) return {
    customerType: "user",
    referenceId: user$1.id
  };
  return null;
}
async function onCheckoutSessionCompleted(ctx, options, event) {
  try {
    const client = options.stripeClient;
    const checkoutSession = event.data.object;
    if (checkoutSession.mode === "setup" || !options.subscription?.enabled) return;
    const subscription = await client.subscriptions.retrieve(checkoutSession.subscription);
    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      ctx.context.logger.warn(`Stripe webhook warning: Subscription ${subscription.id} has no items`);
      return;
    }
    const priceId = subscriptionItem.price.id;
    const priceLookupKey = subscriptionItem.price.lookup_key;
    const plan = await getPlanByPriceInfo(options, priceId, priceLookupKey);
    if (plan) {
      const referenceId = checkoutSession?.client_reference_id || checkoutSession?.metadata?.referenceId;
      const subscriptionId = checkoutSession?.metadata?.subscriptionId;
      const seats = subscriptionItem.quantity;
      if (referenceId && subscriptionId) {
        const trial = subscription.trial_start && subscription.trial_end ? {
          trialStart: /* @__PURE__ */ new Date(subscription.trial_start * 1e3),
          trialEnd: /* @__PURE__ */ new Date(subscription.trial_end * 1e3)
        } : {};
        let dbSubscription = await ctx.context.adapter.update({
          model: "subscription",
          update: {
            plan: plan.name.toLowerCase(),
            status: subscription.status,
            updatedAt: /* @__PURE__ */ new Date(),
            periodStart: /* @__PURE__ */ new Date(subscriptionItem.current_period_start * 1e3),
            periodEnd: /* @__PURE__ */ new Date(subscriptionItem.current_period_end * 1e3),
            stripeSubscriptionId: checkoutSession.subscription,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            cancelAt: subscription.cancel_at ? /* @__PURE__ */ new Date(subscription.cancel_at * 1e3) : null,
            canceledAt: subscription.canceled_at ? /* @__PURE__ */ new Date(subscription.canceled_at * 1e3) : null,
            endedAt: subscription.ended_at ? /* @__PURE__ */ new Date(subscription.ended_at * 1e3) : null,
            seats,
            ...trial
          },
          where: [{
            field: "id",
            value: subscriptionId
          }]
        });
        if (trial.trialStart && plan.freeTrial?.onTrialStart) await plan.freeTrial.onTrialStart(dbSubscription);
        if (!dbSubscription) dbSubscription = await ctx.context.adapter.findOne({
          model: "subscription",
          where: [{
            field: "id",
            value: subscriptionId
          }]
        });
        await options.subscription?.onSubscriptionComplete?.({
          event,
          subscription: dbSubscription,
          stripeSubscription: subscription,
          plan
        }, ctx);
        return;
      }
    }
  } catch (e) {
    ctx.context.logger.error(`Stripe webhook failed. Error: ${e.message}`);
  }
}
async function onSubscriptionCreated(ctx, options, event) {
  try {
    if (!options.subscription?.enabled) return;
    const subscriptionCreated = event.data.object;
    const stripeCustomerId = subscriptionCreated.customer?.toString();
    if (!stripeCustomerId) {
      ctx.context.logger.warn(`Stripe webhook warning: customer.subscription.created event received without customer ID`);
      return;
    }
    const subscriptionId = subscriptionCreated.metadata?.subscriptionId;
    const existingSubscription = await ctx.context.adapter.findOne({
      model: "subscription",
      where: subscriptionId ? [{
        field: "id",
        value: subscriptionId
      }] : [{
        field: "stripeSubscriptionId",
        value: subscriptionCreated.id
      }]
    });
    if (existingSubscription) {
      ctx.context.logger.info(`Stripe webhook: Subscription already exists in database (id: ${existingSubscription.id}), skipping creation`);
      return;
    }
    const reference = await findReferenceByStripeCustomerId(ctx, options, stripeCustomerId);
    if (!reference) {
      ctx.context.logger.warn(`Stripe webhook warning: No user or organization found with stripeCustomerId: ${stripeCustomerId}`);
      return;
    }
    const { referenceId, customerType } = reference;
    const subscriptionItem = subscriptionCreated.items.data[0];
    if (!subscriptionItem) {
      ctx.context.logger.warn(`Stripe webhook warning: Subscription ${subscriptionCreated.id} has no items`);
      return;
    }
    const priceId = subscriptionItem.price.id;
    const plan = await getPlanByPriceInfo(options, priceId, subscriptionItem.price.lookup_key || null);
    if (!plan) {
      ctx.context.logger.warn(`Stripe webhook warning: No matching plan found for priceId: ${priceId}`);
      return;
    }
    const seats = subscriptionItem.quantity;
    const periodStart = /* @__PURE__ */ new Date(subscriptionItem.current_period_start * 1e3);
    const periodEnd = /* @__PURE__ */ new Date(subscriptionItem.current_period_end * 1e3);
    const trial = subscriptionCreated.trial_start && subscriptionCreated.trial_end ? {
      trialStart: /* @__PURE__ */ new Date(subscriptionCreated.trial_start * 1e3),
      trialEnd: /* @__PURE__ */ new Date(subscriptionCreated.trial_end * 1e3)
    } : {};
    const newSubscription = await ctx.context.adapter.create({
      model: "subscription",
      data: {
        referenceId,
        stripeCustomerId,
        stripeSubscriptionId: subscriptionCreated.id,
        status: subscriptionCreated.status,
        plan: plan.name.toLowerCase(),
        periodStart,
        periodEnd,
        seats,
        ...plan.limits ? { limits: plan.limits } : {},
        ...trial
      }
    });
    ctx.context.logger.info(`Stripe webhook: Created subscription ${subscriptionCreated.id} for ${customerType} ${referenceId} from dashboard`);
    await options.subscription.onSubscriptionCreated?.({
      event,
      subscription: newSubscription,
      stripeSubscription: subscriptionCreated,
      plan
    });
  } catch (error) {
    ctx.context.logger.error(`Stripe webhook failed. Error: ${error}`);
  }
}
async function onSubscriptionUpdated(ctx, options, event) {
  try {
    if (!options.subscription?.enabled) return;
    const subscriptionUpdated = event.data.object;
    const subscriptionItem = subscriptionUpdated.items.data[0];
    if (!subscriptionItem) {
      ctx.context.logger.warn(`Stripe webhook warning: Subscription ${subscriptionUpdated.id} has no items`);
      return;
    }
    const priceId = subscriptionItem.price.id;
    const priceLookupKey = subscriptionItem.price.lookup_key;
    const plan = await getPlanByPriceInfo(options, priceId, priceLookupKey);
    const subscriptionId = subscriptionUpdated.metadata?.subscriptionId;
    const customerId = subscriptionUpdated.customer?.toString();
    let subscription = await ctx.context.adapter.findOne({
      model: "subscription",
      where: subscriptionId ? [{
        field: "id",
        value: subscriptionId
      }] : [{
        field: "stripeSubscriptionId",
        value: subscriptionUpdated.id
      }]
    });
    if (!subscription) {
      const subs = await ctx.context.adapter.findMany({
        model: "subscription",
        where: [{
          field: "stripeCustomerId",
          value: customerId
        }]
      });
      if (subs.length > 1) {
        const activeSub = subs.find((sub) => isActiveOrTrialing(sub));
        if (!activeSub) {
          ctx.context.logger.warn(`Stripe webhook error: Multiple subscriptions found for customerId: ${customerId} and no active subscription is found`);
          return;
        }
        subscription = activeSub;
      } else subscription = subs[0];
    }
    const updatedSubscription = await ctx.context.adapter.update({
      model: "subscription",
      update: {
        ...plan ? {
          plan: plan.name.toLowerCase(),
          limits: plan.limits
        } : {},
        updatedAt: /* @__PURE__ */ new Date(),
        status: subscriptionUpdated.status,
        periodStart: /* @__PURE__ */ new Date(subscriptionItem.current_period_start * 1e3),
        periodEnd: /* @__PURE__ */ new Date(subscriptionItem.current_period_end * 1e3),
        cancelAtPeriodEnd: subscriptionUpdated.cancel_at_period_end,
        cancelAt: subscriptionUpdated.cancel_at ? /* @__PURE__ */ new Date(subscriptionUpdated.cancel_at * 1e3) : null,
        canceledAt: subscriptionUpdated.canceled_at ? /* @__PURE__ */ new Date(subscriptionUpdated.canceled_at * 1e3) : null,
        endedAt: subscriptionUpdated.ended_at ? /* @__PURE__ */ new Date(subscriptionUpdated.ended_at * 1e3) : null,
        seats: subscriptionItem.quantity,
        stripeSubscriptionId: subscriptionUpdated.id
      },
      where: [{
        field: "id",
        value: subscription.id
      }]
    });
    if (subscriptionUpdated.status === "active" && isStripePendingCancel(subscriptionUpdated) && !isPendingCancel(subscription)) await options.subscription.onSubscriptionCancel?.({
      subscription,
      cancellationDetails: subscriptionUpdated.cancellation_details || void 0,
      stripeSubscription: subscriptionUpdated,
      event
    });
    await options.subscription.onSubscriptionUpdate?.({
      event,
      subscription: updatedSubscription || subscription
    });
    if (plan) {
      if (subscriptionUpdated.status === "active" && subscription.status === "trialing" && plan.freeTrial?.onTrialEnd) await plan.freeTrial.onTrialEnd({ subscription }, ctx);
      if (subscriptionUpdated.status === "incomplete_expired" && subscription.status === "trialing" && plan.freeTrial?.onTrialExpired) await plan.freeTrial.onTrialExpired(subscription, ctx);
    }
  } catch (error) {
    ctx.context.logger.error(`Stripe webhook failed. Error: ${error}`);
  }
}
async function onSubscriptionDeleted(ctx, options, event) {
  if (!options.subscription?.enabled) return;
  try {
    const subscriptionDeleted = event.data.object;
    const subscriptionId = subscriptionDeleted.id;
    const subscription = await ctx.context.adapter.findOne({
      model: "subscription",
      where: [{
        field: "stripeSubscriptionId",
        value: subscriptionId
      }]
    });
    if (subscription) {
      await ctx.context.adapter.update({
        model: "subscription",
        where: [{
          field: "id",
          value: subscription.id
        }],
        update: {
          status: "canceled",
          updatedAt: /* @__PURE__ */ new Date(),
          cancelAtPeriodEnd: subscriptionDeleted.cancel_at_period_end,
          cancelAt: subscriptionDeleted.cancel_at ? /* @__PURE__ */ new Date(subscriptionDeleted.cancel_at * 1e3) : null,
          canceledAt: subscriptionDeleted.canceled_at ? /* @__PURE__ */ new Date(subscriptionDeleted.canceled_at * 1e3) : null,
          endedAt: subscriptionDeleted.ended_at ? /* @__PURE__ */ new Date(subscriptionDeleted.ended_at * 1e3) : null
        }
      });
      await options.subscription.onSubscriptionDeleted?.({
        event,
        stripeSubscription: subscriptionDeleted,
        subscription
      });
    } else ctx.context.logger.warn(`Stripe webhook error: Subscription not found for subscriptionId: ${subscriptionId}`);
  } catch (error) {
    ctx.context.logger.error(`Stripe webhook failed. Error: ${error}`);
  }
}
const stripeSessionMiddleware = createAuthMiddleware({ use: [sessionMiddleware] }, async (ctx) => {
  return { session: ctx.context.session };
});
const referenceMiddleware = (subscriptionOptions, action) => createAuthMiddleware(async (ctx) => {
  const ctxSession = ctx.context.session;
  if (!ctxSession) throw new APIError("UNAUTHORIZED", { message: STRIPE_ERROR_CODES.UNAUTHORIZED });
  const customerType = ctx.body?.customerType || ctx.query?.customerType;
  const explicitReferenceId = ctx.body?.referenceId || ctx.query?.referenceId;
  if (customerType === "organization") {
    if (!subscriptionOptions.authorizeReference) {
      ctx.context.logger.error(`Organization subscriptions require authorizeReference to be defined in your stripe plugin config.`);
      throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.ORGANIZATION_SUBSCRIPTION_NOT_ENABLED });
    }
    const referenceId = explicitReferenceId || ctxSession.session.activeOrganizationId;
    if (!referenceId) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.ORGANIZATION_REFERENCE_ID_REQUIRED });
    if (!await subscriptionOptions.authorizeReference({
      user: ctxSession.user,
      session: ctxSession.session,
      referenceId,
      action
    }, ctx)) throw new APIError("UNAUTHORIZED", { message: STRIPE_ERROR_CODES.UNAUTHORIZED });
    return;
  }
  if (!explicitReferenceId) return;
  if (explicitReferenceId === ctxSession.user.id) return;
  if (!subscriptionOptions.authorizeReference) {
    ctx.context.logger.error(`Passing referenceId into a subscription action isn't allowed if subscription.authorizeReference isn't defined in your stripe plugin config.`);
    throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.REFERENCE_ID_NOT_ALLOWED });
  }
  if (!await subscriptionOptions.authorizeReference({
    user: ctxSession.user,
    session: ctxSession.session,
    referenceId: explicitReferenceId,
    action
  }, ctx)) throw new APIError("UNAUTHORIZED", { message: STRIPE_ERROR_CODES.UNAUTHORIZED });
});
function getUrl(ctx, url) {
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(url)) return url;
  return `${ctx.context.options.baseURL}${url.startsWith("/") ? url : `/${url}`}`;
}
async function resolvePriceIdFromLookupKey(stripeClient2, lookupKey) {
  if (!lookupKey) return void 0;
  return (await stripeClient2.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1
  })).data[0]?.id;
}
function getReferenceId(ctxSession, customerType, options) {
  const { user: user$1, session } = ctxSession;
  if ((customerType || "user") === "organization") {
    if (!options.organization?.enabled) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.ORGANIZATION_SUBSCRIPTION_NOT_ENABLED });
    if (!session.activeOrganizationId) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.ORGANIZATION_NOT_FOUND });
    return session.activeOrganizationId;
  }
  return user$1.id;
}
const upgradeSubscriptionBodySchema = object({
  plan: string().meta({ description: 'The name of the plan to upgrade to. Eg: "pro"' }),
  annual: boolean().meta({ description: "Whether to upgrade to an annual plan. Eg: true" }).optional(),
  referenceId: string().meta({ description: 'Reference ID for the subscription. Eg: "org_123"' }).optional(),
  subscriptionId: string().meta({ description: 'The Stripe subscription ID to upgrade. Eg: "sub_1ABC2DEF3GHI4JKL"' }).optional(),
  customerType: _enum(["user", "organization"]).meta({ description: 'Customer type for the subscription. Eg: "user" or "organization"' }).optional(),
  metadata: record(string(), any()).optional(),
  seats: number().meta({ description: "Number of seats to upgrade to (if applicable). Eg: 1" }).optional(),
  successUrl: string().meta({ description: 'Callback URL to redirect back after successful subscription. Eg: "https://example.com/success"' }).default("/"),
  cancelUrl: string().meta({ description: 'If set, checkout shows a back button and customers will be directed here if they cancel payment. Eg: "https://example.com/pricing"' }).default("/"),
  returnUrl: string().meta({ description: 'URL to take customers to when they click on the billing portal’s link to return to your website. Eg: "https://example.com/dashboard"' }).optional(),
  disableRedirect: boolean().meta({ description: "Disable redirect after successful subscription. Eg: true" }).default(false)
});
const upgradeSubscription = (options) => {
  const client = options.stripeClient;
  const subscriptionOptions = options.subscription;
  return createAuthEndpoint("/subscription/upgrade", {
    method: "POST",
    body: upgradeSubscriptionBodySchema,
    metadata: { openapi: { operationId: "upgradeSubscription" } },
    use: [
      stripeSessionMiddleware,
      referenceMiddleware(subscriptionOptions, "upgrade-subscription"),
      originCheck((c) => {
        return [c.body.successUrl, c.body.cancelUrl];
      })
    ]
  }, async (ctx) => {
    const { user: user$1, session } = ctx.context.session;
    const customerType = ctx.body.customerType || "user";
    const referenceId = ctx.body.referenceId || getReferenceId(ctx.context.session, customerType, options);
    if (!user$1.emailVerified && subscriptionOptions.requireEmailVerification) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED });
    const plan = await getPlanByName(options, ctx.body.plan);
    if (!plan) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_PLAN_NOT_FOUND });
    let subscriptionToUpdate = ctx.body.subscriptionId ? await ctx.context.adapter.findOne({
      model: "subscription",
      where: [{
        field: "stripeSubscriptionId",
        value: ctx.body.subscriptionId
      }]
    }) : referenceId ? await ctx.context.adapter.findOne({
      model: "subscription",
      where: [{
        field: "referenceId",
        value: referenceId
      }]
    }) : null;
    if (ctx.body.subscriptionId && subscriptionToUpdate && subscriptionToUpdate.referenceId !== referenceId) subscriptionToUpdate = null;
    if (ctx.body.subscriptionId && !subscriptionToUpdate) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND });
    let customerId;
    if (customerType === "organization") {
      customerId = subscriptionToUpdate?.stripeCustomerId;
      if (!customerId) {
        const org = await ctx.context.adapter.findOne({
          model: "organization",
          where: [{
            field: "id",
            value: referenceId
          }]
        });
        if (!org) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.ORGANIZATION_NOT_FOUND });
        customerId = org.stripeCustomerId;
        if (!customerId) try {
          let stripeCustomer = (await client.customers.search({
            query: `metadata["organizationId"]:"${org.id}"`,
            limit: 1
          })).data[0];
          if (!stripeCustomer) {
            let extraCreateParams = {};
            if (options.organization?.getCustomerCreateParams) extraCreateParams = await options.organization.getCustomerCreateParams(org, ctx);
            const customerParams = defu({
              name: org.name,
              metadata: {
                ...ctx.body.metadata,
                organizationId: org.id,
                customerType: "organization"
              }
            }, extraCreateParams);
            stripeCustomer = await client.customers.create(customerParams);
            await options.organization?.onCustomerCreate?.({
              stripeCustomer,
              organization: {
                ...org,
                stripeCustomerId: stripeCustomer.id
              }
            }, ctx);
          }
          await ctx.context.adapter.update({
            model: "organization",
            update: { stripeCustomerId: stripeCustomer.id },
            where: [{
              field: "id",
              value: org.id
            }]
          });
          customerId = stripeCustomer.id;
        } catch (e) {
          ctx.context.logger.error(e);
          throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.UNABLE_TO_CREATE_CUSTOMER });
        }
      }
    } else {
      customerId = subscriptionToUpdate?.stripeCustomerId || user$1.stripeCustomerId;
      if (!customerId) try {
        let stripeCustomer = (await client.customers.search({
          query: `email:"${escapeStripeSearchValue(user$1.email)}" AND -metadata["customerType"]:"organization"`,
          limit: 1
        })).data[0];
        if (!stripeCustomer) stripeCustomer = await client.customers.create({
          email: user$1.email,
          name: user$1.name,
          metadata: {
            ...ctx.body.metadata,
            userId: user$1.id,
            customerType: "user"
          }
        });
        await ctx.context.adapter.update({
          model: "user",
          update: { stripeCustomerId: stripeCustomer.id },
          where: [{
            field: "id",
            value: user$1.id
          }]
        });
        customerId = stripeCustomer.id;
      } catch (e) {
        ctx.context.logger.error(e);
        throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.UNABLE_TO_CREATE_CUSTOMER });
      }
    }
    const subscriptions$1 = subscriptionToUpdate ? [subscriptionToUpdate] : await ctx.context.adapter.findMany({
      model: "subscription",
      where: [{
        field: "referenceId",
        value: referenceId
      }]
    });
    const activeOrTrialingSubscription = subscriptions$1.find((sub) => isActiveOrTrialing(sub));
    const activeSubscription = (await client.subscriptions.list({ customer: customerId }).then((res) => res.data.filter((sub) => isActiveOrTrialing(sub)))).find((sub) => {
      if (subscriptionToUpdate?.stripeSubscriptionId || ctx.body.subscriptionId) return sub.id === subscriptionToUpdate?.stripeSubscriptionId || sub.id === ctx.body.subscriptionId;
      if (activeOrTrialingSubscription?.stripeSubscriptionId) return sub.id === activeOrTrialingSubscription.stripeSubscriptionId;
      return false;
    });
    const incompleteSubscription = subscriptions$1.find((sub) => sub.status === "incomplete");
    if (activeOrTrialingSubscription && activeOrTrialingSubscription.status === "active" && activeOrTrialingSubscription.plan === ctx.body.plan && activeOrTrialingSubscription.seats === (ctx.body.seats || 1)) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.ALREADY_SUBSCRIBED_PLAN });
    if (activeSubscription && customerId) {
      let dbSubscription = await ctx.context.adapter.findOne({
        model: "subscription",
        where: [{
          field: "stripeSubscriptionId",
          value: activeSubscription.id
        }]
      });
      if (!dbSubscription && activeOrTrialingSubscription) {
        await ctx.context.adapter.update({
          model: "subscription",
          update: {
            stripeSubscriptionId: activeSubscription.id,
            updatedAt: /* @__PURE__ */ new Date()
          },
          where: [{
            field: "id",
            value: activeOrTrialingSubscription.id
          }]
        });
        dbSubscription = activeOrTrialingSubscription;
      }
      let priceIdToUse$1 = void 0;
      if (ctx.body.annual) {
        priceIdToUse$1 = plan.annualDiscountPriceId;
        if (!priceIdToUse$1 && plan.annualDiscountLookupKey) priceIdToUse$1 = await resolvePriceIdFromLookupKey(client, plan.annualDiscountLookupKey);
      } else {
        priceIdToUse$1 = plan.priceId;
        if (!priceIdToUse$1 && plan.lookupKey) priceIdToUse$1 = await resolvePriceIdFromLookupKey(client, plan.lookupKey);
      }
      if (!priceIdToUse$1) throw ctx.error("BAD_REQUEST", { message: "Price ID not found for the selected plan" });
      const { url } = await client.billingPortal.sessions.create({
        customer: customerId,
        return_url: getUrl(ctx, ctx.body.returnUrl || "/"),
        flow_data: {
          type: "subscription_update_confirm",
          after_completion: {
            type: "redirect",
            redirect: { return_url: getUrl(ctx, ctx.body.returnUrl || "/") }
          },
          subscription_update_confirm: {
            subscription: activeSubscription.id,
            items: [{
              id: activeSubscription.items.data[0]?.id,
              quantity: ctx.body.seats || 1,
              price: priceIdToUse$1
            }]
          }
        }
      }).catch(async (e) => {
        throw ctx.error("BAD_REQUEST", {
          message: e.message,
          code: e.code
        });
      });
      return ctx.json({
        url,
        redirect: !ctx.body.disableRedirect
      });
    }
    let subscription = activeOrTrialingSubscription || incompleteSubscription;
    if (incompleteSubscription && !activeOrTrialingSubscription) subscription = await ctx.context.adapter.update({
      model: "subscription",
      update: {
        plan: plan.name.toLowerCase(),
        seats: ctx.body.seats || 1,
        updatedAt: /* @__PURE__ */ new Date()
      },
      where: [{
        field: "id",
        value: incompleteSubscription.id
      }]
    }) || incompleteSubscription;
    if (!subscription) subscription = await ctx.context.adapter.create({
      model: "subscription",
      data: {
        plan: plan.name.toLowerCase(),
        stripeCustomerId: customerId,
        status: "incomplete",
        referenceId,
        seats: ctx.body.seats || 1
      }
    });
    if (!subscription) {
      ctx.context.logger.error("Subscription ID not found");
      throw new APIError("NOT_FOUND", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND });
    }
    const params = await subscriptionOptions.getCheckoutSessionParams?.({
      user: user$1,
      session,
      plan,
      subscription
    }, ctx.request, ctx);
    const freeTrial = !(await ctx.context.adapter.findMany({
      model: "subscription",
      where: [{
        field: "referenceId",
        value: referenceId
      }]
    })).some((s) => {
      return !!(s.trialStart || s.trialEnd) || s.status === "trialing";
    }) && plan.freeTrial ? { trial_period_days: plan.freeTrial.days } : void 0;
    let priceIdToUse = void 0;
    if (ctx.body.annual) {
      priceIdToUse = plan.annualDiscountPriceId;
      if (!priceIdToUse && plan.annualDiscountLookupKey) priceIdToUse = await resolvePriceIdFromLookupKey(client, plan.annualDiscountLookupKey);
    } else {
      priceIdToUse = plan.priceId;
      if (!priceIdToUse && plan.lookupKey) priceIdToUse = await resolvePriceIdFromLookupKey(client, plan.lookupKey);
    }
    const checkoutSession = await client.checkout.sessions.create({
      ...customerId ? {
        customer: customerId,
        customer_update: customerType !== "user" ? { address: "auto" } : {
          name: "auto",
          address: "auto"
        }
      } : { customer_email: user$1.email },
      success_url: getUrl(ctx, `${ctx.context.baseURL}/subscription/success?callbackURL=${encodeURIComponent(ctx.body.successUrl)}&subscriptionId=${encodeURIComponent(subscription.id)}`),
      cancel_url: getUrl(ctx, ctx.body.cancelUrl),
      line_items: [{
        price: priceIdToUse,
        quantity: ctx.body.seats || 1
      }],
      subscription_data: {
        ...freeTrial,
        metadata: {
          ...ctx.body.metadata,
          ...params?.params?.subscription_data?.metadata,
          userId: user$1.id,
          subscriptionId: subscription.id,
          referenceId
        }
      },
      mode: "subscription",
      client_reference_id: referenceId,
      ...params?.params,
      metadata: {
        ...ctx.body.metadata,
        ...params?.params?.metadata,
        userId: user$1.id,
        subscriptionId: subscription.id,
        referenceId
      }
    }, params?.options).catch(async (e) => {
      throw ctx.error("BAD_REQUEST", {
        message: e.message,
        code: e.code
      });
    });
    return ctx.json({
      ...checkoutSession,
      redirect: !ctx.body.disableRedirect
    });
  });
};
const cancelSubscriptionCallbackQuerySchema = record(string(), any()).optional();
const cancelSubscriptionCallback = (options) => {
  const client = options.stripeClient;
  const subscriptionOptions = options.subscription;
  return createAuthEndpoint("/subscription/cancel/callback", {
    method: "GET",
    query: cancelSubscriptionCallbackQuerySchema,
    metadata: { openapi: { operationId: "cancelSubscriptionCallback" } },
    use: [originCheck((ctx) => ctx.query.callbackURL)]
  }, async (ctx) => {
    if (!ctx.query || !ctx.query.callbackURL || !ctx.query.subscriptionId) throw ctx.redirect(getUrl(ctx, ctx.query?.callbackURL || "/"));
    const session = await getSessionFromCtx(ctx);
    if (!session) throw ctx.redirect(getUrl(ctx, ctx.query?.callbackURL || "/"));
    const { user: user$1 } = session;
    const { callbackURL, subscriptionId } = ctx.query;
    if (user$1?.stripeCustomerId) try {
      const subscription = await ctx.context.adapter.findOne({
        model: "subscription",
        where: [{
          field: "id",
          value: subscriptionId
        }]
      });
      if (!subscription || subscription.status === "canceled" || isPendingCancel(subscription)) throw ctx.redirect(getUrl(ctx, callbackURL));
      const currentSubscription = (await client.subscriptions.list({
        customer: user$1.stripeCustomerId,
        status: "active"
      })).data.find((sub) => sub.id === subscription.stripeSubscriptionId);
      if (currentSubscription && isStripePendingCancel(currentSubscription) && !isPendingCancel(subscription)) {
        await ctx.context.adapter.update({
          model: "subscription",
          update: {
            status: currentSubscription?.status,
            cancelAtPeriodEnd: currentSubscription?.cancel_at_period_end || false,
            cancelAt: currentSubscription?.cancel_at ? /* @__PURE__ */ new Date(currentSubscription.cancel_at * 1e3) : null,
            canceledAt: currentSubscription?.canceled_at ? /* @__PURE__ */ new Date(currentSubscription.canceled_at * 1e3) : null
          },
          where: [{
            field: "id",
            value: subscription.id
          }]
        });
        await subscriptionOptions.onSubscriptionCancel?.({
          subscription,
          cancellationDetails: currentSubscription.cancellation_details,
          stripeSubscription: currentSubscription,
          event: void 0
        });
      }
    } catch (error) {
      ctx.context.logger.error("Error checking subscription status from Stripe", error);
    }
    throw ctx.redirect(getUrl(ctx, callbackURL));
  });
};
const cancelSubscriptionBodySchema = object({
  referenceId: string().meta({ description: "Reference id of the subscription to cancel. Eg: '123'" }).optional(),
  subscriptionId: string().meta({ description: "The Stripe subscription ID to cancel. Eg: 'sub_1ABC2DEF3GHI4JKL'" }).optional(),
  customerType: _enum(["user", "organization"]).meta({ description: 'Customer type for the subscription. Eg: "user" or "organization"' }).optional(),
  returnUrl: string().meta({ description: `URL to take customers to when they click on the billing portal's link to return to your website. Eg: "/account"` }),
  disableRedirect: boolean().meta({ description: "Disable redirect after successful subscription cancellation. Eg: true" }).default(false)
});
const cancelSubscription = (options) => {
  const client = options.stripeClient;
  const subscriptionOptions = options.subscription;
  return createAuthEndpoint("/subscription/cancel", {
    method: "POST",
    body: cancelSubscriptionBodySchema,
    metadata: { openapi: { operationId: "cancelSubscription" } },
    use: [
      stripeSessionMiddleware,
      referenceMiddleware(subscriptionOptions, "cancel-subscription"),
      originCheck((ctx) => ctx.body.returnUrl)
    ]
  }, async (ctx) => {
    const customerType = ctx.body.customerType || "user";
    const referenceId = ctx.body.referenceId || getReferenceId(ctx.context.session, customerType, options);
    let subscription = ctx.body.subscriptionId ? await ctx.context.adapter.findOne({
      model: "subscription",
      where: [{
        field: "stripeSubscriptionId",
        value: ctx.body.subscriptionId
      }]
    }) : await ctx.context.adapter.findMany({
      model: "subscription",
      where: [{
        field: "referenceId",
        value: referenceId
      }]
    }).then((subs) => subs.find((sub) => isActiveOrTrialing(sub)));
    if (ctx.body.subscriptionId && subscription && subscription.referenceId !== referenceId) subscription = void 0;
    if (!subscription || !subscription.stripeCustomerId) throw ctx.error("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND });
    const activeSubscriptions = await client.subscriptions.list({ customer: subscription.stripeCustomerId }).then((res) => res.data.filter((sub) => isActiveOrTrialing(sub)));
    if (!activeSubscriptions.length) {
      await ctx.context.adapter.deleteMany({
        model: "subscription",
        where: [{
          field: "referenceId",
          value: referenceId
        }]
      });
      throw ctx.error("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND });
    }
    const activeSubscription = activeSubscriptions.find((sub) => sub.id === subscription.stripeSubscriptionId);
    if (!activeSubscription) throw ctx.error("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND });
    const { url } = await client.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: getUrl(ctx, `${ctx.context.baseURL}/subscription/cancel/callback?callbackURL=${encodeURIComponent(ctx.body?.returnUrl || "/")}&subscriptionId=${encodeURIComponent(subscription.id)}`),
      flow_data: {
        type: "subscription_cancel",
        subscription_cancel: { subscription: activeSubscription.id }
      }
    }).catch(async (e) => {
      if (e.message?.includes("already set to be canceled")) {
        if (!isPendingCancel(subscription)) {
          const stripeSub = await client.subscriptions.retrieve(activeSubscription.id);
          await ctx.context.adapter.update({
            model: "subscription",
            update: {
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              cancelAt: stripeSub.cancel_at ? /* @__PURE__ */ new Date(stripeSub.cancel_at * 1e3) : null,
              canceledAt: stripeSub.canceled_at ? /* @__PURE__ */ new Date(stripeSub.canceled_at * 1e3) : null
            },
            where: [{
              field: "id",
              value: subscription.id
            }]
          });
        }
      }
      throw ctx.error("BAD_REQUEST", {
        message: e.message,
        code: e.code
      });
    });
    return ctx.json({
      url,
      redirect: !ctx.body.disableRedirect
    });
  });
};
const restoreSubscriptionBodySchema = object({
  referenceId: string().meta({ description: "Reference id of the subscription to restore. Eg: '123'" }).optional(),
  subscriptionId: string().meta({ description: "The Stripe subscription ID to restore. Eg: 'sub_1ABC2DEF3GHI4JKL'" }).optional(),
  customerType: _enum(["user", "organization"]).meta({ description: 'Customer type for the subscription. Eg: "user" or "organization"' }).optional()
});
const restoreSubscription = (options) => {
  const client = options.stripeClient;
  const subscriptionOptions = options.subscription;
  return createAuthEndpoint("/subscription/restore", {
    method: "POST",
    body: restoreSubscriptionBodySchema,
    metadata: { openapi: { operationId: "restoreSubscription" } },
    use: [stripeSessionMiddleware, referenceMiddleware(subscriptionOptions, "restore-subscription")]
  }, async (ctx) => {
    const customerType = ctx.body.customerType || "user";
    const referenceId = ctx.body.referenceId || getReferenceId(ctx.context.session, customerType, options);
    let subscription = ctx.body.subscriptionId ? await ctx.context.adapter.findOne({
      model: "subscription",
      where: [{
        field: "stripeSubscriptionId",
        value: ctx.body.subscriptionId
      }]
    }) : await ctx.context.adapter.findMany({
      model: "subscription",
      where: [{
        field: "referenceId",
        value: referenceId
      }]
    }).then((subs) => subs.find((sub) => isActiveOrTrialing(sub)));
    if (ctx.body.subscriptionId && subscription && subscription.referenceId !== referenceId) subscription = void 0;
    if (!subscription || !subscription.stripeCustomerId) throw ctx.error("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND });
    if (!isActiveOrTrialing(subscription)) throw ctx.error("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_ACTIVE });
    if (!isPendingCancel(subscription)) throw ctx.error("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_SCHEDULED_FOR_CANCELLATION });
    const activeSubscription = await client.subscriptions.list({ customer: subscription.stripeCustomerId }).then((res) => res.data.filter((sub) => isActiveOrTrialing(sub))[0]);
    if (!activeSubscription) throw ctx.error("BAD_REQUEST", { message: STRIPE_ERROR_CODES.SUBSCRIPTION_NOT_FOUND });
    const updateParams = {};
    if (activeSubscription.cancel_at) updateParams.cancel_at = "";
    else if (activeSubscription.cancel_at_period_end) updateParams.cancel_at_period_end = false;
    const newSub = await client.subscriptions.update(activeSubscription.id, updateParams).catch((e) => {
      throw ctx.error("BAD_REQUEST", {
        message: e.message,
        code: e.code
      });
    });
    await ctx.context.adapter.update({
      model: "subscription",
      update: {
        cancelAtPeriodEnd: false,
        cancelAt: null,
        canceledAt: null,
        updatedAt: /* @__PURE__ */ new Date()
      },
      where: [{
        field: "id",
        value: subscription.id
      }]
    });
    return ctx.json(newSub);
  });
};
const listActiveSubscriptionsQuerySchema = optional(object({
  referenceId: string().meta({ description: "Reference id of the subscription to list. Eg: '123'" }).optional(),
  customerType: _enum(["user", "organization"]).meta({ description: 'Customer type for the subscription. Eg: "user" or "organization"' }).optional()
}));
const listActiveSubscriptions = (options) => {
  const subscriptionOptions = options.subscription;
  return createAuthEndpoint("/subscription/list", {
    method: "GET",
    query: listActiveSubscriptionsQuerySchema,
    metadata: { openapi: { operationId: "listActiveSubscriptions" } },
    use: [stripeSessionMiddleware, referenceMiddleware(subscriptionOptions, "list-subscription")]
  }, async (ctx) => {
    const customerType = ctx.query?.customerType || "user";
    const referenceId = ctx.query?.referenceId || getReferenceId(ctx.context.session, customerType, options);
    const subscriptions$1 = await ctx.context.adapter.findMany({
      model: "subscription",
      where: [{
        field: "referenceId",
        value: referenceId
      }]
    });
    if (!subscriptions$1.length) return [];
    const plans = await getPlans(options.subscription);
    if (!plans) return [];
    const subs = subscriptions$1.map((sub) => {
      const plan = plans.find((p) => p.name.toLowerCase() === sub.plan.toLowerCase());
      return {
        ...sub,
        limits: plan?.limits,
        priceId: plan?.priceId
      };
    }).filter((sub) => isActiveOrTrialing(sub));
    return ctx.json(subs);
  });
};
const subscriptionSuccessQuerySchema = record(string(), any()).optional();
const subscriptionSuccess = (options) => {
  const client = options.stripeClient;
  return createAuthEndpoint("/subscription/success", {
    method: "GET",
    query: subscriptionSuccessQuerySchema,
    metadata: { openapi: { operationId: "handleSubscriptionSuccess" } },
    use: [originCheck((ctx) => ctx.query.callbackURL)]
  }, async (ctx) => {
    if (!ctx.query || !ctx.query.callbackURL || !ctx.query.subscriptionId) throw ctx.redirect(getUrl(ctx, ctx.query?.callbackURL || "/"));
    const { callbackURL, subscriptionId } = ctx.query;
    const session = await getSessionFromCtx(ctx);
    if (!session) throw ctx.redirect(getUrl(ctx, ctx.query?.callbackURL || "/"));
    const subscription = await ctx.context.adapter.findOne({
      model: "subscription",
      where: [{
        field: "id",
        value: subscriptionId
      }]
    });
    if (!subscription) {
      ctx.context.logger.warn(`Subscription record not found for subscriptionId: ${subscriptionId}`);
      throw ctx.redirect(getUrl(ctx, callbackURL));
    }
    if (isActiveOrTrialing(subscription)) throw ctx.redirect(getUrl(ctx, callbackURL));
    const customerId = subscription.stripeCustomerId || session.user.stripeCustomerId;
    if (!customerId) throw ctx.redirect(getUrl(ctx, callbackURL));
    const stripeSubscription = await client.subscriptions.list({
      customer: customerId,
      status: "active"
    }).then((res) => res.data[0]).catch((error) => {
      ctx.context.logger.error("Error fetching subscription from Stripe", error);
      throw ctx.redirect(getUrl(ctx, callbackURL));
    });
    if (!stripeSubscription) throw ctx.redirect(getUrl(ctx, callbackURL));
    const subscriptionItem = stripeSubscription.items.data[0];
    if (!subscriptionItem) {
      ctx.context.logger.warn(`No subscription items found for Stripe subscription ${stripeSubscription.id}`);
      throw ctx.redirect(getUrl(ctx, callbackURL));
    }
    const plan = await getPlanByPriceInfo(options, subscriptionItem.price.id, subscriptionItem.price.lookup_key);
    if (!plan) {
      ctx.context.logger.warn(`Plan not found for price ${subscriptionItem.price.id}`);
      throw ctx.redirect(getUrl(ctx, callbackURL));
    }
    await ctx.context.adapter.update({
      model: "subscription",
      update: {
        status: stripeSubscription.status,
        seats: subscriptionItem.quantity || 1,
        plan: plan.name.toLowerCase(),
        periodEnd: /* @__PURE__ */ new Date(subscriptionItem.current_period_end * 1e3),
        periodStart: /* @__PURE__ */ new Date(subscriptionItem.current_period_start * 1e3),
        stripeSubscriptionId: stripeSubscription.id,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        cancelAt: stripeSubscription.cancel_at ? /* @__PURE__ */ new Date(stripeSubscription.cancel_at * 1e3) : null,
        canceledAt: stripeSubscription.canceled_at ? /* @__PURE__ */ new Date(stripeSubscription.canceled_at * 1e3) : null,
        ...stripeSubscription.trial_start && stripeSubscription.trial_end ? {
          trialStart: /* @__PURE__ */ new Date(stripeSubscription.trial_start * 1e3),
          trialEnd: /* @__PURE__ */ new Date(stripeSubscription.trial_end * 1e3)
        } : {}
      },
      where: [{
        field: "id",
        value: subscription.id
      }]
    });
    throw ctx.redirect(getUrl(ctx, callbackURL));
  });
};
const createBillingPortalBodySchema = object({
  locale: custom((localization) => {
    return typeof localization === "string";
  }).optional(),
  referenceId: string().optional(),
  customerType: _enum(["user", "organization"]).meta({ description: 'Customer type for the subscription. Eg: "user" or "organization"' }).optional(),
  returnUrl: string().default("/"),
  disableRedirect: boolean().meta({ description: "Disable redirect after creating billing portal session. Eg: true" }).default(false)
});
const createBillingPortal = (options) => {
  const client = options.stripeClient;
  const subscriptionOptions = options.subscription;
  return createAuthEndpoint("/subscription/billing-portal", {
    method: "POST",
    body: createBillingPortalBodySchema,
    metadata: { openapi: { operationId: "createBillingPortal" } },
    use: [
      stripeSessionMiddleware,
      referenceMiddleware(subscriptionOptions, "billing-portal"),
      originCheck((ctx) => ctx.body.returnUrl)
    ]
  }, async (ctx) => {
    const { user: user$1 } = ctx.context.session;
    const customerType = ctx.body.customerType || "user";
    const referenceId = ctx.body.referenceId || getReferenceId(ctx.context.session, customerType, options);
    let customerId;
    if (customerType === "organization") {
      customerId = (await ctx.context.adapter.findOne({
        model: "organization",
        where: [{
          field: "id",
          value: referenceId
        }]
      }))?.stripeCustomerId;
      if (!customerId) customerId = (await ctx.context.adapter.findMany({
        model: "subscription",
        where: [{
          field: "referenceId",
          value: referenceId
        }]
      }).then((subs) => subs.find((sub) => isActiveOrTrialing(sub))))?.stripeCustomerId;
    } else {
      customerId = user$1.stripeCustomerId;
      if (!customerId) customerId = (await ctx.context.adapter.findMany({
        model: "subscription",
        where: [{
          field: "referenceId",
          value: referenceId
        }]
      }).then((subs) => subs.find((sub) => isActiveOrTrialing(sub))))?.stripeCustomerId;
    }
    if (!customerId) throw new APIError("NOT_FOUND", { message: STRIPE_ERROR_CODES.CUSTOMER_NOT_FOUND });
    try {
      const { url } = await client.billingPortal.sessions.create({
        locale: ctx.body.locale,
        customer: customerId,
        return_url: getUrl(ctx, ctx.body.returnUrl)
      });
      return ctx.json({
        url,
        redirect: !ctx.body.disableRedirect
      });
    } catch (error) {
      ctx.context.logger.error("Error creating billing portal session", error);
      throw new APIError("INTERNAL_SERVER_ERROR", { message: STRIPE_ERROR_CODES.UNABLE_TO_CREATE_BILLING_PORTAL });
    }
  });
};
const stripeWebhook = (options) => {
  const client = options.stripeClient;
  return createAuthEndpoint("/stripe/webhook", {
    method: "POST",
    metadata: {
      ...HIDE_METADATA,
      openapi: { operationId: "handleStripeWebhook" }
    },
    cloneRequest: true,
    disableBody: true
  }, async (ctx) => {
    if (!ctx.request?.body) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.INVALID_REQUEST_BODY });
    const sig = ctx.request.headers.get("stripe-signature");
    if (!sig) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.STRIPE_SIGNATURE_NOT_FOUND });
    const webhookSecret = options.stripeWebhookSecret;
    if (!webhookSecret) throw new APIError("INTERNAL_SERVER_ERROR", { message: STRIPE_ERROR_CODES.STRIPE_WEBHOOK_SECRET_NOT_FOUND });
    const payload = await ctx.request.text();
    let event;
    try {
      if (typeof client.webhooks.constructEventAsync === "function") event = await client.webhooks.constructEventAsync(payload, sig, webhookSecret);
      else event = client.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
      ctx.context.logger.error(`${err.message}`);
      throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.FAILED_TO_CONSTRUCT_STRIPE_EVENT });
    }
    if (!event) throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.FAILED_TO_CONSTRUCT_STRIPE_EVENT });
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await onCheckoutSessionCompleted(ctx, options, event);
          await options.onEvent?.(event);
          break;
        case "customer.subscription.created":
          await onSubscriptionCreated(ctx, options, event);
          await options.onEvent?.(event);
          break;
        case "customer.subscription.updated":
          await onSubscriptionUpdated(ctx, options, event);
          await options.onEvent?.(event);
          break;
        case "customer.subscription.deleted":
          await onSubscriptionDeleted(ctx, options, event);
          await options.onEvent?.(event);
          break;
        default:
          await options.onEvent?.(event);
          break;
      }
    } catch (e) {
      ctx.context.logger.error(`Stripe webhook failed. Error: ${e.message}`);
      throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.STRIPE_WEBHOOK_ERROR });
    }
    return ctx.json({ success: true });
  });
};
const subscriptions = { subscription: { fields: {
  plan: {
    type: "string",
    required: true
  },
  referenceId: {
    type: "string",
    required: true
  },
  stripeCustomerId: {
    type: "string",
    required: false
  },
  stripeSubscriptionId: {
    type: "string",
    required: false
  },
  status: {
    type: "string",
    defaultValue: "incomplete"
  },
  periodStart: {
    type: "date",
    required: false
  },
  periodEnd: {
    type: "date",
    required: false
  },
  trialStart: {
    type: "date",
    required: false
  },
  trialEnd: {
    type: "date",
    required: false
  },
  cancelAtPeriodEnd: {
    type: "boolean",
    required: false,
    defaultValue: false
  },
  cancelAt: {
    type: "date",
    required: false
  },
  canceledAt: {
    type: "date",
    required: false
  },
  endedAt: {
    type: "date",
    required: false
  },
  seats: {
    type: "number",
    required: false
  }
} } };
const user = { user: { fields: { stripeCustomerId: {
  type: "string",
  required: false
} } } };
const organization = { organization: { fields: { stripeCustomerId: {
  type: "string",
  required: false
} } } };
const getSchema = (options) => {
  let baseSchema = {};
  if (options.subscription?.enabled) baseSchema = {
    ...subscriptions,
    ...user
  };
  else baseSchema = { ...user };
  if (options.organization?.enabled) baseSchema = {
    ...baseSchema,
    ...organization
  };
  if (options.schema && !options.subscription?.enabled && "subscription" in options.schema) {
    const { subscription: _subscription, ...restSchema } = options.schema;
    return mergeSchema(baseSchema, restSchema);
  }
  return mergeSchema(baseSchema, options.schema);
};
const stripe = (options) => {
  const client = options.stripeClient;
  const subscriptionEndpoints = {
    upgradeSubscription: upgradeSubscription(options),
    cancelSubscriptionCallback: cancelSubscriptionCallback(options),
    cancelSubscription: cancelSubscription(options),
    restoreSubscription: restoreSubscription(options),
    listActiveSubscriptions: listActiveSubscriptions(options),
    subscriptionSuccess: subscriptionSuccess(options),
    createBillingPortal: createBillingPortal(options)
  };
  return {
    id: "stripe",
    endpoints: {
      stripeWebhook: stripeWebhook(options),
      ...options.subscription?.enabled ? subscriptionEndpoints : {}
    },
    init(ctx) {
      if (options.organization?.enabled) {
        const orgPlugin = ctx.getPlugin("organization");
        if (!orgPlugin) {
          ctx.logger.error(`Organization plugin not found`);
          return;
        }
        const existingHooks = orgPlugin.options.organizationHooks ?? {};
        const afterUpdateStripeOrg = async (data) => {
          const { organization: organization$1 } = data;
          if (!organization$1?.stripeCustomerId) return;
          try {
            const stripeCustomer = await client.customers.retrieve(organization$1.stripeCustomerId);
            if (stripeCustomer.deleted) {
              ctx.logger.warn(`Stripe customer ${organization$1.stripeCustomerId} was deleted`);
              return;
            }
            if (organization$1.name !== stripeCustomer.name) {
              await client.customers.update(organization$1.stripeCustomerId, { name: organization$1.name });
              ctx.logger.info(`Synced organization name to Stripe: "${stripeCustomer.name}" → "${organization$1.name}"`);
            }
          } catch (e) {
            ctx.logger.error(`Failed to sync organization to Stripe: ${e.message}`);
          }
        };
        const beforeDeleteStripeOrg = async (data) => {
          const { organization: organization$1 } = data;
          if (!organization$1.stripeCustomerId) return;
          try {
            const subscriptions$1 = await client.subscriptions.list({
              customer: organization$1.stripeCustomerId,
              status: "all",
              limit: 100
            });
            for (const sub of subscriptions$1.data) if (sub.status !== "canceled" && sub.status !== "incomplete" && sub.status !== "incomplete_expired") throw new APIError("BAD_REQUEST", { message: STRIPE_ERROR_CODES.ORGANIZATION_HAS_ACTIVE_SUBSCRIPTION });
          } catch (error) {
            if (error instanceof APIError) throw error;
            ctx.logger.error(`Failed to check organization subscriptions: ${error.message}`);
            throw error;
          }
        };
        orgPlugin.options.organizationHooks = {
          ...existingHooks,
          afterUpdateOrganization: existingHooks.afterUpdateOrganization ? async (data) => {
            await existingHooks.afterUpdateOrganization(data);
            await afterUpdateStripeOrg(data);
          } : afterUpdateStripeOrg,
          beforeDeleteOrganization: existingHooks.beforeDeleteOrganization ? async (data) => {
            await existingHooks.beforeDeleteOrganization(data);
            await beforeDeleteStripeOrg(data);
          } : beforeDeleteStripeOrg
        };
      }
      return { options: { databaseHooks: { user: {
        create: { async after(user$1, ctx$1) {
          if (!ctx$1 || !options.createCustomerOnSignUp || user$1.stripeCustomerId) return;
          try {
            let stripeCustomer = (await client.customers.search({
              query: `email:"${escapeStripeSearchValue(user$1.email)}" AND -metadata["customerType"]:"organization"`,
              limit: 1
            })).data[0];
            if (stripeCustomer) {
              await ctx$1.context.internalAdapter.updateUser(user$1.id, { stripeCustomerId: stripeCustomer.id });
              await options.onCustomerCreate?.({
                stripeCustomer,
                user: {
                  ...user$1,
                  stripeCustomerId: stripeCustomer.id
                }
              }, ctx$1);
              ctx$1.context.logger.info(`Linked existing Stripe customer ${stripeCustomer.id} to user ${user$1.id}`);
              return;
            }
            let extraCreateParams = {};
            if (options.getCustomerCreateParams) extraCreateParams = await options.getCustomerCreateParams(user$1, ctx$1);
            const params = defu({
              email: user$1.email,
              name: user$1.name,
              metadata: {
                userId: user$1.id,
                customerType: "user"
              }
            }, extraCreateParams);
            stripeCustomer = await client.customers.create(params);
            await ctx$1.context.internalAdapter.updateUser(user$1.id, { stripeCustomerId: stripeCustomer.id });
            await options.onCustomerCreate?.({
              stripeCustomer,
              user: {
                ...user$1,
                stripeCustomerId: stripeCustomer.id
              }
            }, ctx$1);
            ctx$1.context.logger.info(`Created new Stripe customer ${stripeCustomer.id} for user ${user$1.id}`);
          } catch (e) {
            ctx$1.context.logger.error(`Failed to create or link Stripe customer: ${e.message}`, e);
          }
        } },
        update: { async after(user$1, ctx$1) {
          if (!ctx$1 || !user$1.stripeCustomerId) return;
          try {
            const stripeCustomer = await client.customers.retrieve(user$1.stripeCustomerId);
            if (stripeCustomer.deleted) {
              ctx$1.context.logger.warn(`Stripe customer ${user$1.stripeCustomerId} was deleted, cannot update email`);
              return;
            }
            if (stripeCustomer.email !== user$1.email) {
              await client.customers.update(user$1.stripeCustomerId, { email: user$1.email });
              ctx$1.context.logger.info(`Updated Stripe customer email from ${stripeCustomer.email} to ${user$1.email}`);
            }
          } catch (e) {
            ctx$1.context.logger.error(`Failed to sync email to Stripe customer: ${e.message}`, e);
          }
        } }
      } } } };
    },
    schema: getSchema(options),
    options,
    $ERROR_CODES: STRIPE_ERROR_CODES
  };
};
const stripeClient = (options) => {
  return {
    id: "stripe-client",
    $InferServerPlugin: {},
    pathMethods: {
      "/subscription/billing-portal": "POST",
      "/subscription/restore": "POST"
    }
  };
};
export {
  stripeClient as a,
  stripe as s
};
