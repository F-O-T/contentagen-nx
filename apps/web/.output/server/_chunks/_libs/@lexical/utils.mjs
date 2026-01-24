import { R as Ri, ax as Ki, k as ki, l as dn, a as hi, aF as Sn, E as Et, z as zs, b as bs } from "../../../_libs/lexical.mjs";
function p(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var h = p((function(e) {
  const t = new URLSearchParams();
  t.append("code", e);
  for (let e2 = 1; e2 < arguments.length; e2++) t.append("v", arguments[e2]);
  throw Error(`Minified Lexical error #${e}; visit https://lexical.dev/docs/error?${t} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
const m = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement, v = m && "documentMode" in document ? document.documentMode : null;
!(!m || !("InputEvent" in window) || v) && "getTargetRanges" in new window.InputEvent("input");
function C(...e) {
  const t = [];
  for (const n of e) if (n && "string" == typeof n) for (const [e2] of n.matchAll(/\S+/g)) t.push(e2);
  return t;
}
function N(...e) {
  return () => {
    for (let t = e.length - 1; t >= 0; t--) e[t]();
    e.length = 0;
  };
}
function W(e, ...t) {
  const n = C(...t);
  n.length > 0 && e.classList.add(...n);
}
function j(e, ...t) {
  const n = C(...t);
  n.length > 0 && e.classList.remove(...n);
}
function te(e, t) {
  let n = e;
  for (; null != n; ) {
    if (n instanceof t) return n;
    n = n.getParent();
  }
  return null;
}
function ne(e) {
  const t = oe(e, ((e2) => bs(e2) && !e2.isInline()));
  return bs(t) || h(4, e.__key), t;
}
const oe = (e, t) => {
  let n = e;
  for (; n !== Et() && null != n; ) {
    if (t(n)) return n;
    n = n.getParent();
  }
  return null;
};
function ie(e) {
  const l = Ri() || Ki();
  if (ki(l)) {
    const { focus: t } = l, n = t.getNode(), r = t.offset;
    if (dn(n)) {
      const t2 = n.getChildAtIndex(r);
      null == t2 ? n.append(e) : t2.insertBefore(e), e.selectNext();
    } else {
      let t2, l2;
      hi(n) ? (t2 = n.getParentOrThrow(), l2 = n.getIndexWithinParent(), r > 0 && (l2 += 1, n.splitText(r))) : (t2 = n, l2 = r);
      const [, i] = Sn(t2, l2);
      i.insertBefore(e), i.selectStart();
    }
  } else {
    if (null != l) {
      const t2 = l.getNodes();
      t2[t2.length - 1].getTopLevelElementOrThrow().insertAfter(e);
    } else {
      Et().append(e);
    }
    const t = zs();
    e.insertAfter(t), t.select();
  }
  return e.getLatest();
}
function ue(e, t) {
  return null !== e && Object.getPrototypeOf(e).constructor.name === t.name;
}
function ce(e, t) {
  const n = [];
  for (let o = 0; o < e.length; o++) {
    const l = t(e[o]);
    null !== l && n.push(l);
  }
  return n;
}
function de(e, t) {
  const n = e.getFirstChild();
  null !== n ? n.insertBefore(t) : e.append(t);
}
export {
  N,
  W,
  ce as c,
  de as d,
  ie as i,
  j,
  ne as n,
  oe as o,
  te as t,
  ue as u
};
