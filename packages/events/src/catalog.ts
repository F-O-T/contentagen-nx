/**
 * Event Catalog - Central registry of all event names and categories.
 *
 * Event names follow a dotted notation: `<category>.<entity>.<action>`
 */

// ---------------------------------------------------------------------------
// Event Categories
// ---------------------------------------------------------------------------

export const EVENT_CATEGORIES = {
   content: "content",
   ai: "ai",
   form: "form",
   seo: "seo",
   experiment: "experiment",
   webhook: "webhook",
   system: "system",
} as const;

export type EventCategory =
   (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];

// ---------------------------------------------------------------------------
// Event Names
// ---------------------------------------------------------------------------

export const EVENTS = {
   // Content events
   "content.page.view": "content.page.view",
   "content.page.published": "content.page.published",
   "content.page.updated": "content.page.updated",
   "content.created": "content.created",
   "content.deleted": "content.deleted",
   "content.scroll.milestone": "content.scroll.milestone",
   "content.time.spent": "content.time.spent",
   "content.cta.click": "content.cta.click",
   "content.exported": "content.exported",

   // AI events
   "ai.completion": "ai.completion",
   "ai.chat_message": "ai.chat_message",
   "ai.agent_action": "ai.agent_action",

   // Form events
   "form.impression": "form.impression",
   "form.submitted": "form.submitted",
   "form.field_error": "form.field_error",
   "form.conversion": "form.conversion",

   // SEO events
   "seo.analyzed": "seo.analyzed",
   "seo.indexed": "seo.indexed",

   // Experiment events
   "experiment.started": "experiment.started",
   "experiment.conversion": "experiment.conversion",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const categorySet = new Set<string>(Object.values(EVENT_CATEGORIES));
const eventNameSet = new Set<string>(Object.values(EVENTS));

/**
 * Extracts the category prefix from a dotted event name.
 *
 * @example
 * ```ts
 * getEventCategory("content.page.view"); // "content"
 * getEventCategory("ai.completion");     // "ai"
 * ```
 */
export function getEventCategory(eventName: string): EventCategory | undefined {
   const prefix = eventName.split(".")[0];
   if (prefix && categorySet.has(prefix)) {
      return prefix as EventCategory;
   }
   return undefined;
}

/**
 * Type-guard that checks whether a string is a known event name.
 */
export function isValidEventName(value: string): value is EventName {
   return eventNameSet.has(value);
}
