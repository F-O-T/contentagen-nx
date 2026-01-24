import { F } from "./selection.mjs";
import { I as Is, q as qr, l as dn, M as Mi, w as wn, m as bn, b as bs, E as Et, D as Dn, a as hi, T as Tn, o as kn, z as zs } from "../../../_libs/lexical.mjs";
function h(e, n) {
  const t = n.body ? n.body.childNodes : [];
  let o = [];
  const l = [];
  for (let n2 = 0; n2 < t.length; n2++) {
    const r = t[n2];
    if (!x.has(r.nodeName)) {
      const n3 = y(r, e, l, false);
      null !== n3 && (o = o.concat(n3));
    }
  }
  return (function(e2) {
    for (const n2 of e2) n2.getNextSibling() instanceof Is && n2.insertAfter(qr());
    for (const n2 of e2) {
      const e3 = n2.getChildren();
      for (const t2 of e3) n2.insertBefore(t2);
      n2.remove();
    }
  })(l), o;
}
function m(e, n) {
  if ("undefined" == typeof document || "undefined" == typeof window && void 0 === global.window) throw new Error("To use $generateHtmlFromNodes in headless mode please initialize a headless browser implementation such as JSDom before calling this function.");
  const t = document.createElement("div"), l = Et().getChildren();
  for (let o = 0; o < l.length; o++) {
    g(e, l[o], t, n);
  }
  return t.innerHTML;
}
function g(t, o, c, u = null) {
  let f = null === u || o.isSelected(u);
  const a = bs(o) && o.excludeFromCopy("html");
  let d = o;
  if (null !== u) {
    let n = Dn(o);
    n = hi(n) && null !== u ? F(u, n) : n, d = n;
  }
  const p = bs(d) ? d.getChildren() : [], h2 = t._nodes.get(d.getType());
  let m2;
  m2 = h2 && void 0 !== h2.exportDOM ? h2.exportDOM(t, d) : d.exportDOM(t);
  const { element: x2, after: y2 } = m2;
  if (!x2) return false;
  const w2 = document.createDocumentFragment();
  for (let e = 0; e < p.length; e++) {
    const n = p[e], r = g(t, n, w2, u);
    !f && bs(o) && r && o.extractWithChild(n, u, "html") && (f = true);
  }
  if (f && !a) {
    if ((Tn(x2) || kn(x2)) && x2.append(w2), c.append(x2), y2) {
      const e = y2.call(d, x2);
      e && (kn(x2) ? x2.replaceChildren(e) : x2.replaceWith(e));
    }
  } else c.append(w2);
  return f;
}
const x = /* @__PURE__ */ new Set(["STYLE", "SCRIPT"]);
function y(e, n, o, r, i = /* @__PURE__ */ new Map(), s) {
  let h2 = [];
  if (x.has(e.nodeName)) return h2;
  let m2 = null;
  const g2 = (function(e2, n2) {
    const { nodeName: t } = e2, o2 = n2._htmlConversions.get(t.toLowerCase());
    let l = null;
    if (void 0 !== o2) for (const n3 of o2) {
      const t2 = n3(e2);
      null !== t2 && (null === l || (l.priority || 0) <= (t2.priority || 0)) && (l = t2);
    }
    return null !== l ? l.conversion : null;
  })(e, n), b = g2 ? g2(e) : null;
  let C = null;
  if (null !== b) {
    C = b.after;
    const n2 = b.node;
    if (m2 = Array.isArray(n2) ? n2[n2.length - 1] : n2, null !== m2) {
      for (const [, e2] of i) if (m2 = e2(m2, s), !m2) break;
      m2 && h2.push(...Array.isArray(n2) ? n2 : [m2]);
    }
    null != b.forChild && i.set(e.nodeName, b.forChild);
  }
  const S = e.childNodes;
  let v = [];
  const N = (null == m2 || !dn(m2)) && (null != m2 && Mi(m2) || r);
  for (let e2 = 0; e2 < S.length; e2++) v.push(...y(S[e2], n, o, N, new Map(i), m2));
  return null != C && (v = C(v)), wn(e) && (v = w(e, v, N ? () => {
    const e2 = new Is();
    return o.push(e2), e2;
  } : zs)), null == m2 ? v.length > 0 ? h2 = h2.concat(v) : wn(e) && (function(e2) {
    if (null == e2.nextSibling || null == e2.previousSibling) return false;
    return bn(e2.nextSibling) && bn(e2.previousSibling);
  })(e) && (h2 = h2.concat(qr())) : bs(m2) && m2.append(...v), h2;
}
function w(e, n, t) {
  const o = e.style.textAlign, l = [];
  let r = [];
  for (let e2 = 0; e2 < n.length; e2++) {
    const i = n[e2];
    if (Mi(i)) o && !i.getFormat() && i.setFormat(o), l.push(i);
    else if (r.push(i), e2 === n.length - 1 || e2 < n.length - 1 && Mi(n[e2 + 1])) {
      const e3 = t();
      e3.setFormat(o), e3.append(...r), l.push(e3), r = [];
    }
  }
  return l;
}
export {
  h,
  m
};
