import { W, o as oe } from "./utils.mjs";
import { d as ks, k as ki, b as bs, s as e, C as Cn, g as gn, R as Ri } from "../../../_libs/lexical.mjs";
const o = /* @__PURE__ */ new Set(["http:", "https:", "mailto:", "sms:", "tel:"]);
class a extends ks {
  static getType() {
    return "link";
  }
  static clone(t) {
    return new a(t.__url, { rel: t.__rel, target: t.__target, title: t.__title }, t.__key);
  }
  constructor(t, e2 = {}, r) {
    super(r);
    const { target: i = null, rel: n = null, title: l = null } = e2;
    this.__url = t, this.__target = i, this.__rel = n, this.__title = l;
  }
  createDOM(e2) {
    const r = document.createElement("a");
    return r.href = this.sanitizeUrl(this.__url), null !== this.__target && (r.target = this.__target), null !== this.__rel && (r.rel = this.__rel), null !== this.__title && (r.title = this.__title), W(r, e2.theme.link), r;
  }
  updateDOM(t, e2, r) {
    if (e2 instanceof HTMLAnchorElement) {
      const r2 = this.__url, i = this.__target, n = this.__rel, l = this.__title;
      r2 !== t.__url && (e2.href = r2), i !== t.__target && (i ? e2.target = i : e2.removeAttribute("target")), n !== t.__rel && (n ? e2.rel = n : e2.removeAttribute("rel")), l !== t.__title && (l ? e2.title = l : e2.removeAttribute("title"));
    }
    return false;
  }
  static importDOM() {
    return { a: (t) => ({ conversion: h, priority: 1 }) };
  }
  static importJSON(t) {
    const e2 = c(t.url, { rel: t.rel, target: t.target, title: t.title });
    return e2.setFormat(t.format), e2.setIndent(t.indent), e2.setDirection(t.direction), e2;
  }
  sanitizeUrl(t) {
    try {
      const e2 = new URL(t);
      if (!o.has(e2.protocol)) return "about:blank";
    } catch (e2) {
      return t;
    }
    return t;
  }
  exportJSON() {
    return { ...super.exportJSON(), rel: this.getRel(), target: this.getTarget(), title: this.getTitle(), type: "link", url: this.getURL(), version: 1 };
  }
  getURL() {
    return this.getLatest().__url;
  }
  setURL(t) {
    this.getWritable().__url = t;
  }
  getTarget() {
    return this.getLatest().__target;
  }
  setTarget(t) {
    this.getWritable().__target = t;
  }
  getRel() {
    return this.getLatest().__rel;
  }
  setRel(t) {
    this.getWritable().__rel = t;
  }
  getTitle() {
    return this.getLatest().__title;
  }
  setTitle(t) {
    this.getWritable().__title = t;
  }
  insertNewAfter(t, e2 = true) {
    const r = c(this.__url, { rel: this.__rel, target: this.__target, title: this.__title });
    return this.insertAfter(r, e2), r;
  }
  canInsertTextBefore() {
    return false;
  }
  canInsertTextAfter() {
    return false;
  }
  canBeEmpty() {
    return false;
  }
  isInline() {
    return true;
  }
  extractWithChild(t, e2, r) {
    if (!ki(e2)) return false;
    const i = e2.anchor.getNode(), n = e2.focus.getNode();
    return this.isParentOf(i) && this.isParentOf(n) && e2.getTextContent().length > 0;
  }
  isEmailURI() {
    return this.__url.startsWith("mailto:");
  }
  isWebSiteURI() {
    return this.__url.startsWith("https://") || this.__url.startsWith("http://");
  }
}
function h(t) {
  let r = null;
  if (Cn(t)) {
    const e2 = t.textContent;
    (null !== e2 && "" !== e2 || t.children.length > 0) && (r = c(t.getAttribute("href") || "", { rel: t.getAttribute("rel"), target: t.getAttribute("target"), title: t.getAttribute("title") }));
  }
  return { node: r };
}
function c(t, e2) {
  return gn(new a(t, e2));
}
function g(t) {
  return t instanceof a;
}
class f extends a {
  constructor(t, e2 = {}, r) {
    super(t, e2, r), this.__isUnlinked = void 0 !== e2.isUnlinked && null !== e2.isUnlinked && e2.isUnlinked;
  }
  static getType() {
    return "autolink";
  }
  static clone(t) {
    return new f(t.__url, { isUnlinked: t.__isUnlinked, rel: t.__rel, target: t.__target, title: t.__title }, t.__key);
  }
  getIsUnlinked() {
    return this.__isUnlinked;
  }
  setIsUnlinked(t) {
    const e2 = this.getWritable();
    return e2.__isUnlinked = t, e2;
  }
  createDOM(t) {
    return this.__isUnlinked ? document.createElement("span") : super.createDOM(t);
  }
  updateDOM(t, e2, r) {
    return super.updateDOM(t, e2, r) || t.__isUnlinked !== this.__isUnlinked;
  }
  static importJSON(t) {
    const e2 = d(t.url, { isUnlinked: t.isUnlinked, rel: t.rel, target: t.target, title: t.title });
    return e2.setFormat(t.format), e2.setIndent(t.indent), e2.setDirection(t.direction), e2;
  }
  static importDOM() {
    return null;
  }
  exportJSON() {
    return { ...super.exportJSON(), isUnlinked: this.__isUnlinked, type: "autolink", version: 1 };
  }
  insertNewAfter(t, e2 = true) {
    const r = this.getParentOrThrow().insertNewAfter(t, e2);
    if (bs(r)) {
      const t2 = d(this.__url, { isUnlinked: this.__isUnlinked, rel: this.__rel, target: this.__target, title: this.__title });
      return r.append(t2), t2;
    }
    return null;
  }
}
function d(t, e2) {
  return gn(new f(t, e2));
}
function p(t) {
  return t instanceof f;
}
const U = e();
function m(t, e2 = {}) {
  const { target: i, title: n } = e2, s = void 0 === e2.rel ? "noreferrer" : e2.rel, o2 = Ri();
  if (!ki(o2)) return;
  const a2 = o2.extract();
  if (null === t) a2.forEach(((t2) => {
    const e3 = oe(t2, ((t3) => !p(t3) && g(t3)));
    if (e3) {
      const t3 = e3.getChildren();
      for (let r = 0; r < t3.length; r++) e3.insertBefore(t3[r]);
      e3.remove();
    }
  }));
  else {
    if (1 === a2.length) {
      const e4 = (function(t2, e5) {
        let r2 = t2;
        for (; null !== r2 && null !== r2.getParent() && !e5(r2); ) r2 = r2.getParentOrThrow();
        return e5(r2) ? r2 : null;
      })(a2[0], g);
      if (null !== e4) return e4.setURL(t), void 0 !== i && e4.setTarget(i), null !== s && e4.setRel(s), void (void 0 !== n && e4.setTitle(n));
    }
    let e3 = null, r = null;
    a2.forEach(((l) => {
      const _ = l.getParent();
      if (_ !== r && null !== _ && (!bs(l) || l.isInline())) {
        if (g(_)) return r = _, _.setURL(t), void 0 !== i && _.setTarget(i), null !== s && r.setRel(s), void (void 0 !== n && r.setTitle(n));
        if (_.is(e3) || (e3 = _, r = c(t, { rel: s, target: i, title: n }), g(_) ? null === l.getPreviousSibling() ? _.insertBefore(r) : _.insertAfter(r) : l.insertBefore(r)), g(l)) {
          if (l.is(r)) return;
          if (null !== r) {
            const t2 = l.getChildren();
            for (let e4 = 0; e4 < t2.length; e4++) r.append(t2[e4]);
          }
          l.remove();
        } else null !== r && r.append(l);
      }
    }));
  }
}
export {
  U,
  a,
  c,
  f,
  g,
  m
};
