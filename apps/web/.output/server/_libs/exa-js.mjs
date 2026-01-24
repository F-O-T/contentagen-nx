import { n as nodePonyfillExports, f as fetch2 } from "./cross-fetch.mjs";
import { a0 as ZodType } from "./zod.mjs";
import { z as zodToJsonSchema$1 } from "./zod-to-json-schema.mjs";
var package_default = {
  version: "2.0.12"
};
var ExaError = class extends Error {
  /**
   * Create a new ExaError
   * @param message Error message
   * @param statusCode HTTP status code
   * @param timestamp ISO timestamp from API
   * @param path Path that caused the error
   */
  constructor(message, statusCode, timestamp, path) {
    super(message);
    this.name = "ExaError";
    this.statusCode = statusCode;
    this.timestamp = timestamp ?? (/* @__PURE__ */ new Date()).toISOString();
    this.path = path;
  }
};
function isZodSchema(obj) {
  return obj instanceof ZodType;
}
function zodToJsonSchema(schema) {
  return zodToJsonSchema$1(schema, {
    $refStrategy: "none"
  });
}
var ResearchBaseClient = class {
  constructor(client) {
    this.client = client;
  }
  async request(endpoint, method = "POST", data, params) {
    return this.client.request(
      `/research/v1${endpoint}`,
      method,
      data,
      params
    );
  }
  async rawRequest(endpoint, method = "POST", data, params) {
    return this.client.rawRequest(
      `/research/v1${endpoint}`,
      method,
      data,
      params
    );
  }
  buildPaginationParams(pagination) {
    const params = {};
    if (!pagination) return params;
    if (pagination.cursor) params.cursor = pagination.cursor;
    if (pagination.limit) params.limit = pagination.limit;
    return params;
  }
};
var ResearchClient = class extends ResearchBaseClient {
  constructor(client) {
    super(client);
  }
  async create(params) {
    const { instructions, model, outputSchema } = params;
    let schema = outputSchema;
    if (schema && isZodSchema(schema)) {
      schema = zodToJsonSchema(schema);
    }
    const payload = {
      instructions,
      model: model ?? "exa-research-fast"
    };
    if (schema) {
      payload.outputSchema = schema;
    }
    return this.request("", "POST", payload);
  }
  get(researchId, options) {
    if (options?.stream) {
      const promise = async () => {
        const params = { stream: "true" };
        if (options.events !== void 0) {
          params.events = options.events.toString();
        }
        const resp = await this.rawRequest(
          `/${researchId}`,
          "GET",
          void 0,
          params
        );
        if (!resp.body) {
          throw new Error("No response body for SSE stream");
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        function processPart(part) {
          const lines = part.split("\n");
          let data = lines.slice(1).join("\n");
          if (data.startsWith("data:")) {
            data = data.slice(5).trimStart();
          }
          try {
            return JSON.parse(data);
          } catch (e) {
            return null;
          }
        }
        async function* streamEvents() {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";
            for (const part of parts) {
              const processed = processPart(part);
              if (processed) {
                yield processed;
              }
            }
          }
          if (buffer.trim()) {
            const processed = processPart(buffer.trim());
            if (processed) {
              yield processed;
            }
          }
        }
        return streamEvents();
      };
      return promise();
    } else {
      const params = { stream: "false" };
      if (options?.events !== void 0) {
        params.events = options.events.toString();
      }
      return this.request(
        `/${researchId}`,
        "GET",
        void 0,
        params
      );
    }
  }
  async list(options) {
    const params = this.buildPaginationParams(options);
    return this.request("", "GET", void 0, params);
  }
  async pollUntilFinished(researchId, options) {
    const pollInterval = options?.pollInterval ?? 1e3;
    const timeoutMs = options?.timeoutMs ?? 10 * 60 * 1e3;
    const maxConsecutiveFailures = 5;
    const startTime = Date.now();
    let consecutiveFailures = 0;
    while (true) {
      try {
        const research = await this.get(researchId, {
          events: options?.events
        });
        consecutiveFailures = 0;
        if (research.status === "completed" || research.status === "failed" || research.status === "canceled") {
          return research;
        }
      } catch (err) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= maxConsecutiveFailures) {
          throw new Error(
            `Polling failed ${maxConsecutiveFailures} times in a row for research ${researchId}: ${err}`
          );
        }
      }
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(
          `Polling timeout: Research ${researchId} did not complete within ${timeoutMs}ms`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
};
var WebsetsBaseClient = class {
  /**
   * Initialize a new Websets base client
   * @param client The Exa client instance
   */
  constructor(client) {
    this.client = client;
  }
  /**
   * Make a request to the Websets API
   * @param endpoint The endpoint path
   * @param method The HTTP method
   * @param data Optional request body data
   * @param params Optional query parameters
   * @returns The response JSON
   * @throws ExaError with API error details if the request fails
   */
  async request(endpoint, method = "POST", data, params, headers) {
    return this.client.request(
      `/websets${endpoint}`,
      method,
      data,
      params,
      headers
    );
  }
  /**
   * Helper to build pagination parameters
   * @param pagination The pagination parameters
   * @returns QueryParams object with pagination parameters
   */
  buildPaginationParams(pagination) {
    const params = {};
    if (!pagination) return params;
    if (pagination.cursor) params.cursor = pagination.cursor;
    if (pagination.limit) params.limit = pagination.limit;
    return params;
  }
};
var WebsetEnrichmentsClient = class extends WebsetsBaseClient {
  /**
   * Create an Enrichment for a Webset
   * @param websetId The ID of the Webset
   * @param params The enrichment parameters
   * @returns The created Webset Enrichment
   */
  async create(websetId, params) {
    return this.request(
      `/v0/websets/${websetId}/enrichments`,
      "POST",
      params
    );
  }
  /**
   * Get an Enrichment by ID
   * @param websetId The ID of the Webset
   * @param id The ID of the Enrichment
   * @returns The Webset Enrichment
   */
  async get(websetId, id) {
    return this.request(
      `/v0/websets/${websetId}/enrichments/${id}`,
      "GET"
    );
  }
  /**
   * Delete an Enrichment
   * @param websetId The ID of the Webset
   * @param id The ID of the Enrichment
   * @returns The deleted Webset Enrichment
   */
  async delete(websetId, id) {
    return this.request(
      `/v0/websets/${websetId}/enrichments/${id}`,
      "DELETE"
    );
  }
  /**
   * Update an Enrichment
   * @param websetId The ID of the Webset
   * @param id The ID of the Enrichment
   * @param params The enrichment update parameters
   * @returns Promise that resolves when the update is complete
   */
  async update(websetId, id, params) {
    return this.request(
      `/v0/websets/${websetId}/enrichments/${id}`,
      "PATCH",
      params
    );
  }
  /**
   * Cancel a running Enrichment
   * @param websetId The ID of the Webset
   * @param id The ID of the Enrichment
   * @returns The canceled Webset Enrichment
   */
  async cancel(websetId, id) {
    return this.request(
      `/v0/websets/${websetId}/enrichments/${id}/cancel`,
      "POST"
    );
  }
};
var EventsClient = class extends WebsetsBaseClient {
  /**
   * Initialize a new Events client
   * @param client The Exa client instance
   */
  constructor(client) {
    super(client);
  }
  /**
   * List all Events
   * @param options Optional filtering and pagination options
   * @returns The list of Events
   */
  async list(options) {
    const params = {
      cursor: options?.cursor,
      limit: options?.limit,
      types: options?.types
    };
    return this.request(
      "/v0/events",
      "GET",
      void 0,
      params
    );
  }
  /**
   * Get an Event by ID
   * @param id The ID of the Event
   * @returns The Event
   */
  async get(id) {
    return this.request(`/v0/events/${id}`, "GET");
  }
};
var ImportsClient = class extends WebsetsBaseClient {
  async create(params, csv) {
    if (csv === void 0) {
      return this.request(
        "/v0/imports",
        "POST",
        params
      );
    }
    let csvBuffer;
    if (typeof csv === "string") {
      csvBuffer = Buffer.from(csv, "utf8");
    } else if (Buffer.isBuffer(csv)) {
      csvBuffer = csv;
    } else {
      throw new ExaError(
        "Invalid CSV data input. Must be string or Buffer",
        400
        /* BadRequest */
      );
    }
    const sizeInBytes = csvBuffer.length;
    const sizeInMB = Math.max(1, Math.ceil(sizeInBytes / (1024 * 1024)));
    const csvText = csvBuffer.toString("utf8");
    const lines = csvText.split("\n").filter((line) => line.trim().length > 0);
    const recordCount = Math.max(0, lines.length - 1);
    if (sizeInMB > 50) {
      throw new ExaError(
        `CSV file too large: ${sizeInMB}MB. Maximum size is 50MB.`,
        400
        /* BadRequest */
      );
    }
    if (recordCount === 0) {
      throw new ExaError(
        "CSV file appears to have no data records (only header or empty)",
        400
        /* BadRequest */
      );
    }
    const createParams = {
      title: params.title,
      format: "csv",
      entity: params.entity,
      size: sizeInBytes,
      count: recordCount,
      metadata: params.metadata,
      csv: params.csv
    };
    const importResponse = await this.request(
      "/v0/imports",
      "POST",
      createParams
    );
    try {
      const uploadResponse = await fetch(importResponse.uploadUrl, {
        method: "PUT",
        body: csvBuffer
      });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new ExaError(
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`,
          400
          /* BadRequest */
        );
      }
    } catch (error) {
      if (error instanceof ExaError) {
        throw error;
      }
      throw new ExaError(
        `Failed to upload CSV data: ${error.message}`,
        400
        /* BadRequest */
      );
    }
    return importResponse;
  }
  /**
   * Get an Import by ID
   * @param id The ID of the Import
   * @returns The Import
   */
  async get(id) {
    return this.request(`/v0/imports/${id}`, "GET");
  }
  /**
   * List all Imports
   * @param options Pagination options
   * @returns The list of Imports
   */
  async list(options) {
    const params = this.buildPaginationParams(options);
    return this.request(
      "/v0/imports",
      "GET",
      void 0,
      params
    );
  }
  /**
   * Update an Import
   * @param id The ID of the Import
   * @param params The import update parameters
   * @returns The updated Import
   */
  async update(id, params) {
    return this.request(`/v0/imports/${id}`, "PATCH", params);
  }
  /**
   * Delete an Import
   * @param id The ID of the Import
   * @returns The deleted Import
   */
  async delete(id) {
    return this.request(`/v0/imports/${id}`, "DELETE");
  }
  /**
   * Wait until an Import is completed or failed
   * @param id The ID of the Import
   * @param options Configuration options for timeout and polling
   * @returns The Import once it reaches a final state (completed or failed)
   * @throws Error if the Import does not complete within the timeout or fails
   */
  async waitUntilCompleted(id, options) {
    const timeout = options?.timeout ?? 30 * 60 * 1e3;
    const pollInterval = options?.pollInterval ?? 2e3;
    const onPoll = options?.onPoll;
    const startTime = Date.now();
    while (true) {
      const importItem = await this.get(id);
      if (onPoll) {
        onPoll(importItem.status);
      }
      if (importItem.status === "completed") {
        return importItem;
      }
      if (importItem.status === "failed") {
        throw new ExaError(
          `Import ${id} failed: ${importItem.failedMessage || "Unknown error"}`,
          400
          /* BadRequest */
        );
      }
      if (Date.now() - startTime > timeout) {
        throw new ExaError(
          `Import ${id} did not complete within ${timeout}ms. Current status: ${importItem.status}`,
          408
          /* RequestTimeout */
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
};
var WebsetItemsClient = class extends WebsetsBaseClient {
  /**
   * List all Items for a Webset
   * @param websetId The ID of the Webset
   * @param params - Optional pagination and filtering parameters
   * @returns A promise that resolves with the list of Items
   */
  list(websetId, params) {
    const queryParams = {
      ...this.buildPaginationParams(params),
      sourceId: params?.sourceId
    };
    return this.request(
      `/v0/websets/${websetId}/items`,
      "GET",
      void 0,
      queryParams
    );
  }
  /**
   * Iterate through all Items in a Webset, handling pagination automatically
   * @param websetId The ID of the Webset
   * @param options Pagination options
   * @returns Async generator of Webset Items
   */
  async *listAll(websetId, options) {
    let cursor = void 0;
    const pageOptions = options ? { ...options } : {};
    while (true) {
      pageOptions.cursor = cursor;
      const response = await this.list(websetId, pageOptions);
      for (const item of response.data) {
        yield item;
      }
      if (!response.hasMore || !response.nextCursor) {
        break;
      }
      cursor = response.nextCursor;
    }
  }
  /**
   * Collect all items from a Webset into an array
   * @param websetId The ID of the Webset
   * @param options Pagination options
   * @returns Promise resolving to an array of all Webset Items
   */
  async getAll(websetId, options) {
    const items = [];
    for await (const item of this.listAll(websetId, options)) {
      items.push(item);
    }
    return items;
  }
  /**
   * Get an Item by ID
   * @param websetId The ID of the Webset
   * @param id The ID of the Item
   * @returns The Webset Item
   */
  async get(websetId, id) {
    return this.request(
      `/v0/websets/${websetId}/items/${id}`,
      "GET"
    );
  }
  /**
   * Delete an Item
   * @param websetId The ID of the Webset
   * @param id The ID of the Item
   * @returns The deleted Webset Item
   */
  async delete(websetId, id) {
    return this.request(
      `/v0/websets/${websetId}/items/${id}`,
      "DELETE"
    );
  }
};
var WebsetMonitorRunsClient = class extends WebsetsBaseClient {
  /**
   * List all runs for a Monitor
   * @param monitorId The ID of the Monitor
   * @param options Pagination options
   * @returns The list of Monitor runs
   */
  async list(monitorId, options) {
    const params = this.buildPaginationParams(options);
    return this.request(
      `/v0/monitors/${monitorId}/runs`,
      "GET",
      void 0,
      params
    );
  }
  /**
   * Get a specific Monitor run
   * @param monitorId The ID of the Monitor
   * @param runId The ID of the Monitor run
   * @returns The Monitor run
   */
  async get(monitorId, runId) {
    return this.request(
      `/v0/monitors/${monitorId}/runs/${runId}`,
      "GET"
    );
  }
};
var WebsetMonitorsClient = class extends WebsetsBaseClient {
  constructor(client) {
    super(client);
    this.runs = new WebsetMonitorRunsClient(client);
  }
  /**
   * Create a Monitor
   * @param params The monitor parameters
   * @returns The created Monitor
   */
  async create(params) {
    return this.request("/v0/monitors", "POST", params);
  }
  /**
   * Get a Monitor by ID
   * @param id The ID of the Monitor
   * @returns The Monitor
   */
  async get(id) {
    return this.request(`/v0/monitors/${id}`, "GET");
  }
  /**
   * List all Monitors
   * @param options Pagination and filtering options
   * @returns The list of Monitors
   */
  async list(options) {
    const params = {
      cursor: options?.cursor,
      limit: options?.limit,
      websetId: options?.websetId
    };
    return this.request(
      "/v0/monitors",
      "GET",
      void 0,
      params
    );
  }
  /**
   * Update a Monitor
   * @param id The ID of the Monitor
   * @param params The monitor update parameters (status, metadata)
   * @returns The updated Monitor
   */
  async update(id, params) {
    return this.request(`/v0/monitors/${id}`, "PATCH", params);
  }
  /**
   * Delete a Monitor
   * @param id The ID of the Monitor
   * @returns The deleted Monitor
   */
  async delete(id) {
    return this.request(`/v0/monitors/${id}`, "DELETE");
  }
};
var WebsetSearchesClient = class extends WebsetsBaseClient {
  /**
   * Create a new Search for the Webset
   * @param websetId The ID of the Webset
   * @param params The search parameters
   * @returns The created Webset Search
   */
  async create(websetId, params, options) {
    return this.request(
      `/v0/websets/${websetId}/searches`,
      "POST",
      params,
      void 0,
      options?.headers
    );
  }
  /**
   * Get a Search by ID
   * @param websetId The ID of the Webset
   * @param id The ID of the Search
   * @returns The Webset Search
   */
  async get(websetId, id) {
    return this.request(
      `/v0/websets/${websetId}/searches/${id}`,
      "GET"
    );
  }
  /**
   * Cancel a running Search
   * @param websetId The ID of the Webset
   * @param id The ID of the Search
   * @returns The canceled Webset Search
   */
  async cancel(websetId, id) {
    return this.request(
      `/v0/websets/${websetId}/searches/${id}/cancel`,
      "POST"
    );
  }
};
var WebsetWebhooksClient = class extends WebsetsBaseClient {
  /**
   * Create a Webhook
   * @param params The webhook parameters
   * @returns The created Webhook
   */
  async create(params) {
    return this.request("/v0/webhooks", "POST", params);
  }
  /**
   * Get a Webhook by ID
   * @param id The ID of the Webhook
   * @returns The Webhook
   */
  async get(id) {
    return this.request(`/v0/webhooks/${id}`, "GET");
  }
  /**
   * List all Webhooks
   * @param options Pagination options
   * @returns The list of Webhooks
   */
  async list(options) {
    const params = this.buildPaginationParams(options);
    return this.request(
      "/v0/webhooks",
      "GET",
      void 0,
      params
    );
  }
  /**
   * Iterate through all Webhooks, handling pagination automatically
   * @param options Pagination options
   * @returns Async generator of Webhooks
   */
  async *listAll(options) {
    let cursor = void 0;
    const pageOptions = options ? { ...options } : {};
    while (true) {
      pageOptions.cursor = cursor;
      const response = await this.list(pageOptions);
      for (const webhook of response.data) {
        yield webhook;
      }
      if (!response.hasMore || !response.nextCursor) {
        break;
      }
      cursor = response.nextCursor;
    }
  }
  /**
   * Collect all Webhooks into an array
   * @param options Pagination options
   * @returns Promise resolving to an array of all Webhooks
   */
  async getAll(options) {
    const webhooks = [];
    for await (const webhook of this.listAll(options)) {
      webhooks.push(webhook);
    }
    return webhooks;
  }
  /**
   * Update a Webhook
   * @param id The ID of the Webhook
   * @param params The webhook update parameters (events, metadata, url)
   * @returns The updated Webhook
   */
  async update(id, params) {
    return this.request(`/v0/webhooks/${id}`, "PATCH", params);
  }
  /**
   * Delete a Webhook
   * @param id The ID of the Webhook
   * @returns The deleted Webhook
   */
  async delete(id) {
    return this.request(`/v0/webhooks/${id}`, "DELETE");
  }
  /**
   * List all attempts for a Webhook
   * @param id The ID of the Webhook
   * @param options Pagination and filtering options
   * @returns The list of Webhook attempts
   */
  async listAttempts(id, options) {
    const params = {
      cursor: options?.cursor,
      limit: options?.limit,
      eventType: options?.eventType,
      successful: options?.successful
    };
    return this.request(
      `/v0/webhooks/${id}/attempts`,
      "GET",
      void 0,
      params
    );
  }
  /**
   * Iterate through all attempts for a Webhook, handling pagination automatically
   * @param id The ID of the Webhook
   * @param options Pagination and filtering options
   * @returns Async generator of Webhook attempts
   */
  async *listAllAttempts(id, options) {
    let cursor = void 0;
    const pageOptions = options ? { ...options } : {};
    while (true) {
      pageOptions.cursor = cursor;
      const response = await this.listAttempts(id, pageOptions);
      for (const attempt of response.data) {
        yield attempt;
      }
      if (!response.hasMore || !response.nextCursor) {
        break;
      }
      cursor = response.nextCursor;
    }
  }
  /**
   * Collect all attempts for a Webhook into an array
   * @param id The ID of the Webhook
   * @param options Pagination and filtering options
   * @returns Promise resolving to an array of all Webhook attempts
   */
  async getAllAttempts(id, options) {
    const attempts = [];
    for await (const attempt of this.listAllAttempts(id, options)) {
      attempts.push(attempt);
    }
    return attempts;
  }
};
var WebsetsClient = class extends WebsetsBaseClient {
  /**
   * Initialize a new Websets client
   * @param client The Exa client instance
   */
  constructor(client) {
    super(client);
    this.events = new EventsClient(client);
    this.imports = new ImportsClient(client);
    this.items = new WebsetItemsClient(client);
    this.searches = new WebsetSearchesClient(client);
    this.enrichments = new WebsetEnrichmentsClient(client);
    this.monitors = new WebsetMonitorsClient(client);
    this.webhooks = new WebsetWebhooksClient(client);
  }
  /**
   * Create a new Webset
   * @param params The Webset creation parameters
   * @returns The created Webset
   */
  async create(params, options) {
    return this.request(
      "/v0/websets",
      "POST",
      params,
      void 0,
      options?.headers
    );
  }
  /**
   * Preview a webset
   * @param params The preview parameters
   * @param options Optional parameters. Search = true allows you to retrieve a preview set of items that could be returned by the webset.
   * @returns The preview response showing how the query will be decomposed
   */
  async preview(params, options) {
    const queryParams = {};
    if (options?.search !== void 0) {
      queryParams.search = options.search;
    }
    return this.request(
      "/v0/websets/preview",
      "POST",
      params,
      queryParams
    );
  }
  /**
   * Get a Webset by ID
   * @param id The ID of the Webset
   * @param expand Optional array of relations to expand
   * @returns The Webset
   */
  async get(id, expand) {
    const params = {};
    if (expand) {
      params.expand = expand;
    }
    return this.request(
      `/v0/websets/${id}`,
      "GET",
      void 0,
      params
    );
  }
  /**
   * List all Websets
   * @param options Pagination options (filtering by status is not supported by API)
   * @returns The list of Websets
   */
  async list(options) {
    const params = this.buildPaginationParams(options);
    return this.request(
      "/v0/websets",
      "GET",
      void 0,
      params
    );
  }
  /**
   * Iterate through all Websets, handling pagination automatically
   * @param options Pagination options
   * @returns Async generator of Websets
   */
  async *listAll(options) {
    let cursor = void 0;
    const pageOptions = options ? { ...options } : {};
    while (true) {
      pageOptions.cursor = cursor;
      const response = await this.list(pageOptions);
      for (const webset of response.data) {
        yield webset;
      }
      if (!response.hasMore || !response.nextCursor) {
        break;
      }
      cursor = response.nextCursor;
    }
  }
  /**
   * Collect all Websets into an array
   * @param options Pagination options
   * @returns Promise resolving to an array of all Websets
   */
  async getAll(options) {
    const websets = [];
    for await (const webset of this.listAll(options)) {
      websets.push(webset);
    }
    return websets;
  }
  /**
   * Update a Webset
   * @param id The ID of the Webset
   * @param params The Webset update parameters
   * @returns The updated Webset
   */
  async update(id, params) {
    return this.request(`/v0/websets/${id}`, "POST", params);
  }
  /**
   * Delete a Webset
   * @param id The ID of the Webset
   * @returns The deleted Webset
   */
  async delete(id) {
    return this.request(`/v0/websets/${id}`, "DELETE");
  }
  /**
   * Cancel a running Webset
   * @param id The ID or external ID of the Webset
   * @returns The canceled Webset (as returned by the API)
   */
  async cancel(id) {
    return this.request(`/v0/websets/${id}/cancel`, "POST");
  }
  /**
   * Wait until a Webset is idle
   * @param id The ID of the Webset
   * @param options Configuration options for timeout and polling
   * @returns The Webset once it becomes idle
   * @throws Error if the Webset does not become idle within the timeout
   */
  async waitUntilIdle(id, options) {
    let timeout;
    let pollInterval = 1e3;
    let onPoll;
    if (typeof options === "number") {
      timeout = options;
    } else if (options) {
      timeout = options.timeout;
      pollInterval = options.pollInterval || 1e3;
      onPoll = options.onPoll;
    }
    const startTime = Date.now();
    while (true) {
      const webset = await this.get(id);
      if (onPoll) {
        onPoll(webset.status);
      }
      if (webset.status === "idle") {
        return webset;
      }
      if (timeout && Date.now() - startTime > timeout) {
        throw new ExaError(
          `Webset ${id} did not reach idle state within ${timeout}ms. Current status: ${webset.status}`,
          408
          /* RequestTimeout */
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
};
var fetchImpl = typeof global !== "undefined" && global.fetch ? global.fetch : fetch2;
var HeadersImpl = typeof global !== "undefined" && global.Headers ? global.Headers : nodePonyfillExports.Headers;
var DEFAULT_MAX_CHARACTERS = 1e4;
var Exa2 = class {
  /**
   * Helper method to separate out the contents-specific options from the rest.
   */
  extractContentsOptions(options) {
    const {
      text,
      highlights,
      summary,
      subpages,
      subpageTarget,
      extras,
      livecrawl,
      livecrawlTimeout,
      context,
      ...rest
    } = options;
    const contentsOptions = {};
    if (text === void 0 && summary === void 0 && highlights === void 0 && extras === void 0) {
      contentsOptions.text = true;
    }
    if (text !== void 0) contentsOptions.text = text;
    if (highlights !== void 0) contentsOptions.highlights = highlights;
    if (summary !== void 0) {
      if (typeof summary === "object" && summary !== null && "schema" in summary && summary.schema && isZodSchema(summary.schema)) {
        contentsOptions.summary = {
          ...summary,
          schema: zodToJsonSchema(summary.schema)
        };
      } else {
        contentsOptions.summary = summary;
      }
    }
    if (subpages !== void 0) contentsOptions.subpages = subpages;
    if (subpageTarget !== void 0)
      contentsOptions.subpageTarget = subpageTarget;
    if (extras !== void 0) contentsOptions.extras = extras;
    if (livecrawl !== void 0) contentsOptions.livecrawl = livecrawl;
    if (livecrawlTimeout !== void 0)
      contentsOptions.livecrawlTimeout = livecrawlTimeout;
    if (context !== void 0) contentsOptions.context = context;
    return {
      contentsOptions,
      restOptions: rest
    };
  }
  /**
   * Constructs the Exa API client.
   * @param {string} apiKey - The API key for authentication.
   * @param {string} [baseURL] - The base URL of the Exa API.
   */
  constructor(apiKey, baseURL = "https://api.exa.ai") {
    this.baseURL = baseURL;
    if (!apiKey) {
      apiKey = process.env.EXA_API_KEY;
      if (!apiKey) {
        throw new ExaError(
          "API key must be provided as an argument or as an environment variable (EXA_API_KEY)",
          401
          /* Unauthorized */
        );
      }
    }
    this.headers = new HeadersImpl({
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "User-Agent": `exa-node ${package_default.version}`
    });
    this.websets = new WebsetsClient(this);
    this.research = new ResearchClient(this);
  }
  /**
   * Makes a request to the Exa API.
   * @param {string} endpoint - The API endpoint to call.
   * @param {string} method - The HTTP method to use.
   * @param {any} [body] - The request body for POST requests.
   * @param {Record<string, any>} [params] - The query parameters.
   * @returns {Promise<any>} The response from the API.
   * @throws {ExaError} When any API request fails with structured error information
   */
  async request(endpoint, method, body, params, headers) {
    let url = this.baseURL + endpoint;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            searchParams.append(key, item);
          }
        } else if (value !== void 0) {
          searchParams.append(key, String(value));
        }
      }
      url += `?${searchParams.toString()}`;
    }
    let combinedHeaders = {};
    if (this.headers instanceof HeadersImpl) {
      this.headers.forEach((value, key) => {
        combinedHeaders[key] = value;
      });
    } else {
      combinedHeaders = { ...this.headers };
    }
    if (headers) {
      combinedHeaders = { ...combinedHeaders, ...headers };
    }
    const response = await fetchImpl(url, {
      method,
      headers: combinedHeaders,
      body: body ? JSON.stringify(body) : void 0
    });
    if (!response.ok) {
      const errorData = await response.json();
      if (!errorData.statusCode) {
        errorData.statusCode = response.status;
      }
      if (!errorData.timestamp) {
        errorData.timestamp = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (!errorData.path) {
        errorData.path = endpoint;
      }
      let message = errorData.error || "Unknown error";
      if (errorData.message) {
        message += (message.length > 0 ? ". " : "") + errorData.message;
      }
      throw new ExaError(
        message,
        response.status,
        errorData.timestamp,
        errorData.path
      );
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      return await this.parseSSEStream(response);
    }
    return await response.json();
  }
  async rawRequest(endpoint, method = "POST", body, queryParams) {
    let url = this.baseURL + endpoint;
    if (queryParams) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            searchParams.append(key, String(item));
          }
        } else if (value !== void 0) {
          searchParams.append(key, String(value));
        }
      }
      url += `?${searchParams.toString()}`;
    }
    const response = await fetchImpl(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : void 0
    });
    return response;
  }
  async search(query, options) {
    if (options === void 0 || !("contents" in options)) {
      return await this.request("/search", "POST", {
        query,
        ...options,
        contents: { text: { maxCharacters: DEFAULT_MAX_CHARACTERS } }
      });
    }
    if (options.contents === false || options.contents === null || options.contents === void 0) {
      const { contents, ...restOptions } = options;
      return await this.request("/search", "POST", { query, ...restOptions });
    }
    return await this.request("/search", "POST", { query, ...options });
  }
  /**
   * @deprecated Use `search()` instead. The search method now returns text contents by default.
   *
   * Migration examples:
   * - `searchAndContents(query)` → `search(query)`
   * - `searchAndContents(query, { text: true })` → `search(query, { contents: { text: true } })`
   * - `searchAndContents(query, { summary: true })` → `search(query, { contents: { summary: true } })`
   *
   * Performs a search with an Exa prompt-engineered query and returns the contents of the documents.
   *
   * @param {string} query - The query string.
   * @param {RegularSearchOptions & T} [options] - Additional search + contents options
   * @returns {Promise<SearchResponse<T>>} A list of relevant search results with requested contents.
   */
  async searchAndContents(query, options) {
    const { contentsOptions, restOptions } = options === void 0 ? {
      contentsOptions: {
        text: { maxCharacters: DEFAULT_MAX_CHARACTERS }
      },
      restOptions: {}
    } : this.extractContentsOptions(options);
    return await this.request("/search", "POST", {
      query,
      contents: contentsOptions,
      ...restOptions
    });
  }
  async findSimilar(url, options) {
    if (options === void 0 || !("contents" in options)) {
      return await this.request("/findSimilar", "POST", {
        url,
        ...options,
        contents: { text: { maxCharacters: DEFAULT_MAX_CHARACTERS } }
      });
    }
    if (options.contents === false || options.contents === null || options.contents === void 0) {
      const { contents, ...restOptions } = options;
      return await this.request("/findSimilar", "POST", {
        url,
        ...restOptions
      });
    }
    return await this.request("/findSimilar", "POST", { url, ...options });
  }
  /**
   * @deprecated Use `findSimilar()` instead. The findSimilar method now returns text contents by default.
   *
   * Migration examples:
   * - `findSimilarAndContents(url)` → `findSimilar(url)`
   * - `findSimilarAndContents(url, { text: true })` → `findSimilar(url, { contents: { text: true } })`
   * - `findSimilarAndContents(url, { summary: true })` → `findSimilar(url, { contents: { summary: true } })`
   *
   * Finds similar links to the provided URL and returns the contents of the documents.
   * @param {string} url - The URL for which to find similar links.
   * @param {FindSimilarOptions & T} [options] - Additional options for finding similar links + contents.
   * @returns {Promise<SearchResponse<T>>} A list of similar search results, including requested contents.
   */
  async findSimilarAndContents(url, options) {
    const { contentsOptions, restOptions } = options === void 0 ? {
      contentsOptions: {
        text: { maxCharacters: DEFAULT_MAX_CHARACTERS }
      },
      restOptions: {}
    } : this.extractContentsOptions(options);
    return await this.request("/findSimilar", "POST", {
      url,
      contents: contentsOptions,
      ...restOptions
    });
  }
  /**
   * Retrieves contents of documents based on URLs.
   * @param {string | string[] | SearchResult[]} urls - A URL or array of URLs, or an array of SearchResult objects.
   * @param {ContentsOptions} [options] - Additional options for retrieving document contents.
   * @returns {Promise<SearchResponse<T>>} A list of document contents for the requested URLs.
   */
  async getContents(urls, options) {
    if (!urls || Array.isArray(urls) && urls.length === 0) {
      throw new ExaError(
        "Must provide at least one URL",
        400
        /* BadRequest */
      );
    }
    let requestUrls;
    if (typeof urls === "string") {
      requestUrls = [urls];
    } else if (typeof urls[0] === "string") {
      requestUrls = urls;
    } else {
      requestUrls = urls.map((result) => result.url);
    }
    const payload = {
      urls: requestUrls,
      ...options
    };
    return await this.request("/contents", "POST", payload);
  }
  async answer(query, options) {
    if (options?.stream) {
      throw new ExaError(
        "For streaming responses, please use streamAnswer() instead:\n\nfor await (const chunk of exa.streamAnswer(query)) {\n  // Handle chunks\n}",
        400
        /* BadRequest */
      );
    }
    let outputSchema = options?.outputSchema;
    if (outputSchema && isZodSchema(outputSchema)) {
      outputSchema = zodToJsonSchema(outputSchema);
    }
    const requestBody = {
      query,
      stream: false,
      text: options?.text ?? false,
      model: options?.model ?? "exa",
      systemPrompt: options?.systemPrompt,
      outputSchema,
      userLocation: options?.userLocation
    };
    return await this.request("/answer", "POST", requestBody);
  }
  async *streamAnswer(query, options) {
    let outputSchema = options?.outputSchema;
    if (outputSchema && isZodSchema(outputSchema)) {
      outputSchema = zodToJsonSchema(outputSchema);
    }
    const body = {
      query,
      text: options?.text ?? false,
      stream: true,
      model: options?.model ?? "exa",
      systemPrompt: options?.systemPrompt,
      outputSchema
    };
    const response = await fetchImpl(this.baseURL + "/answer", {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const message = await response.text();
      throw new ExaError(message, response.status, (/* @__PURE__ */ new Date()).toISOString());
    }
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ExaError(
        "No response body available for streaming.",
        500,
        (/* @__PURE__ */ new Date()).toISOString()
      );
    }
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.replace(/^data:\s*/, "").trim();
          if (!jsonStr || jsonStr === "[DONE]") {
            continue;
          }
          let chunkData;
          try {
            chunkData = JSON.parse(jsonStr);
          } catch (err) {
            continue;
          }
          const chunk = this.processChunk(chunkData);
          if (chunk.content || chunk.citations) {
            yield chunk;
          }
        }
      }
      if (buffer.startsWith("data: ")) {
        const leftover = buffer.replace(/^data:\s*/, "").trim();
        if (leftover && leftover !== "[DONE]") {
          try {
            const chunkData = JSON.parse(leftover);
            const chunk = this.processChunk(chunkData);
            if (chunk.content || chunk.citations) {
              yield chunk;
            }
          } catch (e) {
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  processChunk(chunkData) {
    let content;
    let citations;
    if (chunkData.choices && chunkData.choices[0] && chunkData.choices[0].delta) {
      content = chunkData.choices[0].delta.content;
    }
    if (chunkData.citations && chunkData.citations !== "null") {
      citations = chunkData.citations.map((c) => ({
        id: c.id,
        url: c.url,
        title: c.title,
        publishedDate: c.publishedDate,
        author: c.author,
        text: c.text
      }));
    }
    return { content, citations };
  }
  async parseSSEStream(response) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ExaError(
        "No response body available for streaming.",
        500,
        (/* @__PURE__ */ new Date()).toISOString()
      );
    }
    const decoder = new TextDecoder();
    let buffer = "";
    return new Promise(async (resolve, reject) => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.replace(/^data:\s*/, "").trim();
            if (!jsonStr || jsonStr === "[DONE]") {
              continue;
            }
            let chunk;
            try {
              chunk = JSON.parse(jsonStr);
            } catch {
              continue;
            }
            switch (chunk.tag) {
              case "complete":
                reader.releaseLock();
                resolve(chunk.data);
                return;
              case "error": {
                const message = chunk.error?.message || "Unknown error";
                reader.releaseLock();
                reject(
                  new ExaError(
                    message,
                    500,
                    (/* @__PURE__ */ new Date()).toISOString()
                  )
                );
                return;
              }
              // 'progress' and any other tags are ignored for the blocking variant
              default:
                break;
            }
          }
        }
        reject(
          new ExaError(
            "Stream ended without a completion event.",
            500,
            (/* @__PURE__ */ new Date()).toISOString()
          )
        );
      } catch (err) {
        reject(err);
      } finally {
        try {
          reader.releaseLock();
        } catch {
        }
      }
    });
  }
};
var index_default = Exa2;
export {
  index_default as i
};
