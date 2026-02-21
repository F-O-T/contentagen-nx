import { createSdk } from "../index.ts";
import type { ContenttaSdkConfig, TrackedEvent } from "./types.ts";

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL = 30_000;
const DEFAULT_API_URL = "https://api.contentagen.com";

const VISITOR_ID_KEY = "contentta_visitor_id";
const SESSION_ID_KEY = "contentta_session_id";

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

/** C1: Maximum number of events allowed in the queue */
const MAX_QUEUE_SIZE = 1000;
/** C1: Stop re-queuing after this many consecutive flush failures */
const MAX_CONSECUTIVE_FAILURES = 5;

export class ContenttaEventTracker {
	private readonly apiKey: string;
	private readonly apiUrl: string;
	private readonly organizationId: string;
	private readonly batchSize: number;
	private readonly flushInterval: number;
	private readonly debug: boolean;
	private readonly enabled: boolean;

	private queue: TrackedEvent[] = [];
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private destroyed = false;

	/** C1: Track consecutive flush failures to stop re-queuing after too many */
	private consecutiveFailures = 0;
	/** C2: Prevent concurrent flush calls */
	private flushing = false;

	/** I2: Cached fallback visitor ID for non-browser environments */
	private cachedVisitorId: string | null = null;
	/** I2: Cached fallback session ID for non-browser environments */
	private cachedSessionId: string | null = null;

	/** AbortController for all auto-tracked listeners (scroll, time, CTA) */
	private trackingAbortController: AbortController | null = null;
	/** Heartbeat interval from time tracking */
	private timeTrackingHeartbeat: ReturnType<typeof setInterval> | null = null;
	/** Callback for time-spent event on destroy */
	private sendTimeEvent: (() => void) | null = null;

	/** oRPC SDK client for sending events */
	private readonly sdk: any;

	constructor(config: ContenttaSdkConfig) {
		this.apiKey = config.apiKey;
		this.apiUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
		this.organizationId = config.organizationId;
		this.batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;
		this.flushInterval = config.flushInterval ?? DEFAULT_FLUSH_INTERVAL;
		this.debug = config.debug ?? false;

		// M3: Respect Do Not Track and Global Privacy Control
		const dnt =
			typeof navigator !== "undefined" && navigator.doNotTrack === "1";
		const gpc =
			typeof navigator !== "undefined" &&
			(navigator as Navigator & { globalPrivacyControl?: boolean })
				.globalPrivacyControl === true;

		this.enabled = (config.enableAnalytics ?? true) && !dnt && !gpc;

		// Initialize SDK client
		this.sdk = createSdk({
			apiKey: this.apiKey,
			host: this.apiUrl,
		}) as any;

		if (!this.enabled) {
			this.log("Analytics disabled — tracking is a no-op");
			return;
		}

		this.flushTimer = setInterval(() => {
			void this.flush();
		}, this.flushInterval);

		if (typeof window !== "undefined") {
			window.addEventListener("beforeunload", this.handleBeforeUnload);
		}
	}

	// ── Public API ──────────────────────────────────────────────

	track(eventName: string, properties: Record<string, unknown> = {}): void {
		if (this.destroyed || !this.enabled) {
			this.log("Tracker is destroyed or disabled, ignoring track call");
			return;
		}

		const event: TrackedEvent = {
			eventName,
			properties: {
				...properties,
				organizationId: this.organizationId,
				visitorId: this.getVisitorId(),
				sessionId: this.getSessionId(),
			},
			timestamp: Date.now(),
		};

		this.queue.push(event);
		this.log(`Tracked: ${eventName}`, event);

		// C1: Drop oldest events if queue exceeds max size
		while (this.queue.length > MAX_QUEUE_SIZE) {
			this.queue.shift();
			this.log("Queue exceeded max size, dropping oldest event");
		}

		if (this.queue.length >= this.batchSize) {
			void this.flush();
		}
	}

	async flush(): Promise<void> {
		// C2: Prevent concurrent flush calls
		if (this.flushing) {
			return;
		}

		if (this.queue.length === 0) {
			return;
		}

		this.flushing = true;

		const events = this.queue.splice(0, this.queue.length);

		this.log(`Flushing ${events.length} events`);

		try {
			// Use oRPC batch endpoint for efficient event submission
			const result = await this.sdk.events.batch({
				events: events.map((event) => ({
					eventName: event.eventName,
					properties: event.properties,
					timestamp: event.timestamp,
				})),
			});

			this.log(
				`Batch sent: ${result.eventsProcessed} processed, ${result.eventsRejected} rejected`,
			);

			// C1: Reset failure counter on success
			this.consecutiveFailures = 0;
		} catch (error) {
			this.log("Flush error:", error);
			this.consecutiveFailures++;

			// C1: Only re-queue if under the consecutive failure threshold
			if (this.consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
				this.queue.unshift(...events);
			} else {
				this.log(
					`Dropping ${events.length} events after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`,
				);
			}
		} finally {
			this.flushing = false;
		}
	}

