import type { ContenttaSdkConfig, EventBatch } from "./types.ts";

const DEFAULT_API_URL = "https://sdk.contentta.com";
const DEFAULT_TIMEOUT_MS = 30_000;

export class ContenttaServerClient {
	private readonly apiKey: string;
	private readonly apiUrl: string;
	private readonly timeout: number;

	constructor(
		config: Pick<ContenttaSdkConfig, "apiKey" | "apiUrl" | "timeout">,
	) {
		if (!config.apiKey) {
			throw new Error("apiKey is required to initialize ContenttaServerClient");
		}

		this.apiKey = config.apiKey;
		this.apiUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
		this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
	}

	async emitEvent(
		eventName: string,
		properties: Record<string, unknown> = {},
	): Promise<void> {
		const batch: EventBatch = {
			events: [
				{
					eventName,
					properties,
					timestamp: Date.now(),
				},
			],
		};

		let response: Response;

		try {
			response = await fetch(`${this.apiUrl}/sdk/events`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-API-Key": this.apiKey,
				},
				body: JSON.stringify(batch),
				signal: AbortSignal.timeout(this.timeout),
			});
		} catch (error) {
			if (error instanceof TypeError) {
				throw new Error(`Contentta SDK: network error — ${error.message}`);
			}
			throw error;
		}

		if (!response.ok) {
			const body = await response.text().catch(() => "");
			throw new Error(
				`Contentta SDK: event emission failed — ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`,
			);
		}
	}

	async trackFormSubmission(params: {
		formId: string;
		formName?: string;
		fieldCount?: number;
		completionTimeSeconds?: number;
	}): Promise<void> {
		return this.emitEvent("form.submitted", params);
	}

	async trackConversion(params: {
		contentId?: string;
		// Keep in sync with ExperimentTargetType in packages/events/src/experiments.ts
		targetType?: "content" | "form" | "cluster";
		targetId?: string;
		experimentId: string;
		variantId: string;
		goalName: string;
		goalValue?: number;
	}): Promise<void> {
		if (!params.contentId && !(params.targetType && params.targetId)) {
			throw new Error(
				"Contentta SDK: trackConversion requires either contentId or both targetType and targetId",
			);
		}
		return this.emitEvent("experiment.conversion", params);
	}

	async trackSeoAnalysis(params: {
		contentId: string;
		score: number;
		keyword?: string;
		keywordDensity?: number;
		readabilityScore?: number;
	}): Promise<void> {
		return this.emitEvent("seo.analyzed", params);
	}
}

export function createServerClient(
	config: Pick<ContenttaSdkConfig, "apiKey" | "apiUrl" | "timeout">,
): ContenttaServerClient {
	return new ContenttaServerClient(config);
}

export type { ContenttaSdkConfig, EventBatch } from "./types.ts";
