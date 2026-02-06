// Catalog - event names, categories, and helpers

export type { EventCategory, EventName } from "./catalog";
export {
   EVENT_CATEGORIES,
   EVENTS,
   getEventCategory,
   isValidEventName,
} from "./catalog";
// Event emission infrastructure
export type { EmitEventBatchParams, EmitEventParams } from "./emit";
export { emitEvent, emitEventBatch } from "./emit";
export type {
   AiAgentActionEvent,
   AiChatMessageEvent,
   AiCompletionEvent,
} from "./types/ai-usage";
// AI usage event schemas and types
export {
   aiAgentActionEventSchema,
   aiChatMessageEventSchema,
   aiCompletionEventSchema,
} from "./types/ai-usage";
export type {
   ContentPublishedEvent,
   ContentUpdatedEvent,
   CtaClickEvent,
   DeviceType,
   PageViewEvent,
   ScrollDepth,
   ScrollMilestoneEvent,
   TimeSpentEvent,
   TrafficSource,
} from "./types/content-analytics";
// Content analytics event schemas and types
export {
   contentPublishedEventSchema,
   contentUpdatedEventSchema,
   ctaClickEventSchema,
   deviceTypeSchema,
   pageViewEventSchema,
   scrollDepthSchema,
   scrollMilestoneEventSchema,
   timeSpentEventSchema,
   trafficSourceSchema,
} from "./types/content-analytics";
export type {
   FormFieldErrorEvent,
   FormImpressionEvent,
   FormSubmittedEvent,
} from "./types/forms";
// Form event schemas and types
export {
   formFieldErrorEventSchema,
   formImpressionEventSchema,
   formSubmittedEventSchema,
} from "./types/forms";
export type { SeoAnalyzedEvent, SeoIndexedEvent } from "./types/seo";
// SEO event schemas and types
export { seoAnalyzedEventSchema, seoIndexedEventSchema } from "./types/seo";

// Utilities
export { getEventMetadata, getEventPrice } from "./utils";
