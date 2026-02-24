/**
 * Shared event categories and helpers.
 *
 * Event names and schemas live in their own category files
 * (content.ts, ai.ts, forms.ts, seo.ts, experiments.ts).
 */

import type { Money } from "@f-o-t/money";

export const EVENT_CATEGORIES = {
   content: "content",
   ai: "ai",
   form: "form",
   seo: "seo",
   experiment: "experiment",
   webhook: "webhook",
   dashboard: "dashboard",
   insight: "insight",
   system: "system",
   writer: "writer",
} as const;

export type EventCategory =
   (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];

export type EmitFn = (params: {
   organizationId: string;
   eventName: string;
   eventCategory: EventCategory;
   properties: Record<string, unknown>;
   userId?: string;
   teamId?: string;
   priceOverride?: Money;
}) => Promise<void>;

const categorySet = new Set<string>(Object.values(EVENT_CATEGORIES));

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
