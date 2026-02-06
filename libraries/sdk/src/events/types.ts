export interface ContenttaSdkConfig {
	apiKey: string;
	apiUrl?: string;
	organizationId: string;
	enableAnalytics?: boolean;
	batchSize?: number;
	flushInterval?: number;
	timeout?: number;
	debug?: boolean;
}

export interface TrackedEvent {
	eventName: string;
	properties: Record<string, unknown>;
	timestamp: number;
}

export interface EventBatch {
	events: TrackedEvent[];
}
