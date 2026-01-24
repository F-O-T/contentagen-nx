import { E as Et, H as Es, b as bs, u as Ws, a as hi } from "../../../_libs/lexical.mjs";
function s() {
  return Et().getTextContent();
}
function u(t, e = true) {
  if (t) return false;
  let n = s();
  return e && (n = n.trim()), "" === n;
}
function c(o) {
  if (!u(o, false)) return false;
  const l = Et().getChildren(), s2 = l.length;
  if (s2 > 1) return false;
  for (let t = 0; t < s2; t++) {
    const o2 = l[t];
    if (Es(o2)) return false;
    if (bs(o2)) {
      if (!Ws(o2)) return false;
      if (0 !== o2.__indent) return false;
      const e = o2.getChildren(), n = e.length;
      for (let r = 0; r < n; r++) {
        const n2 = e[t];
        if (!hi(n2)) return false;
      }
    }
  }
  return true;
}
function g(t) {
  return () => c(t);
}
function d(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
d((function(t) {
  const e = new URLSearchParams();
  e.append("code", t);
  for (let t2 = 1; t2 < arguments.length; t2++) e.append("v", arguments[t2]);
  throw Error(`Minified Lexical error #${t}; visit https://lexical.dev/docs/error?${e} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
export {
  g
};
