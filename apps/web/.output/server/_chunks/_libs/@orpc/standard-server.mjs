import { a as isTypescriptObject, A as AsyncIteratorClass, c as tryDecodeURIComponent } from "./shared.mjs";
class EventEncoderError extends TypeError {
}
class EventDecoderError extends TypeError {
}
class ErrorEvent extends Error {
  data;
  constructor(options) {
    super(options?.message ?? "An error event was received", options);
    this.data = options?.data;
  }
}
function decodeEventMessage(encoded) {
  const lines = encoded.replace(/\n+$/, "").split(/\n/);
  const message = {
    data: void 0,
    event: void 0,
    id: void 0,
    retry: void 0,
    comments: []
  };
  for (const line of lines) {
    const index = line.indexOf(":");
    const key = index === -1 ? line : line.slice(0, index);
    const value = index === -1 ? "" : line.slice(index + 1).replace(/^\s/, "");
    if (index === 0) {
      message.comments.push(value);
    } else if (key === "data") {
      message.data ??= "";
      message.data += `${value}
`;
    } else if (key === "event") {
      message.event = value;
    } else if (key === "id") {
      message.id = value;
    } else if (key === "retry") {
      const maybeInteger = Number.parseInt(value);
      if (Number.isInteger(maybeInteger) && maybeInteger >= 0 && maybeInteger.toString() === value) {
        message.retry = maybeInteger;
      }
    }
  }
  message.data = message.data?.replace(/\n$/, "");
  return message;
}
class EventDecoder {
  constructor(options = {}) {
    this.options = options;
  }
  incomplete = "";
  feed(chunk) {
    this.incomplete += chunk;
    const lastCompleteIndex = this.incomplete.lastIndexOf("\n\n");
    if (lastCompleteIndex === -1) {
      return;
    }
    const completes = this.incomplete.slice(0, lastCompleteIndex).split(/\n\n/);
    this.incomplete = this.incomplete.slice(lastCompleteIndex + 2);
    for (const encoded of completes) {
      const message = decodeEventMessage(`${encoded}

`);
      if (this.options.onEvent) {
        this.options.onEvent(message);
      }
    }
  }
  end() {
    if (this.incomplete) {
      throw new EventDecoderError("Event Iterator ended before complete");
    }
  }
}
class EventDecoderStream extends TransformStream {
  constructor() {
    let decoder;
    super({
      start(controller) {
        decoder = new EventDecoder({
          onEvent: (event) => {
            controller.enqueue(event);
          }
        });
      },
      transform(chunk) {
        decoder.feed(chunk);
      },
      flush() {
        decoder.end();
      }
    });
  }
}
function assertEventId(id) {
  if (id.includes("\n")) {
    throw new EventEncoderError("Event's id must not contain a newline character");
  }
}
function assertEventName(event) {
  if (event.includes("\n")) {
    throw new EventEncoderError("Event's event must not contain a newline character");
  }
}
function assertEventRetry(retry) {
  if (!Number.isInteger(retry) || retry < 0) {
    throw new EventEncoderError("Event's retry must be a integer and >= 0");
  }
}
function assertEventComment(comment) {
  if (comment.includes("\n")) {
    throw new EventEncoderError("Event's comment must not contain a newline character");
  }
}
function encodeEventData(data) {
  const lines = data?.split(/\n/) ?? [];
  let output = "";
  for (const line of lines) {
    output += `data: ${line}
`;
  }
  return output;
}
function encodeEventComments(comments) {
  let output = "";
  for (const comment of comments ?? []) {
    assertEventComment(comment);
    output += `: ${comment}
`;
  }
  return output;
}
function encodeEventMessage(message) {
  let output = "";
  output += encodeEventComments(message.comments);
  if (message.event !== void 0) {
    assertEventName(message.event);
    output += `event: ${message.event}
`;
  }
  if (message.retry !== void 0) {
    assertEventRetry(message.retry);
    output += `retry: ${message.retry}
`;
  }
  if (message.id !== void 0) {
    assertEventId(message.id);
    output += `id: ${message.id}
`;
  }
  output += encodeEventData(message.data);
  output += "\n";
  return output;
}
const EVENT_SOURCE_META_SYMBOL = Symbol("ORPC_EVENT_SOURCE_META");
function withEventMeta(container, meta) {
  if (meta.id === void 0 && meta.retry === void 0 && !meta.comments?.length) {
    return container;
  }
  if (meta.id !== void 0) {
    assertEventId(meta.id);
  }
  if (meta.retry !== void 0) {
    assertEventRetry(meta.retry);
  }
  if (meta.comments !== void 0) {
    for (const comment of meta.comments) {
      assertEventComment(comment);
    }
  }
  return new Proxy(container, {
    get(target, prop, receiver) {
      if (prop === EVENT_SOURCE_META_SYMBOL) {
        return meta;
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
function getEventMeta(container) {
  return isTypescriptObject(container) ? Reflect.get(container, EVENT_SOURCE_META_SYMBOL) : void 0;
}
class HibernationEventIterator extends AsyncIteratorClass {
  /**
   * this property is not transferred to the client, so it should be optional for type safety
   */
  hibernationCallback;
  constructor(hibernationCallback) {
    super(async () => {
      throw new Error("Cannot iterate over hibernating iterator directly");
    }, async (reason) => {
      if (reason !== "next") {
        throw new Error("Cannot cleanup hibernating iterator directly");
      }
    });
    this.hibernationCallback = hibernationCallback;
  }
}
function generateContentDisposition(filename) {
  const escapedFileName = filename.replace(/"/g, '\\"');
  const encodedFilenameStar = encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%(7C|60|5E)/g, (str, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  return `inline; filename="${escapedFileName}"; filename*=utf-8''${encodedFilenameStar}`;
}
function getFilenameFromContentDisposition(contentDisposition) {
  const encodedFilenameStarMatch = contentDisposition.match(/filename\*=(UTF-8'')?([^;]*)/i);
  if (encodedFilenameStarMatch && typeof encodedFilenameStarMatch[2] === "string") {
    return tryDecodeURIComponent(encodedFilenameStarMatch[2]);
  }
  const encodedFilenameMatch = contentDisposition.match(/filename="((?:\\"|[^"])*)"/i);
  if (encodedFilenameMatch && typeof encodedFilenameMatch[1] === "string") {
    return encodedFilenameMatch[1].replace(/\\"/g, '"');
  }
}
function flattenHeader(header) {
  if (typeof header === "string" || header === void 0) {
    return header;
  }
  if (header.length === 0) {
    return void 0;
  }
  return header.join(", ");
}
export {
  ErrorEvent as E,
  HibernationEventIterator as H,
  generateContentDisposition as a,
  getFilenameFromContentDisposition as b,
  EventDecoderStream as c,
  encodeEventMessage as e,
  flattenHeader as f,
  getEventMeta as g,
  withEventMeta as w
};
