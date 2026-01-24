import { a as requireShams$1 } from "./has-symbols.mjs";
var shams;
var hasRequiredShams;
function requireShams() {
  if (hasRequiredShams) return shams;
  hasRequiredShams = 1;
  var hasSymbols = /* @__PURE__ */ requireShams$1();
  shams = function hasToStringTagShams() {
    return hasSymbols() && !!Symbol.toStringTag;
  };
  return shams;
}
export {
  requireShams as r
};
