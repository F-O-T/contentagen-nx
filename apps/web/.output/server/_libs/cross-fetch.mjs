import { g as getDefaultExportFromCjs } from "../_chunks/_libs/@ioredis/commands.mjs";
import { r as require$$0 } from "./node-fetch.mjs";
var nodePonyfill = { exports: {} };
var hasRequiredNodePonyfill;
function requireNodePonyfill() {
  if (hasRequiredNodePonyfill) return nodePonyfill.exports;
  hasRequiredNodePonyfill = 1;
  (function(module, exports$1) {
    const nodeFetch = require$$0;
    const realFetch = nodeFetch.default || nodeFetch;
    const fetch = function(url, options) {
      if (/^\/\//.test(url)) {
        url = "https:" + url;
      }
      return realFetch.call(this, url, options);
    };
    fetch.ponyfill = true;
    module.exports = exports$1 = fetch;
    exports$1.fetch = fetch;
    exports$1.Headers = nodeFetch.Headers;
    exports$1.Request = nodeFetch.Request;
    exports$1.Response = nodeFetch.Response;
    exports$1.default = fetch;
  })(nodePonyfill, nodePonyfill.exports);
  return nodePonyfill.exports;
}
var nodePonyfillExports = /* @__PURE__ */ requireNodePonyfill();
const fetch2 = /* @__PURE__ */ getDefaultExportFromCjs(nodePonyfillExports);
export {
  fetch2 as f,
  nodePonyfillExports as n
};
