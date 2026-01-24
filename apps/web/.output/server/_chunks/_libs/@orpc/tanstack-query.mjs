import { t as toArray, n as get, b as isAsyncIteratorObject, s as stringifyJSON } from "./shared.mjs";
import { s as skipToken } from "../@tanstack/query-core.mjs";
function generateOperationKey(path, state = {}) {
  return [path, {
    ...state.input !== void 0 ? { input: state.input } : {},
    ...state.type !== void 0 ? { type: state.type } : {},
    ...state.fnOptions !== void 0 ? { fnOptions: state.fnOptions } : {}
  }];
}
function createGeneralUtils(path) {
  return {
    key(options) {
      return generateOperationKey(path, options);
    }
  };
}
function experimental_liveQuery(queryFn) {
  return async (context) => {
    const stream = await queryFn(context);
    let last;
    for await (const chunk of stream) {
      if (context.signal.aborted) {
        throw context.signal.reason;
      }
      last = { chunk };
      context.client.setQueryData(context.queryKey, chunk);
    }
    if (!last) {
      throw new Error(
        `Live query for ${stringifyJSON(context.queryKey)} did not yield any data. Ensure the query function returns an AsyncIterable with at least one chunk.`
      );
    }
    return last.chunk;
  };
}
function experimental_serializableStreamedQuery(queryFn, { refetchMode = "reset", maxChunks = Number.POSITIVE_INFINITY } = {}) {
  return async (context) => {
    const query = context.client.getQueryCache().find({ queryKey: context.queryKey, exact: true });
    const hasPreviousData = !!query && query.state.data !== void 0;
    if (hasPreviousData) {
      if (refetchMode === "reset") {
        query.setState({
          status: "pending",
          data: void 0,
          error: null,
          fetchStatus: "fetching"
        });
      } else {
        context.client.setQueryData(
          context.queryKey,
          (prev = []) => limitArraySize(prev, maxChunks)
        );
      }
    }
    let result = [];
    const stream = await queryFn(context);
    const shouldUpdateCacheDuringStream = !hasPreviousData || refetchMode !== "replace";
    context.client.setQueryData(
      context.queryKey,
      (prev = []) => limitArraySize(prev, maxChunks)
    );
    for await (const chunk of stream) {
      if (context.signal.aborted) {
        throw context.signal.reason;
      }
      result.push(chunk);
      result = limitArraySize(result, maxChunks);
      if (shouldUpdateCacheDuringStream) {
        context.client.setQueryData(
          context.queryKey,
          (prev = []) => limitArraySize([...prev, chunk], maxChunks)
        );
      }
    }
    if (!shouldUpdateCacheDuringStream) {
      context.client.setQueryData(context.queryKey, result);
    }
    const cachedData = context.client.getQueryData(context.queryKey);
    if (cachedData) {
      return limitArraySize(cachedData, maxChunks);
    }
    return result;
  };
}
function limitArraySize(items, maxSize) {
  if (items.length <= maxSize) {
    return items;
  }
  return items.slice(items.length - maxSize);
}
const OPERATION_CONTEXT_SYMBOL = Symbol("ORPC_OPERATION_CONTEXT");
function createProcedureUtils(client, options) {
  const utils = {
    call: client,
    queryKey(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.queryKey, ...optionsIn };
      const queryKey = optionsIn.queryKey ?? generateOperationKey(options.path, { type: "query", input: optionsIn.input });
      return queryKey;
    },
    queryOptions(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.queryOptions, ...optionsIn };
      const queryKey = utils.queryKey(optionsIn);
      return {
        queryFn: ({ signal }) => {
          if (optionsIn.input === skipToken) {
            throw new Error("queryFn should not be called with skipToken used as input");
          }
          return client(optionsIn.input, {
            signal,
            context: {
              [OPERATION_CONTEXT_SYMBOL]: {
                key: queryKey,
                type: "query"
              },
              ...optionsIn.context
            }
          });
        },
        ...optionsIn.input === skipToken ? { enabled: false } : {},
        ...optionsIn,
        queryKey
      };
    },
    experimental_streamedKey(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.experimental_streamedKey, ...optionsIn };
      const queryKey = optionsIn.queryKey ?? generateOperationKey(options.path, { type: "streamed", input: optionsIn.input, fnOptions: optionsIn.queryFnOptions });
      return queryKey;
    },
    experimental_streamedOptions(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.experimental_streamedOptions, ...optionsIn };
      const queryKey = utils.experimental_streamedKey(optionsIn);
      return {
        queryFn: experimental_serializableStreamedQuery(
          async ({ signal }) => {
            if (optionsIn.input === skipToken) {
              throw new Error("queryFn should not be called with skipToken used as input");
            }
            const output = await client(optionsIn.input, {
              signal,
              context: {
                [OPERATION_CONTEXT_SYMBOL]: {
                  key: queryKey,
                  type: "streamed"
                },
                ...optionsIn.context
              }
            });
            if (!isAsyncIteratorObject(output)) {
              throw new Error("streamedQuery requires an event iterator output");
            }
            return output;
          },
          optionsIn.queryFnOptions
        ),
        ...optionsIn.input === skipToken ? { enabled: false } : {},
        ...optionsIn,
        queryKey
      };
    },
    experimental_liveKey(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.experimental_liveKey, ...optionsIn };
      const queryKey = optionsIn.queryKey ?? generateOperationKey(options.path, { type: "live", input: optionsIn.input });
      return queryKey;
    },
    experimental_liveOptions(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.experimental_liveOptions, ...optionsIn };
      const queryKey = utils.experimental_liveKey(optionsIn);
      return {
        queryFn: experimental_liveQuery(async ({ signal }) => {
          if (optionsIn.input === skipToken) {
            throw new Error("queryFn should not be called with skipToken used as input");
          }
          const output = await client(optionsIn.input, {
            signal,
            context: {
              [OPERATION_CONTEXT_SYMBOL]: {
                key: queryKey,
                type: "live"
              },
              ...optionsIn.context
            }
          });
          if (!isAsyncIteratorObject(output)) {
            throw new Error("liveQuery requires an event iterator output");
          }
          return output;
        }),
        ...optionsIn.input === skipToken ? { enabled: false } : {},
        ...optionsIn,
        queryKey
      };
    },
    infiniteKey(optionsIn) {
      optionsIn = { ...options.experimental_defaults?.infiniteKey, ...optionsIn };
      const queryKey = optionsIn.queryKey ?? generateOperationKey(options.path, {
        type: "infinite",
        input: optionsIn.input === skipToken ? skipToken : optionsIn.input(optionsIn.initialPageParam)
      });
      return queryKey;
    },
    infiniteOptions(optionsIn) {
      optionsIn = { ...options.experimental_defaults?.infiniteOptions, ...optionsIn };
      const queryKey = utils.infiniteKey(optionsIn);
      return {
        queryFn: ({ pageParam, signal }) => {
          if (optionsIn.input === skipToken) {
            throw new Error("queryFn should not be called with skipToken used as input");
          }
          return client(optionsIn.input(pageParam), {
            signal,
            context: {
              [OPERATION_CONTEXT_SYMBOL]: {
                key: queryKey,
                type: "infinite"
              },
              ...optionsIn.context
            }
          });
        },
        ...optionsIn.input === skipToken ? { enabled: false } : {},
        ...optionsIn,
        queryKey
      };
    },
    mutationKey(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.mutationKey, ...optionsIn };
      const mutationKey = optionsIn.mutationKey ?? generateOperationKey(options.path, { type: "mutation" });
      return mutationKey;
    },
    mutationOptions(...[optionsIn = {}]) {
      optionsIn = { ...options.experimental_defaults?.mutationOptions, ...optionsIn };
      const mutationKey = utils.mutationKey(optionsIn);
      return {
        mutationFn: (input) => client(input, {
          context: {
            [OPERATION_CONTEXT_SYMBOL]: {
              key: mutationKey,
              type: "mutation"
            },
            ...optionsIn.context
          }
        }),
        ...optionsIn,
        mutationKey
      };
    }
  };
  return utils;
}
function createRouterUtils(client, options = {}) {
  const path = toArray(options.path);
  const generalUtils = createGeneralUtils(path);
  const procedureUtils = createProcedureUtils(client, {
    path,
    experimental_defaults: options.experimental_defaults
  });
  const recursive = new Proxy({
    ...generalUtils,
    ...procedureUtils
  }, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      if (typeof prop !== "string") {
        return value;
      }
      const nextUtils = createRouterUtils(client[prop], {
        ...options,
        path: [...path, prop],
        experimental_defaults: get(options.experimental_defaults, [prop])
      });
      if (typeof value !== "function") {
        return nextUtils;
      }
      return new Proxy(value, {
        get(_, prop2) {
          return Reflect.get(nextUtils, prop2);
        }
      });
    }
  });
  return recursive;
}
export {
  createRouterUtils as c
};
