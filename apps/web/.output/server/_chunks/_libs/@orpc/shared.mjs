function resolveMaybeOptionalOptions(rest) {
  return rest[0] ?? {};
}
function toArray(value2) {
  return Array.isArray(value2) ? value2 : value2 === void 0 || value2 === null ? [] : [value2];
}
const ORPC_NAME = "orpc";
const ORPC_SHARED_PACKAGE_NAME = "@orpc/shared";
const ORPC_SHARED_PACKAGE_VERSION = "1.13.4";
class AbortError extends Error {
  constructor(...rest) {
    super(...rest);
    this.name = "AbortError";
  }
}
function once(fn) {
  let cached;
  return () => {
    if (cached) {
      return cached.result;
    }
    const result = fn();
    cached = { result };
    return result;
  };
}
function sequential(fn) {
  let lastOperationPromise = Promise.resolve();
  return (...args) => {
    return lastOperationPromise = lastOperationPromise.catch(() => {
    }).then(() => {
      return fn(...args);
    });
  };
}
const SPAN_ERROR_STATUS = 2;
const GLOBAL_OTEL_CONFIG_KEY = `__${ORPC_SHARED_PACKAGE_NAME}@${ORPC_SHARED_PACKAGE_VERSION}/otel/config__`;
function getGlobalOtelConfig() {
  return globalThis[GLOBAL_OTEL_CONFIG_KEY];
}
function startSpan(name, options = {}, context) {
  const tracer = getGlobalOtelConfig()?.tracer;
  return tracer?.startSpan(name, options, context);
}
function setSpanError(span, error, options = {}) {
  if (!span) {
    return;
  }
  const exception = toOtelException(error);
  span.recordException(exception);
  if (!options.signal?.aborted || options.signal.reason !== error) {
    span.setStatus({
      code: SPAN_ERROR_STATUS,
      message: exception.message
    });
  }
}
function toOtelException(error) {
  if (error instanceof Error) {
    const exception = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
    if ("code" in error && (typeof error.code === "string" || typeof error.code === "number")) {
      exception.code = error.code;
    }
    return exception;
  }
  return { message: String(error) };
}
async function runWithSpan({ name, context, ...options }, fn) {
  const tracer = getGlobalOtelConfig()?.tracer;
  if (!tracer) {
    return fn();
  }
  const callback = async (span) => {
    try {
      return await fn(span);
    } catch (e) {
      setSpanError(span, e, options);
      throw e;
    } finally {
      span.end();
    }
  };
  if (context) {
    return tracer.startActiveSpan(name, options, context, callback);
  } else {
    return tracer.startActiveSpan(name, options, callback);
  }
}
async function runInSpanContext(span, fn) {
  const otelConfig = getGlobalOtelConfig();
  if (!span || !otelConfig) {
    return fn();
  }
  const ctx = otelConfig.trace.setSpan(otelConfig.context.active(), span);
  return otelConfig.context.with(ctx, fn);
}
function isAsyncIteratorObject(maybe) {
  if (!maybe || typeof maybe !== "object") {
    return false;
  }
  return "next" in maybe && typeof maybe.next === "function" && Symbol.asyncIterator in maybe && typeof maybe[Symbol.asyncIterator] === "function";
}
const fallbackAsyncDisposeSymbol = Symbol.for("asyncDispose");
const asyncDisposeSymbol = Symbol.asyncDispose ?? fallbackAsyncDisposeSymbol;
class AsyncIteratorClass {
  #isDone = false;
  #isExecuteComplete = false;
  #cleanup;
  #next;
  constructor(next, cleanup) {
    this.#cleanup = cleanup;
    this.#next = sequential(async () => {
      if (this.#isDone) {
        return { done: true, value: void 0 };
      }
      try {
        const result = await next();
        if (result.done) {
          this.#isDone = true;
        }
        return result;
      } catch (err) {
        this.#isDone = true;
        throw err;
      } finally {
        if (this.#isDone && !this.#isExecuteComplete) {
          this.#isExecuteComplete = true;
          await this.#cleanup("next");
        }
      }
    });
  }
  next() {
    return this.#next();
  }
  async return(value2) {
    this.#isDone = true;
    if (!this.#isExecuteComplete) {
      this.#isExecuteComplete = true;
      await this.#cleanup("return");
    }
    return { done: true, value: value2 };
  }
  async throw(err) {
    this.#isDone = true;
    if (!this.#isExecuteComplete) {
      this.#isExecuteComplete = true;
      await this.#cleanup("throw");
    }
    throw err;
  }
  /**
   * asyncDispose symbol only available in esnext, we should fallback to Symbol.for('asyncDispose')
   */
  async [asyncDisposeSymbol]() {
    this.#isDone = true;
    if (!this.#isExecuteComplete) {
      this.#isExecuteComplete = true;
      await this.#cleanup("dispose");
    }
  }
  [Symbol.asyncIterator]() {
    return this;
  }
}
function asyncIteratorWithSpan({ name, ...options }, iterator) {
  let span;
  return new AsyncIteratorClass(
    async () => {
      span ??= startSpan(name);
      try {
        const result = await runInSpanContext(span, () => iterator.next());
        span?.addEvent(result.done ? "completed" : "yielded");
        return result;
      } catch (err) {
        setSpanError(span, err, options);
        throw err;
      }
    },
    async (reason) => {
      try {
        if (reason !== "next") {
          await runInSpanContext(span, () => iterator.return?.());
        }
      } catch (err) {
        setSpanError(span, err, options);
        throw err;
      } finally {
        span?.end();
      }
    }
  );
}
function onError(callback) {
  return async (options, ...rest) => {
    try {
      return await options.next();
    } catch (error) {
      await callback(error, options, ...rest);
      throw error;
    }
  };
}
function intercept(interceptors, options, main) {
  const next = (options2, index) => {
    const interceptor = interceptors[index];
    if (!interceptor) {
      return main(options2);
    }
    return interceptor({
      ...options2,
      next: (newOptions = options2) => next(newOptions, index + 1)
    });
  };
  return next(options, 0);
}
function parseEmptyableJSON(text) {
  if (!text) {
    return void 0;
  }
  return JSON.parse(text);
}
function stringifyJSON(value2) {
  return JSON.stringify(value2);
}
function getConstructor(value2) {
  if (!isTypescriptObject(value2)) {
    return null;
  }
  return Object.getPrototypeOf(value2)?.constructor;
}
function isObject(value2) {
  if (!value2 || typeof value2 !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value2);
  return proto === Object.prototype || !proto || !proto.constructor;
}
function isTypescriptObject(value2) {
  return !!value2 && (typeof value2 === "object" || typeof value2 === "function");
}
function get(object, path) {
  let current = object;
  for (const key of path) {
    if (!isTypescriptObject(current)) {
      return void 0;
    }
    current = current[key];
  }
  return current;
}
const NullProtoObj = /* @__PURE__ */ (() => {
  const e = function() {
  };
  e.prototype = /* @__PURE__ */ Object.create(null);
  Object.freeze(e.prototype);
  return e;
})();
function value(value2, ...args) {
  if (typeof value2 === "function") {
    return value2(...args);
  }
  return value2;
}
function overlayProxy(target, partial) {
  const proxy = new Proxy(typeof target === "function" ? partial : target, {
    get(_, prop) {
      const targetValue = prop in partial ? partial : value(target);
      const v = Reflect.get(targetValue, prop);
      return typeof v === "function" ? v.bind(targetValue) : v;
    },
    has(_, prop) {
      return Reflect.has(partial, prop) || Reflect.has(value(target), prop);
    }
  });
  return proxy;
}
function tryDecodeURIComponent(value2) {
  try {
    return decodeURIComponent(value2);
  } catch {
    return value2;
  }
}
export {
  AsyncIteratorClass as A,
  NullProtoObj as N,
  ORPC_NAME as O,
  isTypescriptObject as a,
  isAsyncIteratorObject as b,
  tryDecodeURIComponent as c,
  runWithSpan as d,
  intercept as e,
  asyncIteratorWithSpan as f,
  getConstructor as g,
  setSpanError as h,
  isObject as i,
  once as j,
  runInSpanContext as k,
  startSpan as l,
  AbortError as m,
  get as n,
  overlayProxy as o,
  parseEmptyableJSON as p,
  onError as q,
  resolveMaybeOptionalOptions as r,
  stringifyJSON as s,
  toArray as t,
  value as v
};
