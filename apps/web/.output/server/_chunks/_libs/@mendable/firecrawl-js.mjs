import { a as axios, A as AxiosError } from "../../../_libs/axios.mjs";
import { EventEmitter } from "events";
import { z as zodToJsonSchema } from "../../../_libs/zod-to-json-schema.mjs";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_package = __commonJS({
  "package.json"(exports$1, module) {
    module.exports = {
      name: "@mendable/firecrawl-js",
      version: "4.10.0",
      description: "JavaScript SDK for Firecrawl API",
      main: "dist/index.js",
      types: "dist/index.d.ts",
      exports: {
        "./package.json": "./package.json",
        ".": {
          import: "./dist/index.js",
          default: "./dist/index.cjs"
        }
      },
      type: "module",
      scripts: {
        build: "tsup",
        "build-and-publish": "npm run build && npm publish --access public",
        "publish-beta": "npm run build && npm publish --access public --tag beta",
        test: "NODE_OPTIONS=--experimental-vm-modules jest --verbose src/__tests__/e2e/v2/*.test.ts --detectOpenHandles",
        "test:unit": "NODE_OPTIONS=--experimental-vm-modules jest --verbose src/__tests__/unit/v2/*.test.ts"
      },
      repository: {
        type: "git",
        url: "git+https://github.com/firecrawl/firecrawl.git"
      },
      author: "Mendable.ai",
      license: "MIT",
      dependencies: {
        axios: "^1.12.2",
        "typescript-event-target": "^1.1.1",
        zod: "^3.23.8",
        "zod-to-json-schema": "^3.23.0"
      },
      bugs: {
        url: "https://github.com/firecrawl/firecrawl/issues"
      },
      homepage: "https://github.com/firecrawl/firecrawl#readme",
      devDependencies: {
        "@jest/globals": "^30.2.0",
        "@types/dotenv": "^8.2.0",
        "@types/jest": "^30.0.0",
        "@types/mocha": "^10.0.6",
        "@types/node": "^20.12.12",
        "@types/uuid": "^9.0.8",
        dotenv: "^16.4.5",
        jest: "^30.2.0",
        "ts-jest": "^29.4.5",
        tsup: "^8.5.0",
        typescript: "^5.4.5",
        uuid: "^9.0.1"
      },
      keywords: [
        "firecrawl",
        "mendable",
        "crawler",
        "web",
        "scraper",
        "api",
        "sdk"
      ],
      engines: {
        node: ">=22.0.0"
      },
      pnpm: {
        overrides: {
          "@babel/helpers@<7.26.10": ">=7.26.10",
          "brace-expansion@>=1.0.0 <=1.1.11": ">=1.1.12",
          "brace-expansion@>=2.0.0 <=2.0.1": ">=2.0.2",
          "js-yaml@<3.14.2": ">=3.14.2",
          "glob@>=10.2.0 <10.5.0": ">=10.5.0"
        }
      }
    };
  }
});
function getVersion() {
  try {
    if (typeof process !== "undefined" && process.env && process.env.npm_package_version) {
      return process.env.npm_package_version;
    }
    const pkg = require_package();
    return pkg?.version || "3.x.x";
  } catch {
    return "3.x.x";
  }
}
var HttpClient = class {
  instance;
  apiKey;
  apiUrl;
  maxRetries;
  backoffFactor;
  constructor(options) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl.replace(/\/$/, "");
    this.maxRetries = options.maxRetries ?? 3;
    this.backoffFactor = options.backoffFactor ?? 0.5;
    this.instance = axios.create({
      baseURL: this.apiUrl,
      timeout: options.timeoutMs ?? 3e5,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      transitional: { clarifyTimeoutError: true }
    });
  }
  getApiUrl() {
    return this.apiUrl;
  }
  getApiKey() {
    return this.apiKey;
  }
  async request(config) {
    const version = getVersion();
    config.headers = {
      ...config.headers || {}
    };
    let lastError;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const cfg = { ...config };
        if (cfg.method && ["post", "put", "patch"].includes(cfg.method.toLowerCase())) {
          const data = cfg.data ?? {};
          cfg.data = { ...data, origin: typeof data.origin === "string" && data.origin.includes("mcp") ? data.origin : `js-sdk@${version}` };
          if (typeof data.timeout === "number") {
            cfg.timeout = data.timeout + 5e3;
          }
        }
        const res = await this.instance.request(cfg);
        if (res.status === 502 && attempt < this.maxRetries - 1) {
          await this.sleep(this.backoffFactor * Math.pow(2, attempt));
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        if (status === 502 && attempt < this.maxRetries - 1) {
          await this.sleep(this.backoffFactor * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }
    }
    throw lastError ?? new Error("Unexpected HTTP client error");
  }
  sleep(seconds) {
    return new Promise((r) => setTimeout(r, seconds * 1e3));
  }
  post(endpoint, body, headers) {
    return this.request({ method: "post", url: endpoint, data: body, headers });
  }
  get(endpoint, headers) {
    return this.request({ method: "get", url: endpoint, headers });
  }
  delete(endpoint, headers) {
    return this.request({ method: "delete", url: endpoint, headers });
  }
  prepareHeaders(idempotencyKey) {
    const headers = {};
    if (idempotencyKey) headers["x-idempotency-key"] = idempotencyKey;
    return headers;
  }
};
var SdkError = class extends Error {
  status;
  code;
  details;
  jobId;
  constructor(message, status, code, details, jobId) {
    super(message);
    this.name = "FirecrawlSdkError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.jobId = jobId;
  }
};
var JobTimeoutError = class extends SdkError {
  timeoutSeconds;
  constructor(jobId, timeoutSeconds, jobType = "batch") {
    const jobTypeLabel = jobType === "batch" ? "batch scrape" : "crawl";
    super(
      `${jobTypeLabel.charAt(0).toUpperCase() + jobTypeLabel.slice(1)} job ${jobId} did not complete within ${timeoutSeconds} seconds`,
      void 0,
      "JOB_TIMEOUT",
      void 0,
      jobId
    );
    this.name = "JobTimeoutError";
    this.timeoutSeconds = timeoutSeconds;
  }
};
function ensureValidFormats(formats) {
  if (!formats) return;
  for (const fmt of formats) {
    if (typeof fmt === "string") {
      if (fmt === "json") {
        throw new Error("json format must be an object with { type: 'json', prompt, schema }");
      }
      continue;
    }
    if (fmt.type === "json") {
      const j = fmt;
      if (!j.prompt && !j.schema) {
        throw new Error("json format requires either 'prompt' or 'schema' (or both)");
      }
      const maybeSchema = j.schema;
      const isZod = !!maybeSchema && (typeof maybeSchema.safeParse === "function" || typeof maybeSchema.parse === "function") && !!maybeSchema._def;
      if (isZod) {
        try {
          j.schema = zodToJsonSchema(maybeSchema);
        } catch {
        }
      }
      continue;
    }
    if (fmt.type === "changeTracking") {
      const ct = fmt;
      const maybeSchema = ct.schema;
      const isZod = !!maybeSchema && (typeof maybeSchema.safeParse === "function" || typeof maybeSchema.parse === "function") && !!maybeSchema._def;
      if (isZod) {
        try {
          ct.schema = zodToJsonSchema(maybeSchema);
        } catch {
        }
      }
      continue;
    }
    if (fmt.type === "screenshot") {
      const s = fmt;
      if (s.quality != null && (typeof s.quality !== "number" || s.quality < 0)) {
        throw new Error("screenshot.quality must be a non-negative number");
      }
    }
  }
}
function ensureValidScrapeOptions(options) {
  if (!options) return;
  if (options.timeout != null && options.timeout <= 0) {
    throw new Error("timeout must be positive");
  }
  if (options.waitFor != null && options.waitFor < 0) {
    throw new Error("waitFor must be non-negative");
  }
  ensureValidFormats(options.formats);
}
function throwForBadResponse(resp, action) {
  const status = resp.status;
  const body = resp.data || {};
  const msg = body?.error || body?.message || `Request failed (${status}) while trying to ${action}`;
  throw new SdkError(msg, status, void 0, body?.details);
}
function normalizeAxiosError(err, action) {
  const status = err.response?.status;
  const body = err.response?.data;
  const message = body?.error || err.message || `Request failed${status ? ` (${status})` : ""} while trying to ${action}`;
  const code = body?.code || err.code;
  throw new SdkError(message, status, code, body?.details ?? body);
}
function isRetryableError(err) {
  if (err instanceof JobTimeoutError) {
    return false;
  }
  if (err instanceof SdkError || err && typeof err === "object" && "status" in err) {
    const status = err.status;
    if (status && status >= 400 && status < 500) {
      return false;
    }
    if (status && status >= 500) {
      return true;
    }
  }
  if (err?.isAxiosError && !err.response) {
    return true;
  }
  if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
    return true;
  }
  return true;
}
async function scrape(http, url, options) {
  if (!url || !url.trim()) {
    throw new Error("URL cannot be empty");
  }
  if (options) ensureValidScrapeOptions(options);
  const payload = { url: url.trim() };
  if (options) Object.assign(payload, options);
  try {
    const res = await http.post("/v2/scrape", payload);
    if (res.status !== 200 || !res.data?.success) {
      throwForBadResponse(res, "scrape");
    }
    return res.data.data || {};
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "scrape");
    throw err;
  }
}
function prepareSearchPayload(req) {
  if (!req.query || !req.query.trim()) throw new Error("Query cannot be empty");
  if (req.limit != null && req.limit <= 0) throw new Error("limit must be positive");
  if (req.timeout != null && req.timeout <= 0) throw new Error("timeout must be positive");
  const payload = {
    query: req.query
  };
  if (req.sources) payload.sources = req.sources;
  if (req.categories) payload.categories = req.categories;
  if (req.limit != null) payload.limit = req.limit;
  if (req.tbs != null) payload.tbs = req.tbs;
  if (req.location != null) payload.location = req.location;
  if (req.ignoreInvalidURLs != null) payload.ignoreInvalidURLs = req.ignoreInvalidURLs;
  if (req.timeout != null) payload.timeout = req.timeout;
  if (req.integration && req.integration.trim()) payload.integration = req.integration.trim();
  if (req.scrapeOptions) {
    ensureValidScrapeOptions(req.scrapeOptions);
    payload.scrapeOptions = req.scrapeOptions;
  }
  return payload;
}
function transformArray(arr) {
  const results = [];
  for (const item of arr) {
    if (item && typeof item === "object") {
      if ("markdown" in item || "html" in item || "rawHtml" in item || "links" in item || "screenshot" in item || "changeTracking" in item || "summary" in item || "json" in item) {
        results.push(item);
      } else {
        results.push(item);
      }
    } else {
      results.push({ url: item });
    }
  }
  return results;
}
async function search(http, request) {
  const payload = prepareSearchPayload(request);
  try {
    const res = await http.post("/v2/search", payload);
    if (res.status !== 200 || !res.data?.success) {
      throwForBadResponse(res, "search");
    }
    const data = res.data.data || {};
    const out = {};
    if (data.web) out.web = transformArray(data.web);
    if (data.news) out.news = transformArray(data.news);
    if (data.images) out.images = transformArray(data.images);
    return out;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "search");
    throw err;
  }
}
function prepareMapPayload(url, options) {
  if (!url || !url.trim()) throw new Error("URL cannot be empty");
  const payload = { url: url.trim() };
  if (options) {
    if (options.sitemap != null) payload.sitemap = options.sitemap;
    if (options.search != null) payload.search = options.search;
    if (options.includeSubdomains != null) payload.includeSubdomains = options.includeSubdomains;
    if (options.ignoreQueryParameters != null) payload.ignoreQueryParameters = options.ignoreQueryParameters;
    if (options.limit != null) payload.limit = options.limit;
    if (options.timeout != null) payload.timeout = options.timeout;
    if (options.integration != null && options.integration.trim()) payload.integration = options.integration.trim();
    if (options.location != null) payload.location = options.location;
  }
  return payload;
}
async function map(http, url, options) {
  const payload = prepareMapPayload(url, options);
  try {
    const res = await http.post("/v2/map", payload);
    if (res.status !== 200 || !res.data?.success) {
      throwForBadResponse(res, "map");
    }
    const linksIn = res.data.links || [];
    const links = [];
    for (const item of linksIn) {
      if (typeof item === "string") links.push({ url: item });
      else if (item && typeof item === "object") links.push({ url: item.url, title: item.title, description: item.description });
    }
    return { links };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "map");
    throw err;
  }
}
async function fetchAllPages(http, nextUrl, initial, pagination) {
  const docs = initial.slice();
  let current = nextUrl;
  let pageCount = 0;
  const maxPages = pagination?.maxPages ?? void 0;
  const maxResults = pagination?.maxResults ?? void 0;
  const maxWaitTime = pagination?.maxWaitTime ?? void 0;
  const started = Date.now();
  while (current) {
    if (maxPages != null && pageCount >= maxPages) break;
    if (maxWaitTime != null && (Date.now() - started) / 1e3 > maxWaitTime) break;
    let payload = null;
    try {
      const res = await http.get(current);
      payload = res.data;
    } catch {
      break;
    }
    if (!payload?.success) break;
    for (const d of payload.data || []) {
      if (maxResults != null && docs.length >= maxResults) break;
      docs.push(d);
    }
    if (maxResults != null && docs.length >= maxResults) break;
    current = payload.next ?? null;
    pageCount += 1;
  }
  return docs;
}
function prepareCrawlPayload(request) {
  if (!request.url || !request.url.trim()) throw new Error("URL cannot be empty");
  const data = { url: request.url.trim() };
  if (request.prompt) data.prompt = request.prompt;
  if (request.excludePaths) data.excludePaths = request.excludePaths;
  if (request.includePaths) data.includePaths = request.includePaths;
  if (request.maxDiscoveryDepth != null) data.maxDiscoveryDepth = request.maxDiscoveryDepth;
  if (request.sitemap != null) data.sitemap = request.sitemap;
  if (request.ignoreQueryParameters != null) data.ignoreQueryParameters = request.ignoreQueryParameters;
  if (request.limit != null) data.limit = request.limit;
  if (request.crawlEntireDomain != null) data.crawlEntireDomain = request.crawlEntireDomain;
  if (request.allowExternalLinks != null) data.allowExternalLinks = request.allowExternalLinks;
  if (request.allowSubdomains != null) data.allowSubdomains = request.allowSubdomains;
  if (request.delay != null) data.delay = request.delay;
  if (request.maxConcurrency != null) data.maxConcurrency = request.maxConcurrency;
  if (request.webhook != null) data.webhook = request.webhook;
  if (request.integration != null && request.integration.trim()) data.integration = request.integration.trim();
  if (request.scrapeOptions) {
    ensureValidScrapeOptions(request.scrapeOptions);
    data.scrapeOptions = request.scrapeOptions;
  }
  if (request.zeroDataRetention != null) data.zeroDataRetention = request.zeroDataRetention;
  return data;
}
async function startCrawl(http, request) {
  const payload = prepareCrawlPayload(request);
  try {
    const res = await http.post("/v2/crawl", payload);
    if (res.status !== 200 || !res.data?.success) {
      throwForBadResponse(res, "start crawl");
    }
    return { id: res.data.id, url: res.data.url };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "start crawl");
    throw err;
  }
}
async function getCrawlStatus(http, jobId, pagination) {
  try {
    const res = await http.get(`/v2/crawl/${jobId}`);
    if (res.status !== 200 || !res.data?.success) {
      throwForBadResponse(res, "get crawl status");
    }
    const body = res.data;
    const initialDocs = body.data || [];
    const auto = pagination?.autoPaginate ?? true;
    if (!auto || !body.next) {
      return {
        id: jobId,
        status: body.status,
        completed: body.completed ?? 0,
        total: body.total ?? 0,
        creditsUsed: body.creditsUsed,
        expiresAt: body.expiresAt,
        next: body.next ?? null,
        data: initialDocs
      };
    }
    const aggregated = await fetchAllPages(http, body.next, initialDocs, pagination);
    return {
      id: jobId,
      status: body.status,
      completed: body.completed ?? 0,
      total: body.total ?? 0,
      creditsUsed: body.creditsUsed,
      expiresAt: body.expiresAt,
      next: null,
      data: aggregated
    };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get crawl status");
    throw err;
  }
}
async function cancelCrawl(http, jobId) {
  try {
    const res = await http.delete(`/v2/crawl/${jobId}`);
    if (res.status !== 200) throwForBadResponse(res, "cancel crawl");
    return res.data?.status === "cancelled";
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "cancel crawl");
    throw err;
  }
}
async function waitForCrawlCompletion(http, jobId, pollInterval = 2, timeout) {
  const start = Date.now();
  while (true) {
    try {
      const status = await getCrawlStatus(http, jobId);
      if (["completed", "failed", "cancelled"].includes(status.status)) {
        return status;
      }
    } catch (err) {
      if (!isRetryableError(err)) {
        if (err instanceof SdkError) {
          const errorWithJobId = new SdkError(
            err.message,
            err.status,
            err.code,
            err.details,
            jobId
          );
          throw errorWithJobId;
        }
        throw err;
      }
    }
    if (timeout != null && Date.now() - start > timeout * 1e3) {
      throw new JobTimeoutError(jobId, timeout, "crawl");
    }
    await new Promise((r) => setTimeout(r, Math.max(1e3, pollInterval * 1e3)));
  }
}
async function crawl(http, request, pollInterval = 2, timeout) {
  const started = await startCrawl(http, request);
  return waitForCrawlCompletion(http, started.id, pollInterval, timeout);
}
async function getCrawlErrors(http, crawlId) {
  try {
    const res = await http.get(`/v2/crawl/${crawlId}/errors`);
    if (res.status !== 200) throwForBadResponse(res, "get crawl errors");
    const payload = res.data?.data ?? res.data;
    return { errors: payload.errors || [], robotsBlocked: payload.robotsBlocked || [] };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get crawl errors");
    throw err;
  }
}
async function getActiveCrawls(http) {
  try {
    const res = await http.get(`/v2/crawl/active`);
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get active crawls");
    const crawlsIn = res.data?.crawls || [];
    const crawls = crawlsIn.map((c) => ({ id: c.id, teamId: c.teamId ?? c.team_id, url: c.url, options: c.options ?? null }));
    return { success: true, crawls };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get active crawls");
    throw err;
  }
}
async function crawlParamsPreview(http, url, prompt) {
  if (!url || !url.trim()) throw new Error("URL cannot be empty");
  if (!prompt || !prompt.trim()) throw new Error("Prompt cannot be empty");
  try {
    const res = await http.post("/v2/crawl/params-preview", { url: url.trim(), prompt });
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "crawl params preview");
    const data = res.data.data || {};
    if (res.data.warning) data.warning = res.data.warning;
    return data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "crawl params preview");
    throw err;
  }
}
async function startBatchScrape(http, urls, {
  options,
  webhook,
  appendToId,
  ignoreInvalidURLs,
  maxConcurrency,
  zeroDataRetention,
  idempotencyKey,
  integration
} = {}) {
  if (!Array.isArray(urls) || urls.length === 0) throw new Error("URLs list cannot be empty");
  const payload = { urls };
  if (options) {
    ensureValidScrapeOptions(options);
    Object.assign(payload, options);
  }
  if (webhook != null) payload.webhook = webhook;
  if (appendToId != null) payload.appendToId = appendToId;
  if (ignoreInvalidURLs != null) payload.ignoreInvalidURLs = ignoreInvalidURLs;
  if (maxConcurrency != null) payload.maxConcurrency = maxConcurrency;
  if (zeroDataRetention != null) payload.zeroDataRetention = zeroDataRetention;
  if (integration != null && integration.trim()) payload.integration = integration.trim();
  try {
    const headers = http.prepareHeaders(idempotencyKey);
    const res = await http.post("/v2/batch/scrape", payload, headers);
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "start batch scrape");
    return { id: res.data.id, url: res.data.url, invalidURLs: res.data.invalidURLs || void 0 };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "start batch scrape");
    throw err;
  }
}
async function getBatchScrapeStatus(http, jobId, pagination) {
  try {
    const res = await http.get(`/v2/batch/scrape/${jobId}`);
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get batch scrape status");
    const body = res.data;
    const initialDocs = body.data || [];
    const auto = pagination?.autoPaginate ?? true;
    if (!auto || !body.next) {
      return {
        id: jobId,
        status: body.status,
        completed: body.completed ?? 0,
        total: body.total ?? 0,
        creditsUsed: body.creditsUsed,
        expiresAt: body.expiresAt,
        next: body.next ?? null,
        data: initialDocs
      };
    }
    const aggregated = await fetchAllPages(http, body.next, initialDocs, pagination);
    return {
      id: jobId,
      status: body.status,
      completed: body.completed ?? 0,
      total: body.total ?? 0,
      creditsUsed: body.creditsUsed,
      expiresAt: body.expiresAt,
      next: null,
      data: aggregated
    };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get batch scrape status");
    throw err;
  }
}
async function cancelBatchScrape(http, jobId) {
  try {
    const res = await http.delete(`/v2/batch/scrape/${jobId}`);
    if (res.status !== 200) throwForBadResponse(res, "cancel batch scrape");
    return res.data?.status === "cancelled";
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "cancel batch scrape");
    throw err;
  }
}
async function getBatchScrapeErrors(http, jobId) {
  try {
    const res = await http.get(`/v2/batch/scrape/${jobId}/errors`);
    if (res.status !== 200) throwForBadResponse(res, "get batch scrape errors");
    const payload = res.data?.data ?? res.data;
    return { errors: payload.errors || [], robotsBlocked: payload.robotsBlocked || [] };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get batch scrape errors");
    throw err;
  }
}
async function waitForBatchCompletion(http, jobId, pollInterval = 2, timeout) {
  const start = Date.now();
  while (true) {
    try {
      const status = await getBatchScrapeStatus(http, jobId);
      if (["completed", "failed", "cancelled"].includes(status.status)) {
        return status;
      }
    } catch (err) {
      if (!isRetryableError(err)) {
        if (err instanceof SdkError) {
          const errorWithJobId = new SdkError(
            err.message,
            err.status,
            err.code,
            err.details,
            jobId
          );
          throw errorWithJobId;
        }
        throw err;
      }
    }
    if (timeout != null && Date.now() - start > timeout * 1e3) {
      throw new JobTimeoutError(jobId, timeout, "batch");
    }
    await new Promise((r) => setTimeout(r, Math.max(1e3, pollInterval * 1e3)));
  }
}
async function batchScrape(http, urls, opts = {}) {
  const start = await startBatchScrape(http, urls, opts);
  return waitForBatchCompletion(http, start.id, opts.pollInterval ?? 2, opts.timeout);
}
function prepareExtractPayload(args) {
  const body = {};
  if (args.urls) body.urls = args.urls;
  if (args.prompt != null) body.prompt = args.prompt;
  if (args.schema != null) {
    const s = args.schema;
    const isZod = s && (typeof s.safeParse === "function" || typeof s.parse === "function") && s._def;
    body.schema = isZod ? zodToJsonSchema(s) : args.schema;
  }
  if (args.systemPrompt != null) body.systemPrompt = args.systemPrompt;
  if (args.allowExternalLinks != null) body.allowExternalLinks = args.allowExternalLinks;
  if (args.enableWebSearch != null) body.enableWebSearch = args.enableWebSearch;
  if (args.showSources != null) body.showSources = args.showSources;
  if (args.ignoreInvalidURLs != null) body.ignoreInvalidURLs = args.ignoreInvalidURLs;
  if (args.integration && args.integration.trim()) body.integration = args.integration.trim();
  if (args.agent) body.agent = args.agent;
  if (args.scrapeOptions) {
    ensureValidScrapeOptions(args.scrapeOptions);
    body.scrapeOptions = args.scrapeOptions;
  }
  return body;
}
async function startExtract(http, args) {
  const payload = prepareExtractPayload(args);
  try {
    const res = await http.post("/v2/extract", payload);
    if (res.status !== 200) throwForBadResponse(res, "extract");
    return res.data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "extract");
    throw err;
  }
}
async function getExtractStatus(http, jobId) {
  try {
    const res = await http.get(`/v2/extract/${jobId}`);
    if (res.status !== 200) throwForBadResponse(res, "extract status");
    return res.data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "extract status");
    throw err;
  }
}
async function waitExtract(http, jobId, pollInterval = 2, timeout) {
  const start = Date.now();
  while (true) {
    const status = await getExtractStatus(http, jobId);
    if (["completed", "failed", "cancelled"].includes(status.status || "")) return status;
    if (timeout != null && Date.now() - start > timeout * 1e3) return status;
    await new Promise((r) => setTimeout(r, Math.max(1e3, pollInterval * 1e3)));
  }
}
async function extract(http, args) {
  const started = await startExtract(http, args);
  const jobId = started.id;
  if (!jobId) return started;
  return waitExtract(http, jobId, args.pollInterval ?? 2, args.timeout);
}
function prepareAgentPayload(args) {
  const body = {};
  if (args.urls) body.urls = args.urls;
  body.prompt = args.prompt;
  if (args.schema != null) {
    const s = args.schema;
    const isZod = s && (typeof s.safeParse === "function" || typeof s.parse === "function") && s._def;
    body.schema = isZod ? zodToJsonSchema(s) : args.schema;
  }
  if (args.integration && args.integration.trim()) body.integration = args.integration.trim();
  if (args.maxCredits !== null && args.maxCredits !== void 0) body.maxCredits = args.maxCredits;
  if (args.strictConstrainToURLs !== null && args.strictConstrainToURLs !== void 0) body.strictConstrainToURLs = args.strictConstrainToURLs;
  return body;
}
async function startAgent(http, args) {
  const payload = prepareAgentPayload(args);
  try {
    const res = await http.post("/v2/agent", payload);
    if (res.status !== 200) throwForBadResponse(res, "agent");
    return res.data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "agent");
    throw err;
  }
}
async function getAgentStatus(http, jobId) {
  try {
    const res = await http.get(`/v2/agent/${jobId}`);
    if (res.status !== 200) throwForBadResponse(res, "agent status");
    return res.data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "agent status");
    throw err;
  }
}
async function waitAgent(http, jobId, pollInterval = 2, timeout) {
  const start = Date.now();
  while (true) {
    const status = await getAgentStatus(http, jobId);
    if (["completed", "failed", "cancelled"].includes(status.status || "")) return status;
    if (timeout != null && Date.now() - start > timeout * 1e3) return status;
    await new Promise((r) => setTimeout(r, Math.max(1e3, pollInterval * 1e3)));
  }
}
async function agent(http, args) {
  const started = await startAgent(http, args);
  const jobId = started.id;
  if (!jobId) return started;
  return waitAgent(http, jobId, args.pollInterval ?? 2, args.timeout);
}
async function cancelAgent(http, jobId) {
  try {
    const res = await http.delete(`/v2/agent/${jobId}`);
    if (res.status !== 200) throwForBadResponse(res, "cancel agent");
    return res.data?.success === true;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "cancel agent");
    throw err;
  }
}
async function getConcurrency(http) {
  try {
    const res = await http.get("/v2/concurrency-check");
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get concurrency");
    const d = res.data.data || res.data;
    return { concurrency: d.concurrency, maxConcurrency: d.maxConcurrency ?? d.max_concurrency };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get concurrency");
    throw err;
  }
}
async function getCreditUsage(http) {
  try {
    const res = await http.get("/v2/team/credit-usage");
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get credit usage");
    const d = res.data.data || res.data;
    return {
      remainingCredits: d.remainingCredits ?? d.remaining_credits ?? 0,
      planCredits: d.planCredits ?? d.plan_credits,
      billingPeriodStart: d.billingPeriodStart ?? d.billing_period_start ?? null,
      billingPeriodEnd: d.billingPeriodEnd ?? d.billing_period_end ?? null
    };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get credit usage");
    throw err;
  }
}
async function getTokenUsage(http) {
  try {
    const res = await http.get("/v2/team/token-usage");
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get token usage");
    const d = res.data.data || res.data;
    return {
      remainingTokens: d.remainingTokens ?? d.remaining_tokens ?? 0,
      planTokens: d.planTokens ?? d.plan_tokens,
      billingPeriodStart: d.billingPeriodStart ?? d.billing_period_start ?? null,
      billingPeriodEnd: d.billingPeriodEnd ?? d.billing_period_end ?? null
    };
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get token usage");
    throw err;
  }
}
async function getQueueStatus(http) {
  try {
    const res = await http.get("/v2/team/queue-status");
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get queue status");
    return res.data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get queue status");
    throw err;
  }
}
async function getCreditUsageHistorical(http, byApiKey) {
  try {
    const query = byApiKey ? "?byApiKey=true" : "";
    const res = await http.get(`/v2/team/credit-usage/historical${query}`);
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get credit usage historical");
    return res.data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get credit usage historical");
    throw err;
  }
}
async function getTokenUsageHistorical(http, byApiKey) {
  try {
    const query = byApiKey ? "?byApiKey=true" : "";
    const res = await http.get(`/v2/team/token-usage/historical${query}`);
    if (res.status !== 200 || !res.data?.success) throwForBadResponse(res, "get token usage historical");
    return res.data;
  } catch (err) {
    if (err?.isAxiosError) return normalizeAxiosError(err, "get token usage historical");
    throw err;
  }
}
var hasGlobalWebSocket = () => {
  if (typeof globalThis === "undefined") return void 0;
  const candidate = globalThis.WebSocket;
  return typeof candidate === "function" ? candidate : void 0;
};
var isNodeRuntime = () => typeof process !== "undefined" && !!process.versions?.node;
var cachedWebSocket;
var loadPromise;
var loadNodeWebSocket = async () => {
  if (!isNodeRuntime()) return void 0;
  try {
    const undici = await import("../undici.mjs").then(function(n) {
      return n.i;
    });
    const ctor = undici.WebSocket ?? undici.default?.WebSocket;
    return typeof ctor === "function" ? ctor : void 0;
  } catch {
    return void 0;
  }
};
var getWebSocketCtor = async () => {
  if (cachedWebSocket) return cachedWebSocket;
  const globalWs = hasGlobalWebSocket();
  if (globalWs) {
    cachedWebSocket = globalWs;
    return cachedWebSocket;
  }
  if (!loadPromise) {
    loadPromise = loadNodeWebSocket();
  }
  cachedWebSocket = await loadPromise;
  return cachedWebSocket;
};
var decoder = typeof TextDecoder !== "undefined" ? new TextDecoder() : void 0;
var ensureUtf8String = (data) => {
  if (typeof data === "string") return data;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }
  const convertView = (view) => {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString("utf8");
    }
    return decoder?.decode(view);
  };
  if (ArrayBuffer.isView(data)) {
    return convertView(data);
  }
  if (data instanceof ArrayBuffer) {
    return convertView(new Uint8Array(data));
  }
  return void 0;
};
var Watcher = class extends EventEmitter {
  http;
  jobId;
  kind;
  pollInterval;
  timeout;
  ws;
  closed = false;
  emittedDocumentKeys = /* @__PURE__ */ new Set();
  constructor(http, jobId, opts = {}) {
    super();
    this.http = http;
    this.jobId = jobId;
    this.kind = opts.kind ?? "crawl";
    this.pollInterval = opts.pollInterval ?? 2;
    this.timeout = opts.timeout;
  }
  buildWsUrl() {
    const apiUrl = this.http.getApiUrl();
    const wsBase = apiUrl.replace(/^http/, "ws");
    const path = this.kind === "crawl" ? `/v2/crawl/${this.jobId}` : `/v2/batch/scrape/${this.jobId}`;
    return `${wsBase}${path}`;
  }
  async start() {
    try {
      const url = this.buildWsUrl();
      const wsCtor = await getWebSocketCtor();
      if (!wsCtor) {
        this.pollLoop();
        return;
      }
      this.ws = new wsCtor(url, this.http.getApiKey());
      if (this.ws && "binaryType" in this.ws) {
        this.ws.binaryType = "arraybuffer";
      }
      if (this.ws) {
        this.attachWsHandlers(this.ws);
      }
    } catch (err) {
      this.pollLoop();
    }
  }
  attachWsHandlers(ws) {
    let startTs = Date.now();
    const timeoutMs = this.timeout ? this.timeout * 1e3 : void 0;
    ws.onmessage = (ev) => {
      try {
        const raw = ensureUtf8String(ev.data);
        if (!raw) return;
        const body = JSON.parse(raw);
        const type = body.type;
        if (type === "error") {
          this.emit("error", { status: "failed", data: [], error: body.error, id: this.jobId });
          return;
        }
        if (type === "catchup") {
          const payload2 = body.data || {};
          this.emitDocuments(payload2.data || []);
          this.emitSnapshot(payload2);
          return;
        }
        if (type === "document") {
          const doc = body.data;
          if (doc) this.emit("document", doc);
          return;
        }
        if (type === "done") {
          const payload2 = body.data || body;
          const data = payload2.data || [];
          if (data.length) this.emitDocuments(data);
          this.emit("done", { status: "completed", data, id: this.jobId });
          this.close();
          return;
        }
        const payload = body.data || body;
        if (payload && payload.status) this.emitSnapshot(payload);
      } catch {
      }
      if (timeoutMs && Date.now() - startTs > timeoutMs) this.close();
    };
    ws.onerror = () => {
      this.emit("error", { status: "failed", data: [], error: "WebSocket error", id: this.jobId });
      this.close();
    };
    ws.onclose = () => {
      if (!this.closed) this.pollLoop();
    };
  }
  documentKey(doc) {
    if (doc && typeof doc === "object") {
      const explicitId = doc.id ?? doc.docId ?? doc.url;
      if (typeof explicitId === "string" && explicitId.length) {
        return explicitId;
      }
    }
    try {
      return JSON.stringify(doc);
    } catch {
      return `${Date.now()}-${Math.random()}`;
    }
  }
  emitDocuments(docs) {
    for (const doc of docs) {
      if (!doc) continue;
      const key = this.documentKey(doc);
      if (this.emittedDocumentKeys.has(key)) continue;
      this.emittedDocumentKeys.add(key);
      this.emit("document", { ...doc, id: this.jobId });
    }
  }
  emitSnapshot(payload) {
    const status = payload.status;
    const data = payload.data || [];
    const snap = this.kind === "crawl" ? {
      id: this.jobId,
      status,
      completed: payload.completed ?? 0,
      total: payload.total ?? 0,
      creditsUsed: payload.creditsUsed,
      expiresAt: payload.expiresAt,
      next: payload.next ?? null,
      data
    } : {
      id: this.jobId,
      status,
      completed: payload.completed ?? 0,
      total: payload.total ?? 0,
      creditsUsed: payload.creditsUsed,
      expiresAt: payload.expiresAt,
      next: payload.next ?? null,
      data
    };
    this.emit("snapshot", snap);
    if (["completed", "failed", "cancelled"].includes(status)) {
      this.emit("done", { status, data, id: this.jobId });
      this.close();
    }
  }
  async pollLoop() {
    const startTs = Date.now();
    const timeoutMs = this.timeout ? this.timeout * 1e3 : void 0;
    while (!this.closed) {
      try {
        const snap = this.kind === "crawl" ? await getCrawlStatus(this.http, this.jobId) : await getBatchScrapeStatus(this.http, this.jobId);
        this.emitDocuments(snap.data || []);
        this.emit("snapshot", snap);
        if (["completed", "failed", "cancelled"].includes(snap.status)) {
          this.emit("done", { status: snap.status, data: snap.data, id: this.jobId });
          this.close();
          break;
        }
      } catch {
      }
      if (timeoutMs && Date.now() - startTs > timeoutMs) break;
      await new Promise((r) => setTimeout(r, Math.max(1e3, this.pollInterval * 1e3)));
    }
  }
  close() {
    this.closed = true;
    if (this.ws && this.ws.close) this.ws.close();
  }
};
var FirecrawlClient = class {
  http;
  isCloudService(url) {
    return url.includes("api.firecrawl.dev");
  }
  /**
   * Create a v2 client.
   * @param options Transport configuration (API key, base URL, timeouts, retries).
   */
  constructor(options = {}) {
    const apiKey = options.apiKey ?? process.env.FIRECRAWL_API_KEY ?? "";
    const apiUrl = (options.apiUrl ?? process.env.FIRECRAWL_API_URL ?? "https://api.firecrawl.dev").replace(/\/$/, "");
    if (this.isCloudService(apiUrl) && !apiKey) {
      throw new Error("API key is required for the cloud API. Set FIRECRAWL_API_KEY env or pass apiKey.");
    }
    this.http = new HttpClient({
      apiKey,
      apiUrl,
      timeoutMs: options.timeoutMs,
      maxRetries: options.maxRetries,
      backoffFactor: options.backoffFactor
    });
  }
  async scrape(url, options) {
    return scrape(this.http, url, options);
  }
  // Search
  /**
   * Search the web and optionally scrape each result.
   * @param query Search query string.
   * @param req Additional search options (sources, limit, scrapeOptions, etc.).
   * @returns Structured search results.
   */
  async search(query, req = {}) {
    return search(this.http, { query, ...req });
  }
  // Map
  /**
   * Map a site to discover URLs (sitemap-aware).
   * @param url Root URL to map.
   * @param options Mapping options (sitemap mode, includeSubdomains, limit, timeout).
   * @returns Discovered links.
   */
  async map(url, options) {
    return map(this.http, url, options);
  }
  // Crawl
  /**
   * Start a crawl job (async).
   * @param url Root URL to crawl.
   * @param req Crawl configuration (paths, limits, scrapeOptions, webhook, etc.).
   * @returns Job id and url.
   */
  async startCrawl(url, req = {}) {
    return startCrawl(this.http, { url, ...req });
  }
  /**
   * Get the status and partial data of a crawl job.
   * @param jobId Crawl job id.
   */
  async getCrawlStatus(jobId, pagination) {
    return getCrawlStatus(this.http, jobId, pagination);
  }
  /**
   * Cancel a crawl job.
   * @param jobId Crawl job id.
   * @returns True if cancelled.
   */
  async cancelCrawl(jobId) {
    return cancelCrawl(this.http, jobId);
  }
  /**
   * Convenience waiter: start a crawl and poll until it finishes.
   * @param url Root URL to crawl.
   * @param req Crawl configuration plus waiter controls (pollInterval, timeout seconds).
   * @returns Final job snapshot.
   */
  async crawl(url, req = {}) {
    return crawl(this.http, { url, ...req }, req.pollInterval, req.timeout);
  }
  /**
   * Retrieve crawl errors and robots.txt blocks.
   * @param crawlId Crawl job id.
   */
  async getCrawlErrors(crawlId) {
    return getCrawlErrors(this.http, crawlId);
  }
  /**
   * List active crawls for the authenticated team.
   */
  async getActiveCrawls() {
    return getActiveCrawls(this.http);
  }
  /**
   * Preview normalized crawl parameters produced by a natural-language prompt.
   * @param url Root URL.
   * @param prompt Natural-language instruction.
   */
  async crawlParamsPreview(url, prompt) {
    return crawlParamsPreview(this.http, url, prompt);
  }
  // Batch
  /**
   * Start a batch scrape job for multiple URLs (async).
   * @param urls URLs to scrape.
   * @param opts Batch options (scrape options, webhook, concurrency, idempotency key, etc.).
   * @returns Job id and url.
   */
  async startBatchScrape(urls, opts) {
    return startBatchScrape(this.http, urls, opts);
  }
  /**
   * Get the status and partial data of a batch scrape job.
   * @param jobId Batch job id.
   */
  async getBatchScrapeStatus(jobId, pagination) {
    return getBatchScrapeStatus(this.http, jobId, pagination);
  }
  /**
   * Retrieve batch scrape errors and robots.txt blocks.
   * @param jobId Batch job id.
   */
  async getBatchScrapeErrors(jobId) {
    return getBatchScrapeErrors(this.http, jobId);
  }
  /**
   * Cancel a batch scrape job.
   * @param jobId Batch job id.
   * @returns True if cancelled.
   */
  async cancelBatchScrape(jobId) {
    return cancelBatchScrape(this.http, jobId);
  }
  /**
   * Convenience waiter: start a batch scrape and poll until it finishes.
   * @param urls URLs to scrape.
   * @param opts Batch options plus waiter controls (pollInterval, timeout seconds).
   * @returns Final job snapshot.
   */
  async batchScrape(urls, opts) {
    return batchScrape(this.http, urls, opts);
  }
  // Extract
  /**
   * Start an extract job (async).
   * @param args Extraction request (urls, schema or prompt, flags).
   * @returns Job id or processing state.
   */
  async startExtract(args) {
    return startExtract(this.http, args);
  }
  /**
   * Get extract job status/data.
   * @param jobId Extract job id.
   */
  async getExtractStatus(jobId) {
    return getExtractStatus(this.http, jobId);
  }
  /**
   * Convenience waiter: start an extract and poll until it finishes.
   * @param args Extraction request plus waiter controls (pollInterval, timeout seconds).
   * @returns Final extract response.
   */
  async extract(args) {
    return extract(this.http, args);
  }
  // Agent
  /**
   * Start an agent job (async).
   * @param args Agent request (urls, prompt, schema).
   * @returns Job id or processing state.
   */
  async startAgent(args) {
    return startAgent(this.http, args);
  }
  /**
   * Get agent job status/data.
   * @param jobId Agent job id.
   */
  async getAgentStatus(jobId) {
    return getAgentStatus(this.http, jobId);
  }
  /**
   * Convenience waiter: start an agent and poll until it finishes.
   * @param args Agent request plus waiter controls (pollInterval, timeout seconds).
   * @returns Final agent response.
   */
  async agent(args) {
    return agent(this.http, args);
  }
  /**
   * Cancel an agent job.
   * @param jobId Agent job id.
   * @returns True if cancelled.
   */
  async cancelAgent(jobId) {
    return cancelAgent(this.http, jobId);
  }
  // Usage
  /** Current concurrency usage. */
  async getConcurrency() {
    return getConcurrency(this.http);
  }
  /** Current credit usage. */
  async getCreditUsage() {
    return getCreditUsage(this.http);
  }
  /** Recent token usage. */
  async getTokenUsage() {
    return getTokenUsage(this.http);
  }
  /** Historical credit usage by month; set byApiKey to true to break down by API key. */
  async getCreditUsageHistorical(byApiKey) {
    return getCreditUsageHistorical(this.http, byApiKey);
  }
  /** Historical token usage by month; set byApiKey to true to break down by API key. */
  async getTokenUsageHistorical(byApiKey) {
    return getTokenUsageHistorical(this.http, byApiKey);
  }
  /** Metrics about the team's scrape queue. */
  async getQueueStatus() {
    return getQueueStatus(this.http);
  }
  // Watcher
  /**
   * Create a watcher for a crawl or batch job. Emits: `document`, `snapshot`, `done`, `error`.
   * @param jobId Job id.
   * @param opts Watcher options (kind, pollInterval, timeout seconds).
   */
  watcher(jobId, opts = {}) {
    return new Watcher(this.http, jobId, opts);
  }
};
var e = class extends EventTarget {
  dispatchTypedEvent(s, t) {
    return super.dispatchEvent(t);
  }
};
var FirecrawlError = class extends Error {
  statusCode;
  details;
  constructor(message, statusCode, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
};
var FirecrawlApp = class {
  apiKey;
  apiUrl;
  version = "1.25.1";
  isCloudService(url) {
    return url.includes("api.firecrawl.dev");
  }
  async getVersion() {
    try {
      if (typeof process !== "undefined" && process.env && process.env.npm_package_version) {
        return process.env.npm_package_version;
      }
      const packageJson = await Promise.resolve().then(function() {
        return packageTHA2MQX4$1;
      });
      return packageJson.default.version;
    } catch (error) {
      const isTest = typeof process !== "undefined" && (process.env.JEST_WORKER_ID != null || false);
      if (!isTest) {
        console.error("Error getting version:", error);
      }
      return "1.25.1";
    }
  }
  async init() {
    this.version = await this.getVersion();
  }
  /**
   * Initializes a new instance of the FirecrawlApp class.
   * @param config - Configuration options for the FirecrawlApp instance.
   */
  constructor({ apiKey = null, apiUrl = null }) {
    const baseUrl = apiUrl || "https://api.firecrawl.dev";
    if (this.isCloudService(baseUrl) && typeof apiKey !== "string") {
      throw new FirecrawlError("No API key provided", 401);
    }
    this.apiKey = apiKey || "";
    this.apiUrl = baseUrl;
    this.init();
  }
  /**
   * Scrapes a URL using the Firecrawl API.
   * @param url - The URL to scrape.
   * @param params - Additional parameters for the scrape request.
   * @returns The response from the scrape operation.
   */
  async scrapeUrl(url, params) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
    let jsonData = { url, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    if (jsonData?.extract?.schema) {
      let schema = jsonData.extract.schema;
      try {
        schema = zodToJsonSchema(schema);
      } catch (error) {
      }
      jsonData = {
        ...jsonData,
        extract: {
          ...jsonData.extract,
          schema
        }
      };
    }
    if (jsonData?.jsonOptions?.schema) {
      let schema = jsonData.jsonOptions.schema;
      try {
        schema = zodToJsonSchema(schema);
      } catch (error) {
      }
      jsonData = {
        ...jsonData,
        jsonOptions: {
          ...jsonData.jsonOptions,
          schema
        }
      };
    }
    try {
      const response = await axios.post(
        this.apiUrl + `/v1/scrape`,
        jsonData,
        { headers, timeout: params?.timeout !== void 0 ? params.timeout + 5e3 : void 0 }
      );
      if (response.status === 200) {
        const responseData = response.data;
        if (responseData.success) {
          return {
            success: true,
            warning: responseData.warning,
            error: responseData.error,
            ...responseData.data
          };
        } else {
          throw new FirecrawlError(`Failed to scrape URL. Error: ${responseData.error}`, response.status);
        }
      } else {
        this.handleError(response, "scrape URL");
      }
    } catch (error) {
      this.handleError(error.response, "scrape URL");
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Searches using the Firecrawl API and optionally scrapes the results.
   * @param query - The search query string.
   * @param params - Optional parameters for the search request.
   * @returns The response from the search operation.
   */
  async search(query, params) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
    let jsonData = {
      query,
      limit: params?.limit ?? 5,
      tbs: params?.tbs,
      filter: params?.filter,
      lang: params?.lang ?? "en",
      country: params?.country ?? "us",
      location: params?.location,
      origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}`,
      timeout: params?.timeout ?? 6e4,
      scrapeOptions: params?.scrapeOptions ?? { formats: [] }
    };
    if (jsonData?.scrapeOptions?.extract?.schema) {
      let schema = jsonData.scrapeOptions.extract.schema;
      try {
        schema = zodToJsonSchema(schema);
      } catch (error) {
      }
      jsonData = {
        ...jsonData,
        scrapeOptions: {
          ...jsonData.scrapeOptions,
          extract: {
            ...jsonData.scrapeOptions.extract,
            schema
          }
        }
      };
    }
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/search`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        const responseData = response.data;
        if (responseData.success) {
          return {
            success: true,
            data: responseData.data,
            warning: responseData.warning
          };
        } else {
          throw new FirecrawlError(`Failed to search. Error: ${responseData.error}`, response.status);
        }
      } else {
        this.handleError(response, "search");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error.", data: [] };
  }
  /**
   * Initiates a crawl job for a URL using the Firecrawl API.
   * @param url - The URL to crawl.
   * @param params - Additional parameters for the crawl request.
   * @param pollInterval - Time in seconds for job status checks.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @returns The response from the crawl operation.
   */
  async crawlUrl(url, params, pollInterval = 2, idempotencyKey) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { url, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/crawl`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        const id = response.data.id;
        return this.monitorJobStatus(id, headers, pollInterval);
      } else {
        this.handleError(response, "start crawl job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  async asyncCrawlUrl(url, params, idempotencyKey) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { url, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/crawl`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start crawl job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Checks the status of a crawl job using the Firecrawl API.
   * @param id - The ID of the crawl operation.
   * @param getAllData - Paginate through all the pages of documents, returning the full list of all documents. (default: `false`)
   * @param nextURL - The `next` URL from the previous crawl status. Only required if you're not manually increasing `skip`. Only used when `getAllData = false`.
   * @param skip - How many entries to skip to paginate. Only required if you're not providing `nextURL`. Only used when `getAllData = false`.
   * @param limit - How many entries to return. Only used when `getAllData = false`.
   * @returns The response containing the job status.
   */
  async checkCrawlStatus(id, getAllData = false, nextURL, skip, limit) {
    if (!id) {
      throw new FirecrawlError("No crawl ID provided", 400);
    }
    const headers = this.prepareHeaders();
    const targetURL = new URL(nextURL ?? `${this.apiUrl}/v1/crawl/${id}`);
    if (skip !== void 0) {
      targetURL.searchParams.set("skip", skip.toString());
    }
    if (limit !== void 0) {
      targetURL.searchParams.set("limit", limit.toString());
    }
    try {
      const response = await this.getRequest(
        targetURL.href,
        headers
      );
      if (response.status === 200) {
        let allData = response.data.data;
        if (getAllData && response.data.status === "completed") {
          let statusData = response.data;
          if ("data" in statusData) {
            let data = statusData.data;
            while (typeof statusData === "object" && "next" in statusData) {
              if (data.length === 0) {
                break;
              }
              statusData = (await this.getRequest(statusData.next, headers)).data;
              data = data.concat(statusData.data);
            }
            allData = data;
          }
        }
        let resp = {
          success: response.data.success,
          status: response.data.status,
          total: response.data.total,
          completed: response.data.completed,
          creditsUsed: response.data.creditsUsed,
          next: getAllData ? void 0 : response.data.next,
          expiresAt: new Date(response.data.expiresAt),
          data: allData
        };
        if (!response.data.success && response.data.error) {
          resp = {
            ...resp,
            success: false,
            error: response.data.error
          };
        }
        if (response.data.next) {
          resp.next = response.data.next;
        }
        return resp;
      } else {
        this.handleError(response, "check crawl status");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Returns information about crawl errors.
   * @param id - The ID of the crawl operation.
   * @returns Information about crawl errors.
   */
  async checkCrawlErrors(id) {
    const headers = this.prepareHeaders();
    try {
      const response = await this.deleteRequest(
        `${this.apiUrl}/v1/crawl/${id}/errors`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "check crawl errors");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Cancels a crawl job using the Firecrawl API.
   * @param id - The ID of the crawl operation.
   * @returns The response from the cancel crawl operation.
   */
  async cancelCrawl(id) {
    const headers = this.prepareHeaders();
    try {
      const response = await this.deleteRequest(
        `${this.apiUrl}/v1/crawl/${id}`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "cancel crawl job");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Initiates a crawl job and returns a CrawlWatcher to monitor the job via WebSocket.
   * @param url - The URL to crawl.
   * @param params - Additional parameters for the crawl request.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @returns A CrawlWatcher instance to monitor the crawl job.
   */
  async crawlUrlAndWatch(url, params, idempotencyKey) {
    const crawl2 = await this.asyncCrawlUrl(url, params, idempotencyKey);
    if (crawl2.success && crawl2.id) {
      const id = crawl2.id;
      return new CrawlWatcher(id, this);
    }
    throw new FirecrawlError("Crawl job failed to start", 400);
  }
  /**
   * Maps a URL using the Firecrawl API.
   * @param url - The URL to map.
   * @param params - Additional parameters for the map request.
   * @returns The response from the map operation.
   */
  async mapUrl(url, params) {
    const headers = this.prepareHeaders();
    let jsonData = { url, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/map`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "map");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Initiates a batch scrape job for multiple URLs using the Firecrawl API.
   * @param url - The URLs to scrape.
   * @param params - Additional parameters for the scrape request.
   * @param pollInterval - Time in seconds for job status checks.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @param webhook - Optional webhook for the batch scrape.
   * @param ignoreInvalidURLs - Optional flag to ignore invalid URLs.
   * @returns The response from the crawl operation.
   */
  async batchScrapeUrls(urls, params, pollInterval = 2, idempotencyKey, webhook, ignoreInvalidURLs, maxConcurrency) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { urls, webhook, ignoreInvalidURLs, maxConcurrency, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    if (jsonData?.extract?.schema) {
      let schema = jsonData.extract.schema;
      try {
        schema = zodToJsonSchema(schema);
      } catch (error) {
      }
      jsonData = {
        ...jsonData,
        extract: {
          ...jsonData.extract,
          schema
        }
      };
    }
    if (jsonData?.jsonOptions?.schema) {
      let schema = jsonData.jsonOptions.schema;
      try {
        schema = zodToJsonSchema(schema);
      } catch (error) {
      }
      jsonData = {
        ...jsonData,
        jsonOptions: {
          ...jsonData.jsonOptions,
          schema
        }
      };
    }
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/batch/scrape`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        const id = response.data.id;
        return this.monitorJobStatus(id, headers, pollInterval);
      } else {
        this.handleError(response, "start batch scrape job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  async asyncBatchScrapeUrls(urls, params, idempotencyKey, webhook, ignoreInvalidURLs) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { urls, webhook, ignoreInvalidURLs, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/batch/scrape`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start batch scrape job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Initiates a batch scrape job and returns a CrawlWatcher to monitor the job via WebSocket.
   * @param urls - The URL to scrape.
   * @param params - Additional parameters for the scrape request.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @returns A CrawlWatcher instance to monitor the crawl job.
   */
  async batchScrapeUrlsAndWatch(urls, params, idempotencyKey, webhook, ignoreInvalidURLs) {
    const crawl2 = await this.asyncBatchScrapeUrls(urls, params, idempotencyKey, webhook, ignoreInvalidURLs);
    if (crawl2.success && crawl2.id) {
      const id = crawl2.id;
      return new CrawlWatcher(id, this);
    }
    throw new FirecrawlError("Batch scrape job failed to start", 400);
  }
  /**
   * Checks the status of a batch scrape job using the Firecrawl API.
   * @param id - The ID of the batch scrape operation.
   * @param getAllData - Paginate through all the pages of documents, returning the full list of all documents. (default: `false`)
   * @param nextURL - The `next` URL from the previous batch scrape status. Only required if you're not manually increasing `skip`. Only used when `getAllData = false`.
   * @param skip - How many entries to skip to paginate. Only used when `getAllData = false`.
   * @param limit - How many entries to return. Only used when `getAllData = false`.
   * @returns The response containing the job status.
   */
  async checkBatchScrapeStatus(id, getAllData = false, nextURL, skip, limit) {
    if (!id) {
      throw new FirecrawlError("No batch scrape ID provided", 400);
    }
    const headers = this.prepareHeaders();
    const targetURL = new URL(nextURL ?? `${this.apiUrl}/v1/batch/scrape/${id}`);
    if (skip !== void 0) {
      targetURL.searchParams.set("skip", skip.toString());
    }
    if (limit !== void 0) {
      targetURL.searchParams.set("limit", limit.toString());
    }
    try {
      const response = await this.getRequest(
        targetURL.href,
        headers
      );
      if (response.status === 200) {
        let allData = response.data.data;
        if (getAllData && response.data.status === "completed") {
          let statusData = response.data;
          if ("data" in statusData) {
            let data = statusData.data;
            while (typeof statusData === "object" && "next" in statusData) {
              if (data.length === 0) {
                break;
              }
              statusData = (await this.getRequest(statusData.next, headers)).data;
              data = data.concat(statusData.data);
            }
            allData = data;
          }
        }
        let resp = {
          success: response.data.success,
          status: response.data.status,
          total: response.data.total,
          completed: response.data.completed,
          creditsUsed: response.data.creditsUsed,
          next: getAllData ? void 0 : response.data.next,
          expiresAt: new Date(response.data.expiresAt),
          data: allData
        };
        if (!response.data.success && response.data.error) {
          resp = {
            ...resp,
            success: false,
            error: response.data.error
          };
        }
        if (response.data.next) {
          resp.next = response.data.next;
        }
        return resp;
      } else {
        this.handleError(response, "check batch scrape status");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Returns information about batch scrape errors.
   * @param id - The ID of the batch scrape operation.
   * @returns Information about batch scrape errors.
   */
  async checkBatchScrapeErrors(id) {
    const headers = this.prepareHeaders();
    try {
      const response = await this.deleteRequest(
        `${this.apiUrl}/v1/batch/scrape/${id}/errors`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "check batch scrape errors");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Extracts information from URLs using the Firecrawl API.
   * Currently in Beta. Expect breaking changes on future minor versions.
   * @param urls - The URLs to extract information from. Optional if using other methods for data extraction.
   * @param params - Additional parameters for the extract request.
   * @returns The response from the extract operation.
   */
  async extract(urls, params) {
    const headers = this.prepareHeaders();
    let jsonData = { urls, ...params };
    let jsonSchema;
    try {
      if (!params?.schema) {
        jsonSchema = void 0;
      } else {
        try {
          jsonSchema = zodToJsonSchema(params.schema);
        } catch (_) {
          jsonSchema = params.schema;
        }
      }
    } catch (error) {
      throw new FirecrawlError("Invalid schema. Schema must be either a valid Zod schema or JSON schema object.", 400);
    }
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/extract`,
        { ...jsonData, schema: jsonSchema, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` },
        headers
      );
      if (response.status === 200) {
        const jobId = response.data.id;
        let extractStatus;
        do {
          const statusResponse = await this.getRequest(
            `${this.apiUrl}/v1/extract/${jobId}`,
            headers
          );
          extractStatus = statusResponse.data;
          if (extractStatus.status === "completed") {
            if (extractStatus.success) {
              return {
                success: true,
                data: extractStatus.data,
                warning: extractStatus.warning,
                error: extractStatus.error,
                sources: extractStatus?.sources || void 0
              };
            } else {
              throw new FirecrawlError(`Failed to extract data. Error: ${extractStatus.error}`, statusResponse.status);
            }
          } else if (extractStatus.status === "failed" || extractStatus.status === "cancelled") {
            throw new FirecrawlError(`Extract job ${extractStatus.status}. Error: ${extractStatus.error}`, statusResponse.status);
          }
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        } while (extractStatus.status !== "completed");
      } else {
        this.handleError(response, "extract");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500, error.response?.data?.details);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Initiates an asynchronous extract job for a URL using the Firecrawl API.
   * @param url - The URL to extract data from.
   * @param params - Additional parameters for the extract request.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @returns The response from the extract operation.
   */
  async asyncExtract(urls, params, idempotencyKey) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { urls, ...params };
    let jsonSchema;
    try {
      if (!params?.schema) {
        jsonSchema = void 0;
      } else {
        try {
          jsonSchema = zodToJsonSchema(params.schema);
        } catch (_) {
          jsonSchema = params.schema;
        }
      }
    } catch (error) {
      throw new FirecrawlError("Invalid schema. Schema must be either a valid Zod schema or JSON schema object.", 400);
    }
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/extract`,
        { ...jsonData, schema: jsonSchema, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` },
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start extract job");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500, error.response?.data?.details);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Retrieves the status of an extract job.
   * @param jobId - The ID of the extract job.
   * @returns The status of the extract job.
   */
  async getExtractStatus(jobId) {
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/extract/${jobId}`,
        this.prepareHeaders()
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "get extract status");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
  }
  /**
   * Prepares the headers for an API request.
   * @param idempotencyKey - Optional key to ensure idempotency.
   * @returns The prepared headers.
   */
  prepareHeaders(idempotencyKey) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}
    };
  }
  /**
   * Sends a POST request to the specified URL.
   * @param url - The URL to send the request to.
   * @param data - The data to send in the request.
   * @param headers - The headers for the request.
   * @returns The response from the POST request.
   */
  postRequest(url, data, headers) {
    return axios.post(url, data, { headers, timeout: data?.timeout ? data.timeout + 5e3 : void 0 });
  }
  /**
   * Sends a GET request to the specified URL.
   * @param url - The URL to send the request to.
   * @param headers - The headers for the request.
   * @returns The response from the GET request.
   */
  async getRequest(url, headers) {
    try {
      return await axios.get(url, { headers });
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response;
      } else {
        throw error;
      }
    }
  }
  /**
   * Sends a DELETE request to the specified URL.
   * @param url - The URL to send the request to.
   * @param headers - The headers for the request.
   * @returns The response from the DELETE request.
   */
  async deleteRequest(url, headers) {
    try {
      return await axios.delete(url, { headers });
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response;
      } else {
        throw error;
      }
    }
  }
  /**
   * Monitors the status of a crawl job until completion or failure.
   * @param id - The ID of the crawl operation.
   * @param headers - The headers for the request.
   * @param checkInterval - Interval in seconds for job status checks.
   * @param checkUrl - Optional URL to check the status (used for v1 API)
   * @returns The final job status or data.
   */
  async monitorJobStatus(id, headers, checkInterval) {
    let failedTries = 0;
    let networkRetries = 0;
    const maxNetworkRetries = 3;
    while (true) {
      try {
        let statusResponse = await this.getRequest(
          `${this.apiUrl}/v1/crawl/${id}`,
          headers
        );
        if (statusResponse.status === 200) {
          failedTries = 0;
          networkRetries = 0;
          let statusData = statusResponse.data;
          if (statusData.status === "completed") {
            if ("data" in statusData) {
              let data = statusData.data;
              while (typeof statusData === "object" && "next" in statusData) {
                if (data.length === 0) {
                  break;
                }
                statusResponse = await this.getRequest(statusData.next, headers);
                statusData = statusResponse.data;
                data = data.concat(statusData.data);
              }
              statusData.data = data;
              return statusData;
            } else {
              throw new FirecrawlError("Crawl job completed but no data was returned", 500);
            }
          } else if (["active", "paused", "pending", "queued", "waiting", "scraping"].includes(statusData.status)) {
            checkInterval = Math.max(checkInterval, 2);
            await new Promise(
              (resolve) => setTimeout(resolve, checkInterval * 1e3)
            );
          } else {
            throw new FirecrawlError(
              `Crawl job failed or was stopped. Status: ${statusData.status}`,
              500
            );
          }
        } else {
          failedTries++;
          if (failedTries >= 3) {
            this.handleError(statusResponse, "check crawl status");
          }
        }
      } catch (error) {
        if (this.isRetryableError(error) && networkRetries < maxNetworkRetries) {
          networkRetries++;
          const backoffDelay = Math.min(1e3 * Math.pow(2, networkRetries - 1), 1e4);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          continue;
        }
        throw new FirecrawlError(error, 500);
      }
    }
  }
  /**
   * Determines if an error is retryable (transient network error)
   * @param error - The error to check
   * @returns True if the error should be retried
   */
  isRetryableError(error) {
    if (error instanceof AxiosError) {
      if (!error.response) {
        const code = error.code;
        const message = error.message?.toLowerCase() || "";
        return code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "ECONNREFUSED" || message.includes("socket hang up") || message.includes("network error") || message.includes("timeout");
      }
      if (error.response?.status === 408 || error.response?.status === 504) {
        return true;
      }
    }
    if (error && typeof error === "object") {
      const code = error.code;
      const message = error.message?.toLowerCase() || "";
      if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "ECONNREFUSED" || message.includes("socket hang up") || message.includes("network error") || message.includes("timeout")) {
        return true;
      }
      if (error.response?.status === 408 || error.response?.status === 504) {
        return true;
      }
    }
    return false;
  }
  /**
   * Handles errors from API responses.
   * @param {AxiosResponse} response - The response from the API.
   * @param {string} action - The action being performed when the error occurred.
   */
  handleError(response, action) {
    if (!response) {
      throw new FirecrawlError(
        `No response received while trying to ${action}. This may be a network error or the server is unreachable.`,
        0
      );
    }
    if ([400, 402, 403, 408, 409, 500].includes(response.status)) {
      const errorMessage = response.data.error || "Unknown error occurred";
      const details = response.data.details ? ` - ${JSON.stringify(response.data.details)}` : "";
      throw new FirecrawlError(
        `Failed to ${action}. Status code: ${response.status}. Error: ${errorMessage}${details}`,
        response.status,
        response?.data?.details
      );
    } else {
      throw new FirecrawlError(
        `Unexpected error occurred while trying to ${action}. Status code: ${response.status}`,
        response.status
      );
    }
  }
  /**
   * Initiates a deep research operation on a given query and polls until completion.
   * @param query - The query to research.
   * @param params - Parameters for the deep research operation.
   * @param onActivity - Optional callback to receive activity updates in real-time.
   * @param onSource - Optional callback to receive source updates in real-time.
   * @returns The final research results.
   */
  async deepResearch(query, params, onActivity, onSource) {
    try {
      const response = await this.asyncDeepResearch(query, params);
      if (!response.success || "error" in response) {
        return { success: false, error: "error" in response ? response.error : "Unknown error" };
      }
      if (!response.id) {
        throw new FirecrawlError(`Failed to start research. No job ID returned.`, 500);
      }
      const jobId = response.id;
      let researchStatus;
      let lastActivityCount = 0;
      let lastSourceCount = 0;
      while (true) {
        researchStatus = await this.checkDeepResearchStatus(jobId);
        if ("error" in researchStatus && !researchStatus.success) {
          return researchStatus;
        }
        if (onActivity && researchStatus.activities) {
          const newActivities = researchStatus.activities.slice(lastActivityCount);
          for (const activity of newActivities) {
            onActivity(activity);
          }
          lastActivityCount = researchStatus.activities.length;
        }
        if (onSource && researchStatus.sources) {
          const newSources = researchStatus.sources.slice(lastSourceCount);
          for (const source of newSources) {
            onSource(source);
          }
          lastSourceCount = researchStatus.sources.length;
        }
        if (researchStatus.status === "completed") {
          return researchStatus;
        }
        if (researchStatus.status === "failed") {
          throw new FirecrawlError(
            `Research job ${researchStatus.status}. Error: ${researchStatus.error}`,
            500
          );
        }
        if (researchStatus.status !== "processing") {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
      return { success: false, error: "Research job terminated unexpectedly" };
    } catch (error) {
      throw new FirecrawlError(error.message, 500, error.response?.data?.details);
    }
  }
  /**
   * Initiates a deep research operation on a given query without polling.
   * @param params - Parameters for the deep research operation.
   * @returns The response containing the research job ID.
   */
  async asyncDeepResearch(query, params) {
    const headers = this.prepareHeaders();
    let jsonData = { query, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    if (jsonData?.jsonOptions?.schema) {
      let schema = jsonData.jsonOptions.schema;
      try {
        schema = zodToJsonSchema(schema);
      } catch (error) {
      }
      jsonData = {
        ...jsonData,
        jsonOptions: {
          ...jsonData.jsonOptions,
          schema
        }
      };
    }
    try {
      const response = await this.postRequest(
        `${this.apiUrl}/v1/deep-research`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start deep research");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Checks the status of a deep research operation.
   * @param id - The ID of the deep research operation.
   * @returns The current status and results of the research operation.
   */
  async checkDeepResearchStatus(id) {
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/deep-research/${id}`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else if (response.status === 404) {
        throw new FirecrawlError("Deep research job not found", 404);
      } else {
        this.handleError(response, "check deep research status");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * @deprecated Use deepResearch() instead
   * Initiates a deep research operation on a given topic and polls until completion.
   * @param topic - The topic to research.
   * @param params - Parameters for the deep research operation.
   * @param onActivity - Optional callback to receive activity updates in real-time.
   * @returns The final research results.
   */
  async __deepResearch(topic, params, onActivity) {
    try {
      const response = await this.__asyncDeepResearch(topic, params);
      if (!response.success || "error" in response) {
        return { success: false, error: "error" in response ? response.error : "Unknown error" };
      }
      if (!response.id) {
        throw new FirecrawlError(`Failed to start research. No job ID returned.`, 500);
      }
      const jobId = response.id;
      let researchStatus;
      let lastActivityCount = 0;
      while (true) {
        researchStatus = await this.__checkDeepResearchStatus(jobId);
        if ("error" in researchStatus && !researchStatus.success) {
          return researchStatus;
        }
        if (onActivity && researchStatus.activities) {
          const newActivities = researchStatus.activities.slice(lastActivityCount);
          for (const activity of newActivities) {
            onActivity(activity);
          }
          lastActivityCount = researchStatus.activities.length;
        }
        if (researchStatus.status === "completed") {
          return researchStatus;
        }
        if (researchStatus.status === "failed") {
          throw new FirecrawlError(
            `Research job ${researchStatus.status}. Error: ${researchStatus.error}`,
            500
          );
        }
        if (researchStatus.status !== "processing") {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
      return { success: false, error: "Research job terminated unexpectedly" };
    } catch (error) {
      throw new FirecrawlError(error.message, 500, error.response?.data?.details);
    }
  }
  /**
   * @deprecated Use asyncDeepResearch() instead
   * Initiates a deep research operation on a given topic without polling.
   * @param params - Parameters for the deep research operation.
   * @returns The response containing the research job ID.
   */
  async __asyncDeepResearch(topic, params) {
    const headers = this.prepareHeaders();
    try {
      let jsonData = { topic, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
      const response = await this.postRequest(
        `${this.apiUrl}/v1/deep-research`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start deep research");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * @deprecated Use checkDeepResearchStatus() instead
   * Checks the status of a deep research operation.
   * @param id - The ID of the deep research operation.
   * @returns The current status and results of the research operation.
   */
  async __checkDeepResearchStatus(id) {
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/deep-research/${id}`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else if (response.status === 404) {
        throw new FirecrawlError("Deep research job not found", 404);
      } else {
        this.handleError(response, "check deep research status");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Generates LLMs.txt for a given URL and polls until completion.
   * @param url - The URL to generate LLMs.txt from.
   * @param params - Parameters for the LLMs.txt generation operation.
   * @returns The final generation results.
   */
  async generateLLMsText(url, params) {
    try {
      const response = await this.asyncGenerateLLMsText(url, params);
      if (!response.success || "error" in response) {
        return { success: false, error: "error" in response ? response.error : "Unknown error" };
      }
      if (!response.id) {
        throw new FirecrawlError(`Failed to start LLMs.txt generation. No job ID returned.`, 500);
      }
      const jobId = response.id;
      let generationStatus;
      while (true) {
        generationStatus = await this.checkGenerateLLMsTextStatus(jobId);
        if ("error" in generationStatus && !generationStatus.success) {
          return generationStatus;
        }
        if (generationStatus.status === "completed") {
          return generationStatus;
        }
        if (generationStatus.status === "failed") {
          throw new FirecrawlError(
            `LLMs.txt generation job ${generationStatus.status}. Error: ${generationStatus.error}`,
            500
          );
        }
        if (generationStatus.status !== "processing") {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
      return { success: false, error: "LLMs.txt generation job terminated unexpectedly" };
    } catch (error) {
      throw new FirecrawlError(error.message, 500, error.response?.data?.details);
    }
  }
  /**
   * Initiates a LLMs.txt generation operation without polling.
   * @param url - The URL to generate LLMs.txt from.
   * @param params - Parameters for the LLMs.txt generation operation.
   * @returns The response containing the generation job ID.
   */
  async asyncGenerateLLMsText(url, params) {
    const headers = this.prepareHeaders();
    let jsonData = { url, ...params, origin: typeof params.origin === "string" && params.origin.includes("mcp") ? params.origin : `js-sdk@${this.version}` };
    try {
      const response = await this.postRequest(
        `${this.apiUrl}/v1/llmstxt`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start LLMs.txt generation");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Checks the status of a LLMs.txt generation operation.
   * @param id - The ID of the LLMs.txt generation operation.
   * @returns The current status and results of the generation operation.
   */
  async checkGenerateLLMsTextStatus(id) {
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/llmstxt/${id}`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else if (response.status === 404) {
        throw new FirecrawlError("LLMs.txt generation job not found", 404);
      } else {
        this.handleError(response, "check LLMs.txt generation status");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Gets metrics about the team's scrape queue.
   * @returns The current queue status.
   */
  async getQueueStatus() {
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/team/queue-status`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "get queue status");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Gets current credit usage and billing period for the team (v1).
   */
  async getCreditUsage() {
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/team/credit-usage`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "get credit usage");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Gets current token usage and billing period for the team (v1).
   */
  async getTokenUsage() {
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/team/token-usage`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "get token usage");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Gets historical credit usage. Pass byApiKey=true to break down by API key.
   */
  async getCreditUsageHistorical(byApiKey) {
    const headers = this.prepareHeaders();
    try {
      const url = `${this.apiUrl}/v1/team/credit-usage/historical${byApiKey ? "?byApiKey=true" : ""}`;
      const response = await this.getRequest(url, headers);
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "get credit usage historical");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Gets historical token usage. Pass byApiKey=true to break down by API key.
   */
  async getTokenUsageHistorical(byApiKey) {
    const headers = this.prepareHeaders();
    try {
      const url = `${this.apiUrl}/v1/team/token-usage/historical${byApiKey ? "?byApiKey=true" : ""}`;
      const response = await this.getRequest(url, headers);
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "get token usage historical");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
};
var CrawlWatcher = class extends e {
  ws;
  data;
  status;
  id;
  constructor(id, app) {
    super();
    this.id = id;
    const wsUrl = app.apiUrl.replace(/^http/, "ws");
    this.ws = new WebSocket(`${wsUrl}/v1/crawl/${id}`, app.apiKey);
    this.status = "scraping";
    this.data = [];
    const messageHandler = (msg) => {
      if (msg.type === "done") {
        this.status = "completed";
        this.dispatchTypedEvent("done", new CustomEvent("done", {
          detail: {
            status: this.status,
            data: this.data,
            id: this.id
          }
        }));
      } else if (msg.type === "error") {
        this.status = "failed";
        this.dispatchTypedEvent("error", new CustomEvent("error", {
          detail: {
            status: this.status,
            data: this.data,
            error: msg.error,
            id: this.id
          }
        }));
      } else if (msg.type === "catchup") {
        this.status = msg.data.status;
        this.data.push(...msg.data.data ?? []);
        for (const doc of this.data) {
          this.dispatchTypedEvent("document", new CustomEvent("document", {
            detail: {
              ...doc,
              id: this.id
            }
          }));
        }
      } else if (msg.type === "document") {
        this.dispatchTypedEvent("document", new CustomEvent("document", {
          detail: {
            ...msg.data,
            id: this.id
          }
        }));
      }
    };
    this.ws.onmessage = ((ev) => {
      if (typeof ev.data !== "string") {
        this.ws.close();
        return;
      }
      try {
        const msg = JSON.parse(ev.data);
        messageHandler(msg);
      } catch (error) {
        console.error("Error on message", error);
      }
    }).bind(this);
    this.ws.onclose = ((ev) => {
      try {
        const msg = JSON.parse(ev.reason);
        messageHandler(msg);
      } catch (error) {
        console.error("Error on close", error);
      }
    }).bind(this);
    this.ws.onerror = ((_) => {
      this.status = "failed";
      this.dispatchTypedEvent("error", new CustomEvent("error", {
        detail: {
          status: this.status,
          data: this.data,
          error: "WebSocket error",
          id: this.id
        }
      }));
    }).bind(this);
  }
  close() {
    this.ws.close();
  }
};
var Firecrawl = class extends FirecrawlClient {
  /** Feature‑frozen v1 client (lazy). */
  _v1;
  _v1Opts;
  /** @param opts API credentials and base URL. */
  constructor(opts = {}) {
    super(opts);
    this._v1Opts = {
      apiKey: opts.apiKey,
      apiUrl: opts.apiUrl
    };
  }
  /** Access the legacy v1 client (instantiated on first access). */
  get v1() {
    if (!this._v1) this._v1 = new FirecrawlApp(this._v1Opts);
    return this._v1;
  }
};
var index_default = Firecrawl;
const packageTHA2MQX4 = require_package();
const packageTHA2MQX4$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: packageTHA2MQX4
});
export {
  index_default as i
};