	autoTrackPageViews(contentId: string, contentSlug: string): void {
		if (!this.enabled) {
			return;
		}

		// I4: If already tracking, abort previous tracking and clean up heartbeat
		if (this.trackingAbortController !== null) {
			this.trackingAbortController.abort();
			this.trackingAbortController = null;
		}
		if (this.timeTrackingHeartbeat !== null) {
			clearInterval(this.timeTrackingHeartbeat);
			this.timeTrackingHeartbeat = null;
		}
		this.sendTimeEvent = null;

		this.track("content.page.view", {
			contentId,
			contentSlug,
			pageUrl: typeof window !== "undefined" ? window.location.href : "",
			pagePath: typeof window !== "undefined" ? window.location.pathname : "",
			referrer: typeof document !== "undefined" ? document.referrer : "",
		});

		// Create a shared AbortController for all auto-track listeners
		this.trackingAbortController = new AbortController();
		const { signal } = this.trackingAbortController;

		this.setupScrollTracking(contentId, signal);
		this.setupTimeTracking(contentId, signal);
		this.setupCtaTracking(contentId, signal);
	}

	destroy(): void {
		if (this.destroyed) {
			return;
		}

		if (this.flushTimer !== null) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		// Clean up time tracking heartbeat
		if (this.timeTrackingHeartbeat !== null) {
			clearInterval(this.timeTrackingHeartbeat);
			this.timeTrackingHeartbeat = null;
		}

		// Send final time-spent event before marking as destroyed
		if (this.sendTimeEvent !== null) {
			this.sendTimeEvent();
			this.sendTimeEvent = null;
		}

		this.destroyed = true;

		// Abort all auto-tracked listeners (scroll, visibility, CTA, beforeunload from time tracking)
		if (this.trackingAbortController !== null) {
			this.trackingAbortController.abort();
			this.trackingAbortController = null;
		}

		if (typeof window !== "undefined") {
			window.removeEventListener("beforeunload", this.handleBeforeUnload);
		}

		// Final flush using sendBeacon if available
		this.flushSync();
	}

	// ── Visitor & Session IDs ───────────────────────────────────

	getVisitorId(): string {
		if (typeof localStorage === "undefined") {
			// I2: Cache the fallback ID so it stays stable across calls
			if (this.cachedVisitorId === null) {
				this.cachedVisitorId = this.generateId("v");
			}
			return this.cachedVisitorId;
		}

		try {
			let id = localStorage.getItem(VISITOR_ID_KEY);
			if (!id) {
				id = this.generateId("v");
				localStorage.setItem(VISITOR_ID_KEY, id);
			}
			return id;
		} catch {
			// I2: Cache the fallback ID so it stays stable across calls
			if (this.cachedVisitorId === null) {
				this.cachedVisitorId = this.generateId("v");
			}
			return this.cachedVisitorId;
		}
	}

	getSessionId(): string {
		if (typeof sessionStorage === "undefined") {
			// I2: Cache the fallback ID so it stays stable across calls
			if (this.cachedSessionId === null) {
				this.cachedSessionId = this.generateId("s");
			}
			return this.cachedSessionId;
		}

		try {
			let id = sessionStorage.getItem(SESSION_ID_KEY);
			if (!id) {
				id = this.generateId("s");
				sessionStorage.setItem(SESSION_ID_KEY, id);
			}
			return id;
		} catch {
			// I2: Cache the fallback ID so it stays stable across calls
			if (this.cachedSessionId === null) {
				this.cachedSessionId = this.generateId("s");
			}
			return this.cachedSessionId;
		}
	}

	// ── Scroll Tracking ─────────────────────────────────────────

	private setupScrollTracking(contentId: string, signal: AbortSignal): void {
		if (typeof window === "undefined") {
			return;
		}

		const reached = new Set<number>();
		let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

		const handleScroll = (): void => {
			if (scrollTimeout !== null) {
				return;
			}

			scrollTimeout = setTimeout(() => {
				scrollTimeout = null;

				// M1: Use window.scrollY instead of deprecated pageYOffset
				const scrollTop = window.scrollY || document.documentElement.scrollTop;
				const docHeight = Math.max(
					document.body.scrollHeight,
					document.documentElement.scrollHeight,
					document.body.offsetHeight,
					document.documentElement.offsetHeight,
				);
				const viewportHeight = window.innerHeight;
				const maxScroll = docHeight - viewportHeight;

				if (maxScroll <= 0) {
					return;
				}

				const scrollPercent = Math.round((scrollTop / maxScroll) * 100);

				for (const milestone of SCROLL_MILESTONES) {
					if (scrollPercent >= milestone && !reached.has(milestone)) {
						reached.add(milestone);
						this.track("content.scroll.milestone", {
							contentId,
							depth: milestone,
						});
					}
				}
			}, 150);
		};

		window.addEventListener("scroll", handleScroll, { passive: true, signal });
	}

