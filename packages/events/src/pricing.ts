import {
   createMoney,
   type Money,
   parseDecimalToMinorUnits,
   toMajorUnitsString,
} from "@f-o-t/money";
import { PlanName } from "@packages/stripe/constants";
import { AI_EVENTS } from "./ai";
import { EVENT_CATEGORIES, type EventCategory } from "./catalog";
import { CONTENT_EVENTS } from "./content";
import { DASHBOARD_EVENTS } from "./dashboard";
import { EXPERIMENT_EVENTS } from "./experiments";
import { FORM_EVENTS } from "./forms";
import { INSIGHT_EVENTS } from "./insight";
import { SEO_EVENTS } from "./seo";
import { WEBHOOK_EVENTS } from "./webhook";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRICE_SCALE = 6;
const CURRENCY = "BRL";

/**
 * Create a Money value with micro-precision (6 decimal places).
 * Matches the database `decimal(10, 6)` column.
 */
function brl(amount: string): Money {
   return createMoney(
      parseDecimalToMinorUnits(amount, PRICE_SCALE),
      CURRENCY,
      PRICE_SCALE,
   );
}

// ---------------------------------------------------------------------------
// Event Pricing Catalog
// ---------------------------------------------------------------------------

export interface EventPricing {
   eventName: string;
   category: string;
   pricePerEvent: Money;
   freeTierLimit: number;
   displayName: string;
   description: string;
   isBillable: boolean;
}

