import { am as Yt, H as Es, b as bs, F as Fs, av as Ei } from "../../../_libs/lexical.mjs";
function m(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
m((function(e) {
  const t = new URLSearchParams();
  t.append("code", e);
  for (let e2 = 1; e2 < arguments.length; e2++) t.append("v", arguments[e2]);
  throw Error(`Minified Lexical error #${e}; visit https://lexical.dev/docs/error?${t} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
const x = /* @__PURE__ */ new Map();
function w(e) {
  const t = {};
  if (!e) return t;
  const n = e.split(";");
  for (const e2 of n) if ("" !== e2) {
    const [n2, l] = e2.split(/:([^]+)/);
    n2 && l && (t[n2.trim()] = l.trim());
  }
  return t;
}
function F(e, n) {
  const l = e.getStartEndPoints();
  if (n.isSelected(e) && !n.isSegmented() && !n.isToken() && null !== l) {
    const [o, r] = l, s = e.isBackward(), i = o.getNode(), c = r.getNode(), f = n.is(i), u = n.is(c);
    if (f || u) {
      const [l2, o2] = Ei(e), r2 = i.is(c), f2 = n.is(s ? c : i), u2 = n.is(s ? i : c);
      let g, a = 0;
      if (r2) a = l2 > o2 ? o2 : l2, g = l2 > o2 ? l2 : o2;
      else if (f2) {
        a = s ? o2 : l2, g = void 0;
      } else if (u2) {
        a = 0, g = s ? l2 : o2;
      }
      return n.__text = n.__text.slice(a, g), n;
    }
  }
  return n;
}
function O(e) {
  const t = e.getStyle(), n = w(t);
  x.set(t, n);
}
function L(e, t) {
  const l = Yt(e.focus, t);
  return Es(l) && !l.isIsolated() || bs(l) && !l.isInline() && !l.canBeEmpty();
}
function D(e, t, n, l) {
  e.modify(t ? "extend" : "move", n, l);
}
function M(e) {
  const t = e.anchor.getNode();
  return "rtl" === (Fs(t) ? t : t.getParentOrThrow()).getDirection();
}
function $(e, t, n) {
  const l = M(e);
  D(e, t, n ? !l : l, "character");
}
export {
  $,
  F,
  L,
  O
};
