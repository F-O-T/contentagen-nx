import { r as requireGetIntrinsic } from "./get-intrinsic.mjs";
import { r as requireShams } from "./has-tostringtag.mjs";
import { r as requireHasown } from "./hasown.mjs";
import { r as requireType } from "./es-errors.mjs";
var esSetTostringtag;
var hasRequiredEsSetTostringtag;
function requireEsSetTostringtag() {
  if (hasRequiredEsSetTostringtag) return esSetTostringtag;
  hasRequiredEsSetTostringtag = 1;
  var GetIntrinsic = /* @__PURE__ */ requireGetIntrinsic();
  var $defineProperty = GetIntrinsic("%Object.defineProperty%", true);
  var hasToStringTag = /* @__PURE__ */ requireShams()();
  var hasOwn = /* @__PURE__ */ requireHasown();
  var $TypeError = /* @__PURE__ */ requireType();
  var toStringTag = hasToStringTag ? Symbol.toStringTag : null;
  esSetTostringtag = function setToStringTag(object, value) {
    var overrideIfSet = arguments.length > 2 && !!arguments[2] && arguments[2].force;
    var nonConfigurable = arguments.length > 2 && !!arguments[2] && arguments[2].nonConfigurable;
    if (typeof overrideIfSet !== "undefined" && typeof overrideIfSet !== "boolean" || typeof nonConfigurable !== "undefined" && typeof nonConfigurable !== "boolean") {
      throw new $TypeError("if provided, the `overrideIfSet` and `nonConfigurable` options must be booleans");
    }
    if (toStringTag && (overrideIfSet || !hasOwn(object, toStringTag))) {
      if ($defineProperty) {
        $defineProperty(object, toStringTag, {
          configurable: !nonConfigurable,
          enumerable: false,
          value,
          writable: false
        });
      } else {
        object[toStringTag] = value;
      }
    }
  };
  return esSetTostringtag;
}
export {
  requireEsSetTostringtag as r
};
