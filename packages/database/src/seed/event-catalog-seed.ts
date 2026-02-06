import { EVENTS, EVENT_CATEGORIES } from "@packages/events/catalog";

import type { NewEventCatalogEntry } from "../schemas/event-catalog";

/**
 * Seed data for the event_catalog table.
 *
 * Prices are expressed as decimal strings (up to 6 decimal places).
 * Free-tier limits represent the number of events included at no charge on
 * the FREE plan each billing cycle.
 */
export const eventCatalogSeed: NewEventCatalogEntry[] = [
	// -------------------------------------------------------------------------
	// Content events (9)
	// -------------------------------------------------------------------------
	{
		eventName: EVENTS["content.page.view"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.000020",
		freeTierLimit: 50_000,
		displayName: "Page View",
		description: "Tracks a single page view on published content.",
		isBillable: true,
	},
	{
		eventName: EVENTS["content.page.published"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.001000",
		freeTierLimit: 0,
		displayName: "Content Published",
		description:
			"Fired when a piece of content transitions to published status.",
		isBillable: true,
	},
	{
		eventName: EVENTS["content.page.updated"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.000500",
		freeTierLimit: 0,
		displayName: "Content Updated",
		description: "Fired when published content is updated.",
		isBillable: true,
	},
	{
		eventName: EVENTS["content.created"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.000000",
		freeTierLimit: 0,
		displayName: "Content Created",
		description: "Fired when a new content draft is created.",
		isBillable: false,
	},
	{
		eventName: EVENTS["content.deleted"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.000000",
		freeTierLimit: 0,
		displayName: "Content Deleted",
		description: "Fired when content is permanently deleted.",
		isBillable: false,
	},
	{
		eventName: EVENTS["content.scroll.milestone"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.000000",
		freeTierLimit: 0,
		displayName: "Scroll Milestone",
		description:
			"Tracks when a reader reaches a scroll depth milestone (25%, 50%, 75%, 100%).",
		isBillable: false,
	},
	{
		eventName: EVENTS["content.time.spent"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.000000",
		freeTierLimit: 0,
		displayName: "Time Spent",
		description: "Records cumulative time a reader spends on content.",
		isBillable: false,
	},
	{
		eventName: EVENTS["content.cta.click"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.000000",
		freeTierLimit: 0,
		displayName: "CTA Click",
		description: "Fired when a reader clicks a call-to-action element.",
		isBillable: false,
	},
	{
		eventName: EVENTS["content.exported"],
		category: EVENT_CATEGORIES.content,
		pricePerEvent: "0.001000",
		freeTierLimit: 0,
		displayName: "Content Exported",
		description: "Fired when content is exported to an external format.",
		isBillable: true,
	},

	// -------------------------------------------------------------------------
	// AI events (3)
	// -------------------------------------------------------------------------
	{
		eventName: EVENTS["ai.completion"],
		category: EVENT_CATEGORIES.ai,
		pricePerEvent: "0.001000",
		freeTierLimit: 100,
		displayName: "AI Completion (FIM)",
		description: "Tracks a single AI fill-in-the-middle completion.",
		isBillable: true,
	},
	{
		eventName: EVENTS["ai.chat_message"],
		category: EVENT_CATEGORIES.ai,
		pricePerEvent: "0.002000",
		freeTierLimit: 100,
		displayName: "AI Chat Message",
		description: "Tracks a single AI chat message exchange.",
		isBillable: true,
	},
	{
		eventName: EVENTS["ai.agent_action"],
		category: EVENT_CATEGORIES.ai,
		pricePerEvent: "0.005000",
		freeTierLimit: 100,
		displayName: "AI Agent Action",
		description:
			"Tracks a discrete action performed by an AI agent (planning, research, editing).",
		isBillable: true,
	},

	// -------------------------------------------------------------------------
	// Form events (4)
	// -------------------------------------------------------------------------
	{
		eventName: EVENTS["form.impression"],
		category: EVENT_CATEGORIES.form,
		pricePerEvent: "0.000000",
		freeTierLimit: 0,
		displayName: "Form Impression",
		description: "Fired when a form is rendered and visible to a user.",
		isBillable: false,
	},
	{
		eventName: EVENTS["form.submitted"],
		category: EVENT_CATEGORIES.form,
		pricePerEvent: "0.002000",
		freeTierLimit: 1_000,
		displayName: "Form Submitted",
		description: "Fired when a form is successfully submitted.",
		isBillable: true,
	},
	{
		eventName: EVENTS["form.field_error"],
		category: EVENT_CATEGORIES.form,
		pricePerEvent: "0.000100",
		freeTierLimit: 0,
		displayName: "Form Field Error",
		description: "Tracks a field-level validation error on a form.",
		isBillable: true,
	},
	{
		eventName: EVENTS["form.conversion"],
		category: EVENT_CATEGORIES.form,
		pricePerEvent: "0.000100",
		freeTierLimit: 0,
		displayName: "Form Conversion",
		description:
			"Fired when a form submission is attributed as a conversion.",
		isBillable: true,
	},

	// -------------------------------------------------------------------------
	// SEO events (2)
	// -------------------------------------------------------------------------
	{
		eventName: EVENTS["seo.analyzed"],
		category: EVENT_CATEGORIES.seo,
		pricePerEvent: "0.001000",
		freeTierLimit: 0,
		displayName: "SEO Analysis",
		description:
			"Fired when an SEO analysis pass is run against content.",
		isBillable: true,
	},
	{
		eventName: EVENTS["seo.indexed"],
		category: EVENT_CATEGORIES.seo,
		pricePerEvent: "0.000100",
		freeTierLimit: 0,
		displayName: "SEO Indexed",
		description: "Fired when content is confirmed indexed by a search engine.",
		isBillable: true,
	},

	// -------------------------------------------------------------------------
	// Experiment events (2)
	// -------------------------------------------------------------------------
	{
		eventName: EVENTS["experiment.started"],
		category: EVENT_CATEGORIES.experiment,
		pricePerEvent: "0.001000",
		freeTierLimit: 0,
		displayName: "Experiment Started",
		description: "Fired when an A/B experiment is activated.",
		isBillable: true,
	},
	{
		eventName: EVENTS["experiment.conversion"],
		category: EVENT_CATEGORIES.experiment,
		pricePerEvent: "0.000100",
		freeTierLimit: 0,
		displayName: "Experiment Conversion",
		description:
			"Fired when a conversion is recorded for an active experiment.",
		isBillable: true,
	},
];
