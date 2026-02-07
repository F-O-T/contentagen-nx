import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { createSdk } from "../src";

const originalFetch = globalThis.fetch;

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

const createJsonResponse = (payload: unknown): FetchResponse => {
	return {
		ok: true,
		status: 200,
		statusText: "OK",
		json: async () => payload,
		text: async () => JSON.stringify(payload),
		body: null,
	} as unknown as FetchResponse;
};


describe("ContentaGenSDK", () => {
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

	it("serializes array query params as repeated entries", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse({ posts: [], total: 0 })),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await sdk.listContentByAgent({
			agentId: "agent-123",
			status: ["draft", "approved"],
			limit: 5,
			page: 2,
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calls = fetchMock.mock.calls as unknown as Parameters<typeof fetch>[];
		const requestUrl = calls[0]?.[0];
		if (!requestUrl) {
			throw new Error("Expected fetch to be called with a URL");
		}
		const url = new URL(String(requestUrl));
		expect(url.pathname).toBe("/sdk/content/agent-123");
		expect(url.searchParams.getAll("status")).toEqual(["draft", "approved"]);
		expect(url.searchParams.get("limit")).toBe("5");
		expect(url.searchParams.get("page")).toBe("2");
	});

	it("omits status query param when no statuses are provided", async () => {
		const fetchMock = mock(() =>
			Promise.resolve(createJsonResponse({ posts: [], total: 0 })),
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const sdk = createSdk({
			apiKey: "test-key",
			host: "https://api.example.com",
		});

		await sdk.listContentByAgent({
			agentId: "agent-456",
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calls = fetchMock.mock.calls as unknown as Parameters<typeof fetch>[];
		const requestUrl = calls[0]?.[0];
		if (!requestUrl) {
			throw new Error("Expected fetch to be called with a URL");
		}
		const url = new URL(String(requestUrl));
		expect(url.pathname).toBe("/sdk/content/agent-456");
		expect(url.searchParams.getAll("status")).toHaveLength(0);
		expect(url.searchParams.get("limit")).toBeNull();
		expect(url.searchParams.get("page")).toBeNull();
	});

});
