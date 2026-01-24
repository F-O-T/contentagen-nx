var built = {};
var utils = {};
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.tryCatch = exports$1.errorObj = void 0;
    exports$1.errorObj = { e: {} };
    let tryCatchTarget;
    function tryCatcher(err, val) {
      try {
        const target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
      } catch (e) {
        exports$1.errorObj.e = e;
        return exports$1.errorObj;
      }
    }
    function tryCatch(fn) {
      tryCatchTarget = fn;
      return tryCatcher;
    }
    exports$1.tryCatch = tryCatch;
  })(utils);
  return utils;
}
var hasRequiredBuilt;
function requireBuilt() {
  if (hasRequiredBuilt) return built;
  hasRequiredBuilt = 1;
  Object.defineProperty(built, "__esModule", { value: true });
  const utils_1 = /* @__PURE__ */ requireUtils();
  function throwLater(e) {
    setTimeout(function() {
      throw e;
    }, 0);
  }
  function asCallback(promise, nodeback, options) {
    if (typeof nodeback === "function") {
      promise.then((val) => {
        let ret;
        if (options !== void 0 && Object(options).spread && Array.isArray(val)) {
          ret = utils_1.tryCatch(nodeback).apply(void 0, [null].concat(val));
        } else {
          ret = val === void 0 ? utils_1.tryCatch(nodeback)(null) : utils_1.tryCatch(nodeback)(null, val);
        }
        if (ret === utils_1.errorObj) {
          throwLater(ret.e);
        }
      }, (cause) => {
        if (!cause) {
          const newReason = new Error(cause + "");
          Object.assign(newReason, { cause });
          cause = newReason;
        }
        const ret = utils_1.tryCatch(nodeback)(cause);
        if (ret === utils_1.errorObj) {
          throwLater(ret.e);
        }
      });
    }
    return promise;
  }
  built.default = asCallback;
  return built;
}
export {
  requireBuilt as r
};
