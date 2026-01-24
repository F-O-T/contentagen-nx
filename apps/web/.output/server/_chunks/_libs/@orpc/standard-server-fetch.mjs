import { j as once, b as isAsyncIteratorObject, s as stringifyJSON, k as runInSpanContext, h as setSpanError, l as startSpan, d as runWithSpan, p as parseEmptyableJSON, A as AsyncIteratorClass, m as AbortError, a as isTypescriptObject } from "./shared.mjs";
import { a as generateContentDisposition, e as encodeEventMessage, g as getEventMeta, E as ErrorEvent, b as getFilenameFromContentDisposition, c as EventDecoderStream, w as withEventMeta } from "./standard-server.mjs";
function toEventIterator(stream, options = {}) {
  const eventStream = stream?.pipeThrough(new TextDecoderStream()).pipeThrough(new EventDecoderStream());
  const reader = eventStream?.getReader();
  let span;
  let isCancelled = false;
  return new AsyncIteratorClass(async () => {
    span ??= startSpan("consume_event_iterator_stream");
    try {
      while (true) {
        if (reader === void 0) {
          return { done: true, value: void 0 };
        }
        const { done, value } = await runInSpanContext(span, () => reader.read());
        if (done) {
          if (isCancelled) {
            throw new AbortError("Stream was cancelled");
          }
          return { done: true, value: void 0 };
        }
        switch (value.event) {
          case "message": {
            let message = parseEmptyableJSON(value.data);
            if (isTypescriptObject(message)) {
              message = withEventMeta(message, value);
            }
            span?.addEvent("message");
            return { done: false, value: message };
          }
          case "error": {
            let error = new ErrorEvent({
              data: parseEmptyableJSON(value.data)
            });
            error = withEventMeta(error, value);
            span?.addEvent("error");
            throw error;
          }
          case "done": {
            let done2 = parseEmptyableJSON(value.data);
            if (isTypescriptObject(done2)) {
              done2 = withEventMeta(done2, value);
            }
            span?.addEvent("done");
            return { done: true, value: done2 };
          }
          default: {
            span?.addEvent("maybe_keepalive");
          }
        }
      }
    } catch (e) {
      if (!(e instanceof ErrorEvent)) {
        setSpanError(span, e, options);
      }
      throw e;
    }
  }, async (reason) => {
    try {
      if (reason !== "next") {
        isCancelled = true;
        span?.addEvent("cancelled");
      }
      await runInSpanContext(span, () => reader?.cancel());
    } catch (e) {
      setSpanError(span, e, options);
      throw e;
    } finally {
      span?.end();
    }
  });
}
function toEventStream(iterator, options = {}) {
  const keepAliveEnabled = options.eventIteratorKeepAliveEnabled ?? true;
  const keepAliveInterval = options.eventIteratorKeepAliveInterval ?? 5e3;
  const keepAliveComment = options.eventIteratorKeepAliveComment ?? "";
  const initialCommentEnabled = options.eventIteratorInitialCommentEnabled ?? true;
  const initialComment = options.eventIteratorInitialComment ?? "";
  let cancelled = false;
  let timeout;
  let span;
  const stream = new ReadableStream({
    start(controller) {
      span = startSpan("stream_event_iterator");
      if (initialCommentEnabled) {
        controller.enqueue(encodeEventMessage({
          comments: [initialComment]
        }));
      }
    },
    async pull(controller) {
      try {
        if (keepAliveEnabled) {
          timeout = setInterval(() => {
            controller.enqueue(encodeEventMessage({
              comments: [keepAliveComment]
            }));
            span?.addEvent("keepalive");
          }, keepAliveInterval);
        }
        const value = await runInSpanContext(span, () => iterator.next());
        clearInterval(timeout);
        if (cancelled) {
          return;
        }
        const meta = getEventMeta(value.value);
        if (!value.done || value.value !== void 0 || meta !== void 0) {
          const event = value.done ? "done" : "message";
          controller.enqueue(encodeEventMessage({
            ...meta,
            event,
            data: stringifyJSON(value.value)
          }));
          span?.addEvent(event);
        }
        if (value.done) {
          controller.close();
          span?.end();
        }
      } catch (err) {
        clearInterval(timeout);
        if (cancelled) {
          return;
        }
        if (err instanceof ErrorEvent) {
          controller.enqueue(encodeEventMessage({
            ...getEventMeta(err),
            event: "error",
            data: stringifyJSON(err.data)
          }));
          span?.addEvent("error");
          controller.close();
        } else {
          setSpanError(span, err);
          controller.error(err);
        }
        span?.end();
      }
    },
    async cancel() {
      try {
        cancelled = true;
        clearInterval(timeout);
        span?.addEvent("cancelled");
        await runInSpanContext(span, () => iterator.return?.());
      } catch (e) {
        setSpanError(span, e);
        throw e;
      } finally {
        span?.end();
      }
    }
  }).pipeThrough(new TextEncoderStream());
  return stream;
}
function toStandardBody(re, options = {}) {
  return runWithSpan(
    { name: "parse_standard_body", signal: options.signal },
    async () => {
      const contentDisposition = re.headers.get("content-disposition");
      if (typeof contentDisposition === "string") {
        const fileName = getFilenameFromContentDisposition(contentDisposition) ?? "blob";
        const blob2 = await re.blob();
        return new File([blob2], fileName, {
          type: blob2.type
        });
      }
      const contentType = re.headers.get("content-type");
      if (!contentType || contentType.startsWith("application/json")) {
        const text = await re.text();
        return parseEmptyableJSON(text);
      }
      if (contentType.startsWith("multipart/form-data")) {
        return await re.formData();
      }
      if (contentType.startsWith("application/x-www-form-urlencoded")) {
        const text = await re.text();
        return new URLSearchParams(text);
      }
      if (contentType.startsWith("text/event-stream")) {
        return toEventIterator(re.body, options);
      }
      if (contentType.startsWith("text/plain")) {
        return await re.text();
      }
      const blob = await re.blob();
      return new File([blob], "blob", {
        type: blob.type
      });
    }
  );
}
function toFetchBody(body, headers, options = {}) {
  const currentContentDisposition = headers.get("content-disposition");
  headers.delete("content-type");
  headers.delete("content-disposition");
  if (body === void 0) {
    return void 0;
  }
  if (body instanceof Blob) {
    headers.set("content-type", body.type);
    headers.set("content-length", body.size.toString());
    headers.set(
      "content-disposition",
      currentContentDisposition ?? generateContentDisposition(body instanceof File ? body.name : "blob")
    );
    return body;
  }
  if (body instanceof FormData) {
    return body;
  }
  if (body instanceof URLSearchParams) {
    return body;
  }
  if (isAsyncIteratorObject(body)) {
    headers.set("content-type", "text/event-stream");
    return toEventStream(body, options);
  }
  headers.set("content-type", "application/json");
  return stringifyJSON(body);
}
function toStandardHeaders(headers, standardHeaders = {}) {
  headers.forEach((value, key) => {
    if (Array.isArray(standardHeaders[key])) {
      standardHeaders[key].push(value);
    } else if (standardHeaders[key] !== void 0) {
      standardHeaders[key] = [standardHeaders[key], value];
    } else {
      standardHeaders[key] = value;
    }
  });
  return standardHeaders;
}
function toFetchHeaders(headers, fetchHeaders = new Headers()) {
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        fetchHeaders.append(key, v);
      }
    } else if (value !== void 0) {
      fetchHeaders.append(key, value);
    }
  }
  return fetchHeaders;
}
function toStandardLazyRequest(request) {
  return {
    url: new URL(request.url),
    signal: request.signal,
    method: request.method,
    body: once(() => toStandardBody(request, { signal: request.signal })),
    get headers() {
      const headers = toStandardHeaders(request.headers);
      Object.defineProperty(this, "headers", { value: headers, writable: true });
      return headers;
    },
    set headers(value) {
      Object.defineProperty(this, "headers", { value, writable: true });
    }
  };
}
function toFetchResponse(response, options = {}) {
  const headers = toFetchHeaders(response.headers);
  const body = toFetchBody(response.body, headers, options);
  return new Response(body, { headers, status: response.status });
}
export {
  toFetchResponse as a,
  toStandardLazyRequest as t
};