export const EVENT_PRICING: EventPricing[] = [
   // -------------------------------------------------------------------------
   // Content events (9)
   // -------------------------------------------------------------------------
   {
      eventName: CONTENT_EVENTS["content.page.view"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000020"),
      freeTierLimit: 10_000,
      displayName: "Page View",
      description: "Tracks a single page view on published content.",
      isBillable: true,
   },
   {
      eventName: CONTENT_EVENTS["content.page.published"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.001000"),
      freeTierLimit: 100,
      displayName: "Content Published",
      description:
         "Fired when a piece of content transitions to published status.",
      isBillable: true,
   },
   {
      eventName: CONTENT_EVENTS["content.page.updated"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000500"),
      freeTierLimit: 500,
      displayName: "Content Updated",
      description: "Fired when published content is updated.",
      isBillable: true,
   },
   {
      eventName: CONTENT_EVENTS["content.created"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Content Created",
      description: "Fired when a new content draft is created.",
      isBillable: false,
   },
   {
      eventName: CONTENT_EVENTS["content.deleted"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Content Deleted",
      description: "Fired when content is permanently deleted.",
      isBillable: false,
   },
   {
      eventName: CONTENT_EVENTS["content.scroll.milestone"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Scroll Milestone",
      description:
         "Tracks when a reader reaches a scroll depth milestone (25%, 50%, 75%, 100%).",
      isBillable: false,
   },
   {
      eventName: CONTENT_EVENTS["content.time.spent"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Time Spent",
      description: "Records cumulative time a reader spends on content.",
      isBillable: false,
   },
   {
      eventName: CONTENT_EVENTS["content.cta.click"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "CTA Click",
      description: "Fired when a reader clicks a call-to-action element.",
      isBillable: false,
   },
   {
      eventName: CONTENT_EVENTS["content.exported"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.001000"),
      freeTierLimit: 100,
      displayName: "Content Exported",
      description: "Fired when content is exported to an external format.",
      isBillable: true,
   },

   // -------------------------------------------------------------------------
   // AI events (3)
   // -------------------------------------------------------------------------
   {
      eventName: AI_EVENTS["ai.completion"],
      category: EVENT_CATEGORIES.ai,
      pricePerEvent: brl("0.003000"),
      freeTierLimit: 100,
      displayName: "AI Completion (FIM)",
      description: "Tracks a single AI fill-in-the-middle completion.",
      isBillable: true,
   },
   {
      eventName: AI_EVENTS["ai.chat_message"],
      category: EVENT_CATEGORIES.ai,
      pricePerEvent: brl("0.020000"),
      freeTierLimit: 50,
      displayName: "AI Chat Message",
      description: "Tracks a single AI chat message exchange.",
      isBillable: true,
   },
   {
      eventName: AI_EVENTS["ai.agent_action"],
      category: EVENT_CATEGORIES.ai,
      pricePerEvent: brl("0.040000"),
      freeTierLimit: 20,
      displayName: "AI Agent Action",
      description:
         "Tracks a discrete action performed by an AI agent (planning, research, editing).",
      isBillable: true,
   },
   {
      eventName: AI_EVENTS["ai.image_generation"],
      category: EVENT_CATEGORIES.ai,
      pricePerEvent: brl("0.500000"),
      freeTierLimit: 5,
      displayName: "AI Image Generation",
      description:
         "Tracks a single AI image generation request via OpenRouter.",
      isBillable: true,
   },

   // -------------------------------------------------------------------------
   // Form events (4)
   // -------------------------------------------------------------------------
   {
      eventName: FORM_EVENTS["form.impression"],
      category: EVENT_CATEGORIES.form,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Form Impression",
      description: "Fired when a form is rendered and visible to a user.",
      isBillable: false,
   },
   {
      eventName: FORM_EVENTS["form.submitted"],
      category: EVENT_CATEGORIES.form,
      pricePerEvent: brl("0.002000"),
      freeTierLimit: 500,
      displayName: "Form Submitted",
      description: "Fired when a form is successfully submitted.",
      isBillable: true,
   },
   {
      eventName: FORM_EVENTS["form.field_error"],
      category: EVENT_CATEGORIES.form,
      pricePerEvent: brl("0.000100"),
      freeTierLimit: 1_000,
      displayName: "Form Field Error",
      description: "Tracks a field-level validation error on a form.",
      isBillable: true,
   },
   {
      eventName: FORM_EVENTS["form.conversion"],
      category: EVENT_CATEGORIES.form,
      pricePerEvent: brl("0.000100"),
      freeTierLimit: 500,
      displayName: "Form Conversion",
      description:
         "Fired when a form submission is attributed as a conversion.",
      isBillable: true,
   },

   // -------------------------------------------------------------------------
   // SEO events (2)
   // -------------------------------------------------------------------------
   {
      eventName: SEO_EVENTS["seo.analyzed"],
      category: EVENT_CATEGORIES.seo,
      pricePerEvent: brl("0.001000"),
      freeTierLimit: 500,
      displayName: "SEO Analysis",
      description: "Fired when an SEO analysis pass is run against content.",
      isBillable: true,
   },
   {
      eventName: SEO_EVENTS["seo.indexed"],
      category: EVENT_CATEGORIES.seo,
      pricePerEvent: brl("0.000100"),
      freeTierLimit: 1_000,
      displayName: "SEO Indexed",
      description:
         "Fired when content is confirmed indexed by a search engine.",
      isBillable: true,
   },

   // -------------------------------------------------------------------------
   // Experiment events (2)
   // -------------------------------------------------------------------------
   {
      eventName: EXPERIMENT_EVENTS["experiment.started"],
      category: EVENT_CATEGORIES.experiment,
      pricePerEvent: brl("0.001000"),
      freeTierLimit: 1_000,
      displayName: "Experiment Started",
      description: "Fired when an A/B experiment is activated.",
      isBillable: true,
   },
   {
      eventName: EXPERIMENT_EVENTS["experiment.conversion"],
      category: EVENT_CATEGORIES.experiment,
      pricePerEvent: brl("0.000100"),
      freeTierLimit: 1_000,
      displayName: "Experiment Conversion",
      description:
         "Fired when a conversion is recorded for an active experiment.",
      isBillable: true,
   },

   // -------------------------------------------------------------------------
   // Webhook events (4)
   // -------------------------------------------------------------------------
   {
      eventName: WEBHOOK_EVENTS["webhook.endpoint.created"],
      category: EVENT_CATEGORIES.webhook,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Webhook Endpoint Created",
      description: "Fired when a webhook endpoint is created.",
      isBillable: false,
   },
   {
      eventName: WEBHOOK_EVENTS["webhook.endpoint.updated"],
      category: EVENT_CATEGORIES.webhook,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Webhook Endpoint Updated",
      description: "Fired when a webhook endpoint configuration is updated.",
      isBillable: false,
   },
   {
      eventName: WEBHOOK_EVENTS["webhook.endpoint.deleted"],
      category: EVENT_CATEGORIES.webhook,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Webhook Endpoint Deleted",
      description: "Fired when a webhook endpoint is deleted.",
      isBillable: false,
   },
   {
      eventName: WEBHOOK_EVENTS["webhook.delivered"],
      category: EVENT_CATEGORIES.webhook,
      pricePerEvent: brl("0.000500"),
      freeTierLimit: 500,
      displayName: "Webhook Delivered",
      description: "Fired when a webhook payload is delivered to an endpoint.",
      isBillable: true,
   },

   // -------------------------------------------------------------------------
   // Dashboard events (3)
   // -------------------------------------------------------------------------
   {
      eventName: DASHBOARD_EVENTS["dashboard.created"],
      category: EVENT_CATEGORIES.dashboard,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Dashboard Created",
      description: "Fired when a new dashboard is created.",
      isBillable: false,
   },
   {
      eventName: DASHBOARD_EVENTS["dashboard.updated"],
      category: EVENT_CATEGORIES.dashboard,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Dashboard Updated",
      description: "Fired when a dashboard configuration is updated.",
      isBillable: false,
   },
   {
      eventName: DASHBOARD_EVENTS["dashboard.deleted"],
      category: EVENT_CATEGORIES.dashboard,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Dashboard Deleted",
      description: "Fired when a dashboard is deleted.",
      isBillable: false,
   },

   // -------------------------------------------------------------------------
   // Insight events (3)
   // -------------------------------------------------------------------------
   {
      eventName: INSIGHT_EVENTS["insight.created"],
      category: EVENT_CATEGORIES.insight,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Insight Created",
      description: "Fired when a new insight is created.",
      isBillable: false,
   },
   {
      eventName: INSIGHT_EVENTS["insight.updated"],
      category: EVENT_CATEGORIES.insight,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Insight Updated",
      description: "Fired when an insight is updated.",
      isBillable: false,
   },
   {
      eventName: INSIGHT_EVENTS["insight.deleted"],
      category: EVENT_CATEGORIES.insight,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Insight Deleted",
      description: "Fired when an insight is deleted.",
      isBillable: false,
   },

   // -------------------------------------------------------------------------
   // Content archived (1)
   // -------------------------------------------------------------------------
   {
      eventName: CONTENT_EVENTS["content.archived"],
      category: EVENT_CATEGORIES.content,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Content Archived",
      description: "Fired when content is archived.",
      isBillable: false,
   },

   // -------------------------------------------------------------------------
   // Form CRUD events (3)
   // -------------------------------------------------------------------------
   {
      eventName: FORM_EVENTS["form.created"],
      category: EVENT_CATEGORIES.form,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Form Created",
      description: "Fired when a new form is created.",
      isBillable: false,
   },
   {
      eventName: FORM_EVENTS["form.updated"],
      category: EVENT_CATEGORIES.form,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Form Updated",
      description: "Fired when a form is updated.",
      isBillable: false,
   },
   {
      eventName: FORM_EVENTS["form.deleted"],
      category: EVENT_CATEGORIES.form,
      pricePerEvent: brl("0.000000"),
      freeTierLimit: 0,
      displayName: "Form Deleted",
      description: "Fired when a form is deleted.",
      isBillable: false,
   },
];

// ---------------------------------------------------------------------------
// Credit Pools & Budgets
// ---------------------------------------------------------------------------

export type CreditPool = "ai" | "platform";

/**
 * Maps each credit pool to the event categories it covers.
 */
export const POOL_CATEGORIES: Record<CreditPool, EventCategory[]> = {
   ai: [EVENT_CATEGORIES.ai],
   platform: [
      EVENT_CATEGORIES.content,
      EVENT_CATEGORIES.form,
      EVENT_CATEGORIES.seo,
      EVENT_CATEGORIES.experiment,
      EVENT_CATEGORIES.dashboard,
      EVENT_CATEGORIES.insight,
      EVENT_CATEGORIES.webhook,
   ],
};

/**
 * Monthly credit budget per plan per pool.
 * Values are in BRL with micro-precision (6 decimal places).
 */
export const PLAN_CREDIT_BUDGETS: Record<
   PlanName,
   Record<CreditPool, Money>
> = {
   [PlanName.FREE]: {
      ai: brl("2.500000"),
      platform: brl("2.500000"),
   },
   [PlanName.LITE]: {
      ai: brl("25.000000"),
      platform: brl("25.000000"),
   },
   [PlanName.PRO]: {
      ai: brl("50.000000"),
      platform: brl("50.000000"),
   },
};

/**
 * Resolve which credit pool an event category belongs to.
 *
 * @returns The pool name, or `undefined` for non-billable categories
 *          (e.g. "webhook", "system").
 */
export function getCreditPool(category: EventCategory): CreditPool | undefined {
   for (const [pool, categories] of Object.entries(POOL_CATEGORIES)) {
      if (categories.includes(category)) {
         return pool as CreditPool;
      }
   }
   return undefined;
}

/**
 * Convert an EventPricing entry to database-ready format.
 * Converts the Money object to a decimal string for the `price_per_event` column.
 */
export function toSeedEntry(pricing: EventPricing) {
   return {
      eventName: pricing.eventName,
      category: pricing.category,
      pricePerEvent: toMajorUnitsString(pricing.pricePerEvent),
      freeTierLimit: pricing.freeTierLimit,
      displayName: pricing.displayName,
      description: pricing.description,
      isBillable: pricing.isBillable,
   };
}