	// ── Time Tracking ───────────────────────────────────────────

	private setupTimeTracking(contentId: string, signal: AbortSignal): void {
		if (typeof window === "undefined" || typeof document === "undefined") {
			return;
		}

		const startTime = Date.now();
		let activeTime = 0;
		let lastActiveTimestamp = startTime;
		let isActive = true;

		const updateActiveTime = (): void => {
			if (isActive) {
				activeTime += Date.now() - lastActiveTimestamp;
				lastActiveTimestamp = Date.now();
			}
		};

		const handleVisibilityChange = (): void => {
			if (document.hidden) {
				if (isActive) {
					activeTime += Date.now() - lastActiveTimestamp;
					isActive = false;
				}
			} else {
				lastActiveTimestamp = Date.now();
				isActive = true;
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange, {
			signal,
		});

		// Heartbeat to keep active time current
		this.timeTrackingHeartbeat = setInterval(updateActiveTime, 30_000);

		// Store the time-event sender so destroy() can fire it
		this.sendTimeEvent = (): void => {
			updateActiveTime();
			const totalMs = Date.now() - startTime;
			this.track("content.time.spent", {
				contentId,
				durationSeconds: Math.round(totalMs / 1000),
				activeTimeSeconds: Math.round(activeTime / 1000),
			});
		};

		const handleUnload = (): void => {
			if (this.timeTrackingHeartbeat !== null) {
				clearInterval(this.timeTrackingHeartbeat);
				this.timeTrackingHeartbeat = null;
			}
			if (this.sendTimeEvent !== null) {
				this.sendTimeEvent();
			}
		};

		window.addEventListener("beforeunload", handleUnload, { signal });
	}

	// ── CTA Tracking ────────────────────────────────────────────

	private setupCtaTracking(contentId: string, signal: AbortSignal): void {
		if (typeof document === "undefined") {
			return;
		}

		const handleClick = (event: Event): void => {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}

			const ctaElement = target.closest("a[data-cta]");
			if (!ctaElement) {
				return;
			}

			const ctaId =
				ctaElement.getAttribute("data-cta-id") ?? ctaElement.id ?? "unknown";
			const ctaLabel =
				ctaElement.getAttribute("data-cta-name") ??
				ctaElement.textContent?.trim().substring(0, 100) ??
				"";
			const ctaUrl = ctaElement.getAttribute("href") ?? "";

			this.track("content.cta.click", {
				contentId,
				ctaId,
				ctaLabel,
				ctaUrl,
			});
		};

		document.addEventListener("click", handleClick, { capture: true, signal });
	}

	// ── Private Helpers ─────────────────────────────────────────

	private readonly handleBeforeUnload = (): void => {
		this.flushSync();
	};

	private flushSync(): void {
		if (this.queue.length === 0) {
			return;
		}

		const events = this.queue.splice(0, this.queue.length);
		const batch = {
			events: events.map((event) => ({
				eventName: event.eventName,
				properties: event.properties,
				timestamp: event.timestamp,
			})),
		};
		const payload = JSON.stringify(batch);

		// For synchronous flush during unload, use direct fetch since oRPC client is async
		// The oRPC endpoint expects the same payload structure
		const url = `${this.apiUrl}/sdk/events.batch`;

		if (
			typeof navigator !== "undefined" &&
			typeof navigator.sendBeacon === "function"
		) {
			const blob = new Blob([payload], { type: "application/json" });
			// Note: sendBeacon doesn't support custom headers well, so we include apiKey in URL
			const beaconUrl = `${url}?apiKey=${encodeURIComponent(this.apiKey)}`;
			navigator.sendBeacon(beaconUrl, blob);
			this.log(`Beacon sent ${events.length} events`);
		} else {
			// Fallback: fire-and-forget fetch with proper headers
			try {
				void fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"sdk-api-key": this.apiKey,
					},
					body: payload,
					keepalive: true,
				});
			} catch {
				// Best-effort — nothing we can do on unload
			}
		}
	}

	private generateId(prefix: string): string {
		return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 11)}`;
	}

	private log(message: string, ...args: unknown[]): void {
		if (this.debug) {
			console.log(`[ContenttaEventTracker] ${message}`, ...args);
		}
	}
}

export function createEventTracker(
	config: ContenttaSdkConfig,
): ContenttaEventTracker {
	return new ContenttaEventTracker(config);
}

export type { ContenttaSdkConfig, EventBatch, TrackedEvent } from "./types.ts";
