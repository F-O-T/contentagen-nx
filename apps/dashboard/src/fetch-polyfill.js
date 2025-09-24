// fetch-polyfill.js
//@ts-nocheck
import fetch, { Headers, Request, Response } from "node-fetch";

if (!globalThis.fetch) {
   globalThis.fetch = fetch;
   globalThis.Headers = Headers;
   globalThis.Request = Request;
   globalThis.Response = Response;
}
