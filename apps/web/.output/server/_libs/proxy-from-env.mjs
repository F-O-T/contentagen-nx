import { g as getDefaultExportFromCjs } from "../_chunks/_libs/@ioredis/commands.mjs";
import Url from "url";
var proxyFromEnv$1 = {};
var hasRequiredProxyFromEnv;
function requireProxyFromEnv() {
  if (hasRequiredProxyFromEnv) return proxyFromEnv$1;
  hasRequiredProxyFromEnv = 1;
  var parseUrl = Url.parse;
  var DEFAULT_PORTS = {
    ftp: 21,
    gopher: 70,
    http: 80,
    https: 443,
    ws: 80,
    wss: 443
  };
  var stringEndsWith = String.prototype.endsWith || function(s) {
    return s.length <= this.length && this.indexOf(s, this.length - s.length) !== -1;
  };
  function getProxyForUrl(url) {
    var parsedUrl = typeof url === "string" ? parseUrl(url) : url || {};
    var proto = parsedUrl.protocol;
    var hostname = parsedUrl.host;
    var port = parsedUrl.port;
    if (typeof hostname !== "string" || !hostname || typeof proto !== "string") {
      return "";
    }
    proto = proto.split(":", 1)[0];
    hostname = hostname.replace(/:\d*$/, "");
    port = parseInt(port) || DEFAULT_PORTS[proto] || 0;
    if (!shouldProxy(hostname, port)) {
      return "";
    }
    var proxy = getEnv("npm_config_" + proto + "_proxy") || getEnv(proto + "_proxy") || getEnv("npm_config_proxy") || getEnv("all_proxy");
    if (proxy && proxy.indexOf("://") === -1) {
      proxy = proto + "://" + proxy;
    }
    return proxy;
  }
  function shouldProxy(hostname, port) {
    var NO_PROXY = (getEnv("npm_config_no_proxy") || getEnv("no_proxy")).toLowerCase();
    if (!NO_PROXY) {
      return true;
    }
    if (NO_PROXY === "*") {
      return false;
    }
    return NO_PROXY.split(/[,\s]/).every(function(proxy) {
      if (!proxy) {
        return true;
      }
      var parsedProxy = proxy.match(/^(.+):(\d+)$/);
      var parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
      var parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
      if (parsedProxyPort && parsedProxyPort !== port) {
        return true;
      }
      if (!/^[.*]/.test(parsedProxyHostname)) {
        return hostname !== parsedProxyHostname;
      }
      if (parsedProxyHostname.charAt(0) === "*") {
        parsedProxyHostname = parsedProxyHostname.slice(1);
      }
      return !stringEndsWith.call(hostname, parsedProxyHostname);
    });
  }
  function getEnv(key) {
    return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || "";
  }
  proxyFromEnv$1.getProxyForUrl = getProxyForUrl;
  return proxyFromEnv$1;
}
var proxyFromEnvExports = /* @__PURE__ */ requireProxyFromEnv();
const proxyFromEnv = /* @__PURE__ */ getDefaultExportFromCjs(proxyFromEnvExports);
export {
  proxyFromEnv as p
};
