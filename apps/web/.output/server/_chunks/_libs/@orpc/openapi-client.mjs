import { i as isObject, N as NullProtoObj, b as isAsyncIteratorObject } from "./shared.mjs";
import { E as ErrorEvent } from "./standard-server.mjs";
import { m as mapEventIterator, a as toORPCError, b as isORPCErrorJson, c as createORPCErrorFromJson } from "./client.mjs";
class StandardBracketNotationSerializer {
  maxArrayIndex;
  constructor(options = {}) {
    this.maxArrayIndex = options.maxBracketNotationArrayIndex ?? 9999;
  }
  serialize(data, segments = [], result = []) {
    if (Array.isArray(data)) {
      data.forEach((item, i) => {
        this.serialize(item, [...segments, i], result);
      });
    } else if (isObject(data)) {
      for (const key in data) {
        this.serialize(data[key], [...segments, key], result);
      }
    } else {
      result.push([this.stringifyPath(segments), data]);
    }
    return result;
  }
  deserialize(serialized) {
    if (serialized.length === 0) {
      return {};
    }
    const arrayPushStyles = /* @__PURE__ */ new WeakSet();
    const ref = { value: [] };
    for (const [path, value] of serialized) {
      const segments = this.parsePath(path);
      let currentRef = ref;
      let nextSegment = "value";
      segments.forEach((segment, i) => {
        if (!Array.isArray(currentRef[nextSegment]) && !isObject(currentRef[nextSegment])) {
          currentRef[nextSegment] = [];
        }
        if (i !== segments.length - 1) {
          if (Array.isArray(currentRef[nextSegment]) && !isValidArrayIndex(segment, this.maxArrayIndex)) {
            if (arrayPushStyles.has(currentRef[nextSegment])) {
              arrayPushStyles.delete(currentRef[nextSegment]);
              currentRef[nextSegment] = pushStyleArrayToObject(currentRef[nextSegment]);
            } else {
              currentRef[nextSegment] = arrayToObject(currentRef[nextSegment]);
            }
          }
        } else {
          if (Array.isArray(currentRef[nextSegment])) {
            if (segment === "") {
              if (currentRef[nextSegment].length && !arrayPushStyles.has(currentRef[nextSegment])) {
                currentRef[nextSegment] = arrayToObject(currentRef[nextSegment]);
              }
            } else {
              if (arrayPushStyles.has(currentRef[nextSegment])) {
                arrayPushStyles.delete(currentRef[nextSegment]);
                currentRef[nextSegment] = pushStyleArrayToObject(currentRef[nextSegment]);
              } else if (!isValidArrayIndex(segment, this.maxArrayIndex)) {
                currentRef[nextSegment] = arrayToObject(currentRef[nextSegment]);
              }
            }
          }
        }
        currentRef = currentRef[nextSegment];
        nextSegment = segment;
      });
      if (Array.isArray(currentRef) && nextSegment === "") {
        arrayPushStyles.add(currentRef);
        currentRef.push(value);
      } else if (nextSegment in currentRef) {
        if (Array.isArray(currentRef[nextSegment])) {
          currentRef[nextSegment].push(value);
        } else {
          currentRef[nextSegment] = [currentRef[nextSegment], value];
        }
      } else {
        currentRef[nextSegment] = value;
      }
    }
    return ref.value;
  }
  stringifyPath(segments) {
    return segments.map((segment) => {
      return segment.toString().replace(/[\\[\]]/g, (match) => {
        switch (match) {
          case "\\":
            return "\\\\";
          case "[":
            return "\\[";
          case "]":
            return "\\]";
          /* v8 ignore next 2 */
          default:
            return match;
        }
      });
    }).reduce((result, segment, i) => {
      if (i === 0) {
        return segment;
      }
      return `${result}[${segment}]`;
    }, "");
  }
  parsePath(path) {
    const segments = [];
    let inBrackets = false;
    let currentSegment = "";
    let backslashCount = 0;
    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      const nextChar = path[i + 1];
      if (inBrackets && char === "]" && (nextChar === void 0 || nextChar === "[") && backslashCount % 2 === 0) {
        if (nextChar === void 0) {
          inBrackets = false;
        }
        segments.push(currentSegment);
        currentSegment = "";
        i++;
      } else if (segments.length === 0 && char === "[" && backslashCount % 2 === 0) {
        inBrackets = true;
        segments.push(currentSegment);
        currentSegment = "";
      } else if (char === "\\") {
        backslashCount++;
      } else {
        currentSegment += "\\".repeat(backslashCount / 2) + char;
        backslashCount = 0;
      }
    }
    return inBrackets || segments.length === 0 ? [path] : segments;
  }
}
function isValidArrayIndex(value, maxIndex) {
  return /^0$|^[1-9]\d*$/.test(value) && Number(value) <= maxIndex;
}
function arrayToObject(array) {
  const obj = new NullProtoObj();
  array.forEach((item, i) => {
    obj[i] = item;
  });
  return obj;
}
function pushStyleArrayToObject(array) {
  const obj = new NullProtoObj();
  obj[""] = array.length === 1 ? array[0] : array;
  return obj;
}
class StandardOpenAPIJsonSerializer {
  customSerializers;
  constructor(options = {}) {
    this.customSerializers = options.customJsonSerializers ?? [];
  }
  serialize(data, hasBlobRef = { value: false }) {
    for (const custom of this.customSerializers) {
      if (custom.condition(data)) {
        const result = this.serialize(custom.serialize(data), hasBlobRef);
        return result;
      }
    }
    if (data instanceof Blob) {
      hasBlobRef.value = true;
      return [data, hasBlobRef.value];
    }
    if (data instanceof Set) {
      return this.serialize(Array.from(data), hasBlobRef);
    }
    if (data instanceof Map) {
      return this.serialize(Array.from(data.entries()), hasBlobRef);
    }
    if (Array.isArray(data)) {
      const json = data.map((v) => v === void 0 ? null : this.serialize(v, hasBlobRef)[0]);
      return [json, hasBlobRef.value];
    }
    if (isObject(data)) {
      const json = {};
      for (const k in data) {
        if (k === "toJSON" && typeof data[k] === "function") {
          continue;
        }
        json[k] = this.serialize(data[k], hasBlobRef)[0];
      }
      return [json, hasBlobRef.value];
    }
    if (typeof data === "bigint" || data instanceof RegExp || data instanceof URL) {
      return [data.toString(), hasBlobRef.value];
    }
    if (data instanceof Date) {
      return [Number.isNaN(data.getTime()) ? null : data.toISOString(), hasBlobRef.value];
    }
    if (Number.isNaN(data)) {
      return [null, hasBlobRef.value];
    }
    return [data, hasBlobRef.value];
  }
}
function standardizeHTTPPath(path) {
  return `/${path.replace(/\/{2,}/g, "/").replace(/^\/|\/$/g, "")}`;
}
class StandardOpenAPISerializer {
  constructor(jsonSerializer, bracketNotation) {
    this.jsonSerializer = jsonSerializer;
    this.bracketNotation = bracketNotation;
  }
  serialize(data, options = {}) {
    if (isAsyncIteratorObject(data) && !options.outputFormat) {
      return mapEventIterator(data, {
        value: async (value) => this.#serialize(value, { outputFormat: "plain" }),
        error: async (e) => {
          return new ErrorEvent({
            data: this.#serialize(toORPCError(e).toJSON(), { outputFormat: "plain" }),
            cause: e
          });
        }
      });
    }
    return this.#serialize(data, options);
  }
  #serialize(data, options) {
    const [json, hasBlob] = this.jsonSerializer.serialize(data);
    if (options.outputFormat === "plain") {
      return json;
    }
    if (options.outputFormat === "URLSearchParams") {
      const params = new URLSearchParams();
      for (const [path, value] of this.bracketNotation.serialize(json)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          params.append(path, value.toString());
        }
      }
      return params;
    }
    if (json instanceof Blob || json === void 0 || !hasBlob) {
      return json;
    }
    const form = new FormData();
    for (const [path, value] of this.bracketNotation.serialize(json)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        form.append(path, value.toString());
      } else if (value instanceof Blob) {
        form.append(path, value);
      }
    }
    return form;
  }
  deserialize(data) {
    if (data instanceof URLSearchParams || data instanceof FormData) {
      return this.bracketNotation.deserialize(Array.from(data.entries()));
    }
    if (isAsyncIteratorObject(data)) {
      return mapEventIterator(data, {
        value: async (value) => value,
        error: async (e) => {
          if (e instanceof ErrorEvent && isORPCErrorJson(e.data)) {
            return createORPCErrorFromJson(e.data, { cause: e });
          }
          return e;
        }
      });
    }
    return data;
  }
}
export {
  StandardOpenAPIJsonSerializer as S,
  StandardBracketNotationSerializer as a,
  StandardOpenAPISerializer as b,
  standardizeHTTPPath as s
};
