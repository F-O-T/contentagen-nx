import { q as qr, t as di, a as hi, E as Et$1, R as Ri, k as ki, b as bs, H as Es, u as Ws, l as dn, L as Gr, N as Ai, O as Ft$1, z as zs } from "../../../_libs/lexical.mjs";
import { J as J$1, I as I$1, H as H$2, W as W$1, q as q$1, V as V$1 } from "./list.mjs";
import { y as yt$1, h as ht$1, N as Nt$1, v as vt$1, C as Ct$1, E as Et$2 } from "./rich-text.mjs";
import { o as oe } from "./utils.mjs";
import { H as H$1, D as D$1, z as z$1 } from "./code.mjs";
import { a, c, g } from "./link.mjs";
function _(t, e) {
  const n = {};
  for (const o of t) {
    const t2 = e(o);
    t2 && (n[t2] ? n[t2].push(o) : n[t2] = [o]);
  }
  return n;
}
function N(t) {
  const e = _(t, ((t2) => t2.type));
  return { element: e.element || [], multilineElement: e["multiline-element"] || [], textFormat: e["text-format"] || [], textMatch: e["text-match"] || [] };
}
const j = /[!-/:-@[-`{-~\s]/, I = /^\s{0,3}$/;
function z(n) {
  if (!Ws(n)) return false;
  const o = n.getFirstChild();
  return null == o || 1 === n.getChildrenSize() && hi(o) && I.test(o.getTextContent());
}
function A(t, e, n, i) {
  for (const o of e) {
    if (!o.export) continue;
    const e2 = o.export(t, ((t2) => B(t2, n, i)));
    if (null != e2) return e2;
  }
  return bs(t) ? B(t, n, i) : Es(t) ? t.getTextContent() : null;
}
function B(t, n, s) {
  const l = [], c2 = t.getChildren();
  t: for (const t2 of c2) {
    for (const e of s) {
      if (!e.export) continue;
      const o = e.export(t2, ((t3) => B(t3, n, s)), ((t3, e2) => W(t3, e2, n)));
      if (null != o) {
        l.push(o);
        continue t;
      }
    }
    Gr(t2) ? l.push("\n") : hi(t2) ? l.push(W(t2, t2.getTextContent(), n)) : bs(t2) ? l.push(B(t2, n, s)) : Es(t2) && l.push(t2.getTextContent());
  }
  return l.join("");
}
function W(t, e, n) {
  const o = e.trim();
  let r = o;
  const i = /* @__PURE__ */ new Set();
  for (const e2 of n) {
    const n2 = e2.format[0], o2 = e2.tag;
    if (D(t, n2) && !i.has(n2)) {
      i.add(n2);
      D(U(t, true), n2) || (r = o2 + r);
      D(U(t, false), n2) || (r += o2);
    }
  }
  return e.replace(o, (() => r));
}
function U(t, n) {
  let r = n ? t.getPreviousSibling() : t.getNextSibling();
  if (!r) {
    const e = t.getParentOrThrow();
    e.isInline() && (r = n ? e.getPreviousSibling() : e.getNextSibling());
  }
  for (; r; ) {
    if (bs(r)) {
      if (!r.isInline()) break;
      const t2 = n ? r.getLastDescendant() : r.getFirstDescendant();
      if (hi(t2)) return t2;
      r = n ? r.getPreviousSibling() : r.getNextSibling();
    }
    if (hi(r)) return r;
    if (!bs(r)) return null;
  }
  return null;
}
function D(t, n) {
  return hi(t) && t.hasFormat(n);
}
const O = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement, K = O && "documentMode" in document ? document.documentMode : null;
O && "InputEvent" in window && !K && new window.InputEvent("input");
const V = O && /Version\/[\d.]+.*Safari/.test(navigator.userAgent), q = O && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, G = O && /^(?=.*Chrome).*/i.test(navigator.userAgent), H = O && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && !G;
function J(t, e = false) {
  const o = N(t), r = (function(t2) {
    const e2 = {}, n = {}, o2 = [], r2 = "(?<![\\\\])";
    for (const r3 of t2) {
      const { tag: t3 } = r3;
      e2[t3] = r3;
      const i = t3.replace(/(\*|\^|\+)/g, "\\$1");
      o2.push(i), n[t3] = V || q || H ? new RegExp(`(${i})(?![${i}\\s])(.*?[^${i}\\s])${i}(?!${i})`) : new RegExp(`(?<![\\\\${i}])(${i})((\\\\${i})?.*?[^${i}\\s](\\\\${i})?)((?<!\\\\)|(?<=\\\\\\\\))(${i})(?![\\\\${i}])`);
    }
    return { fullMatchRegExpByTag: n, openTagsRegExp: new RegExp((V || q || H ? "" : `${r2}`) + "(" + o2.join("|") + ")", "g"), transformersByTag: e2 };
  })(o.textFormat);
  return (t2, i) => {
    const l = t2.split("\n"), c2 = l.length, a2 = i || Et$1();
    a2.clear();
    for (let t3 = 0; t3 < c2; t3++) {
      const e2 = l[t3], [n, i2] = Q(l, t3, o.multilineElement, a2);
      n ? t3 = i2 : X(e2, a2, o.element, r, o.textMatch);
    }
    const f = a2.getChildren();
    for (const t3 of f) !e && z(t3) && a2.getChildrenSize() > 1 && t3.remove();
    null !== Ri() && a2.selectStart();
  };
}
function Q(t, e, n, o) {
  for (const r of n) {
    const { handleImportAfterStartMatch: n2, regExpEnd: i, regExpStart: s, replace: l } = r, c2 = t[e].match(s);
    if (!c2) continue;
    if (n2) {
      const i2 = n2({ lines: t, rootNode: o, startLineIndex: e, startMatch: c2, transformer: r });
      if (null === i2) continue;
      if (i2) return i2;
    }
    const a2 = "object" == typeof i && "regExp" in i ? i.regExp : i, f = i && "object" == typeof i && "optional" in i ? i.optional : !i;
    let u = e;
    const g2 = t.length;
    for (; u < g2; ) {
      const n3 = a2 ? t[u].match(a2) : null;
      if (!n3 && (!f || f && u < g2 - 1)) {
        u++;
        continue;
      }
      if (n3 && e === u && n3.index === c2.index) {
        u++;
        continue;
      }
      const r2 = [];
      if (n3 && e === u) r2.push(t[e].slice(c2[0].length, -n3[0].length));
      else for (let o2 = e; o2 <= u; o2++) if (o2 === e) {
        const e2 = t[o2].slice(c2[0].length);
        r2.push(e2);
      } else if (o2 === u && n3) {
        const e2 = t[o2].slice(0, -n3[0].length);
        r2.push(e2);
      } else r2.push(t[o2]);
      if (false !== l(o, null, c2, n3, r2, true)) return [true, u];
      break;
    }
  }
  return [false, e];
}
function X(e, n, o, r, i) {
  const s = di(e), f = zs();
  f.append(s), n.append(f);
  for (const { regExp: t, replace: n2 } of o) {
    const o2 = e.match(t);
    if (o2 && (s.setTextContent(e.slice(o2[0].length)), false !== n2(f, [s], o2, true))) break;
  }
  if (Y(s, r, i), f.isAttached() && e.length > 0) {
    const e2 = f.getPreviousSibling();
    if (Ws(e2) || vt$1(e2) || H$2(e2)) {
      let t = e2;
      if (H$2(e2)) {
        const n2 = e2.getLastDescendant();
        t = null == n2 ? null : oe(n2, V$1);
      }
      null != t && t.getTextContentSize() > 0 && (t.splice(t.getChildrenSize(), 0, [qr(), ...f.getChildren()]), f.remove());
    }
  }
}
function Y(t, e, n) {
  const o = t.getTextContent(), r = (function(t2, e2) {
    const n2 = t2.match(e2.openTagsRegExp);
    if (null == n2) return null;
    for (const o2 of n2) {
      const n3 = o2.replace(/^\s/, ""), r2 = e2.fullMatchRegExpByTag[n3];
      if (null == r2) continue;
      const i2 = t2.match(r2), s2 = e2.transformersByTag[n3];
      if (null != i2 && null != s2) {
        if (false !== s2.intraword) return i2;
        const { index: e3 = 0 } = i2, n4 = t2[e3 - 1], o3 = t2[e3 + i2[0].length];
        if ((!n4 || j.test(n4)) && (!o3 || j.test(o3))) return i2;
      }
    }
    return null;
  })(o, e);
  if (!r) return void Z(t, n);
  let i, s, l;
  if (r[0] === o) i = t;
  else {
    const e2 = r.index || 0, n2 = e2 + r[0].length;
    0 === e2 ? [i, s] = t.splitText(n2) : [l, i, s] = t.splitText(e2, n2);
  }
  i.setTextContent(r[2]);
  const c2 = e.transformersByTag[r[1]];
  if (c2) for (const t2 of c2.format) i.hasFormat(t2) || i.toggleFormat(t2);
  i.hasFormat("code") || Y(i, e, n), l && Y(l, e, n), s && Y(s, e, n);
}
function Z(t, e) {
  let n = t;
  t: for (; n; ) {
    for (const t2 of e) {
      if (!t2.replace || !t2.importRegExp) continue;
      const o = n.getTextContent().match(t2.importRegExp);
      if (!o) continue;
      const r = o.index || 0, i = t2.getEndIndex ? t2.getEndIndex(n, o) : r + o[0].length;
      if (false === i) continue;
      let s, l;
      0 === r ? [s, n] = n.splitText(i) : [, s, l] = n.splitText(r, i), l && Z(l, e), t2.replace(s, o);
      continue t;
    }
    break;
  }
}
function tt(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var et = tt((function(t) {
  const e = new URLSearchParams();
  e.append("code", t);
  for (let t2 = 1; t2 < arguments.length; t2++) e.append("v", arguments[t2]);
  throw Error(`Minified Lexical error #${t}; visit https://lexical.dev/docs/error?${e} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
function nt(t, e, n) {
  const o = n.length;
  for (let r = e; r >= o; r--) {
    const e2 = r - o;
    if (ot(t, e2, n, 0, o) && " " !== t[e2 + o]) return e2;
  }
  return -1;
}
function ot(t, e, n, o, r) {
  for (let i = 0; i < r; i++) if (t[e + i] !== n[o + i]) return false;
  return true;
}
function rt(t, n = At) {
  const o = N(n), r = _(o.textFormat, (({ tag: t2 }) => t2[t2.length - 1])), l = _(o.textMatch, (({ trigger: t2 }) => t2));
  for (const e of n) {
    const n2 = e.type;
    if ("element" === n2 || "text-match" === n2 || "multiline-element" === n2) {
      const n3 = e.dependencies;
      for (const e2 of n3) t.hasNode(e2) || et(173, e2.getType());
    }
  }
  const c2 = (t2, n2, c3) => {
    (function(t3, e, n3, o2) {
      const r2 = t3.getParent();
      if (!dn(r2) || t3.getFirstChild() !== e) return false;
      const i = e.getTextContent();
      if (" " !== i[n3 - 1]) return false;
      for (const { regExp: r3, replace: s } of o2) {
        const o3 = i.match(r3);
        if (o3 && o3[0].length === (o3[0].endsWith(" ") ? n3 : n3 - 1)) {
          const r4 = e.getNextSiblings(), [i2, l2] = e.splitText(n3);
          if (i2.remove(), false !== s(t3, l2 ? [l2, ...r4] : r4, o3, false)) return true;
        }
      }
      return false;
    })(t2, n2, c3, o.element) || (function(t3, e, n3, o2) {
      const r2 = t3.getParent();
      if (!dn(r2) || t3.getFirstChild() !== e) return false;
      const i = e.getTextContent();
      if (" " !== i[n3 - 1]) return false;
      for (const { regExpStart: r3, replace: s, regExpEnd: l2 } of o2) {
        if (l2 && !("optional" in l2) || l2 && "optional" in l2 && !l2.optional) continue;
        const o3 = i.match(r3);
        if (o3 && o3[0].length === (o3[0].endsWith(" ") ? n3 : n3 - 1)) {
          const r4 = e.getNextSiblings(), [i2, l3] = e.splitText(n3);
          if (i2.remove(), false !== s(t3, l3 ? [l3, ...r4] : r4, o3, null, null, false)) return true;
        }
      }
      return false;
    })(t2, n2, c3, o.multilineElement) || (function(t3, e, n3) {
      let o2 = t3.getTextContent();
      const r2 = n3[o2[e - 1]];
      if (null == r2) return false;
      e < o2.length && (o2 = o2.slice(0, e));
      for (const e2 of r2) {
        if (!e2.replace || !e2.regExp) continue;
        const n4 = o2.match(e2.regExp);
        if (null === n4) continue;
        const r3 = n4.index || 0, i = r3 + n4[0].length;
        let s;
        return 0 === r3 ? [s] = t3.splitText(i) : [, s] = t3.splitText(r3, i), s.selectNext(0, 0), e2.replace(s, n4), true;
      }
      return false;
    })(n2, c3, l) || (function(t3, n3, o2) {
      const r2 = t3.getTextContent(), l2 = n3 - 1, c4 = r2[l2], a2 = o2[c4];
      if (!a2) return false;
      for (const n4 of a2) {
        const { tag: o3 } = n4, a3 = o3.length, u = l2 - a3 + 1;
        if (a3 > 1 && !ot(r2, u, o3, 0, a3)) continue;
        if (" " === r2[u - 1]) continue;
        const h = r2[l2 + 1];
        if (false === n4.intraword && h && !j.test(h)) continue;
        const d = t3;
        let m = d, x = nt(r2, u, o3), T = m;
        for (; x < 0 && (T = T.getPreviousSibling()) && !Gr(T); ) if (hi(T)) {
          const t4 = T.getTextContent();
          m = T, x = nt(t4, t4.length, o3);
        }
        if (x < 0) continue;
        if (m === d && x + a3 === u) continue;
        const E = m.getTextContent();
        if (x > 0 && E[x - 1] === c4) continue;
        const C = E[x - 1];
        if (false === n4.intraword && C && !j.test(C)) continue;
        const y = d.getTextContent(), v = y.slice(0, u) + y.slice(l2 + 1);
        d.setTextContent(v);
        const S = m === d ? v : E;
        m.setTextContent(S.slice(0, x) + S.slice(x + a3));
        const b = Ri(), w = Ai();
        Ft$1(w);
        const $ = l2 - a3 * (m === d ? 2 : 1) + 1;
        w.anchor.set(m.__key, x, "text"), w.focus.set(d.__key, $, "text");
        for (const t4 of n4.format) w.hasFormat(t4) || w.formatText(t4);
        w.anchor.set(w.focus.key, w.focus.offset, w.focus.type);
        for (const t4 of n4.format) w.hasFormat(t4) && w.toggleFormat(t4);
        return ki(b) && (w.format = b.format), true;
      }
    })(n2, c3, r);
  };
  return t.registerUpdateListener((({ tags: n2, dirtyLeaves: o2, editorState: r2, prevEditorState: i }) => {
    if (n2.has("collaboration") || n2.has("historic")) return;
    if (t.isComposing()) return;
    const l2 = r2.read(Ri), a2 = i.read(Ri);
    if (!ki(a2) || !ki(l2) || !l2.isCollapsed() || l2.is(a2)) return;
    const u = l2.anchor.key, g2 = l2.anchor.offset, p = r2._nodeMap.get(u);
    !hi(p) || !o2.has(u) || 1 !== g2 && g2 > a2.anchor.offset + 1 || t.update((() => {
      if (p.hasFormat("code")) return;
      const t2 = p.getParent();
      null === t2 || z$1(t2) || c2(t2, p, l2.anchor.offset);
    }));
  }));
}
const it = /^(\s*)(\d{1,})\.\s/, st = /^(\s*)[-*+]\s/, lt = /^(\s*)(?:-\s)?\s?(\[(\s|x)?\])\s/i, ct = /^(#{1,6})\s/, at = /^>\s/, ft = /^[ \t]*```(\w+)?/, ut = /[ \t]*```$/, gt = /^[ \t]*```[^`]+(?:(?:`{1,2}|`{4,})[^`]+)*```(?:[^`]|$)/, pt = /^(?:\|)(.+)(?:\|)\s?$/, ht = /^(\| ?:?-*:? ?)+\|\s?$/, dt = (t) => (e, n, o) => {
  const r = t(o);
  r.append(...n), e.replace(r), r.select(0, 0);
};
const mt = (t) => (e, n, o) => {
  const r = e.getPreviousSibling(), i = e.getNextSibling(), s = W$1("check" === t ? "x" === o[3] : void 0);
  if (H$2(i) && i.getListType() === t) {
    const t2 = i.getFirstChild();
    null !== t2 ? t2.insertBefore(s) : i.append(s), e.remove();
  } else if (H$2(r) && r.getListType() === t) r.append(s), e.remove();
  else {
    const n2 = q$1(t, "number" === t ? Number(o[2]) : void 0);
    n2.append(s), e.replace(n2);
  }
  s.append(...n), s.select(0, 0);
  const l = (function(t2) {
    const e2 = t2.match(/\t/g), n2 = t2.match(/ /g);
    let o2 = 0;
    return e2 && (o2 += e2.length), n2 && (o2 += Math.floor(n2.length / 4)), o2;
  })(o[1]);
  l && s.setIndent(l);
}, xt = (t, e, n) => {
  const o = [], r = t.getChildren();
  let i = 0;
  for (const s of r) if (V$1(s)) {
    if (1 === s.getChildrenSize()) {
      const t2 = s.getFirstChild();
      if (H$2(t2)) {
        o.push(xt(t2, e, n + 1));
        continue;
      }
    }
    const r2 = " ".repeat(4 * n), l = t.getListType(), c2 = "number" === l ? `${t.getStart() + i}. ` : "check" === l ? `- [${s.getChecked() ? "x" : " "}] ` : "- ";
    o.push(r2 + c2 + e(s)), i++;
  }
  return o.join("\n");
}, Tt = { dependencies: [yt$1], export: (t, e) => {
  if (!Nt$1(t)) return null;
  const n = Number(t.getTag().slice(1));
  return "#".repeat(n) + " " + e(t);
}, regExp: ct, replace: dt(((t) => {
  const e = "h" + t[1].length;
  return Et$2(e);
})), type: "element" }, Et = { dependencies: [ht$1], export: (t, e) => {
  if (!vt$1(t)) return null;
  const n = e(t).split("\n"), o = [];
  for (const t2 of n) o.push("> " + t2);
  return o.join("\n");
}, regExp: at, replace: (t, e, n, o) => {
  if (o) {
    const n2 = t.getPreviousSibling();
    if (vt$1(n2)) return n2.splice(n2.getChildrenSize(), 0, [qr(), ...e]), n2.select(0, 0), void t.remove();
  }
  const r = Ct$1();
  r.append(...e), t.replace(r), r.select(0, 0);
}, type: "element" }, Ct = { dependencies: [H$1], export: (t) => {
  if (!z$1(t)) return null;
  const e = t.getTextContent();
  return "```" + (t.getLanguage() || "") + (e ? "\n" + e : "") + "\n```";
}, regExpEnd: { optional: true, regExp: ut }, regExpStart: ft, replace: (t, e, n, o, r, i) => {
  let s, c2;
  if (!e && r) {
    if (1 === r.length) o ? (s = D$1(), c2 = n[1] + r[0]) : (s = D$1(n[1]), c2 = r[0].startsWith(" ") ? r[0].slice(1) : r[0]);
    else {
      if (s = D$1(n[1]), 0 === r[0].trim().length) for (; r.length > 0 && !r[0].length; ) r.shift();
      else r[0] = r[0].startsWith(" ") ? r[0].slice(1) : r[0];
      for (; r.length > 0 && !r[r.length - 1].length; ) r.pop();
      c2 = r.join("\n");
    }
    const e2 = di(c2);
    s.append(e2), t.append(s);
  } else e && dt(((t2) => D$1(t2 ? t2[1] : void 0)))(t, e, n, i);
}, type: "multiline-element" }, yt = { dependencies: [J$1, I$1], export: (t, e) => H$2(t) ? xt(t, e, 0) : null, regExp: st, replace: mt("bullet"), type: "element" }, vt = { dependencies: [J$1, I$1], export: (t, e) => H$2(t) ? xt(t, e, 0) : null, regExp: lt, replace: mt("check"), type: "element" }, St = { dependencies: [J$1, I$1], export: (t, e) => H$2(t) ? xt(t, e, 0) : null, regExp: it, replace: mt("number"), type: "element" }, bt = { format: ["code"], tag: "`", type: "text-format" }, wt = { format: ["highlight"], tag: "==", type: "text-format" }, $t = { format: ["bold", "italic"], tag: "***", type: "text-format" }, Ft = { format: ["bold", "italic"], intraword: false, tag: "___", type: "text-format" }, Pt = { format: ["bold"], tag: "**", type: "text-format" }, Mt = { format: ["bold"], intraword: false, tag: "__", type: "text-format" }, kt = { format: ["strikethrough"], tag: "~~", type: "text-format" }, Lt = { format: ["italic"], tag: "*", type: "text-format" }, Rt = { format: ["italic"], intraword: false, tag: "_", type: "text-format" }, _t = { dependencies: [a], export: (t, n, o) => {
  if (!g(t)) return null;
  const r = t.getTitle(), i = r ? `[${t.getTextContent()}](${t.getURL()} "${r}")` : `[${t.getTextContent()}](${t.getURL()})`, s = t.getFirstChild();
  return 1 === t.getChildrenSize() && hi(s) ? o(s, i) : i;
}, importRegExp: /(?:\[([^[]+)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))/, regExp: /(?:\[([^[]+)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))$/, replace: (t, e) => {
  const [, n, o, r] = e, i = c(o, { title: r }), s = di(n);
  s.setFormat(t.getFormat()), i.append(s), t.replace(i);
}, trigger: ")", type: "text-match" };
const Nt = [Tt, Et, yt, St], jt = [Ct], It = [bt, $t, Ft, Pt, Mt, wt, Lt, Rt, kt], zt = [_t], At = [...Nt, ...jt, ...It, ...zt];
function Bt(t, e = At, n, o = false, r = false) {
  const i = o ? t : (function(t2, e2 = false) {
    const n2 = t2.split("\n");
    let o2 = false;
    const r2 = [];
    for (let t3 = 0; t3 < n2.length; t3++) {
      const i2 = n2[t3], s = r2[r2.length - 1];
      gt.test(i2) ? r2.push(i2) : ft.test(i2) || ut.test(i2) ? (o2 = !o2, r2.push(i2)) : o2 || "" === i2 || "" === s || !s || ct.test(s) || ct.test(i2) || at.test(i2) || it.test(i2) || st.test(i2) || lt.test(i2) || pt.test(i2) || ht.test(i2) || !e2 ? r2.push(i2) : r2[r2.length - 1] = s + i2;
    }
    return r2.join("\n");
  })(t, r);
  return J(e, o)(i, n);
}
function Wt(t = At, e, o = false) {
  const r = (function(t2, e2 = false) {
    const o2 = N(t2), r2 = [...o2.multilineElement, ...o2.element], i = !e2, s = o2.textFormat.filter(((t3) => 1 === t3.format.length));
    return (t3) => {
      const e3 = [], l = (t3 || Et$1()).getChildren();
      for (let t4 = 0; t4 < l.length; t4++) {
        const n = l[t4], c2 = A(n, r2, s, o2.textMatch);
        null != c2 && e3.push(i && t4 > 0 && !z(n) && !z(l[t4 - 1]) ? "\n".concat(c2) : c2);
      }
      return e3.join("\n");
    };
  })(t, o);
  return r(e);
}
export {
  At as A,
  Bt as B,
  Ct as C,
  Et as E,
  St as S,
  Tt as T,
  Wt as W,
  _t as _,
  rt as r,
  vt as v,
  yt as y
};
