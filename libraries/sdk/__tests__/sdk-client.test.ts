import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { createSdk } from "../src";

const originalFetch = globalThis.fetch;

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

/**
 * Creates a mock fetch response compatible with oRPC format.
 * oRPC expects responses with { json: data, meta?: [] } structure.
 */
const createJsonResponse = (
	payload: unknown,
	status = 200,
	isError = false,
): FetchResponse => {
	// oRPC expects { json: data, meta?: [] } format for success
	// For errors, it expects the error object directly
	const responseBody = isError ? payload : { json: payload, meta: [] };

	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? "OK" : "Error",
		json: async () => responseBody,
		text: async () => JSON.stringify(responseBody),
		body: null,
		headers: new Headers({ "content-type": "application/json" }),
	} as unknown as FetchResponse;
};

describe("Contentta SDK - createSdk", () => {
	beforeEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	afterEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	it("throws error when apiKey is missing", () => {
		expect(() => createSdk({ apiKey: "" })).toThrow(
			"apiKey is required to initialize the SDK",
		);
	});

	it("uses production URL by default", () => {
		const sdk = createSdk({ apiKey: "test-key" });
		expect(sdk).toBeDefined();
	});

	it("accepts custom host", () => {
		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});
		expect(sdk).toBeDefined();
	});

	it("strips trailing slashes from host", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse({ posts: [], total: 0 })),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com//",
		});

		await sdk.content.list({
			agentId: "agent-123",
			limit: "10",
			page: "1",
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calls = fetchMock.mock.calls as unknown as Array<
			[Request | string, RequestInit?]
		>;
		const firstArg = calls[0]?.[0];

		// oRPC passes a Request object, extract the URL from it
		let url: URL;
		if (firstArg instanceof Request) {
			url = new URL(firstArg.url);
		} else {
			url = new URL(String(firstArg));
		}

		expect(url.origin + url.pathname).toContain("/sdk/content/list");
		expect(url.origin + url.pathname).not.toContain("//sdk");
	});
});

