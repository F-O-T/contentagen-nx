import { h, m } from "./html.mjs";
import { O as O$1, F } from "./selection.mjs";
import { u as ue } from "./utils.mjs";
import { k as ki, R as Ri, p as pi, v as vn, A as A$1, U as Us, n, h as hs, a as hi, c as ct, P as Pn, E as Et, b as bs, D as Dn } from "../../../_libs/lexical.mjs";
function y(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var T = y((function(t) {
  const e = new URLSearchParams();
  e.append("code", t);
  for (let t2 = 1; t2 < arguments.length; t2++) e.append("v", arguments[t2]);
  throw Error(`Minified Lexical error #${t}; visit https://lexical.dev/docs/error?${e} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
function v(e, n2 = Ri()) {
  return null == n2 && T(166), ki(n2) && n2.isCollapsed() || 0 === n2.getNodes().length ? "" : m(e, n2);
}
function C(t, e = Ri()) {
  return null == e && T(166), ki(e) && e.isCollapsed() || 0 === e.getNodes().length ? null : JSON.stringify(A(t, e));
}
function N(t, n2, o) {
  const r = t.getData("application/x-lexical-editor");
  if (r) try {
    const t2 = JSON.parse(r);
    if (t2.namespace === o._config.namespace && Array.isArray(t2.nodes)) {
      return _(o, R(t2.nodes), n2);
    }
  } catch (t2) {
  }
  const c = t.getData("text/html");
  if (c) try {
    const t2 = new DOMParser().parseFromString((function(t3) {
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        return window.trustedTypes.createPolicy("lexical", { createHTML: (t4) => t4 }).createHTML(t3);
      }
      return t3;
    })(c), "text/html");
    return _(o, h(o, t2), n2);
  } catch (t2) {
  }
  const a = t.getData("text/plain") || t.getData("text/uri-list");
  if (null != a) if (ki(n2)) {
    const t2 = a.split(/(\r?\n|\t)/);
    "" === t2[t2.length - 1] && t2.pop();
    for (let e = 0; e < t2.length; e++) {
      const n3 = Ri();
      if (ki(n3)) {
        const o2 = t2[e];
        "\n" === o2 || "\r\n" === o2 ? n3.insertParagraph() : "	" === o2 ? n3.insertNodes([pi()]) : n3.insertText(o2);
      }
    }
  } else n2.insertRawText(a);
}
function _(t, e, n$1) {
  t.dispatchCommand(n, { nodes: e, selection: n$1 }) || n$1.insertNodes(e);
}
function P(t, e, n2, r = []) {
  let l = null === e || n2.isSelected(e);
  const i = bs(n2) && n2.excludeFromCopy("html");
  let s = n2;
  if (null !== e) {
    let t2 = Dn(n2);
    t2 = hi(t2) && null !== e ? F(e, t2) : t2, s = t2;
  }
  const c = bs(s) ? s.getChildren() : [], a = (function(t2) {
    const e2 = t2.exportJSON(), n3 = t2.constructor;
    if (e2.type !== n3.getType() && T(58, n3.name), bs(t2)) {
      const t3 = e2.children;
      Array.isArray(t3) || T(59, n3.name);
    }
    return e2;
  })(s);
  if (hi(s)) {
    const t2 = s.__text;
    t2.length > 0 ? a.text = t2 : l = false;
  }
  for (let o = 0; o < c.length; o++) {
    const r2 = c[o], i2 = P(t, e, r2, a.children);
    !l && bs(n2) && i2 && n2.extractWithChild(r2, e, "clone") && (l = true);
  }
  if (l && !i) r.push(a);
  else if (Array.isArray(a.children)) for (let t2 = 0; t2 < a.children.length; t2++) {
    const e2 = a.children[t2];
    r.push(e2);
  }
  return l;
}
function A(t, e) {
  const n2 = [], o = Et().getChildren();
  for (let r = 0; r < o.length; r++) {
    P(t, e, o[r], n2);
  }
  return { namespace: t._config.namespace, nodes: n2 };
}
function R(t) {
  const e = [];
  for (let o = 0; o < t.length; o++) {
    const r = t[o], l = hs(r);
    hi(l) && O$1(l), e.push(l);
  }
  return e;
}
let S = null;
async function O(t, e, n2) {
  if (null !== S) return false;
  if (null !== e) return new Promise(((o2, r) => {
    t.update((() => {
      o2(E(t, e, n2));
    }));
  }));
  const o = t.getRootElement(), l = null == t._window ? window.document : t._window.document, i = vn(t._window);
  if (null === o || null === i) return false;
  const s = l.createElement("span");
  s.style.cssText = "position: fixed; top: -1000px;", s.append(l.createTextNode("#")), o.append(s);
  const c = new Range();
  return c.setStart(s, 0), c.setEnd(s, 1), i.removeAllRanges(), i.addRange(c), new Promise(((e2, o2) => {
    const i2 = t.registerCommand(A$1, ((o3) => (ue(o3, ClipboardEvent) && (i2(), null !== S && (window.clearTimeout(S), S = null), e2(E(t, o3, n2))), true)), Us);
    S = window.setTimeout((() => {
      i2(), S = null, e2(false);
    }), 50), l.execCommand("copy"), s.remove();
  }));
}
function E(t, e, n2) {
  if (void 0 === n2) {
    const e2 = vn(t._window);
    if (!e2) return false;
    const o2 = e2.anchorNode, r = e2.focusNode;
    if (null !== o2 && null !== r && !ct(t, o2, r)) return false;
    const l = Ri();
    if (null === l) return false;
    n2 = L(l);
  }
  e.preventDefault();
  const o = e.clipboardData;
  return null !== o && (b(o, n2), true);
}
const M = [["text/html", v], ["application/x-lexical-editor", C]];
function L(t = Ri()) {
  const e = { "text/plain": t ? t.getTextContent() : "" };
  if (t) {
    const n2 = Pn();
    for (const [o, r] of M) {
      const l = r(n2, t);
      null !== l && (e[o] = l);
    }
  }
  return e;
}
function b(t, e) {
  for (const n2 in e) {
    const o = e[n2];
    void 0 !== o && t.setData(n2, o);
  }
}
export {
  L,
  N,
  O
};
