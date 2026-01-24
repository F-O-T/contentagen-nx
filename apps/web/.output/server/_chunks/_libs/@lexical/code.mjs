import { W, j } from "./utils.mjs";
import { d as ks, z as zs, a as hi, y as yi, p as pi, q as qr, r as ri, T as Tn, g as gn } from "../../../_libs/lexical.mjs";
function w(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
w((function(t) {
  const e = new URLSearchParams();
  e.append("code", t);
  for (let t2 = 1; t2 < arguments.length; t2++) e.append("v", arguments[t2]);
  throw Error(`Minified Lexical error #${t}; visit https://lexical.dev/docs/error?${e} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
const k = globalThis.Prism || window.Prism, L = (t) => {
  try {
    return !!t && k.languages.hasOwnProperty(t);
  } catch (t2) {
    return false;
  }
};
function A(e, n) {
  for (const r of e.childNodes) {
    if (Tn(r) && r.tagName === n) return true;
    A(r, n);
  }
  return false;
}
const O = "data-language", M = "data-highlight-language";
class H extends ks {
  static getType() {
    return "code";
  }
  static clone(t) {
    return new H(t.__language, t.__key);
  }
  constructor(t, e) {
    super(e), this.__language = t, this.__isSyntaxHighlightSupported = L(t);
  }
  createDOM(t) {
    const n = document.createElement("code");
    W(n, t.theme.code), n.setAttribute("spellcheck", "false");
    const r = this.getLanguage();
    return r && (n.setAttribute(O, r), this.getIsSyntaxHighlightSupported() && n.setAttribute(M, r)), n;
  }
  updateDOM(t, e, n) {
    const r = this.__language, o = t.__language;
    return r ? r !== o && (e.setAttribute(O, r), this.__isSyntaxHighlightSupported && e.setAttribute(M, r)) : o && (e.removeAttribute(O), t.__isSyntaxHighlightSupported && e.removeAttribute(M)), false;
  }
  exportDOM(t) {
    const n = document.createElement("pre");
    W(n, t._config.theme.code), n.setAttribute("spellcheck", "false");
    const r = this.getLanguage();
    return r && (n.setAttribute(O, r), this.getIsSyntaxHighlightSupported() && n.setAttribute(M, r)), { element: n };
  }
  static importDOM() {
    return { code: (t) => null != t.textContent && (/\r?\n/.test(t.textContent) || A(t, "BR")) ? { conversion: E, priority: 1 } : null, div: () => ({ conversion: B, priority: 1 }), pre: () => ({ conversion: E, priority: 0 }), table: (t) => F(t) ? { conversion: I, priority: 3 } : null, td: (t) => {
      const e = t, n = e.closest("table");
      return e.classList.contains("js-file-line") || n && F(n) ? { conversion: J, priority: 3 } : null;
    }, tr: (t) => {
      const e = t.closest("table");
      return e && F(e) ? { conversion: J, priority: 3 } : null;
    } };
  }
  static importJSON(t) {
    const e = D(t.language);
    return e.setFormat(t.format), e.setIndent(t.indent), e.setDirection(t.direction), e;
  }
  exportJSON() {
    return { ...super.exportJSON(), language: this.getLanguage(), type: "code", version: 1 };
  }
  insertNewAfter(t, e = true) {
    const n = this.getChildren(), r = n.length;
    if (r >= 2 && "\n" === n[r - 1].getTextContent() && "\n" === n[r - 2].getTextContent() && t.isCollapsed() && t.anchor.key === this.__key && t.anchor.offset === r) {
      n[r - 1].remove(), n[r - 2].remove();
      const t2 = zs();
      return this.insertAfter(t2, e), t2;
    }
    const { anchor: o, focus: a } = t, g = (o.isBefore(a) ? o : a).getNode();
    if (hi(g)) {
      let t2 = tt(g);
      const e2 = [];
      for (; ; ) if (yi(t2)) e2.push(pi()), t2 = t2.getNextSibling();
      else {
        if (!Z(t2)) break;
        {
          let n3 = 0;
          const r3 = t2.getTextContent(), o2 = t2.getTextContentSize();
          for (; n3 < o2 && " " === r3[n3]; ) n3++;
          if (0 !== n3 && e2.push(Y(" ".repeat(n3))), n3 !== o2) break;
          t2 = t2.getNextSibling();
        }
      }
      const n2 = g.splitText(o.offset)[0], r2 = 0 === o.offset ? 0 : 1, i = n2.getIndexWithinParent() + r2, s = g.getParentOrThrow(), a2 = [qr(), ...e2];
      s.splice(i, 0, a2);
      const f = e2[e2.length - 1];
      f ? f.select() : 0 === o.offset ? n2.selectPrevious() : n2.getNextSibling().selectNext(0, 0);
    }
    if (z(g)) {
      const { offset: e2 } = t.anchor;
      g.splice(e2, 0, [qr()]), g.select(e2 + 1, e2 + 1);
    }
    return null;
  }
  canIndent() {
    return false;
  }
  collapseAtStart() {
    const t = zs();
    return this.getChildren().forEach(((e) => t.append(e))), this.replace(t), true;
  }
  setLanguage(t) {
    const e = this.getWritable();
    e.__language = t, e.__isSyntaxHighlightSupported = L(t);
  }
  getLanguage() {
    return this.getLatest().__language;
  }
  getIsSyntaxHighlightSupported() {
    return this.getLatest().__isSyntaxHighlightSupported;
  }
}
function D(t) {
  return gn(new H(t));
}
function z(t) {
  return t instanceof H;
}
function E(t) {
  return { node: D(t.getAttribute(O)) };
}
function B(t) {
  const e = t, n = R(e);
  return n || (function(t2) {
    let e2 = t2.parentElement;
    for (; null !== e2; ) {
      if (R(e2)) return true;
      e2 = e2.parentElement;
    }
    return false;
  })(e) ? { node: n ? D() : null } : { node: null };
}
function I() {
  return { node: D() };
}
function J() {
  return { node: null };
}
function R(t) {
  return null !== t.style.fontFamily.match("monospace");
}
function F(t) {
  return t.classList.contains("js-file-line-container");
}
class G extends ri {
  constructor(t, e, n) {
    super(t, n), this.__highlightType = e;
  }
  static getType() {
    return "code-highlight";
  }
  static clone(t) {
    return new G(t.__text, t.__highlightType || void 0, t.__key);
  }
  getHighlightType() {
    return this.getLatest().__highlightType;
  }
  canHaveFormat() {
    return false;
  }
  createDOM(t) {
    const n = super.createDOM(t), r = V(t.theme, this.__highlightType);
    return W(n, r), n;
  }
  updateDOM(t, r, o) {
    const i = super.updateDOM(t, r, o), s = V(o.theme, t.__highlightType), l = V(o.theme, this.__highlightType);
    return s !== l && (s && j(r, s), l && W(r, l)), i;
  }
  static importJSON(t) {
    const e = Y(t.text, t.highlightType);
    return e.setFormat(t.format), e.setDetail(t.detail), e.setMode(t.mode), e.setStyle(t.style), e;
  }
  exportJSON() {
    return { ...super.exportJSON(), highlightType: this.getHighlightType(), type: "code-highlight", version: 1 };
  }
  setFormat(t) {
    return this;
  }
  isParentRequired() {
    return true;
  }
  createParentElementNode() {
    return D();
  }
}
function V(t, e) {
  return e && t && t.codeHighlight && t.codeHighlight[e];
}
function Y(t, e) {
  return gn(new G(t, e));
}
function Z(t) {
  return t instanceof G;
}
function tt(t) {
  let e = t, n = t;
  for (; Z(n) || yi(n); ) e = n, n = n.getPreviousSibling();
  return e;
}
export {
  D,
  G,
  H,
  z
};