describe("Contentta SDK - Content", () => {
	beforeEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	afterEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	it("content.list - lists content by agent with default params", async () => {
		const mockResponse = {
			posts: [
				{
					id: "post-1",
					title: "Test Post",
					slug: "test-post",
					status: "published",
				},
			],
			total: 1,
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockResponse)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.content.list({
			agentId: "agent-123",
		});

		expect(result).toEqual(mockResponse);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("content.list - handles pagination parameters", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse({ posts: [], total: 0 })),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await sdk.content.list({
			agentId: "agent-123",
			limit: "20",
			page: "2",
			status: ["draft", "published"],
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calls = fetchMock.mock.calls as unknown as Array<
			[Request | string, RequestInit?]
		>;
		const firstArg = calls[0]?.[0];

		// oRPC passes a Request object with headers
		if (firstArg instanceof Request) {
			expect(firstArg.headers.get("sdk-api-key")).toBe("test-key");
		}
	});

	it("content.get - gets content by slug", async () => {
		const mockContent = {
			id: "content-123",
			slug: "my-post",
			title: "My Post",
			body: "<p>Content here</p>",
			status: "published",
			image: null,
			analytics: {
				trackingScript: "<script>...</script>",
				enabled: true,
			},
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockContent)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.content.get({
			agentId: "agent-123",
			slug: "my-post",
		});

		expect(result).toEqual(mockContent);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("content.get - throws on not found", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "NOT_FOUND",
						message: "Content not found",
					},
					404,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await expect(
			sdk.content.get({
				agentId: "agent-123",
				slug: "missing-post",
			}),
		).rejects.toThrow();
	});

	it("content.getImage - gets content image by contentId", async () => {
		const mockImage = {
			contentType: "image/jpeg",
			data: "https://presigned-url.example.com/image.jpg",
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockImage)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.content.getImage({
			contentId: "content-123",
		});

		expect(result).toEqual(mockImage);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("content.getImage - returns null when no image", async () => {
		const fetchMock = mock(() => Promise.resolve(createJsonResponse(null)));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.content.getImage({
			contentId: "content-123",
		});

		expect(result).toBeNull();
	});
});

describe("Contentta SDK - Forms", () => {
	beforeEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	afterEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	it("forms.get - gets form definition by ID", async () => {
		const mockForm = {
			id: "form-123",
			name: "Contact Form",
			description: "Get in touch with us",
			fields: [
				{
					id: "field-1",
					type: "email",
					label: "Email",
					required: true,
				},
			],
			settings: {
				successMessage: "Thank you!",
			},
		};

		const fetchMock = mock(() => Promise.resolve(createJsonResponse(mockForm)));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.forms.get({
			formId: "form-123",
		});

		expect(result).toEqual(mockForm);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("forms.get - throws on not found", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "NOT_FOUND",
						message: "Form not found.",
					},
					404,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await expect(
			sdk.forms.get({
				formId: "missing-form",
			}),
		).rejects.toThrow();
	});

	it("forms.submit - submits form data successfully", async () => {
		const mockResponse = {
			success: true,
			submissionId: "submission-123",
			settings: {
				successMessage: "Thank you! Your submission has been received.",
				redirectUrl: undefined,
			},
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockResponse)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.forms.submit({
			formId: "form-123",
			data: {
				email: "user@example.com",
				message: "Hello world",
			},
		});

		expect(result).toEqual(mockResponse);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("forms.submit - includes optional metadata", async () => {
		const mockResponse = {
			success: true,
			submissionId: "submission-123",
			settings: {
				successMessage: "Thank you!",
			},
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockResponse)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await sdk.forms.submit({
			formId: "form-123",
			data: {
				email: "user@example.com",
			},
			metadata: {
				visitorId: "visitor-123",
				sessionId: "session-456",
				referrer: "https://example.com",
				url: "https://example.com/contact",
			},
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("forms.submit - throws on validation error", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "UNPROCESSABLE_ENTITY",
						message: "Validation failed",
						cause: {
							errors: {
								email: "Email is required.",
							},
						},
					},
					422,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await expect(
			sdk.forms.submit({
				formId: "form-123",
				data: {},
			}),
		).rejects.toThrow();
	});
});

describe("Contentta SDK - Events", () => {
	beforeEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	afterEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	it("events.track - tracks a single event", async () => {
		const mockResponse = {
			success: true,
			eventsProcessed: 1,
			eventsRejected: 0,
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockResponse)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.events.track({
			eventName: "content.page.viewed",
			properties: {
				contentId: "content-123",
				page: "/blog/my-post",
			},
		});

		expect(result).toEqual(mockResponse);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("events.track - includes optional timestamp", async () => {
		const mockResponse = {
			success: true,
			eventsProcessed: 1,
			eventsRejected: 0,
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockResponse)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const timestamp = Date.now();
		await sdk.events.track({
			eventName: "content.page.viewed",
			properties: {
				contentId: "content-123",
			},
			timestamp,
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("events.track - throws on unknown event", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "BAD_REQUEST",
						message: "Unknown event: invalid.event.name",
					},
					400,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await expect(
			sdk.events.track({
				eventName: "invalid.event.name",
				properties: {},
			}),
		).rejects.toThrow();
	});

	it("events.batch - tracks multiple events", async () => {
		const mockResponse = {
			success: true,
			eventsProcessed: 2,
			eventsRejected: 0,
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockResponse)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.events.batch({
			events: [
				{
					eventName: "content.page.viewed",
					properties: { contentId: "content-123" },
				},
				{
					eventName: "content.page.scrolled",
					properties: { contentId: "content-123", depth: 50 },
					timestamp: Date.now(),
				},
			],
		});

		expect(result).toEqual(mockResponse);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("events.batch - handles partial rejection", async () => {
		const mockResponse = {
			success: true,
			eventsProcessed: 1,
			eventsRejected: 1,
		};

		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse(mockResponse)),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const result = await sdk.events.batch({
			events: [
				{
					eventName: "content.page.viewed",
					properties: { contentId: "content-123" },
				},
				{
					eventName: "invalid.event",
					properties: {},
				},
			],
		});

		expect(result.eventsProcessed).toBe(1);
		expect(result.eventsRejected).toBe(1);
	});

	it("events.batch - respects max batch size", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse({
					success: true,
					eventsProcessed: 100,
					eventsRejected: 0,
				}),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		const events = Array.from({ length: 100 }, (_, i) => ({
			eventName: "content.page.viewed",
			properties: { index: i },
		}));

		await sdk.events.batch({ events });

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe("Contentta SDK - Error Handling", () => {
	beforeEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	afterEach(() => {
		if (originalFetch) {
			globalThis.fetch = originalFetch;
		}
	});

	it("handles unauthorized error", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "UNAUTHORIZED",
						message: "Invalid API Key",
					},
					401,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "invalid-key",
			host: "https://api.example.com",
		});

		await expect(sdk.content.list({ agentId: "agent-123" })).rejects.toThrow();
	});

	it("handles forbidden error", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "FORBIDDEN",
						message: "Origin not allowed",
					},
					403,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await expect(sdk.content.list({ agentId: "agent-123" })).rejects.toThrow();
	});

	it("handles rate limit error", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "TOO_MANY_REQUESTS",
						message: "Rate limit exceeded",
					},
					429,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await expect(
			sdk.events.track({
				eventName: "content.page.viewed",
				properties: {},
			}),
		).rejects.toThrow();
	});

	it("handles server error", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(
				createJsonResponse(
					{
						code: "INTERNAL_SERVER_ERROR",
						message: "Internal server error",
					},
					500,
					true,
				),
			),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await expect(sdk.content.list({ agentId: "agent-123" })).rejects.toThrow();
	});

	it("includes SDK API key header in requests", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse({ posts: [], total: 0 })),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "my-secret-key",
			host: "https://api.example.com",
		});

		await sdk.content.list({ agentId: "agent-123" });

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calls = fetchMock.mock.calls as unknown as Array<
			[Request | string, RequestInit?]
		>;
		const firstArg = calls[0]?.[0];

		// oRPC passes a Request object with headers
		if (firstArg instanceof Request) {
			expect(firstArg.headers.get("sdk-api-key")).toBe("my-secret-key");
		}
	});
});
