import type { PostHog } from "posthog-node";
import type {
	ObservabilityExporter,
	TracingEvent,
} from "@mastra/core/observability";
import { captureAIGeneration } from "./ai-generation";
import { captureAISpan } from "./ai-span";

export class PosthogExporter implements ObservabilityExporter {
	readonly name = "posthog";

	constructor(
		private readonly posthog: PostHog,
		private readonly fallbackDistinctId: string,
	) {}

	async exportTracingEvent(event: TracingEvent): Promise<void> {
		if (event.type !== "span_ended") return;

		const span = event.exportedSpan;
		const distinctId =
			(span.metadata?.userId as string | undefined) ??
			span.entityId ??
			this.fallbackDistinctId;

		const durationSeconds =
			span.endTime && span.startTime
				? (span.endTime.getTime() - span.startTime.getTime()) / 1000
				: 0;

		if (span.type === "model_generation") {
			const attrs = span.attributes as
				| {
						model?: string;
						provider?: string;
						usage?: { inputTokens?: number; outputTokens?: number };
						streaming?: boolean;
				  }
				| undefined;

			const inputMessages = Array.isArray(span.input)
				? (span.input as Array<{ role: string; content: string }>)
				: [];

			const outputContent =
				typeof span.output === "string"
					? span.output
					: (span.output as { text?: string })?.text ?? "";

			captureAIGeneration({
				posthog: this.posthog,
				distinctId,
				traceId: span.traceId,
				model: attrs?.model ?? "unknown",
				provider: attrs?.provider ?? "openrouter",
				input: inputMessages,
				outputChoices: [{ role: "assistant", content: outputContent }],
				inputTokens: attrs?.usage?.inputTokens ?? 0,
				outputTokens: attrs?.usage?.outputTokens ?? 0,
				latencySeconds: durationSeconds,
				isError: !!span.errorInfo,
				agentId: span.entityId,
			});
			return;
		}

		if (span.type === "tool_call") {
			captureAISpan({
				posthog: this.posthog,
				distinctId,
				traceId: span.traceId,
				spanName: span.name,
				spanKind: "tool_execution",
				input: span.input as Record<string, unknown> | undefined,
				output: span.output,
				durationSeconds,
				isError: !!span.errorInfo,
				errorMessage: (span.errorInfo as { message?: string } | undefined)
					?.message,
			});
		}
	}

	async flush(): Promise<void> {}

	async shutdown(): Promise<void> {}
}
