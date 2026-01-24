import { N as N$1, O } from "./clipboard.mjs";
import { L as L$1, $ } from "./selection.mjs";
import { W, N, u as ue, n as ne, o as oe } from "./utils.mjs";
import { d as ks, T as Tn, z as zs, g as gn, a6 as Mn, a0 as c, s as e, a7 as lt$1, R as Ri, f as Rs, a8 as B, k as ki, S as wi, A, a9 as z, aa as Ht, ab as M, ac as bt, H as Es, ad as D, ae as L, N as Ai, a as hi, a2 as nt, O as Ft, af as b, ag as C, ah as s, x as o, _ as w, ai as i, Z as k, F as Fs, a3 as F, aj as p, ak as m, al as S, E as Et$1, am as Yt, an as v, a4 as P, a5 as E, ao as Hi, p as pi, ap as O$1, aq as d, ar as a, as as l, at as f, au as u, $ as r, b as bs } from "../../../_libs/lexical.mjs";
function ct(t, e2) {
  if (void 0 !== document.caretRangeFromPoint) {
    const n = document.caretRangeFromPoint(t, e2);
    return null === n ? null : { node: n.startContainer, offset: n.startOffset };
  }
  if ("undefined" !== document.caretPositionFromPoint) {
    const n = document.caretPositionFromPoint(t, e2);
    return null === n ? null : { node: n.offsetNode, offset: n.offset };
  }
  return null;
}
const at = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement, ut = at && "documentMode" in document ? document.documentMode : null, lt = !(!at || !("InputEvent" in window) || ut) && "getTargetRanges" in new window.InputEvent("input"), dt = at && /Version\/[\d.]+.*Safari/.test(navigator.userAgent), mt = at && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, ft = at && /^(?=.*Chrome).*/i.test(navigator.userAgent), gt = at && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && !ft, pt = e();
class ht extends ks {
  static getType() {
    return "quote";
  }
  static clone(t) {
    return new ht(t.__key);
  }
  constructor(t) {
    super(t);
  }
  createDOM(t) {
    const e2 = document.createElement("blockquote");
    return W(e2, t.theme.quote), e2;
  }
  updateDOM(t, e2) {
    return false;
  }
  static importDOM() {
    return { blockquote: (t) => ({ conversion: wt, priority: 0 }) };
  }
  exportDOM(t) {
    const { element: e2 } = super.exportDOM(t);
    if (e2 && Tn(e2)) {
      this.isEmpty() && e2.append(document.createElement("br"));
      const t2 = this.getFormatType();
      e2.style.textAlign = t2;
      const n = this.getDirection();
      n && (e2.dir = n);
    }
    return { element: e2 };
  }
  static importJSON(t) {
    const e2 = Ct();
    return e2.setFormat(t.format), e2.setIndent(t.indent), e2.setDirection(t.direction), e2;
  }
  exportJSON() {
    return { ...super.exportJSON(), type: "quote" };
  }
  insertNewAfter(t, e2) {
    const n = zs(), r2 = this.getDirection();
    return n.setDirection(r2), this.insertAfter(n, e2), n;
  }
  collapseAtStart() {
    const t = zs();
    return this.getChildren().forEach(((e2) => t.append(e2))), this.replace(t), true;
  }
  canMergeWhenEmpty() {
    return true;
  }
}
function Ct() {
  return gn(new ht());
}
function vt(t) {
  return t instanceof ht;
}
class yt extends ks {
  static getType() {
    return "heading";
  }
  static clone(t) {
    return new yt(t.__tag, t.__key);
  }
  constructor(t, e2) {
    super(e2), this.__tag = t;
  }
  getTag() {
    return this.__tag;
  }
  createDOM(t) {
    const e2 = this.__tag, n = document.createElement(e2), r2 = t.theme.heading;
    if (void 0 !== r2) {
      const t2 = r2[e2];
      W(n, t2);
    }
    return n;
  }
  updateDOM(t, e2) {
    return false;
  }
  static importDOM() {
    return { h1: (t) => ({ conversion: xt, priority: 0 }), h2: (t) => ({ conversion: xt, priority: 0 }), h3: (t) => ({ conversion: xt, priority: 0 }), h4: (t) => ({ conversion: xt, priority: 0 }), h5: (t) => ({ conversion: xt, priority: 0 }), h6: (t) => ({ conversion: xt, priority: 0 }), p: (t) => {
      const e2 = t.firstChild;
      return null !== e2 && Dt(e2) ? { conversion: () => ({ node: null }), priority: 3 } : null;
    }, span: (t) => Dt(t) ? { conversion: (t2) => ({ node: Et("h1") }), priority: 3 } : null };
  }
  exportDOM(t) {
    const { element: e2 } = super.exportDOM(t);
    if (e2 && Tn(e2)) {
      this.isEmpty() && e2.append(document.createElement("br"));
      const t2 = this.getFormatType();
      e2.style.textAlign = t2;
      const n = this.getDirection();
      n && (e2.dir = n);
    }
    return { element: e2 };
  }
  static importJSON(t) {
    const e2 = Et(t.tag);
    return e2.setFormat(t.format), e2.setIndent(t.indent), e2.setDirection(t.direction), e2;
  }
  exportJSON() {
    return { ...super.exportJSON(), tag: this.getTag(), type: "heading", version: 1 };
  }
  insertNewAfter(t, e2 = true) {
    const n = t ? t.anchor.offset : 0, r2 = this.getLastDescendant(), o2 = !r2 || t && t.anchor.key === r2.getKey() && n === r2.getTextContentSize() || !t ? zs() : Et(this.getTag()), i2 = this.getDirection();
    if (o2.setDirection(i2), this.insertAfter(o2, e2), 0 === n && !this.isEmpty() && t) {
      const t2 = zs();
      t2.select(), this.replace(t2, true);
    }
    return o2;
  }
  collapseAtStart() {
    const t = this.isEmpty() ? zs() : Et(this.getTag());
    return this.getChildren().forEach(((e2) => t.append(e2))), this.replace(t), true;
  }
  extractWithChild() {
    return true;
  }
}
function Dt(t) {
  return "span" === t.nodeName.toLowerCase() && "26pt" === t.style.fontSize;
}
function xt(t) {
  const e2 = t.nodeName.toLowerCase();
  let n = null;
  return "h1" !== e2 && "h2" !== e2 && "h3" !== e2 && "h4" !== e2 && "h5" !== e2 && "h6" !== e2 || (n = Et(e2), null !== t.style && (Mn(t, n), n.setFormat(t.style.textAlign))), { node: n };
}
function wt(t) {
  const e2 = Ct();
  return null !== t.style && (e2.setFormat(t.style.textAlign), Mn(t, e2)), { node: e2 };
}
function Et(t) {
  return gn(new yt(t));
}
function Nt(t) {
  return t instanceof yt;
}
function It(t) {
  let e2 = null;
  if (ue(t, DragEvent) ? e2 = t.dataTransfer : ue(t, ClipboardEvent) && (e2 = t.clipboardData), null === e2) return [false, [], false];
  const n = e2.types, r2 = n.includes("Files"), o2 = n.includes("text/html") || n.includes("text/plain");
  return [r2, Array.from(e2.files), o2];
}
function Ot(t) {
  const e2 = Ri();
  if (!ki(e2)) return false;
  const n = /* @__PURE__ */ new Set(), r2 = e2.getNodes();
  for (let e3 = 0; e3 < r2.length; e3++) {
    const o2 = r2[e3], i2 = o2.getKey();
    if (n.has(i2)) continue;
    const s2 = oe(o2, ((t2) => bs(t2) && !t2.isInline()));
    if (null === s2) continue;
    const c2 = s2.getKey();
    s2.canIndent() && !n.has(c2) && (n.add(c2), t(s2));
  }
  return n.size > 0;
}
function Tt(t) {
  const e2 = bt(t);
  return Es(e2);
}
function At(o$1) {
  return N(o$1.registerCommand(r, ((t) => {
    const e2 = Ri();
    return !!wi(e2) && (e2.clear(), true);
  }), 0), o$1.registerCommand(i, ((t) => {
    const e2 = Ri();
    return !!ki(e2) && (e2.deleteCharacter(t), true);
  }), Rs), o$1.registerCommand(u, ((t) => {
    const e2 = Ri();
    return !!ki(e2) && (e2.deleteWord(t), true);
  }), Rs), o$1.registerCommand(f, ((t) => {
    const e2 = Ri();
    return !!ki(e2) && (e2.deleteLine(t), true);
  }), Rs), o$1.registerCommand(l, ((e2) => {
    const n = Ri();
    if ("string" == typeof e2) null !== n && n.insertText(e2);
    else {
      if (null === n) return false;
      const r2 = e2.dataTransfer;
      if (null != r2) N$1(r2, n, o$1);
      else if (ki(n)) {
        const t = e2.data;
        return t && n.insertText(t), true;
      }
    }
    return true;
  }), Rs), o$1.registerCommand(a, (() => {
    const t = Ri();
    return !!ki(t) && (t.removeText(), true);
  }), Rs), o$1.registerCommand(d, ((t) => {
    const e2 = Ri();
    return !!ki(e2) && (e2.formatText(t), true);
  }), Rs), o$1.registerCommand(O$1, ((t) => {
    const e2 = Ri();
    if (!ki(e2) && !wi(e2)) return false;
    const n = e2.getNodes();
    for (const e3 of n) {
      const n2 = oe(e3, ((t2) => bs(t2) && !t2.isInline()));
      null !== n2 && n2.setFormat(t);
    }
    return true;
  }), Rs), o$1.registerCommand(s, ((t) => {
    const e2 = Ri();
    return !!ki(e2) && (e2.insertLineBreak(t), true);
  }), Rs), o$1.registerCommand(o, (() => {
    const t = Ri();
    return !!ki(t) && (t.insertParagraph(), true);
  }), Rs), o$1.registerCommand(E, (() => (Hi([pi()]), true)), Rs), o$1.registerCommand(P, (() => Ot(((t) => {
    const e2 = t.getIndent();
    t.setIndent(e2 + 1);
  }))), Rs), o$1.registerCommand(F, (() => Ot(((t) => {
    const e2 = t.getIndent();
    e2 > 0 && t.setIndent(e2 - 1);
  }))), Rs), o$1.registerCommand(v, ((t) => {
    const e2 = Ri();
    if (wi(e2) && !Tt(t.target)) {
      const t2 = e2.getNodes();
      if (t2.length > 0) return t2[0].selectPrevious(), true;
    } else if (ki(e2)) {
      const n = Yt(e2.focus, true);
      if (!t.shiftKey && Es(n) && !n.isIsolated() && !n.isInline()) return n.selectPrevious(), t.preventDefault(), true;
    }
    return false;
  }), Rs), o$1.registerCommand(S, ((t) => {
    const e2 = Ri();
    if (wi(e2)) {
      const t2 = e2.getNodes();
      if (t2.length > 0) return t2[0].selectNext(0, 0), true;
    } else if (ki(e2)) {
      if ((function(t2) {
        const e3 = t2.focus;
        return "root" === e3.key && e3.offset === Et$1().getChildrenSize();
      })(e2)) return t.preventDefault(), true;
      const n = Yt(e2.focus, false);
      if (!t.shiftKey && Es(n) && !n.isIsolated() && !n.isInline()) return n.selectNext(), t.preventDefault(), true;
    }
    return false;
  }), Rs), o$1.registerCommand(m, ((t) => {
    const e2 = Ri();
    if (wi(e2)) {
      const n = e2.getNodes();
      if (n.length > 0) return t.preventDefault(), n[0].selectPrevious(), true;
    }
    if (!ki(e2)) return false;
    if (L$1(e2, true)) {
      const n = t.shiftKey;
      return t.preventDefault(), $(e2, n, true), true;
    }
    return false;
  }), Rs), o$1.registerCommand(p, ((t) => {
    const e2 = Ri();
    if (wi(e2) && !Tt(t.target)) {
      const n = e2.getNodes();
      if (n.length > 0) return t.preventDefault(), n[0].selectNext(0, 0), true;
    }
    if (!ki(e2)) return false;
    const o2 = t.shiftKey;
    return !!L$1(e2, false) && (t.preventDefault(), $(e2, o2, false), true);
  }), Rs), o$1.registerCommand(k, ((t) => {
    if (Tt(t.target)) return false;
    const e2 = Ri();
    if (!ki(e2)) return false;
    const { anchor: n } = e2, r2 = n.getNode();
    if (e2.isCollapsed() && 0 === n.offset && !Fs(r2)) {
      if (ne(r2).getIndent() > 0) return t.preventDefault(), o$1.dispatchCommand(F, void 0);
    }
    return (!mt || "ko-KR" !== navigator.language) && (t.preventDefault(), o$1.dispatchCommand(i, true));
  }), Rs), o$1.registerCommand(w, ((t) => {
    if (Tt(t.target)) return false;
    const e2 = Ri();
    return !!ki(e2) && (t.preventDefault(), o$1.dispatchCommand(i, false));
  }), Rs), o$1.registerCommand(C, ((t) => {
    const e2 = Ri();
    if (!ki(e2)) return false;
    if (null !== t) {
      if ((mt || dt || gt) && lt) return false;
      if (t.preventDefault(), t.shiftKey) return o$1.dispatchCommand(s, false);
    }
    return o$1.dispatchCommand(o, void 0);
  }), Rs), o$1.registerCommand(b, (() => {
    const t = Ri();
    return !!ki(t) && (o$1.blur(), true);
  }), Rs), o$1.registerCommand(L, ((t) => {
    const [, e2] = It(t);
    if (e2.length > 0) {
      const n2 = ct(t.clientX, t.clientY);
      if (null !== n2) {
        const { offset: t2, node: r2 } = n2, i2 = bt(r2);
        if (null !== i2) {
          const e3 = Ai();
          if (hi(i2)) e3.anchor.set(i2.getKey(), t2, "text"), e3.focus.set(i2.getKey(), t2, "text");
          else {
            const t3 = i2.getParentOrThrow().getKey(), n4 = i2.getIndexWithinParent() + 1;
            e3.anchor.set(t3, n4, "element"), e3.focus.set(t3, n4, "element");
          }
          const n3 = nt(e3);
          Ft(n3);
        }
        o$1.dispatchCommand(pt, e2);
      }
      return t.preventDefault(), true;
    }
    const n = Ri();
    return !!ki(n);
  }), Rs), o$1.registerCommand(D, ((t) => {
    const [e2] = It(t), n = Ri();
    return !(e2 && !ki(n));
  }), Rs), o$1.registerCommand(M, ((t) => {
    const [e2] = It(t), n = Ri();
    if (e2 && !ki(n)) return false;
    const r2 = ct(t.clientX, t.clientY);
    if (null !== r2) {
      const e3 = bt(r2.node);
      Es(e3) && t.preventDefault();
    }
    return true;
  }), Rs), o$1.registerCommand(z, (() => (Ht(), true)), Rs), o$1.registerCommand(A, ((t) => (O(o$1, ue(t, ClipboardEvent) ? t : null), true)), Rs), o$1.registerCommand(B, ((t) => ((async function(t2, n) {
    await O(n, ue(t2, ClipboardEvent) ? t2 : null), n.update((() => {
      const t3 = Ri();
      ki(t3) ? t3.removeText() : wi(t3) && t3.getNodes().forEach(((t4) => t4.remove()));
    }));
  })(t, o$1), true)), Rs), o$1.registerCommand(c, ((e2) => {
    const [, n, r2] = It(e2);
    if (n.length > 0 && !r2) return o$1.dispatchCommand(pt, n), true;
    if (lt$1(e2.target)) return false;
    return null !== Ri() && ((function(e3, n2) {
      e3.preventDefault(), n2.update((() => {
        const r3 = Ri(), o2 = ue(e3, InputEvent) || ue(e3, KeyboardEvent) ? null : e3.clipboardData;
        null != o2 && null !== r3 && N$1(o2, r3, n2);
      }), { tag: "paste" });
    })(e2, o$1), true);
  }), Rs));
}
export {
  At as A,
  Ct as C,
  Et as E,
  Nt as N,
  ht as h,
  vt as v,
  yt as y
};
