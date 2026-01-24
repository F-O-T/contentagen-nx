import { A as AxiosError, a as axios } from "../../../_libs/axios.mjs";
import { e as encodingForModel } from "../../../_libs/js-tiktoken.mjs";
import { d as distExports } from "../https-proxy-agent.mjs";
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var __await = function(promise, isYieldStar) {
  this[0] = promise;
  this[1] = isYieldStar;
};
var __asyncGenerator = (__this, __arguments, generator) => {
  var resume = (k, v, yes, no) => {
    try {
      var x = generator[k](v), isAwait = (v = x.value) instanceof __await, done = x.done;
      Promise.resolve(isAwait ? v[0] : v).then((y) => isAwait ? resume(k === "return" ? k : "next", v[1] ? { done: y.done, value: y.value } : y, yes, no) : yes({ value: y, done })).catch((e) => resume("throw", e, yes, no));
    } catch (e) {
      no(e);
    }
  }, method = (k) => it[k] = (x) => new Promise((yes, no) => resume(k, x, yes, no)), it = {};
  return generator = generator.apply(__this, __arguments), it[__knownSymbol("asyncIterator")] = () => it, method("next"), method("throw"), method("return"), it;
};
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
var BASE_URL = "https://api.tavily.com";
var DEFAULT_MODEL_ENCODING = "gpt-3.5-turbo";
var DEFAULT_MAX_TOKENS = 4e3;
function post(endpoint, body, apiKey, proxies, timeout, apiBaseURL, responseType) {
  return __async(this, null, function* () {
    const requestTimeout = endpoint === "research" ? timeout : timeout != null ? timeout : 60;
    const url = `${apiBaseURL || BASE_URL}/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Client-Source": "tavily-js"
    };
    const config = { headers };
    if (requestTimeout !== void 0) {
      const timeoutInMillis = requestTimeout * 1e3;
      config.timeout = timeoutInMillis;
    }
    if (proxies) {
      if (proxies.http) {
        config.httpAgent = new distExports.HttpsProxyAgent(proxies.http);
      }
      if (proxies.https) {
        config.httpsAgent = new distExports.HttpsProxyAgent(proxies.https);
      }
    }
    if (responseType) {
      config.responseType = responseType;
    }
    return axios.post(url, body, config);
  });
}
function get(endpoint, apiKey, proxies, timeout, apiBaseURL) {
  return __async(this, null, function* () {
    const url = `${apiBaseURL || BASE_URL}/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Client-Source": "tavily-js"
    };
    const requestTimeout = endpoint.includes("research") ? timeout : timeout;
    const timeoutInMillis = requestTimeout * 1e3;
    const config = { headers, timeout: timeoutInMillis };
    if (proxies) {
      if (proxies.http) {
        config.httpAgent = new distExports.HttpsProxyAgent(proxies.http);
      }
      if (proxies.https) {
        config.httpsAgent = new distExports.HttpsProxyAgent(proxies.https);
      }
    }
    return axios.get(url, config);
  });
}
function getTotalTokensFromString(str, encodingName = DEFAULT_MODEL_ENCODING) {
  const encoding = encodingForModel(encodingName);
  return encoding.encode(str).length;
}
function getMaxTokensFromList(data, maxTokens = DEFAULT_MAX_TOKENS) {
  var result = [];
  let currentTokens = 0;
  for (let item of data) {
    let itemString = JSON.stringify(item);
    let newTotalTokens = currentTokens + getTotalTokensFromString(itemString);
    if (newTotalTokens > maxTokens) {
      break;
    }
    result.push(item);
    currentTokens = newTotalTokens;
  }
  return JSON.stringify(result);
}
function handleRequestError(res) {
  var _a, _b, _c, _d;
  const status = res.status;
  const message = (_b = (_a = res.data) == null ? void 0 : _a.detail) == null ? void 0 : _b.error;
  if (!message) {
    throw new Error(`${status} Error: ${JSON.stringify(res.data)}`);
  }
  throw new Error(`${(_d = (_c = res.data) == null ? void 0 : _c.detail) == null ? void 0 : _d.error}`);
}
function handleTimeoutError(timeout) {
  throw new Error(`Request timed out after ${timeout} seconds.`);
}
function _search(apiKey, proxies, apiBaseURL) {
  return function search(_0) {
    return __async(this, arguments, function* (query, options = {}) {
      var _b, _c, _d, _e, _f;
      const _a = options, {
        searchDepth,
        topic,
        days,
        maxResults,
        includeImages,
        includeImageDescriptions,
        includeAnswer,
        includeRawContent,
        includeDomains,
        excludeDomains,
        timeRange,
        chunksPerSource,
        country,
        startDate,
        endDate,
        autoParameters,
        timeout,
        includeFavicon,
        includeUsage
      } = _a, kwargs = __objRest(_a, [
        "searchDepth",
        "topic",
        "days",
        "maxResults",
        "includeImages",
        "includeImageDescriptions",
        "includeAnswer",
        "includeRawContent",
        "includeDomains",
        "excludeDomains",
        "timeRange",
        "chunksPerSource",
        "country",
        "startDate",
        "endDate",
        "autoParameters",
        "timeout",
        "includeFavicon",
        "includeUsage"
      ]);
      const requestTimeout = timeout != null ? timeout : 60;
      try {
        const response = yield post(
          "search",
          __spreadValues({
            query,
            search_depth: searchDepth,
            topic,
            days,
            max_results: maxResults,
            include_images: includeImages,
            include_image_descriptions: includeImageDescriptions,
            include_answer: includeAnswer,
            include_raw_content: includeRawContent,
            include_domains: includeDomains,
            exclude_domains: excludeDomains,
            time_range: timeRange,
            chunks_per_source: chunksPerSource,
            country,
            start_date: startDate,
            end_date: endDate,
            auto_parameters: autoParameters,
            include_favicon: includeFavicon,
            include_usage: includeUsage
          }, kwargs),
          apiKey,
          proxies,
          requestTimeout,
          apiBaseURL
        );
        return __spreadValues(__spreadValues({
          query,
          responseTime: response.data.response_time,
          images: response.data.images.map((image) => {
            return {
              url: (image == null ? void 0 : image.url) || image,
              description: image.description
            };
          }),
          results: response.data.results.map((result) => {
            return {
              title: result.title,
              url: result.url,
              content: result.content,
              rawContent: result.raw_content,
              score: result.score,
              publishedDate: result.published_date,
              favicon: result.favicon
            };
          }),
          answer: response.data.answer,
          requestId: response.data.request_id
        }, response.data.usage !== void 0 && { usage: response.data.usage }), response.data.auto_parameters && {
          autoParameters: {
            includeDomains: (_b = response.data.auto_parameters) == null ? void 0 : _b.include_domains,
            excludeDomains: (_c = response.data.auto_parameters) == null ? void 0 : _c.exclude_domains,
            topic: (_d = response.data.auto_parameters) == null ? void 0 : _d.topic,
            timeRange: (_e = response.data.auto_parameters) == null ? void 0 : _e.time_range,
            searchDepth: (_f = response.data.auto_parameters) == null ? void 0 : _f.search_depth
          }
        });
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(requestTimeout);
          }
          if (err.response) {
            handleRequestError(err.response);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    });
  };
}
function _searchQNA(apiKey, proxies, apiBaseURL) {
  return function searchQNA(_0) {
    return __async(this, arguments, function* (query, options = {}) {
      var _a, _b;
      console.warn(
        "searchQNA() is deprecated and will be removed in a future version. Use search() with includeAnswer: true instead."
      );
      const requestTimeout = (_a = options == null ? void 0 : options.timeout) != null ? _a : 60;
      try {
        const response = yield post(
          "search",
          {
            query,
            search_depth: (_b = options.searchDepth) != null ? _b : "advanced",
            topic: options.topic,
            days: options.days,
            max_results: options.maxResults,
            include_answer: true,
            include_domains: options.includeDomains,
            exclude_domains: options.excludeDomains,
            chunks_per_source: options.chunksPerSource,
            include_favicon: options.includeFavicon
          },
          apiKey,
          proxies,
          requestTimeout,
          apiBaseURL
        );
        const answer = response.data.answer;
        return answer;
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(requestTimeout);
          }
          if (err.response) {
            handleRequestError(err.response);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    });
  };
}
function _searchContext(apiKey, proxies, apiBaseURL) {
  return function searchContext(_0) {
    return __async(this, arguments, function* (query, options = {}) {
      var _a, _b, _c;
      console.warn(
        "searchContext() is deprecated and will be removed in a future version. Use search() directly and process the results as needed."
      );
      const timeout = (_a = options == null ? void 0 : options.timeout) != null ? _a : 60;
      try {
        const response = yield post(
          "search",
          {
            query,
            search_depth: options.searchDepth,
            topic: options.topic,
            days: options.days,
            max_results: options.maxResults,
            include_domains: options.includeDomains,
            exclude_domains: options.excludeDomains,
            chunks_per_source: options.chunksPerSource,
            include_favicon: options.includeFavicon
          },
          apiKey,
          proxies,
          timeout,
          apiBaseURL
        );
        const sources = ((_b = response.data) == null ? void 0 : _b.results) || [];
        const context = sources.map((source) => {
          return {
            url: source.url,
            content: source.content
          };
        });
        return JSON.stringify(
          getMaxTokensFromList(context, (_c = options.maxTokens) != null ? _c : DEFAULT_MAX_TOKENS)
        );
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(timeout);
          }
          if (err.response) {
            handleRequestError(err.response);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    });
  };
}
function _extract(apiKey, proxies, apiBaseURL) {
  return function extract(_0) {
    return __async(this, arguments, function* (urls, options = {}) {
      const _a = options, { includeImages, extractDepth, format, timeout, includeFavicon, includeUsage, query, chunksPerSource } = _a, kwargs = __objRest(_a, ["includeImages", "extractDepth", "format", "timeout", "includeFavicon", "includeUsage", "query", "chunksPerSource"]);
      const requestTimeout = timeout != null ? timeout : 30;
      try {
        const response = yield post(
          "extract",
          __spreadValues({
            urls,
            include_images: includeImages,
            extract_depth: extractDepth,
            format,
            include_favicon: includeFavicon,
            timeout,
            // Add timeout to the payload
            include_usage: includeUsage,
            query,
            chunks_per_source: chunksPerSource
          }, kwargs),
          apiKey,
          proxies,
          requestTimeout,
          apiBaseURL
        );
        return __spreadValues({
          responseTime: response.data.response_time,
          results: response.data.results.map((result) => {
            return {
              url: result.url,
              rawContent: result.raw_content,
              images: result.images,
              favicon: result.favicon
            };
          }),
          failedResults: response.data.failed_results.map((result) => {
            return {
              url: result.url,
              error: result.error
            };
          }),
          requestId: response.data.request_id
        }, response.data.usage !== void 0 && { usage: response.data.usage });
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(requestTimeout);
          }
          if (err.response) {
            handleRequestError(err.response);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    });
  };
}
function _crawl(apiKey, proxies, apiBaseURL) {
  return function crawl(_0) {
    return __async(this, arguments, function* (url, options = {}) {
      const _a = options, {
        maxDepth,
        maxBreadth,
        limit,
        extractDepth,
        selectPaths,
        selectDomains,
        excludePaths,
        excludeDomains,
        allowExternal,
        includeImages,
        instructions,
        format,
        timeout,
        includeFavicon,
        includeUsage,
        chunksPerSource
      } = _a, kwargs = __objRest(_a, [
        "maxDepth",
        "maxBreadth",
        "limit",
        "extractDepth",
        "selectPaths",
        "selectDomains",
        "excludePaths",
        "excludeDomains",
        "allowExternal",
        "includeImages",
        "instructions",
        "format",
        "timeout",
        "includeFavicon",
        "includeUsage",
        "chunksPerSource"
      ]);
      const requestTimeout = timeout != null ? timeout : 150;
      try {
        const response = yield post(
          "crawl",
          __spreadValues({
            url,
            max_depth: maxDepth,
            max_breadth: maxBreadth,
            limit,
            extract_depth: extractDepth,
            select_paths: selectPaths,
            select_domains: selectDomains,
            exclude_paths: excludePaths,
            exclude_domains: excludeDomains,
            allow_external: allowExternal,
            include_images: includeImages,
            instructions,
            format,
            timeout,
            include_favicon: includeFavicon,
            include_usage: includeUsage,
            chunks_per_source: chunksPerSource
          }, kwargs),
          apiKey,
          proxies,
          requestTimeout,
          apiBaseURL
        );
        return __spreadValues({
          responseTime: response.data.response_time,
          baseUrl: response.data.base_url,
          results: response.data.results.map((item) => {
            return {
              url: item.url,
              rawContent: item.raw_content,
              images: item.images,
              favicon: item.favicon
            };
          }),
          requestId: response.data.request_id
        }, response.data.usage !== void 0 && { usage: response.data.usage });
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(requestTimeout);
          }
          if (err.response) {
            handleRequestError(err.response);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    });
  };
}
function _map(apiKey, proxies, apiBaseURL) {
  return function map(_0) {
    return __async(this, arguments, function* (url, options = {}) {
      const _a = options, {
        maxDepth,
        maxBreadth,
        limit,
        selectPaths,
        selectDomains,
        excludePaths,
        excludeDomains,
        allowExternal,
        instructions,
        timeout,
        includeUsage
      } = _a, kwargs = __objRest(_a, [
        "maxDepth",
        "maxBreadth",
        "limit",
        "selectPaths",
        "selectDomains",
        "excludePaths",
        "excludeDomains",
        "allowExternal",
        "instructions",
        "timeout",
        "includeUsage"
      ]);
      const requestTimeout = timeout != null ? timeout : 150;
      try {
        const response = yield post(
          "map",
          __spreadValues({
            url,
            max_depth: maxDepth,
            max_breadth: maxBreadth,
            limit,
            select_paths: selectPaths,
            select_domains: selectDomains,
            exclude_paths: excludePaths,
            exclude_domains: excludeDomains,
            allow_external: allowExternal,
            instructions,
            timeout,
            include_usage: includeUsage
          }, kwargs),
          apiKey,
          proxies,
          requestTimeout,
          apiBaseURL
        );
        return __spreadValues({
          responseTime: response.data.response_time,
          baseUrl: response.data.base_url,
          results: response.data.results,
          requestId: response.data.request_id
        }, response.data.usage !== void 0 && { usage: response.data.usage });
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(requestTimeout);
          }
          if (err.response) {
            handleRequestError(err.response);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    });
  };
}
function _research(apiKey, proxies, apiBaseURL) {
  return function research(_0) {
    return __async(this, arguments, function* (input, options = {}) {
      const _a = options, { model, outputSchema, stream, citationFormat, timeout } = _a, kwargs = __objRest(_a, ["model", "outputSchema", "stream", "citationFormat", "timeout"]);
      if (stream) {
        try {
          let streamGenerator = function() {
            return __asyncGenerator(this, null, function* () {
              const stream2 = response.data;
              try {
                try {
                  for (var iter = __forAwait(stream2), more, temp, error; more = !(temp = yield new __await(iter.next())).done; more = false) {
                    const chunk = temp.value;
                    if (chunk) {
                      yield chunk;
                    }
                  }
                } catch (temp2) {
                  error = [temp2];
                } finally {
                  try {
                    more && (temp = iter.return) && (yield new __await(temp.call(iter)));
                  } finally {
                    if (error)
                      throw error[0];
                  }
                }
              } finally {
                if (!stream2.destroyed) {
                  stream2.destroy();
                }
              }
            });
          };
          const response = yield post(
            "research",
            __spreadValues({
              input,
              model,
              output_schema: outputSchema,
              stream,
              citation_format: citationFormat
            }, kwargs),
            apiKey,
            proxies,
            timeout,
            apiBaseURL,
            "stream"
          );
          return streamGenerator();
        } catch (err) {
          if (err instanceof AxiosError) {
            if (err.code === "ECONNABORTED") {
              handleTimeoutError(timeout || 0);
            }
            if (err.response) {
              handleRequestError(err.response);
            }
          }
          throw new Error(
            `An unexpected error occurred while making the request. Error: ${err}`
          );
        }
      } else {
        try {
          const response = yield post(
            "research",
            __spreadValues({
              input,
              model,
              output_schema: outputSchema,
              stream,
              citation_format: citationFormat
            }, kwargs),
            apiKey,
            proxies,
            timeout,
            apiBaseURL
          );
          return {
            requestId: response.data.request_id,
            createdAt: response.data.created_at,
            status: response.data.status,
            input: response.data.input,
            model: response.data.model,
            responseTime: response.data.response_time
          };
        } catch (err) {
          if (err instanceof AxiosError) {
            if (err.code === "ECONNABORTED") {
              handleTimeoutError(timeout || 0);
            }
            if (err.response) {
              handleRequestError(err.response);
            }
          }
          throw new Error(
            `An unexpected error occurred while making the request. Error: ${err}`
          );
        }
      }
    });
  };
}
function _getResearch(apiKey, proxies, apiBaseURL) {
  return function getResearch(requestId) {
    return __async(this, null, function* () {
      const requestTimeout = 60;
      try {
        const response = yield get(
          `research/${requestId}`,
          apiKey,
          proxies,
          requestTimeout,
          apiBaseURL
        );
        return response.data;
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(requestTimeout);
          }
          if (err.response) {
            handleRequestError(err.response);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    });
  };
}
function tavily(options) {
  const apiKey = (options == null ? void 0 : options.apiKey) || process.env.TAVILY_API_KEY;
  const proxies = (() => {
    var _a, _b;
    const http = ((_a = options == null ? void 0 : options.proxies) == null ? void 0 : _a.http) || process.env.TAVILY_HTTP_PROXY;
    const https = ((_b = options == null ? void 0 : options.proxies) == null ? void 0 : _b.https) || process.env.TAVILY_HTTPS_PROXY;
    const result = {};
    if (http) result.http = http;
    if (https) result.https = https;
    return Object.keys(result).length > 0 ? result : void 0;
  })();
  const apiBaseURL = options == null ? void 0 : options.apiBaseURL;
  if (!apiKey) {
    throw new Error(
      "No API key provided. Please provide the api_key attribute or set the TAVILY_API_KEY environment variable."
    );
  }
  return {
    search: _search(apiKey, proxies, apiBaseURL),
    extract: _extract(apiKey, proxies, apiBaseURL),
    searchQNA: _searchQNA(apiKey, proxies, apiBaseURL),
    searchContext: _searchContext(apiKey, proxies, apiBaseURL),
    crawl: _crawl(apiKey, proxies, apiBaseURL),
    map: _map(apiKey, proxies, apiBaseURL),
    research: _research(apiKey, proxies, apiBaseURL),
    getResearch: _getResearch(apiKey, proxies, apiBaseURL)
  };
}
export {
  tavily as t
};
