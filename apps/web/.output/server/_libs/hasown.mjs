import { r as requireFunctionBind } from "./function-bind.mjs";
var hasown;
var hasRequiredHasown;
function requireHasown() {
  if (hasRequiredHasown) return hasown;
  hasRequiredHasown = 1;
  var call = Function.prototype.call;
  var $hasOwn = Object.prototype.hasOwnProperty;
  var bind = /* @__PURE__ */ requireFunctionBind();
  hasown = bind.call(call, $hasOwn);
  return hasown;
}
export {
  requireHasown as r
};
