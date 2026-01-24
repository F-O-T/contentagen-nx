import { j as j$1, W as W$1, N as N$1, t as te } from "./utils.mjs";
import { d as ks, T as Tn, b as bs, t as di, z as zs, u as Ws, k as ki, g as gn, x as o, B as Ks, s as e, R as Ri, l as dn, G as pt } from "../../../_libs/lexical.mjs";
function v(e2) {
  return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
}
var y = v((function(e2) {
  const t = new URLSearchParams();
  t.append("code", e2);
  for (let e3 = 1; e3 < arguments.length; e3++) t.append("v", arguments[e3]);
  throw Error(`Minified Lexical error #${e2}; visit https://lexical.dev/docs/error?${t} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
function C(e2) {
  let t = 1, n = e2.getParent();
  for (; null != n; ) {
    if (V(n)) {
      const e3 = n.getParent();
      if (H(e3)) {
        t++, n = e3.getParent();
        continue;
      }
      y(40);
    }
    return t;
  }
  return t;
}
function k(e2) {
  let t = e2.getParent();
  H(t) || y(40);
  let n = t;
  for (; null !== n; ) n = n.getParent(), H(n) && (t = n);
  return t;
}
function T(e2) {
  let t = [];
  const n = e2.getChildren().filter(V);
  for (let e3 = 0; e3 < n.length; e3++) {
    const r = n[e3], i = r.getFirstChild();
    H(i) ? t = t.concat(T(i)) : t.push(r);
  }
  return t;
}
function b(e2) {
  return V(e2) && H(e2.getFirstChild());
}
function S(e2) {
  return W().append(e2);
}
function P(e2, t) {
  return V(e2) && (0 === t.length || 1 === t.length && e2.is(t[0]) && 0 === e2.getChildrenSize());
}
function A(e2, t) {
  e2.update((() => {
    const e3 = Ri();
    if (null !== e3) {
      const n = e3.getNodes();
      if (ki(e3)) {
        const r2 = e3.getStartEndPoints();
        null === r2 && y(143);
        const [i] = r2, s = i.getNode(), o2 = s.getParent();
        if (P(s, n)) {
          const e4 = q(t);
          if (dn(o2)) {
            s.replace(e4);
            const t2 = W();
            bs(s) && (t2.setFormat(s.getFormatType()), t2.setIndent(s.getIndent())), e4.append(t2);
          } else if (V(s)) {
            const t2 = s.getParentOrThrow();
            N(e4, t2.getChildren()), t2.replace(e4);
          }
          return;
        }
      }
      const r = /* @__PURE__ */ new Set();
      for (let e4 = 0; e4 < n.length; e4++) {
        const i = n[e4];
        if (!bs(i) || !i.isEmpty() || V(i) || r.has(i.getKey())) {
          if (pt(i)) {
            let e5 = i.getParent();
            for (; null != e5; ) {
              const n2 = e5.getKey();
              if (H(e5)) {
                if (!r.has(n2)) {
                  const i2 = q(t);
                  N(i2, e5.getChildren()), e5.replace(i2), r.add(n2);
                }
                break;
              }
              {
                const i2 = e5.getParent();
                if (dn(i2) && !r.has(n2)) {
                  r.add(n2), x(e5, t);
                  break;
                }
                e5 = i2;
              }
            }
          }
        } else x(i, t);
      }
    }
  }));
}
function N(e2, t) {
  e2.splice(e2.getChildrenSize(), 0, t);
}
function x(e2, t) {
  if (H(e2)) return e2;
  const n = e2.getPreviousSibling(), r = e2.getNextSibling(), i = W();
  let s;
  if (N(i, e2.getChildren()), H(n) && t === n.getListType()) n.append(i), H(r) && t === r.getListType() && (N(n, r.getChildren()), r.remove()), s = n;
  else if (H(r) && t === r.getListType()) r.getFirstChildOrThrow().insertBefore(i), s = r;
  else {
    const n2 = q(t);
    n2.append(i), e2.replace(n2), s = n2;
  }
  return i.setFormat(e2.getFormatType()), i.setIndent(e2.getIndent()), e2.remove(), s;
}
function L(e2, t) {
  const n = e2.getLastChild(), r = t.getFirstChild();
  n && r && b(n) && b(r) && (L(n.getFirstChild(), r.getFirstChild()), r.remove());
  const i = t.getChildren();
  i.length > 0 && e2.append(...i), t.remove();
}
function O(t) {
  t.update((() => {
    const t2 = Ri();
    if (ki(t2)) {
      const n = /* @__PURE__ */ new Set(), r = t2.getNodes(), i = t2.anchor.getNode();
      if (P(i, r)) n.add(k(i));
      else for (let t3 = 0; t3 < r.length; t3++) {
        const i2 = r[t3];
        if (pt(i2)) {
          const t4 = te(i2, I);
          null != t4 && n.add(k(t4));
        }
      }
      for (const e2 of n) {
        let n2 = e2;
        const r2 = T(e2);
        for (const e3 of r2) {
          const r3 = zs();
          N(r3, e3.getChildren()), n2.insertAfter(r3), n2 = r3, e3.__key === t2.anchor.key && t2.anchor.set(r3.getKey(), 0, "element"), e3.__key === t2.focus.key && t2.focus.set(r3.getKey(), 0, "element"), e3.remove();
        }
        e2.remove();
      }
    }
  }));
}
function E(e2) {
  const t = /* @__PURE__ */ new Set();
  if (b(e2) || t.has(e2.getKey())) return;
  const n = e2.getParent(), r = e2.getNextSibling(), i = e2.getPreviousSibling();
  if (b(r) && b(i)) {
    const n2 = i.getFirstChild();
    if (H(n2)) {
      n2.append(e2);
      const i2 = r.getFirstChild();
      if (H(i2)) {
        N(n2, i2.getChildren()), r.remove(), t.add(r.getKey());
      }
    }
  } else if (b(r)) {
    const t2 = r.getFirstChild();
    if (H(t2)) {
      const n2 = t2.getFirstChild();
      null !== n2 && n2.insertBefore(e2);
    }
  } else if (b(i)) {
    const t2 = i.getFirstChild();
    H(t2) && t2.append(e2);
  } else if (H(n)) {
    const t2 = W(), s = q(n.getListType());
    t2.append(s), s.append(e2), i ? i.insertAfter(t2) : r ? r.insertBefore(t2) : n.append(t2);
  }
}
function M(e2) {
  if (b(e2)) return;
  const t = e2.getParent(), n = t ? t.getParent() : void 0;
  if (H(n ? n.getParent() : void 0) && V(n) && H(t)) {
    const r = t ? t.getFirstChild() : void 0, i = t ? t.getLastChild() : void 0;
    if (e2.is(r)) n.insertBefore(e2), t.isEmpty() && n.remove();
    else if (e2.is(i)) n.insertAfter(e2), t.isEmpty() && n.remove();
    else {
      const r2 = t.getListType(), i2 = W(), s = q(r2);
      i2.append(s), e2.getPreviousSiblings().forEach(((e3) => s.append(e3)));
      const o2 = W(), c = q(r2);
      o2.append(c), N(c, e2.getNextSiblings()), n.insertBefore(i2), n.insertAfter(o2), n.replace(e2);
    }
  }
}
function F() {
  const e2 = Ri();
  if (!ki(e2) || !e2.isCollapsed()) return false;
  const t = e2.anchor.getNode();
  if (!V(t) || 0 !== t.getChildrenSize()) return false;
  const n = k(t), r = t.getParent();
  H(r) || y(40);
  const i = r.getParent();
  let l;
  if (dn(i)) l = zs(), n.insertAfter(l);
  else {
    if (!V(i)) return false;
    l = W(), i.insertAfter(l);
  }
  l.select();
  const a = t.getNextSiblings();
  if (a.length > 0) {
    const e3 = q(r.getListType());
    if (Ws(l)) l.insertAfter(e3);
    else {
      const t2 = W();
      t2.append(e3), l.insertAfter(t2);
    }
    a.forEach(((t2) => {
      t2.remove(), e3.append(t2);
    }));
  }
  return (function(e3) {
    let t2 = e3;
    for (; null == t2.getNextSibling() && null == t2.getPreviousSibling(); ) {
      const e4 = t2.getParent();
      if (null == e4 || !V(t2) && !H(t2)) break;
      t2 = e4;
    }
    t2.remove();
  })(t), true;
}
function w(...e2) {
  const t = [];
  for (const n of e2) if (n && "string" == typeof n) for (const [e3] of n.matchAll(/\S+/g)) t.push(e3);
  return t;
}
class I extends ks {
  static getType() {
    return "listitem";
  }
  static clone(e2) {
    return new I(e2.__value, e2.__checked, e2.__key);
  }
  constructor(e2, t, n) {
    super(n), this.__value = void 0 === e2 ? 1 : e2, this.__checked = t;
  }
  createDOM(e2) {
    const t = document.createElement("li"), n = this.getParent();
    return H(n) && "check" === n.getListType() && R(t, this, null), t.value = this.__value, D(t, e2.theme, this), t;
  }
  updateDOM(e2, t, n) {
    const r = this.getParent();
    return H(r) && "check" === r.getListType() && R(t, this, e2), t.value = this.__value, D(t, n.theme, this), false;
  }
  static transform() {
    return (e2) => {
      if (V(e2) || y(144), null == e2.__checked) return;
      const t = e2.getParent();
      H(t) && "check" !== t.getListType() && null != e2.getChecked() && e2.setChecked(void 0);
    };
  }
  static importDOM() {
    return { li: () => ({ conversion: B, priority: 0 }) };
  }
  static importJSON(e2) {
    const t = W();
    return t.setChecked(e2.checked), t.setValue(e2.value), t.setFormat(e2.format), t.setDirection(e2.direction), t;
  }
  exportDOM(e2) {
    const t = this.createDOM(e2._config);
    return t.style.textAlign = this.getFormatType(), { element: t };
  }
  exportJSON() {
    return { ...super.exportJSON(), checked: this.getChecked(), type: "listitem", value: this.getValue(), version: 1 };
  }
  append(...e2) {
    for (let t = 0; t < e2.length; t++) {
      const n = e2[t];
      if (bs(n) && this.canMergeWith(n)) {
        const e3 = n.getChildren();
        this.append(...e3), n.remove();
      } else super.append(n);
    }
    return this;
  }
  replace(e2, t) {
    if (V(e2)) return super.replace(e2);
    this.setIndent(0);
    const n = this.getParentOrThrow();
    if (!H(n)) return e2;
    if (n.__first === this.getKey()) n.insertBefore(e2);
    else if (n.__last === this.getKey()) n.insertAfter(e2);
    else {
      const t2 = q(n.getListType());
      let r = this.getNextSibling();
      for (; r; ) {
        const e3 = r;
        r = r.getNextSibling(), t2.append(e3);
      }
      n.insertAfter(e2), e2.insertAfter(t2);
    }
    return t && (bs(e2) || y(139), this.getChildren().forEach(((t2) => {
      e2.append(t2);
    }))), this.remove(), 0 === n.getChildrenSize() && n.remove(), e2;
  }
  insertAfter(e2, t = true) {
    const n = this.getParentOrThrow();
    if (H(n) || y(39), V(e2)) return super.insertAfter(e2, t);
    const r = this.getNextSiblings();
    if (n.insertAfter(e2, t), 0 !== r.length) {
      const i = q(n.getListType());
      r.forEach(((e3) => i.append(e3))), e2.insertAfter(i, t);
    }
    return e2;
  }
  remove(e2) {
    const t = this.getPreviousSibling(), n = this.getNextSibling();
    super.remove(e2), t && n && b(t) && b(n) && (L(t.getFirstChild(), n.getFirstChild()), n.remove());
  }
  insertNewAfter(e2, t = true) {
    const n = W(null == this.__checked && void 0);
    return this.insertAfter(n, t), n;
  }
  collapseAtStart(e2) {
    const t = zs();
    this.getChildren().forEach(((e3) => t.append(e3)));
    const n = this.getParentOrThrow(), r = n.getParentOrThrow(), i = V(r);
    if (1 === n.getChildrenSize()) if (i) n.remove(), r.select();
    else {
      n.insertBefore(t), n.remove();
      const r2 = e2.anchor, i2 = e2.focus, s = t.getKey();
      "element" === r2.type && r2.getNode().is(this) && r2.set(s, r2.offset, "element"), "element" === i2.type && i2.getNode().is(this) && i2.set(s, i2.offset, "element");
    }
    else n.insertBefore(t), this.remove();
    return true;
  }
  getValue() {
    return this.getLatest().__value;
  }
  setValue(e2) {
    this.getWritable().__value = e2;
  }
  getChecked() {
    const e2 = this.getLatest();
    let t;
    const n = this.getParent();
    return H(n) && (t = n.getListType()), "check" === t ? Boolean(e2.__checked) : void 0;
  }
  setChecked(e2) {
    this.getWritable().__checked = e2;
  }
  toggleChecked() {
    this.setChecked(!this.__checked);
  }
  getIndent() {
    const e2 = this.getParent();
    if (null === e2) return this.getLatest().__indent;
    let t = e2.getParentOrThrow(), n = 0;
    for (; V(t); ) t = t.getParentOrThrow().getParentOrThrow(), n++;
    return n;
  }
  setIndent(e2) {
    "number" != typeof e2 && y(117), (e2 = Math.floor(e2)) >= 0 || y(199);
    let t = this.getIndent();
    for (; t !== e2; ) t < e2 ? (E(this), t++) : (M(this), t--);
    return this;
  }
  canInsertAfter(e2) {
    return V(e2);
  }
  canReplaceWith(e2) {
    return V(e2);
  }
  canMergeWith(e2) {
    return Ws(e2) || V(e2);
  }
  extractWithChild(e2, t) {
    if (!ki(t)) return false;
    const n = t.anchor.getNode(), r = t.focus.getNode();
    return this.isParentOf(n) && this.isParentOf(r) && this.getTextContent().length === t.getTextContent().length;
  }
  isParentRequired() {
    return true;
  }
  createParentElementNode() {
    return q("bullet");
  }
  canMergeWhenEmpty() {
    return true;
  }
}
function D(e2, r, i) {
  const s = [], o2 = [], c = r.list, l = c ? c.listitem : void 0;
  let a;
  if (c && c.nested && (a = c.nested.listitem), void 0 !== l && s.push(...w(l)), c) {
    const e3 = i.getParent(), t = H(e3) && "check" === e3.getListType(), n = i.getChecked();
    t && !n || o2.push(c.listitemUnchecked), t && n || o2.push(c.listitemChecked), t && s.push(n ? c.listitemChecked : c.listitemUnchecked);
  }
  if (void 0 !== a) {
    const e3 = w(a);
    i.getChildren().some(((e4) => H(e4))) ? s.push(...e3) : o2.push(...e3);
  }
  o2.length > 0 && j$1(e2, ...o2), s.length > 0 && W$1(e2, ...s);
}
function R(e2, t, n, r) {
  H(t.getFirstChild()) ? (e2.removeAttribute("role"), e2.removeAttribute("tabIndex"), e2.removeAttribute("aria-checked")) : (e2.setAttribute("role", "checkbox"), e2.setAttribute("tabIndex", "-1"), n && t.__checked === n.__checked || e2.setAttribute("aria-checked", t.getChecked() ? "true" : "false"));
}
function B(e2) {
  if (e2.classList.contains("task-list-item")) {
    for (const t2 of e2.children) if ("INPUT" === t2.tagName) return K(t2);
  }
  const t = e2.getAttribute("aria-checked");
  return { node: W("true" === t || "false" !== t && void 0) };
}
function K(e2) {
  if (!("checkbox" === e2.getAttribute("type"))) return { node: null };
  return { node: W(e2.hasAttribute("checked")) };
}
function W(e2) {
  return gn(new I(void 0, e2));
}
function V(e2) {
  return e2 instanceof I;
}
class J extends ks {
  static getType() {
    return "list";
  }
  static clone(e2) {
    const t = e2.__listType || j[e2.__tag];
    return new J(t, e2.__start, e2.__key);
  }
  constructor(e2, t, n) {
    super(n);
    const r = j[e2] || e2;
    this.__listType = r, this.__tag = "number" === r ? "ol" : "ul", this.__start = t;
  }
  getTag() {
    return this.__tag;
  }
  setListType(e2) {
    const t = this.getWritable();
    t.__listType = e2, t.__tag = "number" === e2 ? "ol" : "ul";
  }
  getListType() {
    return this.__listType;
  }
  getStart() {
    return this.__start;
  }
  createDOM(e2, t) {
    const n = this.__tag, r = document.createElement(n);
    return 1 !== this.__start && r.setAttribute("start", String(this.__start)), r.__lexicalListType = this.__listType, z(r, e2.theme, this), r;
  }
  updateDOM(e2, t, n) {
    return e2.__tag !== this.__tag || (z(t, n.theme, this), false);
  }
  static transform() {
    return (e2) => {
      H(e2) || y(163), (function(e3) {
        const t = e3.getNextSibling();
        H(t) && e3.getListType() === t.getListType() && L(e3, t);
      })(e2), (function(e3) {
        const t = "check" !== e3.getListType();
        let n = e3.getStart();
        for (const r of e3.getChildren()) V(r) && (r.getValue() !== n && r.setValue(n), t && null != r.getLatest().__checked && r.setChecked(void 0), H(r.getFirstChild()) || n++);
      })(e2);
    };
  }
  static importDOM() {
    return { ol: () => ({ conversion: $, priority: 0 }), ul: () => ({ conversion: $, priority: 0 }) };
  }
  static importJSON(e2) {
    const t = q(e2.listType, e2.start);
    return t.setFormat(e2.format), t.setIndent(e2.indent), t.setDirection(e2.direction), t;
  }
  exportDOM(e2) {
    const t = this.createDOM(e2._config, e2);
    return t && Tn(t) && (1 !== this.__start && t.setAttribute("start", String(this.__start)), "check" === this.__listType && t.setAttribute("__lexicalListType", "check")), { element: t };
  }
  exportJSON() {
    return { ...super.exportJSON(), listType: this.getListType(), start: this.getStart(), tag: this.getTag(), type: "list", version: 1 };
  }
  canBeEmpty() {
    return false;
  }
  canIndent() {
    return false;
  }
  append(...e2) {
    for (let t = 0; t < e2.length; t++) {
      const n = e2[t];
      if (V(n)) super.append(n);
      else {
        const e3 = W();
        if (H(n)) e3.append(n);
        else if (bs(n)) if (n.isInline()) e3.append(n);
        else {
          const t2 = di(n.getTextContent());
          e3.append(t2);
        }
        else e3.append(n);
        super.append(e3);
      }
    }
    return this;
  }
  extractWithChild(e2) {
    return V(e2);
  }
}
function z(e2, r, i) {
  const s = [], o2 = [], c = r.list;
  if (void 0 !== c) {
    const e3 = c[`${i.__tag}Depth`] || [], t = C(i) - 1, n = t % e3.length, r2 = e3[n], l = c[i.__tag];
    let a;
    const h = c.nested, u = c.checklist;
    if (void 0 !== h && h.list && (a = h.list), void 0 !== l && s.push(l), void 0 !== u && "check" === i.__listType && s.push(u), void 0 !== r2) {
      s.push(...w(r2));
      for (let t2 = 0; t2 < e3.length; t2++) t2 !== n && o2.push(i.__tag + t2);
    }
    if (void 0 !== a) {
      const e4 = w(a);
      t > 1 ? s.push(...e4) : o2.push(...e4);
    }
  }
  o2.length > 0 && j$1(e2, ...o2), s.length > 0 && W$1(e2, ...s);
}
function U(e2) {
  const t = [];
  for (let n = 0; n < e2.length; n++) {
    const r = e2[n];
    if (V(r)) {
      t.push(r);
      const e3 = r.getChildren();
      e3.length > 1 && e3.forEach(((e4) => {
        H(e4) && t.push(S(e4));
      }));
    } else t.push(S(r));
  }
  return t;
}
function $(e2) {
  const t = e2.nodeName.toLowerCase();
  let n = null;
  if ("ol" === t) {
    n = q("number", e2.start);
  } else "ul" === t && (n = (function(e3) {
    if ("check" === e3.getAttribute("__lexicallisttype") || e3.classList.contains("contains-task-list")) return true;
    for (const t2 of e3.childNodes) if (Tn(t2) && t2.hasAttribute("aria-checked")) return true;
    return false;
  })(e2) ? q("check") : q("bullet"));
  return { after: U, node: n };
}
const j = { ol: "number", ul: "bullet" };
function q(e2, t = 1) {
  return gn(new J(e2, t));
}
function H(e2) {
  return e2 instanceof J;
}
const G = e(), Q = e(), Y = e();
function Z(e2) {
  return N$1(e2.registerCommand(Q, (() => (A(e2, "number"), true)), Ks), e2.registerCommand(G, (() => (A(e2, "bullet"), true)), Ks), e2.registerCommand(Y, (() => (O(e2), true)), Ks), e2.registerCommand(o, (() => !!F()), Ks));
}
export {
  H,
  I,
  J,
  V,
  W,
  Z,
  q
};
