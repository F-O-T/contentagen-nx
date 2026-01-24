function e(e2) {
  return {};
}
const t = {}, n = {}, r = {}, i = {}, s = {}, o = {}, l = {}, c = {}, a = {}, u = {}, f = {}, d = {}, h = {}, g = {}, _ = {}, p = {}, y = {}, m = {}, x = {}, v = {}, S = {}, C = {}, T = {}, k = {}, b = {}, w = {}, N = {}, E = {}, P = {}, F = {}, L = {}, O = {}, D = {}, M = {}, I = {}, A = {}, B = {}, z = {}, W = {}, R = {}, K = {}, J = {}, $ = {}, U = {}, V = {}, j = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement, H = j && "documentMode" in document ? document.documentMode : null, q = j && /Mac|iPod|iPhone|iPad/.test(navigator.platform), G = j && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent), Q = !(!j || !("InputEvent" in window) || H) && "getTargetRanges" in new window.InputEvent("input"), X = j && /Version\/[\d.]+.*Safari/.test(navigator.userAgent), Y = j && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, Z = j && /Android/.test(navigator.userAgent), ee = j && /^(?=.*Chrome).*/i.test(navigator.userAgent), te = j && Z && ee, ne = j && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && !ee, re = 1, ie = 3, se = 0, oe = 1, le = 2, ce = 0, ae = 1, ue = 2, he = 4, ge = 8, me = 128, xe = 112 | (3 | he | ge) | me, ve = 1, Se = 2, Ce = 3, Te = 4, ke = 5, be = 6, we = X || Y || ne ? " " : "​", Ne = "\n\n", Ee = G ? " " : we, Pe = "֑-߿יִ-﷽ﹰ-ﻼ", Fe = "A-Za-zÀ-ÖØ-öø-ʸ̀-֐ࠀ-῿‎Ⰰ-﬜︀-﹯﻽-￿", Le = new RegExp("^[^" + Fe + "]*[" + Pe + "]"), Oe = new RegExp("^[^" + Pe + "]*[" + Fe + "]"), De = { bold: 1, code: 16, highlight: me, italic: 2, strikethrough: he, subscript: 32, superscript: 64, underline: ge }, Me = { directionless: 1, unmergeable: 2 }, Ie = { center: Se, end: be, justify: Te, left: ve, right: Ce, start: ke }, Ae = { [Se]: "center", [be]: "end", [Te]: "justify", [ve]: "left", [Ce]: "right", [ke]: "start" }, Be = { normal: 0, segmented: 2, token: 1 }, ze = { [ce]: "normal", [ue]: "segmented", [ae]: "token" };
function We(e2) {
  return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
}
var Re = We((function(e2) {
  const t2 = new URLSearchParams();
  t2.append("code", e2);
  for (let e3 = 1; e3 < arguments.length; e3++) t2.append("v", arguments[e3]);
  throw Error(`Minified Lexical error #${e2}; visit https://lexical.dev/docs/error?${t2} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
function Ke(...e2) {
  const t2 = [];
  for (const n2 of e2) if (n2 && "string" == typeof n2) for (const [e3] of n2.matchAll(/\S+/g)) t2.push(e3);
  return t2;
}
const Je = 100;
let $e = false, Ue = 0;
function Ve(e2) {
  Ue = e2.timeStamp;
}
function je(e2, t2, n2) {
  const r2 = "BR" === e2.nodeName, i2 = t2.__lexicalLineBreak;
  return i2 && (e2 === i2 || r2 && e2.previousSibling === i2) || r2 && void 0 !== kt(e2, n2);
}
function He(e2, t2, n2) {
  const r2 = vn(n2._window);
  let i2 = null, s2 = null;
  null !== r2 && r2.anchorNode === e2 && (i2 = r2.anchorOffset, s2 = r2.focusOffset);
  const o2 = e2.nodeValue;
  null !== o2 && zt(t2, o2, i2, s2, false);
}
function qe(e2, t2, n2) {
  if (ki(e2)) {
    const t3 = e2.anchor.getNode();
    if (t3.is(n2) && e2.format !== t3.getFormat()) return false;
  }
  return t2.nodeType === ie && n2.isAttached();
}
function Ge(e2, t2, n2, r2) {
  for (let i2 = e2; i2 && !An(i2); i2 = rn(i2)) {
    const e3 = kt(i2, t2);
    if (void 0 !== e3) {
      const t3 = Ct(e3, n2);
      if (t3) return Es(t3) ? void 0 : [i2, t3];
    } else if (i2 === r2) return [r2, Pt(n2)];
  }
}
function Qe(e2, t2, n2) {
  $e = true;
  const r2 = performance.now() - Ue > Je;
  try {
    Ss(e2, (() => {
      const i2 = Ri() || (function(e3) {
        return e3.getEditorState().read((() => {
          const e4 = Ri();
          return null !== e4 ? e4.clone() : null;
        }));
      })(e2), s2 = /* @__PURE__ */ new Map(), o2 = e2.getRootElement(), l2 = e2._editorState, c2 = e2._blockCursorElement;
      let a2 = false, u2 = "";
      for (let n3 = 0; n3 < t2.length; n3++) {
        const f3 = t2[n3], d2 = f3.type, h2 = f3.target, g2 = Ge(h2, e2, l2, o2);
        if (!g2) continue;
        const [_2, p2] = g2;
        if ("characterData" === d2) r2 && hi(p2) && qe(i2, h2, p2) && He(h2, p2, e2);
        else if ("childList" === d2) {
          a2 = true;
          const t3 = f3.addedNodes;
          for (let n5 = 0; n5 < t3.length; n5++) {
            const r4 = t3[n5], i3 = Tt(r4), s3 = r4.parentNode;
            if (null != s3 && r4 !== c2 && null === i3 && !je(r4, s3, e2)) {
              if (G) {
                const e3 = r4.innerText || r4.nodeValue;
                e3 && (u2 += e3);
              }
              s3.removeChild(r4);
            }
          }
          const n4 = f3.removedNodes, r3 = n4.length;
          if (r3 > 0) {
            let t4 = 0;
            for (let i3 = 0; i3 < r3; i3++) {
              const r4 = n4[i3];
              (je(r4, h2, e2) || c2 === r4) && (h2.appendChild(r4), t4++);
            }
            r3 !== t4 && s2.set(_2, p2);
          }
        }
      }
      if (s2.size > 0) for (const [t3, n3] of s2) n3.reconcileObservedMutation(t3, e2);
      const f2 = n2.takeRecords();
      if (f2.length > 0) {
        for (let t3 = 0; t3 < f2.length; t3++) {
          const n3 = f2[t3], r3 = n3.addedNodes, i3 = n3.target;
          for (let t4 = 0; t4 < r3.length; t4++) {
            const n4 = r3[t4], s3 = n4.parentNode;
            null == s3 || "BR" !== n4.nodeName || je(n4, i3, e2) || s3.removeChild(n4);
          }
        }
        n2.takeRecords();
      }
      null !== i2 && (a2 && (i2.dirty = true, Ft(i2)), G && Zt(e2) && i2.insertRawText(u2));
    }));
  } finally {
    $e = false;
  }
}
function Xe(e2) {
  const t2 = e2._observer;
  if (null !== t2) {
    Qe(e2, t2.takeRecords(), t2);
  }
}
function Ye(e2) {
  !(function(e3) {
    0 === Ue && an(e3).addEventListener("textInput", Ve, true);
  })(e2), e2._observer = new MutationObserver(((t2, n2) => {
    Qe(e2, t2, n2);
  }));
}
function Ze(e2, t2) {
  const n2 = e2.__mode, r2 = e2.__format, i2 = e2.__style, s2 = t2.__mode, o2 = t2.__format, l2 = t2.__style;
  return !(null !== n2 && n2 !== s2 || null !== r2 && r2 !== o2 || null !== i2 && i2 !== l2);
}
function et(e2, t2) {
  const n2 = e2.mergeWithSibling(t2), r2 = ls()._normalizedNodes;
  return r2.add(e2.__key), r2.add(t2.__key), n2;
}
function tt(e2) {
  let t2, n2, r2 = e2;
  if ("" !== r2.__text || !r2.isSimpleText() || r2.isUnmergeable()) {
    for (; null !== (t2 = r2.getPreviousSibling()) && hi(t2) && t2.isSimpleText() && !t2.isUnmergeable(); ) {
      if ("" !== t2.__text) {
        if (Ze(t2, r2)) {
          r2 = et(t2, r2);
          break;
        }
        break;
      }
      t2.remove();
    }
    for (; null !== (n2 = r2.getNextSibling()) && hi(n2) && n2.isSimpleText() && !n2.isUnmergeable(); ) {
      if ("" !== n2.__text) {
        if (Ze(r2, n2)) {
          r2 = et(r2, n2);
          break;
        }
        break;
      }
      n2.remove();
    }
  } else r2.remove();
}
function nt(e2) {
  return rt(e2.anchor), rt(e2.focus), e2;
}
function rt(e2) {
  for (; "element" === e2.type; ) {
    const t2 = e2.getNode(), n2 = e2.offset;
    let r2, i2;
    if (n2 === t2.getChildrenSize() ? (r2 = t2.getChildAtIndex(n2 - 1), i2 = true) : (r2 = t2.getChildAtIndex(n2), i2 = false), hi(r2)) {
      e2.set(r2.__key, i2 ? r2.getTextContentSize() : 0, "text");
      break;
    }
    if (!bs(r2)) break;
    e2.set(r2.__key, i2 ? r2.getChildrenSize() : 0, "element");
  }
}
let it = 1;
const ot = "function" == typeof queueMicrotask ? queueMicrotask : (e2) => {
  Promise.resolve().then(e2);
};
function lt(e2) {
  const t2 = document.activeElement;
  if (null === t2) return false;
  const n2 = t2.nodeName;
  return Es(bt(e2)) && ("INPUT" === n2 || "TEXTAREA" === n2 || "true" === t2.contentEditable && null == ft(t2));
}
function ct(e2, t2, n2) {
  const r2 = e2.getRootElement();
  try {
    return null !== r2 && r2.contains(t2) && r2.contains(n2) && null !== t2 && !lt(t2) && ut(t2) === e2;
  } catch (e3) {
    return false;
  }
}
function at(e2) {
  return e2 instanceof Hs;
}
function ut(e2) {
  let t2 = e2;
  for (; null != t2; ) {
    const e3 = ft(t2);
    if (at(e3)) return e3;
    t2 = rn(t2);
  }
  return null;
}
function ft(e2) {
  return e2 ? e2.__lexicalEditor : null;
}
function dt(e2) {
  return e2.isToken() || e2.isSegmented();
}
function ht(e2) {
  return e2.nodeType === ie;
}
function gt(e2) {
  let t2 = e2;
  for (; null != t2; ) {
    if (ht(t2)) return t2;
    t2 = t2.firstChild;
  }
  return null;
}
function _t(e2, t2, n2) {
  const r2 = De[t2];
  if (null !== n2 && (e2 & r2) == (n2 & r2)) return e2;
  let i2 = e2 ^ r2;
  return "subscript" === t2 ? i2 &= -65 : "superscript" === t2 && (i2 &= -33), i2;
}
function pt(e2) {
  return hi(e2) || Gr(e2) || Es(e2);
}
function yt(e2, t2) {
  if (null != t2) return void (e2.__key = t2);
  is(), ss();
  const n2 = ls(), r2 = os(), i2 = "" + it++;
  r2._nodeMap.set(i2, e2), bs(e2) ? n2._dirtyElements.set(i2, true) : n2._dirtyLeaves.add(i2), n2._cloneNotNeeded.add(i2), n2._dirtyType = oe, e2.__key = i2;
}
function mt(e2) {
  const t2 = e2.getParent();
  if (null !== t2) {
    const n2 = e2.getWritable(), r2 = t2.getWritable(), i2 = e2.getPreviousSibling(), s2 = e2.getNextSibling();
    if (null === i2) if (null !== s2) {
      const e3 = s2.getWritable();
      r2.__first = s2.__key, e3.__prev = null;
    } else r2.__first = null;
    else {
      const e3 = i2.getWritable();
      if (null !== s2) {
        const t3 = s2.getWritable();
        t3.__prev = e3.__key, e3.__next = t3.__key;
      } else e3.__next = null;
      n2.__prev = null;
    }
    if (null === s2) if (null !== i2) {
      const e3 = i2.getWritable();
      r2.__last = i2.__key, e3.__next = null;
    } else r2.__last = null;
    else {
      const e3 = s2.getWritable();
      if (null !== i2) {
        const t3 = i2.getWritable();
        t3.__next = e3.__key, e3.__prev = t3.__key;
      } else e3.__prev = null;
      n2.__next = null;
    }
    r2.__size--, n2.__parent = null;
  }
}
function xt(e2) {
  ss();
  const t2 = e2.getLatest(), n2 = t2.__parent, r2 = os(), i2 = ls(), s2 = r2._nodeMap, o2 = i2._dirtyElements;
  null !== n2 && (function(e3, t3, n3) {
    let r3 = e3;
    for (; null !== r3; ) {
      if (n3.has(r3)) return;
      const e4 = t3.get(r3);
      if (void 0 === e4) break;
      n3.set(r3, false), r3 = e4.__parent;
    }
  })(n2, s2, o2);
  const l2 = t2.__key;
  i2._dirtyType = oe, bs(e2) ? o2.set(l2, true) : i2._dirtyLeaves.add(l2);
}
function vt(e2) {
  is();
  const t2 = ls(), n2 = t2._compositionKey;
  if (e2 !== n2) {
    if (t2._compositionKey = e2, null !== n2) {
      const e3 = Ct(n2);
      null !== e3 && e3.getWritable();
    }
    if (null !== e2) {
      const t3 = Ct(e2);
      null !== t3 && t3.getWritable();
    }
  }
}
function St() {
  if (rs()) return null;
  return ls()._compositionKey;
}
function Ct(e2, t2) {
  const n2 = (t2 || os())._nodeMap.get(e2);
  return void 0 === n2 ? null : n2;
}
function Tt(e2, t2) {
  const n2 = kt(e2, ls());
  return void 0 !== n2 ? Ct(n2, t2) : null;
}
function kt(e2, t2) {
  return e2[`__lexicalKey_${t2._key}`];
}
function bt(e2, t2) {
  let n2 = e2;
  for (; null != n2; ) {
    const e3 = Tt(n2, t2);
    if (null !== e3) return e3;
    n2 = rn(n2);
  }
  return null;
}
function wt(e2) {
  const t2 = e2._decorators, n2 = Object.assign({}, t2);
  return e2._pendingDecorators = n2, n2;
}
function Nt(e2) {
  return e2.read((() => Et().getTextContent()));
}
function Et() {
  return Pt(os());
}
function Pt(e2) {
  return e2._nodeMap.get("root");
}
function Ft(e2) {
  is();
  const t2 = os();
  null !== e2 && (e2.dirty = true, e2.setCachedNodes(null)), t2._selection = e2;
}
function Lt(e2) {
  const t2 = ls(), n2 = (function(e3, t3) {
    let n3 = e3;
    for (; null != n3; ) {
      const e4 = kt(n3, t3);
      if (void 0 !== e4) return e4;
      n3 = rn(n3);
    }
    return null;
  })(e2, t2);
  if (null === n2) {
    return e2 === t2.getRootElement() ? Ct("root") : null;
  }
  return Ct(n2);
}
function Ot(e2, t2) {
  return t2 ? e2.getTextContentSize() : 0;
}
function Dt(e2) {
  return /[\uD800-\uDBFF][\uDC00-\uDFFF]/g.test(e2);
}
function Mt(e2) {
  const t2 = [];
  let n2 = e2;
  for (; null !== n2; ) t2.push(n2), n2 = n2._parentEditor;
  return t2;
}
function It() {
  return Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 5);
}
function At(e2) {
  return e2.nodeType === ie ? e2.nodeValue : null;
}
function Bt(e2, t2, n2) {
  const r2 = vn(t2._window);
  if (null === r2) return;
  const i2 = r2.anchorNode;
  let { anchorOffset: s2, focusOffset: o2 } = r2;
  if (null !== i2) {
    let t3 = At(i2);
    const r3 = bt(i2);
    if (null !== t3 && hi(r3)) {
      if (t3 === we && n2) {
        const e3 = n2.length;
        t3 = n2, s2 = e3, o2 = e3;
      }
      null !== t3 && zt(r3, t3, s2, o2, e2);
    }
  }
}
function zt(e2, t2, n2, r2, i2) {
  let s2 = e2;
  if (s2.isAttached() && (i2 || !s2.isDirty())) {
    const o2 = s2.isComposing();
    let l2 = t2;
    (o2 || i2) && t2[t2.length - 1] === we && (l2 = t2.slice(0, -1));
    const c2 = s2.getTextContent();
    if (i2 || l2 !== c2) {
      if ("" === l2) {
        if (vt(null), X || Y || ne) s2.remove();
        else {
          const e3 = ls();
          setTimeout((() => {
            e3.update((() => {
              s2.isAttached() && s2.remove();
            }));
          }), 20);
        }
        return;
      }
      const t3 = s2.getParent(), i3 = Ki(), c3 = s2.getTextContentSize(), a2 = St(), u2 = s2.getKey();
      if (s2.isToken() || null !== a2 && u2 === a2 && !o2 || ki(i3) && (null !== t3 && !t3.canInsertTextBefore() && 0 === i3.anchor.offset || i3.anchor.key === e2.__key && 0 === i3.anchor.offset && !s2.canInsertTextBefore() && !o2 || i3.focus.key === e2.__key && i3.focus.offset === c3 && !s2.canInsertTextAfter() && !o2)) return void s2.markDirty();
      const f2 = Ri();
      if (!ki(f2) || null === n2 || null === r2) return void s2.setTextContent(l2);
      if (f2.setTextNodeRange(s2, n2, s2, r2), s2.isSegmented()) {
        const e3 = di(s2.getTextContent());
        s2.replace(e3), s2 = e3;
      }
      s2.setTextContent(l2);
    }
  }
}
function Wt(e2, t2) {
  if (t2.isSegmented()) return true;
  if (!e2.isCollapsed()) return false;
  const n2 = e2.anchor.offset, r2 = t2.getParentOrThrow(), i2 = t2.isToken();
  return 0 === n2 ? !t2.canInsertTextBefore() || !r2.canInsertTextBefore() && !t2.isComposing() || i2 || (function(e3) {
    const t3 = e3.getPreviousSibling();
    return (hi(t3) || bs(t3) && t3.isInline()) && !t3.canInsertTextAfter();
  })(t2) : n2 === t2.getTextContentSize() && (!t2.canInsertTextAfter() || !r2.canInsertTextAfter() && !t2.isComposing() || i2);
}
function Rt(e2) {
  return "ArrowLeft" === e2;
}
function Kt(e2) {
  return "ArrowRight" === e2;
}
function Jt(e2, t2) {
  return q ? e2 : t2;
}
function $t(e2) {
  return "Enter" === e2;
}
function Ut(e2) {
  return "Backspace" === e2;
}
function Vt(e2) {
  return "Delete" === e2;
}
function jt(e2, t2, n2) {
  return "a" === e2.toLowerCase() && Jt(t2, n2);
}
function Ht() {
  const e2 = Et();
  Ft(nt(e2.select(0, e2.getChildrenSize())));
}
function qt(e2, t2) {
  void 0 === e2.__lexicalClassNameCache && (e2.__lexicalClassNameCache = {});
  const n2 = e2.__lexicalClassNameCache, r2 = n2[t2];
  if (void 0 !== r2) return r2;
  const i2 = e2[t2];
  if ("string" == typeof i2) {
    const e3 = Ke(i2);
    return n2[t2] = e3, e3;
  }
  return i2;
}
function Gt(e2, t2, n2, r2, i2) {
  if (0 === n2.size) return;
  const s2 = r2.__type, o2 = r2.__key, l2 = t2.get(s2);
  void 0 === l2 && Re(33, s2);
  const c2 = l2.klass;
  let a2 = e2.get(c2);
  void 0 === a2 && (a2 = /* @__PURE__ */ new Map(), e2.set(c2, a2));
  const u2 = a2.get(o2), f2 = "destroyed" === u2 && "created" === i2;
  (void 0 === u2 || f2) && a2.set(o2, f2 ? "updated" : i2);
}
function Xt(e2, t2, n2) {
  const r2 = e2.getParent();
  let i2 = n2, s2 = e2;
  return null !== r2 && (t2 && 0 === n2 ? (i2 = s2.getIndexWithinParent(), s2 = r2) : t2 || n2 !== s2.getChildrenSize() || (i2 = s2.getIndexWithinParent() + 1, s2 = r2)), s2.getChildAtIndex(t2 ? i2 - 1 : i2);
}
function Yt(e2, t2) {
  const n2 = e2.offset;
  if ("element" === e2.type) {
    return Xt(e2.getNode(), t2, n2);
  }
  {
    const r2 = e2.getNode();
    if (t2 && 0 === n2 || !t2 && n2 === r2.getTextContentSize()) {
      const e3 = t2 ? r2.getPreviousSibling() : r2.getNextSibling();
      return null === e3 ? Xt(r2.getParentOrThrow(), t2, r2.getIndexWithinParent() + (t2 ? 0 : 1)) : e3;
    }
  }
  return null;
}
function Zt(e2) {
  const t2 = an(e2).event, n2 = t2 && t2.inputType;
  return "insertFromPaste" === n2 || "insertFromPasteAsQuotation" === n2;
}
function en(e2, t2, n2) {
  return ms(e2, t2, n2);
}
function tn(e2) {
  return !Fs(e2) && !e2.isLastChild() && !e2.isInline();
}
function nn(e2, t2) {
  const n2 = e2._keyToDOMMap.get(t2);
  return void 0 === n2 && Re(75, t2), n2;
}
function rn(e2) {
  const t2 = e2.assignedSlot || e2.parentElement;
  return null !== t2 && 11 === t2.nodeType ? t2.host : t2;
}
function cn(e2, t2) {
  let n2 = e2.getParent();
  for (; null !== n2; ) {
    if (n2.is(t2)) return true;
    n2 = n2.getParent();
  }
  return false;
}
function an(e2) {
  const t2 = e2._window;
  return null === t2 && Re(78), t2;
}
function fn(e2) {
  let t2 = e2.getParentOrThrow();
  for (; null !== t2; ) {
    if (dn(t2)) return t2;
    t2 = t2.getParentOrThrow();
  }
  return t2;
}
function dn(e2) {
  return Fs(e2) || bs(e2) && e2.isShadowRoot();
}
function hn(e2) {
  const t2 = e2.constructor.clone(e2);
  return yt(t2, null), t2;
}
function gn(e2) {
  const t2 = ls(), n2 = e2.constructor.getType(), r2 = t2._nodes.get(n2);
  void 0 === r2 && Re(200, e2.constructor.name, n2);
  const { replace: i2, replaceWithKlass: s2 } = r2;
  if (null !== i2) {
    const t3 = i2(e2), r3 = t3.constructor;
    return null !== s2 ? t3 instanceof s2 || Re(201, s2.name, s2.getType(), r3.name, r3.getType(), e2.constructor.name, n2) : t3 instanceof e2.constructor && r3 !== e2.constructor || Re(202, r3.name, r3.getType(), e2.constructor.name, n2), t3.__key === e2.__key && Re(203, e2.constructor.name, n2, r3.name, r3.getType()), t3;
  }
  return e2;
}
function _n(e2, t2) {
  !Fs(e2.getParent()) || bs(t2) || Es(t2) || Re(99);
}
function yn(e2) {
  return (Es(e2) || bs(e2) && !e2.canBeEmpty()) && !e2.isInline();
}
function mn(e2, t2, n2) {
  n2.style.removeProperty("caret-color"), t2._blockCursorElement = null;
  const r2 = e2.parentElement;
  null !== r2 && r2.removeChild(e2);
}
function xn(e2, t2, n2) {
  let r2 = e2._blockCursorElement;
  if (ki(n2) && n2.isCollapsed() && "element" === n2.anchor.type && t2.contains(document.activeElement)) {
    const i2 = n2.anchor, s2 = i2.getNode(), o2 = i2.offset;
    let l2 = false, c2 = null;
    if (o2 === s2.getChildrenSize()) {
      yn(s2.getChildAtIndex(o2 - 1)) && (l2 = true);
    } else {
      const t3 = s2.getChildAtIndex(o2);
      if (null !== t3 && yn(t3)) {
        const n3 = t3.getPreviousSibling();
        (null === n3 || yn(n3)) && (l2 = true, c2 = e2.getElementByKey(t3.__key));
      }
    }
    if (l2) {
      const n3 = e2.getElementByKey(s2.__key);
      return null === r2 && (e2._blockCursorElement = r2 = (function(e3) {
        const t3 = e3.theme, n4 = document.createElement("div");
        n4.contentEditable = "false", n4.setAttribute("data-lexical-cursor", "true");
        let r3 = t3.blockCursor;
        if (void 0 !== r3) {
          if ("string" == typeof r3) {
            const e4 = Ke(r3);
            r3 = t3.blockCursor = e4;
          }
          void 0 !== r3 && n4.classList.add(...r3);
        }
        return n4;
      })(e2._config)), t2.style.caretColor = "transparent", void (null === c2 ? n3.appendChild(r2) : n3.insertBefore(r2, c2));
    }
  }
  null !== r2 && mn(r2, e2, t2);
}
function vn(e2) {
  return j ? (e2 || window).getSelection() : null;
}
function Sn(e2, t2) {
  let n2 = e2.getChildAtIndex(t2);
  null == n2 && (n2 = e2), dn(e2) && Re(102);
  const r2 = (e3) => {
    const t3 = e3.getParentOrThrow(), i3 = dn(t3), s3 = e3 !== n2 || i3 ? hn(e3) : e3;
    if (i3) return bs(e3) && bs(s3) || Re(133), e3.insertAfter(s3), [e3, s3, s3];
    {
      const [n3, i4, o2] = r2(t3), l2 = e3.getNextSiblings();
      return o2.append(s3, ...l2), [n3, i4, s3];
    }
  }, [i2, s2] = r2(n2);
  return [i2, s2];
}
function Cn(e2) {
  return Tn(e2) && "A" === e2.tagName;
}
function Tn(e2) {
  return 1 === e2.nodeType;
}
function kn(e2) {
  return 11 === e2.nodeType;
}
function bn(e2) {
  const t2 = new RegExp(/^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var|#text)$/, "i");
  return null !== e2.nodeName.match(t2);
}
function wn(e2) {
  const t2 = new RegExp(/^(address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hr|li|main|nav|noscript|ol|p|pre|section|table|td|tfoot|ul|video)$/, "i");
  return null !== e2.nodeName.match(t2);
}
function Nn(e2) {
  if (Es(e2) && !e2.isInline()) return true;
  if (!bs(e2) || dn(e2)) return false;
  const t2 = e2.getFirstChild(), n2 = null === t2 || Gr(t2) || hi(t2) || t2.isInline();
  return !e2.isInline() && false !== e2.canBeEmpty() && n2;
}
function En(e2, t2) {
  let n2 = e2;
  for (; null !== n2 && null !== n2.getParent() && !t2(n2); ) n2 = n2.getParentOrThrow();
  return t2(n2) ? n2 : null;
}
function Pn() {
  return ls();
}
const Fn = /* @__PURE__ */ new WeakMap(), Ln = /* @__PURE__ */ new Map();
function On(e2) {
  if (!e2._readOnly && e2.isEmpty()) return Ln;
  e2._readOnly || Re(192);
  let t2 = Fn.get(e2);
  if (!t2) {
    t2 = /* @__PURE__ */ new Map(), Fn.set(e2, t2);
    for (const [n2, r2] of e2._nodeMap) {
      const e3 = r2.__type;
      let i2 = t2.get(e3);
      i2 || (i2 = /* @__PURE__ */ new Map(), t2.set(e3, i2)), i2.set(n2, r2);
    }
  }
  return t2;
}
function Dn(e2) {
  const t2 = e2.constructor.clone(e2);
  return t2.afterCloneFrom(e2), t2;
}
function Mn(e2, t2) {
  const n2 = (parseInt(e2.style.paddingInlineStart, 10) || 0) / 40;
  t2.setIndent(n2);
}
function In(e2) {
  e2.__lexicalUnmanaged = true;
}
function An(e2) {
  return true === e2.__lexicalUnmanaged;
}
function Bn(e2, t2, n2, r2, i2, s2) {
  let o2 = e2.getFirstChild();
  for (; null !== o2; ) {
    const e3 = o2.__key;
    o2.__parent === t2 && (bs(o2) && Bn(o2, e3, n2, r2, i2, s2), n2.has(e3) || s2.delete(e3), i2.push(e3)), o2 = o2.getNextSibling();
  }
}
let zn, Wn, Rn, Kn, Jn, $n, Un, Vn, jn, Hn, qn = "", Gn = "", Qn = null, Xn = "", Yn = "", Zn = false, er = false, tr = null;
function nr(e2, t2) {
  const n2 = Un.get(e2);
  if (null !== t2) {
    const n3 = xr(e2);
    n3.parentNode === t2 && t2.removeChild(n3);
  }
  if (Vn.has(e2) || Wn._keyToDOMMap.delete(e2), bs(n2)) {
    const e3 = gr(n2, Un);
    rr(e3, 0, e3.length - 1, null);
  }
  void 0 !== n2 && Gt(Hn, Rn, Kn, n2, "destroyed");
}
function rr(e2, t2, n2, r2) {
  let i2 = t2;
  for (; i2 <= n2; ++i2) {
    const t3 = e2[i2];
    void 0 !== t3 && nr(t3, r2);
  }
}
function ir(e2, t2) {
  e2.setProperty("text-align", t2);
}
const sr = "40px";
function or(e2, t2) {
  const n2 = zn.theme.indent;
  if ("string" == typeof n2) {
    const r3 = e2.classList.contains(n2);
    t2 > 0 && !r3 ? e2.classList.add(n2) : t2 < 1 && r3 && e2.classList.remove(n2);
  }
  const r2 = getComputedStyle(e2).getPropertyValue("--lexical-indent-base-value") || sr;
  e2.style.setProperty("padding-inline-start", 0 === t2 ? "" : `calc(${t2} * ${r2})`);
}
function lr(e2, t2) {
  const n2 = e2.style;
  0 === t2 ? ir(n2, "") : t2 === ve ? ir(n2, "left") : t2 === Se ? ir(n2, "center") : t2 === Ce ? ir(n2, "right") : t2 === Te ? ir(n2, "justify") : t2 === ke ? ir(n2, "start") : t2 === be && ir(n2, "end");
}
function cr(e2, t2) {
  const n2 = Vn.get(e2);
  void 0 === n2 && Re(60);
  const r2 = n2.createDOM(zn, Wn);
  if ((function(e3, t3, n3) {
    const r3 = n3._keyToDOMMap;
    (function(e4, t4, n4) {
      e4[`__lexicalKey_${t4._key}`] = n4;
    })(t3, n3, e3), r3.set(e3, t3);
  })(e2, r2, Wn), hi(n2) ? r2.setAttribute("data-lexical-text", "true") : Es(n2) && r2.setAttribute("data-lexical-decorator", "true"), bs(n2)) {
    const e3 = n2.__indent, t3 = n2.__size;
    if (0 !== e3 && or(r2, e3), 0 !== t3) {
      const e4 = t3 - 1;
      !(function(e5, t4, n3, r3) {
        const i3 = Gn;
        Gn = "", ar(e5, n3, 0, t4, n3.getDOMSlot(r3)), dr(n3, r3), Gn = i3;
      })(gr(n2, Vn), e4, n2, r2);
    }
    const i2 = n2.__format;
    0 !== i2 && lr(r2, i2), n2.isInline() || fr(null, n2, r2), tn(n2) && (qn += Ne, Yn += Ne);
  } else {
    const t3 = n2.getTextContent();
    if (Es(n2)) {
      const t4 = n2.decorate(Wn, zn);
      null !== t4 && pr(e2, t4), r2.contentEditable = "false";
    } else hi(n2) && (n2.isDirectionless() || (Gn += t3));
    qn += t3, Yn += t3;
  }
  return null !== t2 && t2.insertChild(r2), Gt(Hn, Rn, Kn, n2, "created"), r2;
}
function ar(e2, t2, n2, r2, i2) {
  const s2 = qn;
  qn = "";
  let o2 = n2;
  for (; o2 <= r2; ++o2) {
    cr(e2[o2], i2);
    const t3 = Vn.get(e2[o2]);
    null !== t3 && hi(t3) && (null === Qn && (Qn = t3.getFormat()), "" === Xn && (Xn = t3.getStyle()));
  }
  tn(t2) && (qn += Ne);
  i2.element.__lexicalTextContent = qn, qn = s2 + qn;
}
function ur(e2, t2) {
  if (e2) {
    const n2 = e2.__last;
    if (n2) {
      const e3 = t2.get(n2);
      if (e3) return Gr(e3) ? "line-break" : Es(e3) && e3.isInline() ? "decorator" : null;
    }
    return "empty";
  }
  return null;
}
function fr(e2, t2, n2) {
  const r2 = ur(e2, Un), i2 = ur(t2, Vn);
  r2 !== i2 && t2.getDOMSlot(n2).setManagedLineBreak(i2);
}
function dr(e2, t2) {
  const n2 = t2.__lexicalDirTextContent || "", r2 = t2.__lexicalDir || "";
  if (n2 !== Gn || r2 !== tr) {
    const n3 = "" === Gn, s2 = n3 ? tr : (i2 = Gn, Le.test(i2) ? "rtl" : Oe.test(i2) ? "ltr" : null);
    if (s2 !== r2) {
      const i3 = t2.classList, o2 = zn.theme;
      let l2 = null !== r2 ? o2[r2] : void 0, c2 = null !== s2 ? o2[s2] : void 0;
      if (void 0 !== l2) {
        if ("string" == typeof l2) {
          const e3 = Ke(l2);
          l2 = o2[r2] = e3;
        }
        i3.remove(...l2);
      }
      if (null === s2 || n3 && "ltr" === s2) t2.removeAttribute("dir");
      else {
        if (void 0 !== c2) {
          if ("string" == typeof c2) {
            const e3 = Ke(c2);
            c2 = o2[s2] = e3;
          }
          void 0 !== c2 && i3.add(...c2);
        }
        t2.dir = s2;
      }
      if (!er) {
        e2.getWritable().__dir = s2;
      }
    }
    tr = s2, t2.__lexicalDirTextContent = Gn, t2.__lexicalDir = s2;
  }
  var i2;
}
function hr(e2, t2, n2) {
  const r2 = Gn;
  var i2;
  Gn = "", Qn = null, Xn = "", (function(e3, t3, n3) {
    const r3 = qn, i3 = e3.__size, s2 = t3.__size;
    qn = "";
    const o2 = n3.element;
    if (1 === i3 && 1 === s2) {
      const n4 = e3.__first, r4 = t3.__first;
      if (n4 === r4) _r(n4, o2);
      else {
        const e4 = xr(n4), t4 = cr(r4, null);
        try {
          o2.replaceChild(t4, e4);
        } catch (i5) {
          if ("object" == typeof i5 && null != i5) {
            const s3 = `${i5.toString()} Parent: ${o2.tagName}, new child: {tag: ${t4.tagName} key: ${r4}}, old child: {tag: ${e4.tagName}, key: ${n4}}.`;
            throw new Error(s3);
          }
          throw i5;
        }
        nr(n4, null);
      }
      const i4 = Vn.get(r4);
      hi(i4) && (null === Qn && (Qn = i4.getFormat()), "" === Xn && (Xn = i4.getStyle()));
    } else {
      const r4 = gr(e3, Un), l2 = gr(t3, Vn);
      if (r4.length !== i3 && Re(227), l2.length !== s2 && Re(228), 0 === i3) 0 !== s2 && ar(l2, t3, 0, s2 - 1, n3);
      else if (0 === s2) {
        if (0 !== i3) {
          const e4 = null == n3.after && null == n3.before && null == n3.element.__lexicalLineBreak;
          rr(r4, 0, i3 - 1, e4 ? null : o2), e4 && (o2.textContent = "");
        }
      } else !(function(e4, t4, n4, r5, i4, s3) {
        const o3 = r5 - 1, l3 = i4 - 1;
        let c2, a2, u2 = s3.getFirstChild(), f2 = 0, d2 = 0;
        for (; f2 <= o3 && d2 <= l3; ) {
          const e5 = t4[f2], r6 = n4[d2];
          if (e5 === r6) u2 = yr(_r(r6, s3.element)), f2++, d2++;
          else {
            void 0 === c2 && (c2 = new Set(t4)), void 0 === a2 && (a2 = new Set(n4));
            const i6 = a2.has(e5), o4 = c2.has(r6);
            if (i6) if (o4) {
              const e6 = nn(Wn, r6);
              e6 === u2 ? u2 = yr(_r(r6, s3.element)) : (s3.withBefore(u2).insertChild(e6), _r(r6, s3.element)), f2++, d2++;
            } else cr(r6, s3.withBefore(u2)), d2++;
            else u2 = yr(xr(e5)), nr(e5, s3.element), f2++;
          }
          const i5 = Vn.get(r6);
          null !== i5 && hi(i5) && (null === Qn && (Qn = i5.getFormat()), "" === Xn && (Xn = i5.getStyle()));
        }
        const h2 = f2 > o3, g2 = d2 > l3;
        if (h2 && !g2) {
          const t5 = n4[l3 + 1], r6 = void 0 === t5 ? null : Wn.getElementByKey(t5);
          ar(n4, e4, d2, l3, s3.withBefore(r6));
        } else g2 && !h2 && rr(t4, f2, o3, s3.element);
      })(t3, r4, l2, i3, s2, n3);
    }
    tn(t3) && (qn += Ne);
    o2.__lexicalTextContent = qn, qn = r3 + qn;
  })(e2, t2, t2.getDOMSlot(n2)), dr(t2, n2), Ws(i2 = t2) && null != Qn && Qn !== i2.__textFormat && !er && (i2.setTextFormat(Qn), i2.setTextStyle(Xn)), (function(e3) {
    Ws(e3) && "" !== Xn && Xn !== e3.__textStyle && !er && e3.setTextStyle(Xn);
  })(t2), Gn = r2;
}
function gr(e2, t2) {
  const n2 = [];
  let r2 = e2.__first;
  for (; null !== r2; ) {
    const e3 = t2.get(r2);
    void 0 === e3 && Re(101), n2.push(r2), r2 = e3.__next;
  }
  return n2;
}
function _r(e2, t2) {
  const n2 = Un.get(e2);
  let r2 = Vn.get(e2);
  void 0 !== n2 && void 0 !== r2 || Re(61);
  const i2 = Zn || $n.has(e2) || Jn.has(e2), s2 = nn(Wn, e2);
  if (n2 === r2 && !i2) {
    if (bs(n2)) {
      const e3 = s2.__lexicalTextContent;
      void 0 !== e3 && (qn += e3, Yn += e3);
      const t3 = s2.__lexicalDirTextContent;
      void 0 !== t3 && (Gn += t3);
    } else {
      const e3 = n2.getTextContent();
      hi(n2) && !n2.isDirectionless() && (Gn += e3), Yn += e3, qn += e3;
    }
    return s2;
  }
  if (n2 !== r2 && i2 && Gt(Hn, Rn, Kn, r2, "updated"), r2.updateDOM(n2, s2, zn)) {
    const n3 = cr(e2, null);
    return null === t2 && Re(62), t2.replaceChild(n3, s2), nr(e2, null), n3;
  }
  if (bs(n2) && bs(r2)) {
    const e3 = r2.__indent;
    e3 !== n2.__indent && or(s2, e3);
    const t3 = r2.__format;
    t3 !== n2.__format && lr(s2, t3), i2 && (hr(n2, r2, s2), Fs(r2) || r2.isInline() || fr(n2, r2, s2)), tn(r2) && (qn += Ne, Yn += Ne);
  } else {
    const t3 = r2.getTextContent();
    if (Es(r2)) {
      const t4 = r2.decorate(Wn, zn);
      null !== t4 && pr(e2, t4);
    } else hi(r2) && !r2.isDirectionless() && (Gn += t3);
    qn += t3, Yn += t3;
  }
  if (!er && Fs(r2) && r2.__cachedText !== Yn) {
    const e3 = r2.getWritable();
    e3.__cachedText = Yn, r2 = e3;
  }
  return s2;
}
function pr(e2, t2) {
  let n2 = Wn._pendingDecorators;
  const r2 = Wn._decorators;
  if (null === n2) {
    if (r2[e2] === t2) return;
    n2 = wt(Wn);
  }
  n2[e2] = t2;
}
function yr(e2) {
  let t2 = e2.nextSibling;
  return null !== t2 && t2 === Wn._blockCursorElement && (t2 = t2.nextSibling), t2;
}
function mr(e2, t2, n2, r2, i2, s2) {
  qn = "", Yn = "", Gn = "", Zn = r2 === le, tr = null, Wn = n2, zn = n2._config, Rn = n2._nodes, Kn = Wn._listeners.mutation, Jn = i2, $n = s2, Un = e2._nodeMap, Vn = t2._nodeMap, er = t2._readOnly, jn = new Map(n2._keyToDOMMap);
  const o2 = /* @__PURE__ */ new Map();
  return Hn = o2, _r("root", null), Wn = void 0, Rn = void 0, Jn = void 0, $n = void 0, Un = void 0, Vn = void 0, zn = void 0, jn = void 0, Hn = void 0, o2;
}
function xr(e2) {
  const t2 = jn.get(e2);
  return void 0 === t2 && Re(75, e2), t2;
}
const vr = Object.freeze({}), Sr = 30, Cr = [["keydown", function(e2, t2) {
  if (Tr = e2.timeStamp, kr = e2.key, t2.isComposing()) return;
  const { key: n2, shiftKey: r2, ctrlKey: o2, metaKey: l2, altKey: c2 } = e2;
  if (en(t2, _, e2)) return;
  if (null == n2) return;
  if ((function(e3, t3, n3, r3) {
    return Kt(e3) && !t3 && !r3 && !n3;
  })(n2, o2, c2, l2)) en(t2, p, e2);
  else if ((function(e3, t3, n3, r3, i2) {
    return Kt(e3) && !r3 && !n3 && (t3 || i2);
  })(n2, o2, r2, c2, l2)) en(t2, y, e2);
  else if ((function(e3, t3, n3, r3) {
    return Rt(e3) && !t3 && !r3 && !n3;
  })(n2, o2, c2, l2)) en(t2, m, e2);
  else if ((function(e3, t3, n3, r3, i2) {
    return Rt(e3) && !r3 && !n3 && (t3 || i2);
  })(n2, o2, r2, c2, l2)) en(t2, x, e2);
  else if (/* @__PURE__ */ (function(e3, t3, n3) {
    return /* @__PURE__ */ (function(e4) {
      return "ArrowUp" === e4;
    })(e3) && !t3 && !n3;
  })(n2, o2, l2)) en(t2, v, e2);
  else if (/* @__PURE__ */ (function(e3, t3, n3) {
    return /* @__PURE__ */ (function(e4) {
      return "ArrowDown" === e4;
    })(e3) && !t3 && !n3;
  })(n2, o2, l2)) en(t2, S, e2);
  else if ((function(e3, t3) {
    return $t(e3) && t3;
  })(n2, r2)) Fr = true, en(t2, C, e2);
  else if (/* @__PURE__ */ (function(e3) {
    return " " === e3;
  })(n2)) en(t2, T, e2);
  else if ((function(e3, t3) {
    return q && t3 && "o" === e3.toLowerCase();
  })(n2, o2)) e2.preventDefault(), Fr = true, en(t2, s, true);
  else if ((function(e3, t3) {
    return $t(e3) && !t3;
  })(n2, r2)) Fr = false, en(t2, C, e2);
  else if ((function(e3, t3, n3, r3) {
    return q ? !t3 && !n3 && (Ut(e3) || "h" === e3.toLowerCase() && r3) : !(r3 || t3 || n3) && Ut(e3);
  })(n2, c2, l2, o2)) Ut(n2) ? en(t2, k, e2) : (e2.preventDefault(), en(t2, i, true));
  else if (/* @__PURE__ */ (function(e3) {
    return "Escape" === e3;
  })(n2)) en(t2, b, e2);
  else if ((function(e3, t3, n3, r3, i2) {
    return q ? !(n3 || r3 || i2) && (Vt(e3) || "d" === e3.toLowerCase() && t3) : !(t3 || r3 || i2) && Vt(e3);
  })(n2, o2, r2, c2, l2)) Vt(n2) ? en(t2, w, e2) : (e2.preventDefault(), en(t2, i, false));
  else if ((function(e3, t3, n3) {
    return Ut(e3) && (q ? t3 : n3);
  })(n2, c2, o2)) e2.preventDefault(), en(t2, u, true);
  else if ((function(e3, t3, n3) {
    return Vt(e3) && (q ? t3 : n3);
  })(n2, c2, o2)) e2.preventDefault(), en(t2, u, false);
  else if ((function(e3, t3) {
    return q && t3 && Ut(e3);
  })(n2, l2)) e2.preventDefault(), en(t2, f, true);
  else if ((function(e3, t3) {
    return q && t3 && Vt(e3);
  })(n2, l2)) e2.preventDefault(), en(t2, f, false);
  else if ((function(e3, t3, n3, r3) {
    return "b" === e3.toLowerCase() && !t3 && Jt(n3, r3);
  })(n2, c2, l2, o2)) e2.preventDefault(), en(t2, d, "bold");
  else if ((function(e3, t3, n3, r3) {
    return "u" === e3.toLowerCase() && !t3 && Jt(n3, r3);
  })(n2, c2, l2, o2)) e2.preventDefault(), en(t2, d, "underline");
  else if ((function(e3, t3, n3, r3) {
    return "i" === e3.toLowerCase() && !t3 && Jt(n3, r3);
  })(n2, c2, l2, o2)) e2.preventDefault(), en(t2, d, "italic");
  else if (/* @__PURE__ */ (function(e3, t3, n3, r3) {
    return "Tab" === e3 && !t3 && !n3 && !r3;
  })(n2, c2, o2, l2)) en(t2, N, e2);
  else if ((function(e3, t3, n3, r3) {
    return "z" === e3.toLowerCase() && !t3 && Jt(n3, r3);
  })(n2, r2, l2, o2)) e2.preventDefault(), en(t2, h, void 0);
  else if ((function(e3, t3, n3, r3) {
    return q ? "z" === e3.toLowerCase() && n3 && t3 : "y" === e3.toLowerCase() && r3 || "z" === e3.toLowerCase() && r3 && t3;
  })(n2, r2, l2, o2)) e2.preventDefault(), en(t2, g, void 0);
  else {
    const i2 = t2._editorState._selection;
    null === i2 || ki(i2) ? !G && jt(n2, l2, o2) && (e2.preventDefault(), en(t2, z, e2)) : !(function(e3, t3, n3, r3) {
      return !t3 && "c" === e3.toLowerCase() && (q ? n3 : r3);
    })(n2, r2, l2, o2) ? !(function(e3, t3, n3, r3) {
      return !t3 && "x" === e3.toLowerCase() && (q ? n3 : r3);
    })(n2, r2, l2, o2) ? jt(n2, l2, o2) && (e2.preventDefault(), en(t2, z, e2)) : (e2.preventDefault(), en(t2, B, e2)) : (e2.preventDefault(), en(t2, A, e2));
  }
  /* @__PURE__ */ (function(e3, t3, n3, r3) {
    return e3 || t3 || n3 || r3;
  })(o2, r2, c2, l2) && en(t2, V, e2);
}], ["pointerdown", function(e2, t2) {
  const n2 = e2.target, r2 = e2.pointerType;
  n2 instanceof Node && "touch" !== r2 && Ss(t2, (() => {
    Es(bt(n2)) || (Pr = true);
  }));
}], ["compositionstart", function(e2, t2) {
  Ss(t2, (() => {
    const n2 = Ri();
    if (ki(n2) && !t2.isComposing()) {
      const r2 = n2.anchor, i2 = n2.anchor.getNode();
      vt(r2.key), (e2.timeStamp < Tr + Sr || "element" === r2.type || !n2.isCollapsed() || i2.getFormat() !== n2.format || hi(i2) && i2.getStyle() !== n2.style) && en(t2, l, Ee);
    }
  }));
}], ["compositionend", function(e2, t2) {
  G ? Lr = true : Ss(t2, (() => {
    Br(t2, e2.data);
  }));
}], ["input", function(e2, t2) {
  e2.stopPropagation(), Ss(t2, (() => {
    const n2 = Ri(), r2 = e2.data, i2 = Ar(e2);
    if (null != r2 && ki(n2) && Dr(n2, i2, r2, e2.timeStamp, false)) {
      Lr && (Br(t2, r2), Lr = false);
      const i3 = n2.anchor.getNode(), s2 = vn(t2._window);
      if (null === s2) return;
      const o2 = n2.isBackward(), c2 = o2 ? n2.anchor.offset : n2.focus.offset, a2 = o2 ? n2.focus.offset : n2.anchor.offset;
      Q && !n2.isCollapsed() && hi(i3) && null !== s2.anchorNode && i3.getTextContent().slice(0, c2) + r2 + i3.getTextContent().slice(c2 + a2) === At(s2.anchorNode) || en(t2, l, r2);
      const u2 = r2.length;
      G && u2 > 1 && "insertCompositionText" === e2.inputType && !t2.isComposing() && (n2.anchor.offset -= u2), X || Y || ne || !t2.isComposing() || (Tr = 0, vt(null));
    } else {
      Bt(false, t2, null !== r2 ? r2 : void 0), Lr && (Br(t2, r2 || void 0), Lr = false);
    }
    is(), Xe(ls());
  })), wr = null;
}], ["click", function(e2, t2) {
  Ss(t2, (() => {
    const n2 = Ri(), i2 = vn(t2._window), s2 = Ki();
    if (i2) {
      if (ki(n2)) {
        const t3 = n2.anchor, r2 = t3.getNode();
        if ("element" === t3.type && 0 === t3.offset && n2.isCollapsed() && !Fs(r2) && 1 === Et().getChildrenSize() && r2.getTopLevelElementOrThrow().isEmpty() && null !== s2 && n2.is(s2)) i2.removeAllRanges(), n2.dirty = true;
        else if (3 === e2.detail && !n2.isCollapsed()) {
          r2 !== n2.focus.getNode() && (bs(r2) ? r2.select(0) : r2.getParentOrThrow().select(0));
        }
      } else if ("touch" === e2.pointerType) {
        const n3 = i2.anchorNode;
        if (null !== n3) {
          const r2 = n3.nodeType;
          if (r2 === re || r2 === ie) {
            Ft(Wi(s2, i2, t2, e2));
          }
        }
      }
    }
    en(t2, r, e2);
  }));
}], ["cut", vr], ["copy", vr], ["dragstart", vr], ["dragover", vr], ["dragend", vr], ["paste", vr], ["focus", vr], ["blur", vr], ["drop", vr]];
Q && Cr.push(["beforeinput", (e2, t2) => (function(e3, t3) {
  const n2 = e3.inputType, r2 = Ar(e3);
  if ("deleteCompositionText" === n2 || G && Zt(t3)) return;
  if ("insertCompositionText" === n2) return;
  Ss(t3, (() => {
    const _2 = Ri();
    if ("deleteContentBackward" === n2) {
      if (null === _2) {
        const e4 = Ki();
        if (!ki(e4)) return;
        Ft(e4.clone());
      }
      if (ki(_2)) {
        const n3 = _2.anchor.key === _2.focus.key;
        if (p2 = e3.timeStamp, "MediaLast" === kr && p2 < Tr + Sr && t3.isComposing() && n3) {
          if (vt(null), Tr = 0, setTimeout((() => {
            Ss(t3, (() => {
              vt(null);
            }));
          }), Sr), ki(_2)) {
            const e4 = _2.anchor.getNode();
            e4.markDirty(), _2.format = e4.getFormat(), hi(e4) || Re(142), _2.style = e4.getStyle();
          }
        } else {
          vt(null), e3.preventDefault();
          const r3 = _2.anchor.getNode(), s2 = r3.getTextContent(), o2 = r3.canInsertTextAfter(), l2 = 0 === _2.anchor.offset && _2.focus.offset === s2.length;
          te && n3 && !l2 && o2 || en(t3, i, true);
        }
        return;
      }
    }
    var p2;
    if (!ki(_2)) return;
    const y2 = e3.data;
    null !== wr && Bt(false, t3, wr), _2.dirty && null === wr || !_2.isCollapsed() || Fs(_2.anchor.getNode()) || null === r2 || _2.applyDOMRange(r2), wr = null;
    const m2 = _2.anchor, x2 = _2.focus, v2 = m2.getNode(), S2 = x2.getNode();
    if ("insertText" !== n2 && "insertTranspose" !== n2) switch (e3.preventDefault(), n2) {
      case "insertFromYank":
      case "insertFromDrop":
      case "insertReplacementText":
        en(t3, l, e3);
        break;
      case "insertFromComposition":
        vt(null), en(t3, l, e3);
        break;
      case "insertLineBreak":
        vt(null), en(t3, s, false);
        break;
      case "insertParagraph":
        vt(null), Fr && !Y ? (Fr = false, en(t3, s, false)) : en(t3, o, void 0);
        break;
      case "insertFromPaste":
      case "insertFromPasteAsQuotation":
        en(t3, c, e3);
        break;
      case "deleteByComposition":
        (function(e4, t4) {
          return e4 !== t4 || bs(e4) || bs(t4) || !e4.isToken() || !t4.isToken();
        })(v2, S2) && en(t3, a, e3);
        break;
      case "deleteByDrag":
      case "deleteByCut":
        en(t3, a, e3);
        break;
      case "deleteContent":
        en(t3, i, false);
        break;
      case "deleteWordBackward":
        en(t3, u, true);
        break;
      case "deleteWordForward":
        en(t3, u, false);
        break;
      case "deleteHardLineBackward":
      case "deleteSoftLineBackward":
        en(t3, f, true);
        break;
      case "deleteContentForward":
      case "deleteHardLineForward":
      case "deleteSoftLineForward":
        en(t3, f, false);
        break;
      case "formatStrikeThrough":
        en(t3, d, "strikethrough");
        break;
      case "formatBold":
        en(t3, d, "bold");
        break;
      case "formatItalic":
        en(t3, d, "italic");
        break;
      case "formatUnderline":
        en(t3, d, "underline");
        break;
      case "historyUndo":
        en(t3, h, void 0);
        break;
      case "historyRedo":
        en(t3, g, void 0);
    }
    else {
      if ("\n" === y2) e3.preventDefault(), en(t3, s, false);
      else if (y2 === Ne) e3.preventDefault(), en(t3, o, void 0);
      else if (null == y2 && e3.dataTransfer) {
        const t4 = e3.dataTransfer.getData("text/plain");
        e3.preventDefault(), _2.insertRawText(t4);
      } else null != y2 && Dr(_2, r2, y2, e3.timeStamp, true) ? (e3.preventDefault(), en(t3, l, y2)) : wr = y2;
      br = e3.timeStamp;
    }
  }));
})(e2, t2)]);
let Tr = 0, kr = null, br = 0, wr = null;
const Nr = /* @__PURE__ */ new WeakMap();
let Er = false, Pr = false, Fr = false, Lr = false, Or = [0, "", 0, "root", 0];
function Dr(e2, t2, n2, r2, i2) {
  const s2 = e2.anchor, o2 = e2.focus, l2 = s2.getNode(), c2 = ls(), a2 = vn(c2._window), u2 = null !== a2 ? a2.anchorNode : null, f2 = s2.key, d2 = c2.getElementByKey(f2), h2 = n2.length;
  return f2 !== o2.key || !hi(l2) || (!i2 && (!Q || br < r2 + 50) || l2.isDirty() && h2 < 2 || Dt(n2)) && s2.offset !== o2.offset && !l2.isComposing() || dt(l2) || l2.isDirty() && h2 > 1 || (i2 || !Q) && null !== d2 && !l2.isComposing() && u2 !== gt(d2) || null !== a2 && null !== t2 && (!t2.collapsed || t2.startContainer !== a2.anchorNode || t2.startOffset !== a2.anchorOffset) || l2.getFormat() !== e2.format || l2.getStyle() !== e2.style || Wt(e2, l2);
}
function Mr(e2, t2) {
  return null !== e2 && null !== e2.nodeValue && e2.nodeType === ie && 0 !== t2 && t2 !== e2.nodeValue.length;
}
function Ir(e2, n2, r2) {
  const { anchorNode: i2, anchorOffset: s2, focusNode: o2, focusOffset: l2 } = e2;
  Er && (Er = false, Mr(i2, s2) && Mr(o2, l2)) || Ss(n2, (() => {
    if (!r2) return void Ft(null);
    if (!ct(n2, i2, o2)) return;
    const c2 = Ri();
    if (ki(c2)) {
      const t2 = c2.anchor, r3 = t2.getNode();
      if (c2.isCollapsed()) {
        "Range" === e2.type && e2.anchorNode === e2.focusNode && (c2.dirty = true);
        const i3 = an(n2).event, s3 = i3 ? i3.timeStamp : performance.now(), [o3, l3, a2, u2, f2] = Or, d2 = Et(), h2 = false === n2.isComposing() && "" === d2.getTextContent();
        if (s3 < f2 + 200 && t2.offset === a2 && t2.key === u2) c2.format = o3, c2.style = l3;
        else if ("text" === t2.type) hi(r3) || Re(141), c2.format = r3.getFormat(), c2.style = r3.getStyle();
        else if ("element" === t2.type && !h2) {
          const e3 = t2.getNode();
          c2.style = "", e3 instanceof As && 0 === e3.getChildrenSize() ? (c2.format = e3.getTextFormat(), c2.style = e3.getTextStyle()) : c2.format = 0;
        }
      } else {
        const e3 = t2.key, n3 = c2.focus.key, r4 = c2.getNodes(), i3 = r4.length, o3 = c2.isBackward(), a2 = o3 ? l2 : s2, u2 = o3 ? s2 : l2, f2 = o3 ? n3 : e3, d2 = o3 ? e3 : n3;
        let h2 = xe, g2 = false;
        for (let e4 = 0; e4 < i3; e4++) {
          const t3 = r4[e4], n4 = t3.getTextContentSize();
          if (hi(t3) && 0 !== n4 && !(0 === e4 && t3.__key === f2 && a2 === n4 || e4 === i3 - 1 && t3.__key === d2 && 0 === u2) && (g2 = true, h2 &= t3.getFormat(), 0 === h2)) break;
        }
        c2.format = g2 ? h2 : 0;
      }
    }
    en(n2, t, void 0);
  }));
}
function Ar(e2) {
  if (!e2.getTargetRanges) return null;
  const t2 = e2.getTargetRanges();
  return 0 === t2.length ? null : t2[0];
}
function Br(e2, t2) {
  const n2 = e2._compositionKey;
  if (vt(null), null !== n2 && null != t2) {
    if ("" === t2) {
      const t3 = Ct(n2), r2 = gt(e2.getElementByKey(n2));
      return void (null !== r2 && null !== r2.nodeValue && hi(t3) && zt(t3, r2.nodeValue, null, null, true));
    }
    if ("\n" === t2[t2.length - 1]) {
      const t3 = Ri();
      if (ki(t3)) {
        const n3 = t3.focus;
        return t3.anchor.set(n3.key, n3.offset, n3.type), void en(e2, C, null);
      }
    }
  }
  Bt(true, e2, t2);
}
function zr(e2) {
  let t2 = e2.__lexicalEventHandles;
  return void 0 === t2 && (t2 = [], e2.__lexicalEventHandles = t2), t2;
}
const Wr = /* @__PURE__ */ new Map();
function Rr(e2) {
  const t2 = e2.target, n2 = vn(null == t2 ? null : 9 === t2.nodeType ? t2.defaultView : t2.ownerDocument.defaultView);
  if (null === n2) return;
  const r2 = ut(n2.anchorNode);
  if (null === r2) return;
  Pr && (Pr = false, Ss(r2, (() => {
    const t3 = Ki(), i3 = n2.anchorNode;
    if (null === i3) return;
    const s3 = i3.nodeType;
    if (s3 !== re && s3 !== ie) return;
    Ft(Wi(t3, n2, r2, e2));
  })));
  const i2 = Mt(r2), s2 = i2[i2.length - 1], o2 = s2._key, l2 = Wr.get(o2), c2 = l2 || s2;
  c2 !== r2 && Ir(n2, c2, false), Ir(n2, r2, true), r2 !== s2 ? Wr.set(o2, r2) : l2 && Wr.delete(o2);
}
function Kr(e2) {
  e2._lexicalHandled = true;
}
function Jr(e2) {
  return true === e2._lexicalHandled;
}
function $r(e2) {
  const t2 = e2.ownerDocument, n2 = Nr.get(t2);
  void 0 === n2 && Re(162);
  const r2 = n2 - 1;
  r2 >= 0 || Re(164), Nr.set(t2, r2), 0 === r2 && t2.removeEventListener("selectionchange", Rr);
  const i2 = ft(e2);
  at(i2) ? (!(function(e3) {
    if (null !== e3._parentEditor) {
      const t3 = Mt(e3), n3 = t3[t3.length - 1]._key;
      Wr.get(n3) === e3 && Wr.delete(n3);
    } else Wr.delete(e3._key);
  })(i2), e2.__lexicalEditor = null) : i2 && Re(198);
  const s2 = zr(e2);
  for (let e3 = 0; e3 < s2.length; e3++) s2[e3]();
  e2.__lexicalEventHandles = [];
}
function Ur(e2, t2, n2) {
  is();
  const r2 = e2.__key, i2 = e2.getParent();
  if (null === i2) return;
  const s2 = (function(e3) {
    const t3 = Ri();
    if (!ki(t3) || !bs(e3)) return t3;
    const { anchor: n3, focus: r3 } = t3, i3 = n3.getNode(), s3 = r3.getNode();
    return cn(i3, e3) && n3.set(e3.__key, 0, "element"), cn(s3, e3) && r3.set(e3.__key, 0, "element"), t3;
  })(e2);
  let o2 = false;
  if (ki(s2) && t2) {
    const t3 = s2.anchor, n3 = s2.focus;
    t3.key === r2 && (Ui(t3, e2, i2, e2.getPreviousSibling(), e2.getNextSibling()), o2 = true), n3.key === r2 && (Ui(n3, e2, i2, e2.getPreviousSibling(), e2.getNextSibling()), o2 = true);
  } else wi(s2) && t2 && e2.isSelected() && e2.selectPrevious();
  if (ki(s2) && t2 && !o2) {
    const t3 = e2.getIndexWithinParent();
    mt(e2), Ji(s2, i2, t3, -1);
  } else mt(e2);
  n2 || dn(i2) || i2.canBeEmpty() || !i2.isEmpty() || Ur(i2, t2), t2 && Fs(i2) && i2.isEmpty() && i2.selectEnd();
}
class Vr {
  static getType() {
    Re(64, this.name);
  }
  static clone(e2) {
    Re(65, this.name);
  }
  afterCloneFrom(e2) {
    this.__parent = e2.__parent, this.__next = e2.__next, this.__prev = e2.__prev;
  }
  constructor(e2) {
    this.__type = this.constructor.getType(), this.__parent = null, this.__prev = null, this.__next = null, yt(this, e2);
  }
  getType() {
    return this.__type;
  }
  isInline() {
    Re(137, this.constructor.name);
  }
  isAttached() {
    let e2 = this.__key;
    for (; null !== e2; ) {
      if ("root" === e2) return true;
      const t2 = Ct(e2);
      if (null === t2) break;
      e2 = t2.__parent;
    }
    return false;
  }
  isSelected(e2) {
    const t2 = e2 || Ri();
    if (null == t2) return false;
    const n2 = t2.getNodes().some(((e3) => e3.__key === this.__key));
    if (hi(this)) return n2;
    if (ki(t2) && "element" === t2.anchor.type && "element" === t2.focus.type) {
      if (t2.isCollapsed()) return false;
      const e3 = this.getParent();
      if (Es(this) && this.isInline() && e3) {
        const n3 = t2.isBackward() ? t2.focus : t2.anchor, r2 = n3.getNode();
        if (n3.offset === r2.getChildrenSize() && r2.is(e3) && r2.getLastChildOrThrow().is(this)) return false;
      }
    }
    return n2;
  }
  getKey() {
    return this.__key;
  }
  getIndexWithinParent() {
    const e2 = this.getParent();
    if (null === e2) return -1;
    let t2 = e2.getFirstChild(), n2 = 0;
    for (; null !== t2; ) {
      if (this.is(t2)) return n2;
      n2++, t2 = t2.getNextSibling();
    }
    return -1;
  }
  getParent() {
    const e2 = this.getLatest().__parent;
    return null === e2 ? null : Ct(e2);
  }
  getParentOrThrow() {
    const e2 = this.getParent();
    return null === e2 && Re(66, this.__key), e2;
  }
  getTopLevelElement() {
    let e2 = this;
    for (; null !== e2; ) {
      const t2 = e2.getParent();
      if (dn(t2)) return bs(e2) || e2 === this && Es(e2) || Re(194), e2;
      e2 = t2;
    }
    return null;
  }
  getTopLevelElementOrThrow() {
    const e2 = this.getTopLevelElement();
    return null === e2 && Re(67, this.__key), e2;
  }
  getParents() {
    const e2 = [];
    let t2 = this.getParent();
    for (; null !== t2; ) e2.push(t2), t2 = t2.getParent();
    return e2;
  }
  getParentKeys() {
    const e2 = [];
    let t2 = this.getParent();
    for (; null !== t2; ) e2.push(t2.__key), t2 = t2.getParent();
    return e2;
  }
  getPreviousSibling() {
    const e2 = this.getLatest().__prev;
    return null === e2 ? null : Ct(e2);
  }
  getPreviousSiblings() {
    const e2 = [], t2 = this.getParent();
    if (null === t2) return e2;
    let n2 = t2.getFirstChild();
    for (; null !== n2 && !n2.is(this); ) e2.push(n2), n2 = n2.getNextSibling();
    return e2;
  }
  getNextSibling() {
    const e2 = this.getLatest().__next;
    return null === e2 ? null : Ct(e2);
  }
  getNextSiblings() {
    const e2 = [];
    let t2 = this.getNextSibling();
    for (; null !== t2; ) e2.push(t2), t2 = t2.getNextSibling();
    return e2;
  }
  getCommonAncestor(e2) {
    const t2 = this.getParents(), n2 = e2.getParents();
    bs(this) && t2.unshift(this), bs(e2) && n2.unshift(e2);
    const r2 = t2.length, i2 = n2.length;
    if (0 === r2 || 0 === i2 || t2[r2 - 1] !== n2[i2 - 1]) return null;
    const s2 = new Set(n2);
    for (let e3 = 0; e3 < r2; e3++) {
      const n3 = t2[e3];
      if (s2.has(n3)) return n3;
    }
    return null;
  }
  is(e2) {
    return null != e2 && this.__key === e2.__key;
  }
  isBefore(e2) {
    if (this === e2) return false;
    if (e2.isParentOf(this)) return true;
    if (this.isParentOf(e2)) return false;
    const t2 = this.getCommonAncestor(e2);
    let n2 = 0, r2 = 0, i2 = this;
    for (; ; ) {
      const e3 = i2.getParentOrThrow();
      if (e3 === t2) {
        n2 = i2.getIndexWithinParent();
        break;
      }
      i2 = e3;
    }
    for (i2 = e2; ; ) {
      const e3 = i2.getParentOrThrow();
      if (e3 === t2) {
        r2 = i2.getIndexWithinParent();
        break;
      }
      i2 = e3;
    }
    return n2 < r2;
  }
  isParentOf(e2) {
    const t2 = this.__key;
    if (t2 === e2.__key) return false;
    let n2 = e2;
    for (; null !== n2; ) {
      if (n2.__key === t2) return true;
      n2 = n2.getParent();
    }
    return false;
  }
  getNodesBetween(e2) {
    const t2 = this.isBefore(e2), n2 = [], r2 = /* @__PURE__ */ new Set();
    let i2 = this;
    for (; null !== i2; ) {
      const s2 = i2.__key;
      if (r2.has(s2) || (r2.add(s2), n2.push(i2)), i2 === e2) break;
      const o2 = bs(i2) ? t2 ? i2.getFirstChild() : i2.getLastChild() : null;
      if (null !== o2) {
        i2 = o2;
        continue;
      }
      const l2 = t2 ? i2.getNextSibling() : i2.getPreviousSibling();
      if (null !== l2) {
        i2 = l2;
        continue;
      }
      const c2 = i2.getParentOrThrow();
      if (r2.has(c2.__key) || n2.push(c2), c2 === e2) break;
      let a2 = null, u2 = c2;
      do {
        if (null === u2 && Re(68), a2 = t2 ? u2.getNextSibling() : u2.getPreviousSibling(), u2 = u2.getParent(), null === u2) break;
        null !== a2 || r2.has(u2.__key) || n2.push(u2);
      } while (null === a2);
      i2 = a2;
    }
    return t2 || n2.reverse(), n2;
  }
  isDirty() {
    const e2 = ls()._dirtyLeaves;
    return null !== e2 && e2.has(this.__key);
  }
  getLatest() {
    const e2 = Ct(this.__key);
    return null === e2 && Re(113), e2;
  }
  getWritable() {
    is();
    const e2 = os(), t2 = ls(), n2 = e2._nodeMap, r2 = this.__key, i2 = this.getLatest(), s2 = t2._cloneNotNeeded, o2 = Ri();
    if (null !== o2 && o2.setCachedNodes(null), s2.has(r2)) return xt(i2), i2;
    const l2 = Dn(i2);
    return s2.add(r2), xt(l2), n2.set(r2, l2), l2;
  }
  getTextContent() {
    return "";
  }
  getTextContentSize() {
    return this.getTextContent().length;
  }
  createDOM(e2, t2) {
    Re(70);
  }
  updateDOM(e2, t2, n2) {
    Re(71);
  }
  exportDOM(e2) {
    return { element: this.createDOM(e2._config, e2) };
  }
  exportJSON() {
    Re(72);
  }
  static importJSON(e2) {
    Re(18, this.name);
  }
  static transform() {
    return null;
  }
  remove(e2) {
    Ur(this, true, e2);
  }
  replace(e2, t2) {
    is();
    let n2 = Ri();
    null !== n2 && (n2 = n2.clone()), _n(this, e2);
    const r2 = this.getLatest(), i2 = this.__key, s2 = e2.__key, o2 = e2.getWritable(), l2 = this.getParentOrThrow().getWritable(), c2 = l2.__size;
    mt(o2);
    const a2 = r2.getPreviousSibling(), u2 = r2.getNextSibling(), f2 = r2.__prev, d2 = r2.__next, h2 = r2.__parent;
    if (Ur(r2, false, true), null === a2) l2.__first = s2;
    else {
      a2.getWritable().__next = s2;
    }
    if (o2.__prev = f2, null === u2) l2.__last = s2;
    else {
      u2.getWritable().__prev = s2;
    }
    if (o2.__next = d2, o2.__parent = h2, l2.__size = c2, t2 && (bs(this) && bs(o2) || Re(139), this.getChildren().forEach(((e3) => {
      o2.append(e3);
    }))), ki(n2)) {
      Ft(n2);
      const e3 = n2.anchor, t3 = n2.focus;
      e3.key === i2 && Si(e3, o2), t3.key === i2 && Si(t3, o2);
    }
    return St() === i2 && vt(s2), o2;
  }
  insertAfter(e2, t2 = true) {
    is(), _n(this, e2);
    const n2 = this.getWritable(), r2 = e2.getWritable(), i2 = r2.getParent(), s2 = Ri();
    let o2 = false, l2 = false;
    if (null !== i2) {
      const t3 = e2.getIndexWithinParent();
      if (mt(r2), ki(s2)) {
        const e3 = i2.__key, n3 = s2.anchor, r3 = s2.focus;
        o2 = "element" === n3.type && n3.key === e3 && n3.offset === t3 + 1, l2 = "element" === r3.type && r3.key === e3 && r3.offset === t3 + 1;
      }
    }
    const c2 = this.getNextSibling(), a2 = this.getParentOrThrow().getWritable(), u2 = r2.__key, f2 = n2.__next;
    if (null === c2) a2.__last = u2;
    else {
      c2.getWritable().__prev = u2;
    }
    if (a2.__size++, n2.__next = u2, r2.__next = f2, r2.__prev = n2.__key, r2.__parent = n2.__parent, t2 && ki(s2)) {
      const e3 = this.getIndexWithinParent();
      Ji(s2, a2, e3 + 1);
      const t3 = a2.__key;
      o2 && s2.anchor.set(t3, e3 + 2, "element"), l2 && s2.focus.set(t3, e3 + 2, "element");
    }
    return e2;
  }
  insertBefore(e2, t2 = true) {
    is(), _n(this, e2);
    const n2 = this.getWritable(), r2 = e2.getWritable(), i2 = r2.__key;
    mt(r2);
    const s2 = this.getPreviousSibling(), o2 = this.getParentOrThrow().getWritable(), l2 = n2.__prev, c2 = this.getIndexWithinParent();
    if (null === s2) o2.__first = i2;
    else {
      s2.getWritable().__next = i2;
    }
    o2.__size++, n2.__prev = i2, r2.__prev = l2, r2.__next = n2.__key, r2.__parent = n2.__parent;
    const a2 = Ri();
    if (t2 && ki(a2)) {
      Ji(a2, this.getParentOrThrow(), c2);
    }
    return e2;
  }
  isParentRequired() {
    return false;
  }
  createParentElementNode() {
    return zs();
  }
  selectStart() {
    return this.selectPrevious();
  }
  selectEnd() {
    return this.selectNext(0, 0);
  }
  selectPrevious(e2, t2) {
    is();
    const n2 = this.getPreviousSibling(), r2 = this.getParentOrThrow();
    if (null === n2) return r2.select(0, 0);
    if (bs(n2)) return n2.select();
    if (!hi(n2)) {
      const e3 = n2.getIndexWithinParent() + 1;
      return r2.select(e3, e3);
    }
    return n2.select(e2, t2);
  }
  selectNext(e2, t2) {
    is();
    const n2 = this.getNextSibling(), r2 = this.getParentOrThrow();
    if (null === n2) return r2.select();
    if (bs(n2)) return n2.select(0, 0);
    if (!hi(n2)) {
      const e3 = n2.getIndexWithinParent();
      return r2.select(e3, e3);
    }
    return n2.select(e2, t2);
  }
  markDirty() {
    this.getWritable();
  }
  reconcileObservedMutation(e2, t2) {
    this.markDirty();
  }
}
class jr extends Vr {
  static getType() {
    return "linebreak";
  }
  static clone(e2) {
    return new jr(e2.__key);
  }
  constructor(e2) {
    super(e2);
  }
  getTextContent() {
    return "\n";
  }
  createDOM() {
    return document.createElement("br");
  }
  updateDOM() {
    return false;
  }
  static importDOM() {
    return { br: (e2) => (function(e3) {
      const t2 = e3.parentElement;
      if (null !== t2 && wn(t2)) {
        const n2 = t2.firstChild;
        if (n2 === e3 || n2.nextSibling === e3 && Qr(n2)) {
          const n3 = t2.lastChild;
          if (n3 === e3 || n3.previousSibling === e3 && Qr(n3)) return true;
        }
      }
      return false;
    })(e2) || (function(e3) {
      const t2 = e3.parentElement;
      if (null !== t2 && wn(t2)) {
        const n2 = t2.firstChild;
        if (n2 === e3 || n2.nextSibling === e3 && Qr(n2)) return false;
        const r2 = t2.lastChild;
        if (r2 === e3 || r2.previousSibling === e3 && Qr(r2)) return true;
      }
      return false;
    })(e2) ? null : { conversion: Hr, priority: 0 } };
  }
  static importJSON(e2) {
    return qr();
  }
  exportJSON() {
    return { type: "linebreak", version: 1 };
  }
}
function Hr(e2) {
  return { node: qr() };
}
function qr() {
  return gn(new jr());
}
function Gr(e2) {
  return e2 instanceof jr;
}
function Qr(e2) {
  return e2.nodeType === ie && /^( |\t|\r?\n)+$/.test(e2.textContent || "");
}
function Xr(e2, t2) {
  return 16 & t2 ? "code" : t2 & me ? "mark" : 32 & t2 ? "sub" : 64 & t2 ? "sup" : null;
}
function Yr(e2, t2) {
  return 1 & t2 ? "strong" : 2 & t2 ? "em" : "span";
}
function Zr(e2, t2, n2, r2, i2) {
  const s2 = r2.classList;
  let o2 = qt(i2, "base");
  void 0 !== o2 && s2.add(...o2), o2 = qt(i2, "underlineStrikethrough");
  let l2 = false;
  const c2 = t2 & ge && t2 & he;
  void 0 !== o2 && (n2 & ge && n2 & he ? (l2 = true, c2 || s2.add(...o2)) : c2 && s2.remove(...o2));
  for (const e3 in De) {
    const r3 = De[e3];
    if (o2 = qt(i2, e3), void 0 !== o2) if (n2 & r3) {
      if (l2 && ("underline" === e3 || "strikethrough" === e3)) {
        t2 & r3 && s2.remove(...o2);
        continue;
      }
      t2 & r3 && (!c2 || "underline" !== e3) && "strikethrough" !== e3 || s2.add(...o2);
    } else t2 & r3 && s2.remove(...o2);
  }
}
function ei(e2, t2, n2) {
  const r2 = t2.firstChild, i2 = n2.isComposing(), s2 = e2 + (i2 ? we : "");
  if (null == r2) t2.textContent = s2;
  else {
    const e3 = r2.nodeValue;
    if (e3 !== s2) if (i2 || G) {
      const [t3, n3, i3] = (function(e4, t4) {
        const n4 = e4.length, r3 = t4.length;
        let i4 = 0, s3 = 0;
        for (; i4 < n4 && i4 < r3 && e4[i4] === t4[i4]; ) i4++;
        for (; s3 + i4 < n4 && s3 + i4 < r3 && e4[n4 - s3 - 1] === t4[r3 - s3 - 1]; ) s3++;
        return [i4, n4 - i4 - s3, t4.slice(i4, r3 - s3)];
      })(e3, s2);
      0 !== n3 && r2.deleteData(t3, n3), r2.insertData(t3, i3);
    } else r2.nodeValue = s2;
  }
}
function ti(e2, t2, n2, r2, i2, s2) {
  ei(i2, e2, t2);
  const o2 = s2.theme.text;
  void 0 !== o2 && Zr(0, 0, r2, e2, o2);
}
function ni(e2, t2) {
  const n2 = document.createElement(t2);
  return n2.appendChild(e2), n2;
}
class ri extends Vr {
  static getType() {
    return "text";
  }
  static clone(e2) {
    return new ri(e2.__text, e2.__key);
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__format = e2.__format, this.__style = e2.__style, this.__mode = e2.__mode, this.__detail = e2.__detail;
  }
  constructor(e2, t2) {
    super(t2), this.__text = e2, this.__format = 0, this.__style = "", this.__mode = 0, this.__detail = 0;
  }
  getFormat() {
    return this.getLatest().__format;
  }
  getDetail() {
    return this.getLatest().__detail;
  }
  getMode() {
    const e2 = this.getLatest();
    return ze[e2.__mode];
  }
  getStyle() {
    return this.getLatest().__style;
  }
  isToken() {
    return 1 === this.getLatest().__mode;
  }
  isComposing() {
    return this.__key === St();
  }
  isSegmented() {
    return 2 === this.getLatest().__mode;
  }
  isDirectionless() {
    return !!(1 & this.getLatest().__detail);
  }
  isUnmergeable() {
    return !!(2 & this.getLatest().__detail);
  }
  hasFormat(e2) {
    const t2 = De[e2];
    return !!(this.getFormat() & t2);
  }
  isSimpleText() {
    return "text" === this.__type && 0 === this.__mode;
  }
  getTextContent() {
    return this.getLatest().__text;
  }
  getFormatFlags(e2, t2) {
    return _t(this.getLatest().__format, e2, t2);
  }
  canHaveFormat() {
    return true;
  }
  createDOM(e2, t2) {
    const n2 = this.__format, r2 = Xr(0, n2), i2 = Yr(0, n2), s2 = null === r2 ? i2 : r2, o2 = document.createElement(s2);
    let l2 = o2;
    this.hasFormat("code") && o2.setAttribute("spellcheck", "false"), null !== r2 && (l2 = document.createElement(i2), o2.appendChild(l2));
    ti(l2, this, 0, n2, this.__text, e2);
    const c2 = this.__style;
    return "" !== c2 && (o2.style.cssText = c2), o2;
  }
  updateDOM(e2, t2, n2) {
    const r2 = this.__text, i2 = e2.__format, s2 = this.__format, o2 = Xr(0, i2), l2 = Xr(0, s2), c2 = Yr(0, i2), a2 = Yr(0, s2);
    if ((null === o2 ? c2 : o2) !== (null === l2 ? a2 : l2)) return true;
    if (o2 === l2 && c2 !== a2) {
      const e3 = t2.firstChild;
      null == e3 && Re(48);
      const i3 = document.createElement(a2);
      return ti(i3, this, 0, s2, r2, n2), t2.replaceChild(i3, e3), false;
    }
    let u2 = t2;
    null !== l2 && null !== o2 && (u2 = t2.firstChild, null == u2 && Re(49)), ei(r2, u2, this);
    const f2 = n2.theme.text;
    void 0 !== f2 && i2 !== s2 && Zr(0, i2, s2, u2, f2);
    const d2 = e2.__style, h2 = this.__style;
    return d2 !== h2 && (t2.style.cssText = h2), false;
  }
  static importDOM() {
    return { "#text": () => ({ conversion: ci, priority: 0 }), b: () => ({ conversion: si, priority: 0 }), code: () => ({ conversion: fi, priority: 0 }), em: () => ({ conversion: fi, priority: 0 }), i: () => ({ conversion: fi, priority: 0 }), s: () => ({ conversion: fi, priority: 0 }), span: () => ({ conversion: ii, priority: 0 }), strong: () => ({ conversion: fi, priority: 0 }), sub: () => ({ conversion: fi, priority: 0 }), sup: () => ({ conversion: fi, priority: 0 }), u: () => ({ conversion: fi, priority: 0 }) };
  }
  static importJSON(e2) {
    const t2 = di(e2.text);
    return t2.setFormat(e2.format), t2.setDetail(e2.detail), t2.setMode(e2.mode), t2.setStyle(e2.style), t2;
  }
  exportDOM(e2) {
    let { element: t2 } = super.exportDOM(e2);
    return null !== t2 && Tn(t2) || Re(132), t2.style.whiteSpace = "pre-wrap", this.hasFormat("bold") && (t2 = ni(t2, "b")), this.hasFormat("italic") && (t2 = ni(t2, "i")), this.hasFormat("strikethrough") && (t2 = ni(t2, "s")), this.hasFormat("underline") && (t2 = ni(t2, "u")), { element: t2 };
  }
  exportJSON() {
    return { detail: this.getDetail(), format: this.getFormat(), mode: this.getMode(), style: this.getStyle(), text: this.getTextContent(), type: "text", version: 1 };
  }
  selectionTransform(e2, t2) {
  }
  setFormat(e2) {
    const t2 = this.getWritable();
    return t2.__format = "string" == typeof e2 ? De[e2] : e2, t2;
  }
  setDetail(e2) {
    const t2 = this.getWritable();
    return t2.__detail = "string" == typeof e2 ? Me[e2] : e2, t2;
  }
  setStyle(e2) {
    const t2 = this.getWritable();
    return t2.__style = e2, t2;
  }
  toggleFormat(e2) {
    const t2 = _t(this.getFormat(), e2, null);
    return this.setFormat(t2);
  }
  toggleDirectionless() {
    const e2 = this.getWritable();
    return e2.__detail ^= 1, e2;
  }
  toggleUnmergeable() {
    const e2 = this.getWritable();
    return e2.__detail ^= 2, e2;
  }
  setMode(e2) {
    const t2 = Be[e2];
    if (this.__mode === t2) return this;
    const n2 = this.getWritable();
    return n2.__mode = t2, n2;
  }
  setTextContent(e2) {
    if (this.__text === e2) return this;
    const t2 = this.getWritable();
    return t2.__text = e2, t2;
  }
  select(e2, t2) {
    is();
    let n2 = e2, r2 = t2;
    const i2 = Ri(), s2 = this.getTextContent(), o2 = this.__key;
    if ("string" == typeof s2) {
      const e3 = s2.length;
      void 0 === n2 && (n2 = e3), void 0 === r2 && (r2 = e3);
    } else n2 = 0, r2 = 0;
    if (!ki(i2)) return Ii(o2, n2, o2, r2, "text", "text");
    {
      const e3 = St();
      e3 !== i2.anchor.key && e3 !== i2.focus.key || vt(o2), i2.setTextNodeRange(this, n2, this, r2);
    }
    return i2;
  }
  selectStart() {
    return this.select(0, 0);
  }
  selectEnd() {
    const e2 = this.getTextContentSize();
    return this.select(e2, e2);
  }
  spliceText(e2, t2, n2, r2) {
    const i2 = this.getWritable(), s2 = i2.__text, o2 = n2.length;
    let l2 = e2;
    l2 < 0 && (l2 = o2 + l2, l2 < 0 && (l2 = 0));
    const c2 = Ri();
    if (r2 && ki(c2)) {
      const t3 = e2 + o2;
      c2.setTextNodeRange(i2, t3, i2, t3);
    }
    const a2 = s2.slice(0, l2) + n2 + s2.slice(l2 + t2);
    return i2.__text = a2, i2;
  }
  canInsertTextBefore() {
    return true;
  }
  canInsertTextAfter() {
    return true;
  }
  splitText(...e2) {
    is();
    const t2 = this.getLatest(), n2 = t2.getTextContent(), r2 = t2.__key, i2 = St(), s2 = new Set(e2), o2 = [], l2 = n2.length;
    let c2 = "";
    for (let e3 = 0; e3 < l2; e3++) "" !== c2 && s2.has(e3) && (o2.push(c2), c2 = ""), c2 += n2[e3];
    "" !== c2 && o2.push(c2);
    const a2 = o2.length;
    if (0 === a2) return [];
    if (o2[0] === n2) return [t2];
    const u2 = o2[0], f2 = t2.getParent();
    let d2;
    const h2 = t2.getFormat(), g2 = t2.getStyle(), _2 = t2.__detail;
    let p2 = false;
    t2.isSegmented() ? (d2 = di(u2), d2.__format = h2, d2.__style = g2, d2.__detail = _2, p2 = true) : (d2 = t2.getWritable(), d2.__text = u2);
    const y2 = Ri(), m2 = [d2];
    let x2 = u2.length;
    for (let e3 = 1; e3 < a2; e3++) {
      const t3 = o2[e3], n3 = t3.length, s3 = di(t3).getWritable();
      s3.__format = h2, s3.__style = g2, s3.__detail = _2;
      const l3 = s3.__key, c3 = x2 + n3;
      if (ki(y2)) {
        const e4 = y2.anchor, t4 = y2.focus;
        e4.key === r2 && "text" === e4.type && e4.offset > x2 && e4.offset <= c3 && (e4.key = l3, e4.offset -= x2, y2.dirty = true), t4.key === r2 && "text" === t4.type && t4.offset > x2 && t4.offset <= c3 && (t4.key = l3, t4.offset -= x2, y2.dirty = true);
      }
      i2 === r2 && vt(l3), x2 = c3, m2.push(s3);
    }
    if (null !== f2) {
      !(function(e4) {
        const t4 = e4.getPreviousSibling(), n3 = e4.getNextSibling();
        null !== t4 && xt(t4), null !== n3 && xt(n3);
      })(this);
      const e3 = f2.getWritable(), t3 = this.getIndexWithinParent();
      p2 ? (e3.splice(t3, 0, m2), this.remove()) : e3.splice(t3, 1, m2), ki(y2) && Ji(y2, f2, t3, a2 - 1);
    }
    return m2;
  }
  mergeWithSibling(e2) {
    const t2 = e2 === this.getPreviousSibling();
    t2 || e2 === this.getNextSibling() || Re(50);
    const n2 = this.__key, r2 = e2.__key, i2 = this.__text, s2 = i2.length;
    St() === r2 && vt(n2);
    const o2 = Ri();
    if (ki(o2)) {
      const i3 = o2.anchor, l3 = o2.focus;
      null !== i3 && i3.key === r2 && (Vi(i3, t2, n2, e2, s2), o2.dirty = true), null !== l3 && l3.key === r2 && (Vi(l3, t2, n2, e2, s2), o2.dirty = true);
    }
    const l2 = e2.__text, c2 = t2 ? l2 + i2 : i2 + l2;
    this.setTextContent(c2);
    const a2 = this.getWritable();
    return e2.remove(), a2;
  }
  isTextEntity() {
    return false;
  }
}
function ii(e2) {
  return { forChild: gi(e2.style), node: null };
}
function si(e2) {
  const t2 = e2, n2 = "normal" === t2.style.fontWeight;
  return { forChild: gi(t2.style, n2 ? void 0 : "bold"), node: null };
}
const oi = /* @__PURE__ */ new WeakMap();
function li(e2) {
  return "PRE" === e2.nodeName || e2.nodeType === re && void 0 !== e2.style && void 0 !== e2.style.whiteSpace && e2.style.whiteSpace.startsWith("pre");
}
function ci(e2) {
  const t2 = e2;
  null === e2.parentElement && Re(129);
  let n2 = t2.textContent || "";
  if (null !== (function(e3) {
    let t3, n3 = e3.parentNode;
    const r2 = [e3];
    for (; null !== n3 && void 0 === (t3 = oi.get(n3)) && !li(n3); ) r2.push(n3), n3 = n3.parentNode;
    const i2 = void 0 === t3 ? n3 : t3;
    for (let e4 = 0; e4 < r2.length; e4++) oi.set(r2[e4], i2);
    return i2;
  })(t2)) {
    const e3 = n2.split(/(\r?\n|\t)/), t3 = [], r2 = e3.length;
    for (let n3 = 0; n3 < r2; n3++) {
      const r3 = e3[n3];
      "\n" === r3 || "\r\n" === r3 ? t3.push(qr()) : "	" === r3 ? t3.push(pi()) : "" !== r3 && t3.push(di(r3));
    }
    return { node: t3 };
  }
  if (n2 = n2.replace(/\r/g, "").replace(/[ \t\n]+/g, " "), "" === n2) return { node: null };
  if (" " === n2[0]) {
    let e3 = t2, r2 = true;
    for (; null !== e3 && null !== (e3 = ai(e3, false)); ) {
      const t3 = e3.textContent || "";
      if (t3.length > 0) {
        /[ \t\n]$/.test(t3) && (n2 = n2.slice(1)), r2 = false;
        break;
      }
    }
    r2 && (n2 = n2.slice(1));
  }
  if (" " === n2[n2.length - 1]) {
    let e3 = t2, r2 = true;
    for (; null !== e3 && null !== (e3 = ai(e3, true)); ) {
      if ((e3.textContent || "").replace(/^( |\t|\r?\n)+/, "").length > 0) {
        r2 = false;
        break;
      }
    }
    r2 && (n2 = n2.slice(0, n2.length - 1));
  }
  return "" === n2 ? { node: null } : { node: di(n2) };
}
function ai(e2, t2) {
  let n2 = e2;
  for (; ; ) {
    let e3;
    for (; null === (e3 = t2 ? n2.nextSibling : n2.previousSibling); ) {
      const e4 = n2.parentElement;
      if (null === e4) return null;
      n2 = e4;
    }
    if (n2 = e3, n2.nodeType === re) {
      const e4 = n2.style.display;
      if ("" === e4 && !bn(n2) || "" !== e4 && !e4.startsWith("inline")) return null;
    }
    let r2 = n2;
    for (; null !== (r2 = t2 ? n2.firstChild : n2.lastChild); ) n2 = r2;
    if (n2.nodeType === ie) return n2;
    if ("BR" === n2.nodeName) return null;
  }
}
const ui = { code: "code", em: "italic", i: "italic", s: "strikethrough", strong: "bold", sub: "subscript", sup: "superscript", u: "underline" };
function fi(e2) {
  const t2 = ui[e2.nodeName.toLowerCase()];
  return void 0 === t2 ? { node: null } : { forChild: gi(e2.style, t2), node: null };
}
function di(e2 = "") {
  return gn(new ri(e2));
}
function hi(e2) {
  return e2 instanceof ri;
}
function gi(e2, t2) {
  const n2 = e2.fontWeight, r2 = e2.textDecoration.split(" "), i2 = "700" === n2 || "bold" === n2, s2 = r2.includes("line-through"), o2 = "italic" === e2.fontStyle, l2 = r2.includes("underline"), c2 = e2.verticalAlign;
  return (e3) => hi(e3) ? (i2 && !e3.hasFormat("bold") && e3.toggleFormat("bold"), s2 && !e3.hasFormat("strikethrough") && e3.toggleFormat("strikethrough"), o2 && !e3.hasFormat("italic") && e3.toggleFormat("italic"), l2 && !e3.hasFormat("underline") && e3.toggleFormat("underline"), "sub" !== c2 || e3.hasFormat("subscript") || e3.toggleFormat("subscript"), "super" !== c2 || e3.hasFormat("superscript") || e3.toggleFormat("superscript"), t2 && !e3.hasFormat(t2) && e3.toggleFormat(t2), e3) : e3;
}
class _i extends ri {
  static getType() {
    return "tab";
  }
  static clone(e2) {
    return new _i(e2.__key);
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__text = e2.__text;
  }
  constructor(e2) {
    super("	", e2), this.__detail = 2;
  }
  static importDOM() {
    return null;
  }
  static importJSON(e2) {
    const t2 = pi();
    return t2.setFormat(e2.format), t2.setStyle(e2.style), t2;
  }
  exportJSON() {
    return { ...super.exportJSON(), type: "tab", version: 1 };
  }
  setTextContent(e2) {
    Re(126);
  }
  setDetail(e2) {
    Re(127);
  }
  setMode(e2) {
    Re(128);
  }
  canInsertTextBefore() {
    return false;
  }
  canInsertTextAfter() {
    return false;
  }
}
function pi() {
  return gn(new _i());
}
function yi(e2) {
  return e2 instanceof _i;
}
class mi {
  constructor(e2, t2, n2) {
    this._selection = null, this.key = e2, this.offset = t2, this.type = n2;
  }
  is(e2) {
    return this.key === e2.key && this.offset === e2.offset && this.type === e2.type;
  }
  isBefore(e2) {
    let t2 = this.getNode(), n2 = e2.getNode();
    const r2 = this.offset, i2 = e2.offset;
    if (bs(t2)) {
      const e3 = t2.getDescendantByIndex(r2);
      t2 = null != e3 ? e3 : t2;
    }
    if (bs(n2)) {
      const e3 = n2.getDescendantByIndex(i2);
      n2 = null != e3 ? e3 : n2;
    }
    return t2 === n2 ? r2 < i2 : t2.isBefore(n2);
  }
  getNode() {
    const e2 = Ct(this.key);
    return null === e2 && Re(20), e2;
  }
  set(e2, t2, n2) {
    const r2 = this._selection, i2 = this.key;
    this.key = e2, this.offset = t2, this.type = n2, rs() || (St() === i2 && vt(e2), null !== r2 && (r2.setCachedNodes(null), r2.dirty = true));
  }
}
function xi(e2, t2, n2) {
  return new mi(e2, t2, n2);
}
function vi(e2, t2) {
  let n2 = t2.__key, r2 = e2.offset, i2 = "element";
  if (hi(t2)) {
    i2 = "text";
    const e3 = t2.getTextContentSize();
    r2 > e3 && (r2 = e3);
  } else if (!bs(t2)) {
    const e3 = t2.getNextSibling();
    if (hi(e3)) n2 = e3.__key, r2 = 0, i2 = "text";
    else {
      const e4 = t2.getParent();
      e4 && (n2 = e4.__key, r2 = t2.getIndexWithinParent() + 1);
    }
  }
  e2.set(n2, r2, i2);
}
function Si(e2, t2) {
  if (bs(t2)) {
    const n2 = t2.getLastDescendant();
    bs(n2) || hi(n2) ? vi(e2, n2) : vi(e2, t2);
  } else vi(e2, t2);
}
function Ci(e2, t2, n2, r2) {
  e2.key = t2, e2.offset = n2, e2.type = r2;
}
class Ti {
  constructor(e2) {
    this._cachedNodes = null, this._nodes = e2, this.dirty = false;
  }
  getCachedNodes() {
    return this._cachedNodes;
  }
  setCachedNodes(e2) {
    this._cachedNodes = e2;
  }
  is(e2) {
    if (!wi(e2)) return false;
    const t2 = this._nodes, n2 = e2._nodes;
    return t2.size === n2.size && Array.from(t2).every(((e3) => n2.has(e3)));
  }
  isCollapsed() {
    return false;
  }
  isBackward() {
    return false;
  }
  getStartEndPoints() {
    return null;
  }
  add(e2) {
    this.dirty = true, this._nodes.add(e2), this._cachedNodes = null;
  }
  delete(e2) {
    this.dirty = true, this._nodes.delete(e2), this._cachedNodes = null;
  }
  clear() {
    this.dirty = true, this._nodes.clear(), this._cachedNodes = null;
  }
  has(e2) {
    return this._nodes.has(e2);
  }
  clone() {
    return new Ti(new Set(this._nodes));
  }
  extract() {
    return this.getNodes();
  }
  insertRawText(e2) {
  }
  insertText() {
  }
  insertNodes(e2) {
    const t2 = this.getNodes(), n2 = t2.length, r2 = t2[n2 - 1];
    let i2;
    if (hi(r2)) i2 = r2.select();
    else {
      const e3 = r2.getIndexWithinParent() + 1;
      i2 = r2.getParentOrThrow().select(e3, e3);
    }
    i2.insertNodes(e2);
    for (let e3 = 0; e3 < n2; e3++) t2[e3].remove();
  }
  getNodes() {
    const e2 = this._cachedNodes;
    if (null !== e2) return e2;
    const t2 = this._nodes, n2 = [];
    for (const e3 of t2) {
      const t3 = Ct(e3);
      null !== t3 && n2.push(t3);
    }
    return rs() || (this._cachedNodes = n2), n2;
  }
  getTextContent() {
    const e2 = this.getNodes();
    let t2 = "";
    for (let n2 = 0; n2 < e2.length; n2++) t2 += e2[n2].getTextContent();
    return t2;
  }
}
function ki(e2) {
  return e2 instanceof bi;
}
class bi {
  constructor(e2, t2, n2, r2) {
    this.anchor = e2, this.focus = t2, e2._selection = this, t2._selection = this, this._cachedNodes = null, this.format = n2, this.style = r2, this.dirty = false;
  }
  getCachedNodes() {
    return this._cachedNodes;
  }
  setCachedNodes(e2) {
    this._cachedNodes = e2;
  }
  is(e2) {
    return !!ki(e2) && (this.anchor.is(e2.anchor) && this.focus.is(e2.focus) && this.format === e2.format && this.style === e2.style);
  }
  isCollapsed() {
    return this.anchor.is(this.focus);
  }
  getNodes() {
    const e2 = this._cachedNodes;
    if (null !== e2) return e2;
    const t2 = this.anchor, n2 = this.focus, r2 = t2.isBefore(n2), i2 = r2 ? t2 : n2, s2 = r2 ? n2 : t2;
    let o2 = i2.getNode(), l2 = s2.getNode();
    const c2 = i2.offset, a2 = s2.offset;
    if (bs(o2)) {
      const e3 = o2.getDescendantByIndex(c2);
      o2 = null != e3 ? e3 : o2;
    }
    if (bs(l2)) {
      let e3 = l2.getDescendantByIndex(a2);
      null !== e3 && e3 !== o2 && l2.getChildAtIndex(a2) === e3 && (e3 = e3.getPreviousSibling()), l2 = null != e3 ? e3 : l2;
    }
    let u2;
    return u2 = o2.is(l2) ? bs(o2) && o2.getChildrenSize() > 0 ? [] : [o2] : o2.getNodesBetween(l2), rs() || (this._cachedNodes = u2), u2;
  }
  setTextNodeRange(e2, t2, n2, r2) {
    Ci(this.anchor, e2.__key, t2, "text"), Ci(this.focus, n2.__key, r2, "text"), this._cachedNodes = null, this.dirty = true;
  }
  getTextContent() {
    const e2 = this.getNodes();
    if (0 === e2.length) return "";
    const t2 = e2[0], n2 = e2[e2.length - 1], r2 = this.anchor, i2 = this.focus, s2 = r2.isBefore(i2), [o2, l2] = Ei(this);
    let c2 = "", a2 = true;
    for (let u2 = 0; u2 < e2.length; u2++) {
      const f2 = e2[u2];
      if (bs(f2) && !f2.isInline()) a2 || (c2 += "\n"), a2 = !f2.isEmpty();
      else if (a2 = false, hi(f2)) {
        let e3 = f2.getTextContent();
        f2 === t2 ? f2 === n2 ? "element" === r2.type && "element" === i2.type && i2.offset !== r2.offset || (e3 = o2 < l2 ? e3.slice(o2, l2) : e3.slice(l2, o2)) : e3 = s2 ? e3.slice(o2) : e3.slice(l2) : f2 === n2 && (e3 = s2 ? e3.slice(0, l2) : e3.slice(0, o2)), c2 += e3;
      } else !Es(f2) && !Gr(f2) || f2 === n2 && this.isCollapsed() || (c2 += f2.getTextContent());
    }
    return c2;
  }
  applyDOMRange(e2) {
    const t2 = ls(), n2 = t2.getEditorState()._selection, r2 = Di(e2.startContainer, e2.startOffset, e2.endContainer, e2.endOffset, t2, n2);
    if (null === r2) return;
    const [i2, s2] = r2;
    Ci(this.anchor, i2.key, i2.offset, i2.type), Ci(this.focus, s2.key, s2.offset, s2.type), this._cachedNodes = null;
  }
  clone() {
    const e2 = this.anchor, t2 = this.focus;
    return new bi(xi(e2.key, e2.offset, e2.type), xi(t2.key, t2.offset, t2.type), this.format, this.style);
  }
  toggleFormat(e2) {
    this.format = _t(this.format, e2, null), this.dirty = true;
  }
  setStyle(e2) {
    this.style = e2, this.dirty = true;
  }
  hasFormat(e2) {
    const t2 = De[e2];
    return !!(this.format & t2);
  }
  insertRawText(e2) {
    const t2 = e2.split(/(\r?\n|\t)/), n2 = [], r2 = t2.length;
    for (let e3 = 0; e3 < r2; e3++) {
      const r3 = t2[e3];
      "\n" === r3 || "\r\n" === r3 ? n2.push(qr()) : "	" === r3 ? n2.push(pi()) : n2.push(di(r3));
    }
    this.insertNodes(n2);
  }
  insertText(e2) {
    const t2 = this.anchor, n2 = this.focus, r2 = this.format, i2 = this.style;
    let s2 = t2, o2 = n2;
    !this.isCollapsed() && n2.isBefore(t2) && (s2 = n2, o2 = t2), "element" === s2.type && (function(e3, t3, n3, r3) {
      const i3 = e3.getNode(), s3 = i3.getChildAtIndex(e3.offset), o3 = di(), l3 = Fs(i3) ? zs().append(o3) : o3;
      o3.setFormat(n3), o3.setStyle(r3), null === s3 ? i3.append(l3) : s3.insertBefore(l3), e3.is(t3) && t3.set(o3.__key, 0, "text"), e3.set(o3.__key, 0, "text");
    })(s2, o2, r2, i2);
    const l2 = s2.offset;
    let c2 = o2.offset;
    const a2 = this.getNodes(), u2 = a2.length;
    let f2 = a2[0];
    hi(f2) || Re(26);
    const d2 = f2.getTextContent().length, h2 = f2.getParentOrThrow();
    let g2 = a2[u2 - 1];
    if (1 === u2 && "element" === o2.type && (c2 = d2, o2.set(s2.key, c2, "text")), this.isCollapsed() && l2 === d2 && (f2.isSegmented() || f2.isToken() || !f2.canInsertTextAfter() || !h2.canInsertTextAfter() && null === f2.getNextSibling())) {
      let t3 = f2.getNextSibling();
      if (hi(t3) && t3.canInsertTextBefore() && !dt(t3) || (t3 = di(), t3.setFormat(r2), t3.setStyle(i2), h2.canInsertTextAfter() ? f2.insertAfter(t3) : h2.insertAfter(t3)), t3.select(0, 0), f2 = t3, "" !== e2) return void this.insertText(e2);
    } else if (this.isCollapsed() && 0 === l2 && (f2.isSegmented() || f2.isToken() || !f2.canInsertTextBefore() || !h2.canInsertTextBefore() && null === f2.getPreviousSibling())) {
      let t3 = f2.getPreviousSibling();
      if (hi(t3) && !dt(t3) || (t3 = di(), t3.setFormat(r2), h2.canInsertTextBefore() ? f2.insertBefore(t3) : h2.insertBefore(t3)), t3.select(), f2 = t3, "" !== e2) return void this.insertText(e2);
    } else if (f2.isSegmented() && l2 !== d2) {
      const e3 = di(f2.getTextContent());
      e3.setFormat(r2), f2.replace(e3), f2 = e3;
    } else if (!this.isCollapsed() && "" !== e2) {
      const t3 = g2.getParent();
      if (!h2.canInsertTextBefore() || !h2.canInsertTextAfter() || bs(t3) && (!t3.canInsertTextBefore() || !t3.canInsertTextAfter())) return this.insertText(""), Oi(this.anchor, this.focus, null), void this.insertText(e2);
    }
    if (1 === u2) {
      if (f2.isToken()) {
        const t4 = di(e2);
        return t4.select(), void f2.replace(t4);
      }
      const t3 = f2.getFormat(), n3 = f2.getStyle();
      if (l2 !== c2 || t3 === r2 && n3 === i2) {
        if (yi(f2)) {
          const t4 = di(e2);
          return t4.setFormat(r2), t4.setStyle(i2), t4.select(), void f2.replace(t4);
        }
      } else {
        if ("" !== f2.getTextContent()) {
          const t4 = di(e2);
          if (t4.setFormat(r2), t4.setStyle(i2), t4.select(), 0 === l2) f2.insertBefore(t4, false);
          else {
            const [e3] = f2.splitText(l2);
            e3.insertAfter(t4, false);
          }
          return void (t4.isComposing() && "text" === this.anchor.type && (this.anchor.offset -= e2.length));
        }
        f2.setFormat(r2), f2.setStyle(i2);
      }
      const s3 = c2 - l2;
      f2 = f2.spliceText(l2, s3, e2, true), "" === f2.getTextContent() ? f2.remove() : "text" === this.anchor.type && (f2.isComposing() ? this.anchor.offset -= e2.length : (this.format = t3, this.style = n3));
    } else {
      const t3 = /* @__PURE__ */ new Set([...f2.getParentKeys(), ...g2.getParentKeys()]), n3 = bs(f2) ? f2 : f2.getParentOrThrow();
      let r3 = bs(g2) ? g2 : g2.getParentOrThrow(), i3 = g2;
      if (!n3.is(r3) && r3.isInline()) do {
        i3 = r3, r3 = r3.getParentOrThrow();
      } while (r3.isInline());
      if ("text" === o2.type && (0 !== c2 || "" === g2.getTextContent()) || "element" === o2.type && g2.getIndexWithinParent() < c2) if (hi(g2) && !g2.isToken() && c2 !== g2.getTextContentSize()) {
        if (g2.isSegmented()) {
          const e3 = di(g2.getTextContent());
          g2.replace(e3), g2 = e3;
        }
        Fs(o2.getNode()) || "text" !== o2.type || (g2 = g2.spliceText(0, c2, "")), t3.add(g2.__key);
      } else {
        const e3 = g2.getParentOrThrow();
        e3.canBeEmpty() || 1 !== e3.getChildrenSize() ? g2.remove() : e3.remove();
      }
      else t3.add(g2.__key);
      const s3 = r3.getChildren(), h3 = new Set(a2), _2 = n3.is(r3), p2 = n3.isInline() && null === f2.getNextSibling() ? n3 : f2;
      for (let e3 = s3.length - 1; e3 >= 0; e3--) {
        const t4 = s3[e3];
        if (t4.is(f2) || bs(t4) && t4.isParentOf(f2)) break;
        t4.isAttached() && (!h3.has(t4) || t4.is(i3) ? _2 || p2.insertAfter(t4, false) : t4.remove());
      }
      if (!_2) {
        let e3 = r3, n4 = null;
        for (; null !== e3; ) {
          const r4 = e3.getChildren(), i4 = r4.length;
          (0 === i4 || r4[i4 - 1].is(n4)) && (t3.delete(e3.__key), n4 = e3), e3 = e3.getParent();
        }
      }
      if (f2.isToken()) if (l2 === d2) f2.select();
      else {
        const t4 = di(e2);
        t4.select(), f2.replace(t4);
      }
      else f2 = f2.spliceText(l2, d2 - l2, e2, true), "" === f2.getTextContent() ? f2.remove() : f2.isComposing() && "text" === this.anchor.type && (this.anchor.offset -= e2.length);
      for (let e3 = 1; e3 < u2; e3++) {
        const n4 = a2[e3], r4 = n4.__key;
        t3.has(r4) || n4.remove();
      }
    }
  }
  removeText() {
    if (this.isCollapsed()) return;
    const { anchor: e2, focus: t2 } = this, n2 = this.getNodes(), r2 = this.isBackward() ? t2 : e2, i2 = this.isBackward() ? e2 : t2;
    let s2 = r2.getNode(), o2 = i2.getNode();
    const l2 = En(s2, Nn), c2 = En(o2, Nn);
    hi(s2) && s2.isToken() && r2.offset < s2.getTextContentSize() && (r2.offset = 0), i2.offset > 0 && hi(o2) && o2.isToken() && (i2.offset = o2.getTextContentSize()), n2.forEach(((e3) => {
      cn(s2, e3) || cn(o2, e3) || e3.getKey() === s2.getKey() || e3.getKey() === o2.getKey() || e3.remove();
    }));
    const a2 = (e3, t3) => {
      if ("" === e3.getTextContent()) e3.remove();
      else if (0 !== t3 && dt(e3)) {
        const t4 = di(e3.getTextContent());
        return t4.setFormat(e3.getFormat()), t4.setStyle(e3.getStyle()), e3.replace(t4);
      }
    };
    if (s2 === o2 && hi(s2)) {
      const n3 = Math.abs(t2.offset - e2.offset);
      return s2.spliceText(r2.offset, n3, "", true), void a2(s2, n3);
    }
    if (hi(s2)) {
      const e3 = s2.getTextContentSize() - r2.offset;
      s2.spliceText(r2.offset, e3, ""), s2 = a2(s2, e3) || s2;
    }
    hi(o2) && (o2.spliceText(0, i2.offset, ""), o2 = a2(o2, i2.offset) || o2), s2.isAttached() && hi(s2) ? s2.selectEnd() : o2.isAttached() && hi(o2) && o2.selectStart();
    bs(l2) && bs(c2) && l2 !== c2 && (l2.append(...c2.getChildren()), c2.remove(), i2.set(r2.key, r2.offset, r2.type));
  }
  formatText(e2, t2 = null) {
    if (this.isCollapsed()) return this.toggleFormat(e2), void vt(null);
    const n2 = this.getNodes(), r2 = [];
    for (const e3 of n2) hi(e3) && r2.push(e3);
    const i2 = (t3) => {
      n2.forEach(((n3) => {
        if (Ws(n3)) {
          const r3 = n3.getFormatFlags(e2, t3);
          n3.setTextFormat(r3);
        }
      }));
    }, s2 = r2.length;
    if (0 === s2) return this.toggleFormat(e2), vt(null), void i2(t2);
    const o2 = this.anchor, l2 = this.focus, c2 = this.isBackward(), a2 = c2 ? l2 : o2, u2 = c2 ? o2 : l2;
    let f2 = 0, d2 = r2[0], h2 = "element" === a2.type ? 0 : a2.offset;
    if ("text" === a2.type && h2 === d2.getTextContentSize() && (f2 = 1, d2 = r2[1], h2 = 0), null == d2) return;
    const g2 = d2.getFormatFlags(e2, t2);
    i2(g2);
    const _2 = s2 - 1;
    let p2 = r2[_2];
    const y2 = "text" === u2.type ? u2.offset : p2.getTextContentSize();
    if (d2.is(p2)) {
      if (h2 === y2) return;
      if (dt(d2) || 0 === h2 && y2 === d2.getTextContentSize()) d2.setFormat(g2);
      else {
        const e3 = d2.splitText(h2, y2), t3 = 0 === h2 ? e3[0] : e3[1];
        t3.setFormat(g2), "text" === a2.type && a2.set(t3.__key, 0, "text"), "text" === u2.type && u2.set(t3.__key, y2 - h2, "text");
      }
      return void (this.format = g2);
    }
    0 === h2 || dt(d2) || ([, d2] = d2.splitText(h2), h2 = 0), d2.setFormat(g2);
    const m2 = p2.getFormatFlags(e2, g2);
    y2 > 0 && (y2 === p2.getTextContentSize() || dt(p2) || ([p2] = p2.splitText(y2)), p2.setFormat(m2));
    for (let t3 = f2 + 1; t3 < _2; t3++) {
      const n3 = r2[t3], i3 = n3.getFormatFlags(e2, m2);
      n3.setFormat(i3);
    }
    "text" === a2.type && a2.set(d2.__key, h2, "text"), "text" === u2.type && u2.set(p2.__key, y2, "text"), this.format = g2 | m2;
  }
  insertNodes(e2) {
    if (0 === e2.length) return;
    if ("root" === this.anchor.key) {
      this.insertParagraph();
      const t3 = Ri();
      return ki(t3) || Re(134), t3.insertNodes(e2);
    }
    const t2 = (this.isBackward() ? this.focus : this.anchor).getNode(), n2 = En(t2, Nn), r2 = e2[e2.length - 1];
    if (bs(n2) && "__language" in n2) {
      if ("__language" in e2[0]) this.insertText(e2[0].getTextContent());
      else {
        const t3 = Gi(this);
        n2.splice(t3, 0, e2), r2.selectEnd();
      }
      return;
    }
    if (!e2.some(((e3) => (bs(e3) || Es(e3)) && !e3.isInline()))) {
      bs(n2) || Re(211, t2.constructor.name, t2.getType());
      const i3 = Gi(this);
      return n2.splice(i3, 0, e2), void r2.selectEnd();
    }
    const i2 = (function(e3) {
      const t3 = zs();
      let n3 = null;
      for (let r3 = 0; r3 < e3.length; r3++) {
        const i3 = e3[r3], s3 = Gr(i3);
        if (s3 || Es(i3) && i3.isInline() || bs(i3) && i3.isInline() || hi(i3) || i3.isParentRequired()) {
          if (null === n3 && (n3 = i3.createParentElementNode(), t3.append(n3), s3)) continue;
          null !== n3 && n3.append(i3);
        } else t3.append(i3), n3 = null;
      }
      return t3;
    })(e2), s2 = i2.getLastDescendant(), o2 = i2.getChildren(), l2 = !bs(n2) || !n2.isEmpty() ? this.insertParagraph() : null, c2 = o2[o2.length - 1];
    let a2 = o2[0];
    var u2;
    bs(u2 = a2) && Nn(u2) && !u2.isEmpty() && bs(n2) && (!n2.isEmpty() || n2.canMergeWhenEmpty()) && (bs(n2) || Re(211, t2.constructor.name, t2.getType()), n2.append(...a2.getChildren()), a2 = o2[1]), a2 && (null === n2 && Re(212, t2.constructor.name, t2.getType()), (function(e3, t3, n3) {
      const r3 = t3.getParentOrThrow().getLastChild();
      let i3 = t3;
      const s3 = [t3];
      for (; i3 !== r3; ) i3.getNextSibling() || Re(140), i3 = i3.getNextSibling(), s3.push(i3);
      let o3 = e3;
      for (const e4 of s3) o3 = o3.insertAfter(e4);
    })(n2, a2));
    const f2 = En(s2, Nn);
    l2 && bs(f2) && (l2.canMergeWhenEmpty() || Nn(c2)) && (f2.append(...l2.getChildren()), l2.remove()), bs(n2) && n2.isEmpty() && n2.remove(), s2.selectEnd();
    const d2 = bs(n2) ? n2.getLastChild() : null;
    Gr(d2) && f2 !== n2 && d2.remove();
  }
  insertParagraph() {
    if ("root" === this.anchor.key) {
      const e3 = zs();
      return Et().splice(this.anchor.offset, 0, [e3]), e3.select(), e3;
    }
    const e2 = Gi(this), t2 = En(this.anchor.getNode(), Nn);
    bs(t2) || Re(213);
    const n2 = t2.getChildAtIndex(e2), r2 = n2 ? [n2, ...n2.getNextSiblings()] : [], i2 = t2.insertNewAfter(this, false);
    return i2 ? (i2.append(...r2), i2.selectStart(), i2) : null;
  }
  insertLineBreak(e2) {
    const t2 = qr();
    if (this.insertNodes([t2]), e2) {
      const e3 = t2.getParentOrThrow(), n2 = t2.getIndexWithinParent();
      e3.select(n2, n2);
    }
  }
  extract() {
    const e2 = this.getNodes(), t2 = e2.length, n2 = t2 - 1, r2 = this.anchor, i2 = this.focus;
    let s2 = e2[0], o2 = e2[n2];
    const [l2, c2] = Ei(this);
    if (0 === t2) return [];
    if (1 === t2) {
      if (hi(s2) && !this.isCollapsed()) {
        const e3 = l2 > c2 ? c2 : l2, t3 = l2 > c2 ? l2 : c2, n3 = s2.splitText(e3, t3), r3 = 0 === e3 ? n3[0] : n3[1];
        return null != r3 ? [r3] : [];
      }
      return [s2];
    }
    const a2 = r2.isBefore(i2);
    if (hi(s2)) {
      const t3 = a2 ? l2 : c2;
      t3 === s2.getTextContentSize() ? e2.shift() : 0 !== t3 && ([, s2] = s2.splitText(t3), e2[0] = s2);
    }
    if (hi(o2)) {
      const t3 = o2.getTextContent().length, r3 = a2 ? c2 : l2;
      0 === r3 ? e2.pop() : r3 !== t3 && ([o2] = o2.splitText(r3), e2[n2] = o2);
    }
    return e2;
  }
  modify(e2, t2, n2) {
    const r2 = this.focus, i2 = this.anchor, s2 = "move" === e2, o2 = Yt(r2, t2);
    if (Es(o2) && !o2.isIsolated()) {
      if (s2 && o2.isKeyboardSelectable()) {
        const e4 = Bi();
        return e4.add(o2.__key), void Ft(e4);
      }
      const e3 = t2 ? o2.getPreviousSibling() : o2.getNextSibling();
      if (hi(e3)) {
        const n3 = e3.__key, o3 = t2 ? e3.getTextContent().length : 0;
        return r2.set(n3, o3, "text"), void (s2 && i2.set(n3, o3, "text"));
      }
      {
        const n3 = o2.getParentOrThrow();
        let l3, c3;
        return bs(e3) ? (c3 = e3.__key, l3 = t2 ? e3.getChildrenSize() : 0) : (l3 = o2.getIndexWithinParent(), c3 = n3.__key, t2 || l3++), r2.set(c3, l3, "element"), void (s2 && i2.set(c3, l3, "element"));
      }
    }
    const l2 = ls(), c2 = vn(l2._window);
    if (!c2) return;
    const a2 = l2._blockCursorElement, u2 = l2._rootElement;
    if (null === u2 || null === a2 || !bs(o2) || o2.isInline() || o2.canBeEmpty() || mn(a2, l2, u2), (function(e3, t3, n3, r3) {
      e3.modify(t3, n3, r3);
    })(c2, e2, t2 ? "backward" : "forward", n2), c2.rangeCount > 0) {
      const e3 = c2.getRangeAt(0), n3 = this.anchor.getNode(), r3 = Fs(n3) ? n3 : fn(n3);
      if (this.applyDOMRange(e3), this.dirty = true, !s2) {
        const n4 = this.getNodes(), i3 = [];
        let s3 = false;
        for (let e4 = 0; e4 < n4.length; e4++) {
          const t3 = n4[e4];
          cn(t3, r3) ? i3.push(t3) : s3 = true;
        }
        if (s3 && i3.length > 0) if (t2) {
          const e4 = i3[0];
          bs(e4) ? e4.selectStart() : e4.getParentOrThrow().selectStart();
        } else {
          const e4 = i3[i3.length - 1];
          bs(e4) ? e4.selectEnd() : e4.getParentOrThrow().selectEnd();
        }
        c2.anchorNode === e3.startContainer && c2.anchorOffset === e3.startOffset || (function(e4) {
          const t3 = e4.focus, n5 = e4.anchor, r4 = n5.key, i4 = n5.offset, s4 = n5.type;
          Ci(n5, t3.key, t3.offset, t3.type), Ci(t3, r4, i4, s4), e4._cachedNodes = null;
        })(this);
      }
    }
  }
  forwardDeletion(e2, t2, n2) {
    if (!n2 && ("element" === e2.type && bs(t2) && e2.offset === t2.getChildrenSize() || "text" === e2.type && e2.offset === t2.getTextContentSize())) {
      const e3 = t2.getParent(), n3 = t2.getNextSibling() || (null === e3 ? null : e3.getNextSibling());
      if (bs(n3) && n3.isShadowRoot()) return true;
    }
    return false;
  }
  deleteCharacter(e2) {
    const n2 = this.isCollapsed();
    if (this.isCollapsed()) {
      const n3 = this.anchor;
      let r2 = n3.getNode();
      if (this.forwardDeletion(n3, r2, e2)) return;
      const i2 = this.focus, s2 = Yt(i2, e2);
      if (Es(s2) && !s2.isIsolated()) {
        if (s2.isKeyboardSelectable() && bs(r2) && 0 === r2.getChildrenSize()) {
          r2.remove();
          const e3 = Bi();
          e3.add(s2.__key), Ft(e3);
        } else {
          s2.remove();
          ls().dispatchCommand(t, void 0);
        }
        return;
      }
      if (!e2 && bs(s2) && bs(r2) && r2.isEmpty()) return r2.remove(), void s2.selectStart();
      if (this.modify("extend", e2, "character"), this.isCollapsed()) {
        if (e2 && 0 === n3.offset) {
          if (("element" === n3.type ? n3.getNode() : n3.getNode().getParentOrThrow()).collapseAtStart(this)) return;
        }
      } else {
        const t2 = "text" === i2.type ? i2.getNode() : null;
        if (r2 = "text" === n3.type ? n3.getNode() : null, null !== t2 && t2.isSegmented()) {
          const n4 = i2.offset, s3 = t2.getTextContentSize();
          if (t2.is(r2) || e2 && n4 !== s3 || !e2 && 0 !== n4) return void Pi(t2, e2, n4);
        } else if (null !== r2 && r2.isSegmented()) {
          const i3 = n3.offset, s3 = r2.getTextContentSize();
          if (r2.is(t2) || e2 && 0 !== i3 || !e2 && i3 !== s3) return void Pi(r2, e2, i3);
        }
        !(function(e3, t3) {
          const n4 = e3.anchor, r3 = e3.focus, i3 = n4.getNode(), s3 = r3.getNode();
          if (i3 === s3 && "text" === n4.type && "text" === r3.type) {
            const e4 = n4.offset, s4 = r3.offset, o2 = e4 < s4, l2 = o2 ? e4 : s4, c2 = o2 ? s4 : e4, a2 = c2 - 1;
            if (l2 !== a2) {
              Dt(i3.getTextContent().slice(l2, c2)) || (t3 ? r3.offset = a2 : n4.offset = a2);
            }
          }
        })(this, e2);
      }
    }
    if (this.removeText(), e2 && !n2 && this.isCollapsed() && "element" === this.anchor.type && 0 === this.anchor.offset) {
      const e3 = this.anchor.getNode();
      e3.isEmpty() && Fs(e3.getParent()) && 0 === e3.getIndexWithinParent() && e3.collapseAtStart(this);
    }
  }
  deleteLine(e2) {
    if (this.isCollapsed()) {
      const t2 = "element" === this.anchor.type;
      if (t2 && this.insertText(" "), this.modify("extend", e2, "lineboundary"), this.isCollapsed() && 0 === this.anchor.offset && this.modify("extend", e2, "character"), t2) {
        const t3 = e2 ? this.anchor : this.focus;
        t3.set(t3.key, t3.offset + 1, t3.type);
      }
    }
    this.removeText();
  }
  deleteWord(e2) {
    if (this.isCollapsed()) {
      const t2 = this.anchor, n2 = t2.getNode();
      if (this.forwardDeletion(t2, n2, e2)) return;
      this.modify("extend", e2, "word");
    }
    this.removeText();
  }
  isBackward() {
    return this.focus.isBefore(this.anchor);
  }
  getStartEndPoints() {
    return [this.anchor, this.focus];
  }
}
function wi(e2) {
  return e2 instanceof Ti;
}
function Ni(e2) {
  const t2 = e2.offset;
  if ("text" === e2.type) return t2;
  const n2 = e2.getNode();
  return t2 === n2.getChildrenSize() ? n2.getTextContent().length : 0;
}
function Ei(e2) {
  const t2 = e2.getStartEndPoints();
  if (null === t2) return [0, 0];
  const [n2, r2] = t2;
  return "element" === n2.type && "element" === r2.type && n2.key === r2.key && n2.offset === r2.offset ? [0, 0] : [Ni(n2), Ni(r2)];
}
function Pi(e2, t2, n2) {
  const r2 = e2, i2 = r2.getTextContent().split(/(?=\s)/g), s2 = i2.length;
  let o2 = 0, l2 = 0;
  for (let e3 = 0; e3 < s2; e3++) {
    const r3 = e3 === s2 - 1;
    if (l2 = o2, o2 += i2[e3].length, t2 && o2 === n2 || o2 > n2 || r3) {
      i2.splice(e3, 1), r3 && (l2 = void 0);
      break;
    }
  }
  const c2 = i2.join("").trim();
  "" === c2 ? r2.remove() : (r2.setTextContent(c2), r2.select(l2, l2));
}
function Fi(e2, t2, n2, r2) {
  let i2, s2 = t2;
  if (e2.nodeType === re) {
    let o2 = false;
    const l2 = e2.childNodes, c2 = l2.length, a2 = r2._blockCursorElement;
    s2 === c2 && (o2 = true, s2 = c2 - 1);
    let u2 = l2[s2], f2 = false;
    if (u2 === a2) u2 = l2[s2 + 1], f2 = true;
    else if (null !== a2) {
      const n3 = a2.parentNode;
      if (e2 === n3) {
        t2 > Array.prototype.indexOf.call(n3.children, a2) && s2--;
      }
    }
    if (i2 = Lt(u2), hi(i2)) s2 = Ot(i2, o2);
    else {
      let l3 = Lt(e2);
      if (null === l3) return null;
      if (bs(l3)) {
        const c3 = r2.getElementByKey(l3.getKey());
        null === c3 && Re(214);
        const a3 = l3.getDOMSlot(c3);
        [l3, s2] = a3.resolveChildIndex(l3, c3, e2, t2), bs(l3) || Re(215), o2 && s2 >= l3.getChildrenSize() && (s2 = Math.max(0, l3.getChildrenSize() - 1));
        let u3 = l3.getChildAtIndex(s2);
        if (bs(u3) && (function(e3, t3, n3) {
          const r3 = e3.getParent();
          return null === n3 || null === r3 || !r3.canBeEmpty() || r3 !== n3.getNode();
        })(u3, 0, n2)) {
          const e3 = o2 ? u3.getLastDescendant() : u3.getFirstDescendant();
          null === e3 ? l3 = u3 : (u3 = e3, l3 = bs(u3) ? u3 : u3.getParentOrThrow()), s2 = 0;
        }
        hi(u3) ? (i2 = u3, l3 = null, s2 = Ot(u3, o2)) : u3 !== l3 && o2 && !f2 && (bs(l3) || Re(216), s2 = Math.min(l3.getChildrenSize(), s2 + 1));
      } else {
        const n3 = l3.getIndexWithinParent();
        s2 = 0 === t2 && Es(l3) && Lt(e2) === l3 ? n3 : n3 + 1, l3 = l3.getParentOrThrow();
      }
      if (bs(l3)) return xi(l3.__key, s2, "element");
    }
  } else i2 = Lt(e2);
  return hi(i2) ? xi(i2.__key, s2, "text") : null;
}
function Li(e2, t2, n2) {
  const r2 = e2.offset, i2 = e2.getNode();
  if (0 === r2) {
    const r3 = i2.getPreviousSibling(), s2 = i2.getParent();
    if (t2) {
      if ((n2 || !t2) && null === r3 && bs(s2) && s2.isInline()) {
        const t3 = s2.getPreviousSibling();
        hi(t3) && (e2.key = t3.__key, e2.offset = t3.getTextContent().length);
      }
    } else bs(r3) && !n2 && r3.isInline() ? (e2.key = r3.__key, e2.offset = r3.getChildrenSize(), e2.type = "element") : hi(r3) && (e2.key = r3.__key, e2.offset = r3.getTextContent().length);
  } else if (r2 === i2.getTextContent().length) {
    const r3 = i2.getNextSibling(), s2 = i2.getParent();
    if (t2 && bs(r3) && r3.isInline()) e2.key = r3.__key, e2.offset = 0, e2.type = "element";
    else if ((n2 || t2) && null === r3 && bs(s2) && s2.isInline() && !s2.canInsertTextAfter()) {
      const t3 = s2.getNextSibling();
      hi(t3) && (e2.key = t3.__key, e2.offset = 0);
    }
  }
}
function Oi(e2, t2, n2) {
  if ("text" === e2.type && "text" === t2.type) {
    const r2 = e2.isBefore(t2), i2 = e2.is(t2);
    Li(e2, r2, i2), Li(t2, !r2, i2), i2 && (t2.key = e2.key, t2.offset = e2.offset, t2.type = e2.type);
    const s2 = ls();
    if (s2.isComposing() && s2._compositionKey !== e2.key && ki(n2)) {
      const r3 = n2.anchor, i3 = n2.focus;
      Ci(e2, r3.key, r3.offset, r3.type), Ci(t2, i3.key, i3.offset, i3.type);
    }
  }
}
function Di(e2, t2, n2, r2, i2, s2) {
  if (null === e2 || null === n2 || !ct(i2, e2, n2)) return null;
  const o2 = Fi(e2, t2, ki(s2) ? s2.anchor : null, i2);
  if (null === o2) return null;
  const l2 = Fi(n2, r2, ki(s2) ? s2.focus : null, i2);
  if (null === l2) return null;
  if ("element" === o2.type && "element" === l2.type) {
    const t3 = Lt(e2), r3 = Lt(n2);
    if (Es(t3) && Es(r3)) return null;
  }
  return Oi(o2, l2, s2), [o2, l2];
}
function Mi(e2) {
  return bs(e2) && !e2.isInline();
}
function Ii(e2, t2, n2, r2, i2, s2) {
  const o2 = os(), l2 = new bi(xi(e2, t2, i2), xi(n2, r2, s2), 0, "");
  return l2.dirty = true, o2._selection = l2, l2;
}
function Ai() {
  const e2 = xi("root", 0, "element"), t2 = xi("root", 0, "element");
  return new bi(e2, t2, 0, "");
}
function Bi() {
  return new Ti(/* @__PURE__ */ new Set());
}
function zi(e2, t2) {
  return Wi(null, e2, t2, null);
}
function Wi(e2, t2, n2, r2) {
  const i2 = n2._window;
  if (null === i2) return null;
  const s2 = r2 || i2.event, o2 = s2 ? s2.type : void 0, l2 = "selectionchange" === o2, c2 = !$e && (l2 || "beforeinput" === o2 || "compositionstart" === o2 || "compositionend" === o2 || "click" === o2 && s2 && 3 === s2.detail || "drop" === o2 || void 0 === o2);
  let a2, u2, f2, d2;
  if (ki(e2) && !c2) return e2.clone();
  if (null === t2) return null;
  if (a2 = t2.anchorNode, u2 = t2.focusNode, f2 = t2.anchorOffset, d2 = t2.focusOffset, l2 && ki(e2) && !ct(n2, a2, u2)) return e2.clone();
  const h2 = Di(a2, f2, u2, d2, n2, e2);
  if (null === h2) return null;
  const [g2, _2] = h2;
  return new bi(g2, _2, ki(e2) ? e2.format : 0, ki(e2) ? e2.style : "");
}
function Ri() {
  return os()._selection;
}
function Ki() {
  return ls()._editorState._selection;
}
function Ji(e2, t2, n2, r2 = 1) {
  const i2 = e2.anchor, s2 = e2.focus, o2 = i2.getNode(), l2 = s2.getNode();
  if (!t2.is(o2) && !t2.is(l2)) return;
  const c2 = t2.__key;
  if (e2.isCollapsed()) {
    const t3 = i2.offset;
    if (n2 <= t3 && r2 > 0 || n2 < t3 && r2 < 0) {
      const n3 = Math.max(0, t3 + r2);
      i2.set(c2, n3, "element"), s2.set(c2, n3, "element"), $i(e2);
    }
  } else {
    const o3 = e2.isBackward(), l3 = o3 ? s2 : i2, a2 = l3.getNode(), u2 = o3 ? i2 : s2, f2 = u2.getNode();
    if (t2.is(a2)) {
      const e3 = l3.offset;
      (n2 <= e3 && r2 > 0 || n2 < e3 && r2 < 0) && l3.set(c2, Math.max(0, e3 + r2), "element");
    }
    if (t2.is(f2)) {
      const e3 = u2.offset;
      (n2 <= e3 && r2 > 0 || n2 < e3 && r2 < 0) && u2.set(c2, Math.max(0, e3 + r2), "element");
    }
  }
  $i(e2);
}
function $i(e2) {
  const t2 = e2.anchor, n2 = t2.offset, r2 = e2.focus, i2 = r2.offset, s2 = t2.getNode(), o2 = r2.getNode();
  if (e2.isCollapsed()) {
    if (!bs(s2)) return;
    const e3 = s2.getChildrenSize(), i3 = n2 >= e3, o3 = i3 ? s2.getChildAtIndex(e3 - 1) : s2.getChildAtIndex(n2);
    if (hi(o3)) {
      let e4 = 0;
      i3 && (e4 = o3.getTextContentSize()), t2.set(o3.__key, e4, "text"), r2.set(o3.__key, e4, "text");
    }
  } else {
    if (bs(s2)) {
      const e3 = s2.getChildrenSize(), r3 = n2 >= e3, i3 = r3 ? s2.getChildAtIndex(e3 - 1) : s2.getChildAtIndex(n2);
      if (hi(i3)) {
        let e4 = 0;
        r3 && (e4 = i3.getTextContentSize()), t2.set(i3.__key, e4, "text");
      }
    }
    if (bs(o2)) {
      const e3 = o2.getChildrenSize(), t3 = i2 >= e3, n3 = t3 ? o2.getChildAtIndex(e3 - 1) : o2.getChildAtIndex(i2);
      if (hi(n3)) {
        let e4 = 0;
        t3 && (e4 = n3.getTextContentSize()), r2.set(n3.__key, e4, "text");
      }
    }
  }
}
function Ui(e2, t2, n2, r2, i2) {
  let s2 = null, o2 = 0, l2 = null;
  null !== r2 ? (s2 = r2.__key, hi(r2) ? (o2 = r2.getTextContentSize(), l2 = "text") : bs(r2) && (o2 = r2.getChildrenSize(), l2 = "element")) : null !== i2 && (s2 = i2.__key, hi(i2) ? l2 = "text" : bs(i2) && (l2 = "element")), null !== s2 && null !== l2 ? e2.set(s2, o2, l2) : (o2 = t2.getIndexWithinParent(), -1 === o2 && (o2 = n2.getChildrenSize()), e2.set(n2.__key, o2, "element"));
}
function Vi(e2, t2, n2, r2, i2) {
  "text" === e2.type ? (e2.key = n2, t2 || (e2.offset += i2)) : e2.offset > r2.getIndexWithinParent() && (e2.offset -= 1);
}
function ji(e2, t2, n2, r2, i2, s2, o2) {
  const l2 = r2.anchorNode, c2 = r2.focusNode, a2 = r2.anchorOffset, u2 = r2.focusOffset, f2 = document.activeElement;
  if (i2.has("collaboration") && f2 !== s2 || null !== f2 && lt(f2)) return;
  if (!ki(t2)) return void (null !== e2 && ct(n2, l2, c2) && r2.removeAllRanges());
  const d2 = t2.anchor, h2 = t2.focus, g2 = d2.key, _2 = h2.key, p2 = nn(n2, g2), y2 = nn(n2, _2), m2 = d2.offset, x2 = h2.offset, v2 = t2.format, S2 = t2.style, C2 = t2.isCollapsed();
  let T2 = p2, k2 = y2, b2 = false;
  if ("text" === d2.type) {
    T2 = gt(p2);
    const e3 = d2.getNode();
    b2 = e3.getFormat() !== v2 || e3.getStyle() !== S2;
  } else ki(e2) && "text" === e2.anchor.type && (b2 = true);
  var w2, N2, E2, P2, F2;
  if (("text" === h2.type && (k2 = gt(y2)), null !== T2 && null !== k2) && (C2 && (null === e2 || b2 || ki(e2) && (e2.format !== v2 || e2.style !== S2)) && (w2 = v2, N2 = S2, E2 = m2, P2 = g2, F2 = performance.now(), Or = [w2, N2, E2, P2, F2]), a2 !== m2 || u2 !== x2 || l2 !== T2 || c2 !== k2 || "Range" === r2.type && C2 || (null !== f2 && s2.contains(f2) || s2.focus({ preventScroll: true }), "element" === d2.type))) {
    try {
      r2.setBaseAndExtent(T2, m2, k2, x2);
    } catch (e3) {
    }
    if (!i2.has("skip-scroll-into-view") && t2.isCollapsed() && null !== s2 && s2 === document.activeElement) {
      const e3 = t2 instanceof bi && "element" === t2.anchor.type ? T2.childNodes[m2] || null : r2.rangeCount > 0 ? r2.getRangeAt(0) : null;
      if (null !== e3) {
        let t3;
        if (e3 instanceof Text) {
          const n3 = document.createRange();
          n3.selectNode(e3), t3 = n3.getBoundingClientRect();
        } else t3 = e3.getBoundingClientRect();
        !(function(e4, t4, n3) {
          const r3 = n3.ownerDocument, i3 = r3.defaultView;
          if (null === i3) return;
          let { top: s3, bottom: o3 } = t4, l3 = 0, c3 = 0, a3 = n3;
          for (; null !== a3; ) {
            const t5 = a3 === r3.body;
            if (t5) l3 = 0, c3 = an(e4).innerHeight;
            else {
              const e5 = a3.getBoundingClientRect();
              l3 = e5.top, c3 = e5.bottom;
            }
            let n4 = 0;
            if (s3 < l3 ? n4 = -(l3 - s3) : o3 > c3 && (n4 = o3 - c3), 0 !== n4) if (t5) i3.scrollBy(0, n4);
            else {
              const e5 = a3.scrollTop;
              a3.scrollTop += n4;
              const t6 = a3.scrollTop - e5;
              s3 -= t6, o3 -= t6;
            }
            if (t5) break;
            a3 = rn(a3);
          }
        })(n2, t3, s2);
      }
    }
    Er = true;
  }
}
function Hi(e2) {
  let t2 = Ri() || Ki();
  null === t2 && (t2 = Et().selectEnd()), t2.insertNodes(e2);
}
function Gi(e2) {
  let t2 = e2;
  e2.isCollapsed() || t2.removeText();
  const n2 = Ri();
  ki(n2) && (t2 = n2), ki(t2) || Re(161);
  const r2 = t2.anchor;
  let i2 = r2.getNode(), s2 = r2.offset;
  for (; !Nn(i2); ) [i2, s2] = Qi(i2, s2);
  return s2;
}
function Qi(e2, t2) {
  const n2 = e2.getParent();
  if (!n2) {
    const e3 = zs();
    return Et().append(e3), e3.select(), [Et(), 0];
  }
  if (hi(e2)) {
    const r3 = e2.splitText(t2);
    if (0 === r3.length) return [n2, e2.getIndexWithinParent()];
    const i2 = 0 === t2 ? 0 : 1;
    return [n2, r3[0].getIndexWithinParent() + i2];
  }
  if (!bs(e2) || 0 === t2) return [n2, e2.getIndexWithinParent()];
  const r2 = e2.getChildAtIndex(t2);
  if (r2) {
    const n3 = new bi(xi(e2.__key, t2, "element"), xi(e2.__key, t2, "element"), 0, ""), i2 = e2.insertNewAfter(n3);
    i2 && i2.append(r2, ...r2.getNextSiblings());
  }
  return [n2, e2.getIndexWithinParent() + 1];
}
let Xi = null, Yi = null, Zi = false, es = false, ts = 0;
const ns = { characterData: true, childList: true, subtree: true };
function rs() {
  return Zi || null !== Xi && Xi._readOnly;
}
function is() {
  Zi && Re(13);
}
function ss() {
  ts > 99 && Re(14);
}
function os() {
  return null === Xi && Re(195, cs()), Xi;
}
function ls() {
  return null === Yi && Re(196, cs()), Yi;
}
function cs() {
  let e2 = 0;
  const t2 = /* @__PURE__ */ new Set(), n2 = Hs.version;
  if ("undefined" != typeof window) for (const r3 of document.querySelectorAll("[contenteditable]")) {
    const i2 = ft(r3);
    if (at(i2)) e2++;
    else if (i2) {
      let e3 = String(i2.constructor.version || "<0.17.1");
      e3 === n2 && (e3 += " (separately built, likely a bundler configuration issue)"), t2.add(e3);
    }
  }
  let r2 = ` Detected on the page: ${e2} compatible editor(s) with version ${n2}`;
  return t2.size && (r2 += ` and incompatible editors with versions ${Array.from(t2).join(", ")}`), r2;
}
function as() {
  return Yi;
}
function us(e2, t2, n2) {
  const r2 = t2.__type, i2 = (function(e3, t3) {
    const n3 = e3._nodes.get(t3);
    return void 0 === n3 && Re(30, t3), n3;
  })(e2, r2);
  let s2 = n2.get(r2);
  void 0 === s2 && (s2 = Array.from(i2.transforms), n2.set(r2, s2));
  const o2 = s2.length;
  for (let e3 = 0; e3 < o2 && (s2[e3](t2), t2.isAttached()); e3++) ;
}
function fs(e2, t2) {
  return void 0 !== e2 && e2.__key !== t2 && e2.isAttached();
}
function ds(e2, t2) {
  if (!t2) return;
  const n2 = e2._updateTags;
  let r2 = t2;
  Array.isArray(t2) || (r2 = [t2]);
  for (const e3 of r2) n2.add(e3);
}
function hs(e2) {
  return gs(e2, ls()._nodes);
}
function gs(e2, t2) {
  const n2 = e2.type, r2 = t2.get(n2);
  void 0 === r2 && Re(17, n2);
  const i2 = r2.klass;
  e2.type !== i2.getType() && Re(18, i2.name);
  const s2 = i2.importJSON(e2), o2 = e2.children;
  if (bs(s2) && Array.isArray(o2)) for (let e3 = 0; e3 < o2.length; e3++) {
    const n3 = gs(o2[e3], t2);
    s2.append(n3);
  }
  return s2;
}
function _s(e2, t2, n2) {
  const r2 = Xi, i2 = Zi, s2 = Yi;
  Xi = t2, Zi = true, Yi = e2;
  try {
    return n2();
  } finally {
    Xi = r2, Zi = i2, Yi = s2;
  }
}
function ps(e2, n2) {
  const r2 = e2._pendingEditorState, i2 = e2._rootElement, s2 = e2._headless || null === i2;
  if (null === r2) return;
  const o2 = e2._editorState, l2 = o2._selection, c2 = r2._selection, a2 = e2._dirtyType !== se, u2 = Xi, f2 = Zi, d2 = Yi, h2 = e2._updating, g2 = e2._observer;
  let _2 = null;
  if (e2._pendingEditorState = null, e2._editorState = r2, !s2 && a2 && null !== g2) {
    Yi = e2, Xi = r2, Zi = false, e2._updating = true;
    try {
      const t2 = e2._dirtyType, n3 = e2._dirtyElements, i3 = e2._dirtyLeaves;
      g2.disconnect(), _2 = mr(o2, r2, e2, t2, n3, i3);
    } catch (t2) {
      if (t2 instanceof Error && e2._onError(t2), es) throw t2;
      return Vs(e2, null, i2, r2), Ye(e2), e2._dirtyType = le, es = true, ps(e2, o2), void (es = false);
    } finally {
      g2.observe(i2, ns), e2._updating = h2, Xi = u2, Zi = f2, Yi = d2;
    }
  }
  r2._readOnly || (r2._readOnly = true);
  const p2 = e2._dirtyLeaves, y2 = e2._dirtyElements, m2 = e2._normalizedNodes, x2 = e2._updateTags, v2 = e2._deferred;
  a2 && (e2._dirtyType = se, e2._cloneNotNeeded.clear(), e2._dirtyLeaves = /* @__PURE__ */ new Set(), e2._dirtyElements = /* @__PURE__ */ new Map(), e2._normalizedNodes = /* @__PURE__ */ new Set(), e2._updateTags = /* @__PURE__ */ new Set()), (function(e3, t2) {
    const n3 = e3._decorators;
    let r3 = e3._pendingDecorators || n3;
    const i3 = t2._nodeMap;
    let s3;
    for (s3 in r3) i3.has(s3) || (r3 === n3 && (r3 = wt(e3)), delete r3[s3]);
  })(e2, r2);
  const S2 = s2 ? null : vn(e2._window);
  if (e2._editable && null !== S2 && (a2 || null === c2 || c2.dirty)) {
    Yi = e2, Xi = r2;
    try {
      if (null !== g2 && g2.disconnect(), a2 || null === c2 || c2.dirty) {
        const t2 = e2._blockCursorElement;
        null !== t2 && mn(t2, e2, i2), ji(l2, c2, e2, S2, x2, i2);
      }
      xn(e2, i2, c2), null !== g2 && g2.observe(i2, ns);
    } finally {
      Yi = d2, Xi = u2;
    }
  }
  null !== _2 && (function(e3, t2, n3, r3, i3) {
    const s3 = Array.from(e3._listeners.mutation), o3 = s3.length;
    for (let e4 = 0; e4 < o3; e4++) {
      const [o4, l3] = s3[e4], c3 = t2.get(l3);
      void 0 !== c3 && o4(c3, { dirtyLeaves: r3, prevEditorState: i3, updateTags: n3 });
    }
  })(e2, _2, x2, p2, o2), ki(c2) || null === c2 || null !== l2 && l2.is(c2) || e2.dispatchCommand(t, void 0);
  const C2 = e2._pendingDecorators;
  null !== C2 && (e2._decorators = C2, e2._pendingDecorators = null, ys("decorator", e2, true, C2)), (function(e3, t2, n3) {
    const r3 = Nt(t2), i3 = Nt(n3);
    r3 !== i3 && ys("textcontent", e3, true, i3);
  })(e2, n2 || o2, r2), ys("update", e2, true, { dirtyElements: y2, dirtyLeaves: p2, editorState: r2, normalizedNodes: m2, prevEditorState: n2 || o2, tags: x2 }), (function(e3, t2) {
    if (e3._deferred = [], 0 !== t2.length) {
      const n3 = e3._updating;
      e3._updating = true;
      try {
        for (let e4 = 0; e4 < t2.length; e4++) t2[e4]();
      } finally {
        e3._updating = n3;
      }
    }
  })(e2, v2), (function(e3) {
    const t2 = e3._updates;
    if (0 !== t2.length) {
      const n3 = t2.shift();
      if (n3) {
        const [t3, r3] = n3;
        vs(e3, t3, r3);
      }
    }
  })(e2);
}
function ys(e2, t2, n2, ...r2) {
  const i2 = t2._updating;
  t2._updating = n2;
  try {
    const n3 = Array.from(t2._listeners[e2]);
    for (let e3 = 0; e3 < n3.length; e3++) n3[e3].apply(null, r2);
  } finally {
    t2._updating = i2;
  }
}
function ms(e2, t2, n2) {
  if (false === e2._updating || Yi !== e2) {
    let r3 = false;
    return e2.update((() => {
      r3 = ms(e2, t2, n2);
    })), r3;
  }
  const r2 = Mt(e2);
  for (let i2 = 4; i2 >= 0; i2--) for (let s2 = 0; s2 < r2.length; s2++) {
    const o2 = r2[s2]._commands.get(t2);
    if (void 0 !== o2) {
      const t3 = o2[i2];
      if (void 0 !== t3) {
        const r3 = Array.from(t3), i3 = r3.length;
        for (let t4 = 0; t4 < i3; t4++) if (true === r3[t4](n2, e2)) return true;
      }
    }
  }
  return false;
}
function xs(e2, t2) {
  const n2 = e2._updates;
  let r2 = t2 || false;
  for (; 0 !== n2.length; ) {
    const t3 = n2.shift();
    if (t3) {
      const [n3, i2] = t3;
      let s2;
      if (void 0 !== i2) {
        if (s2 = i2.onUpdate, i2.skipTransforms && (r2 = true), i2.discrete) {
          const t4 = e2._pendingEditorState;
          null === t4 && Re(191), t4._flushSync = true;
        }
        s2 && e2._deferred.push(s2), ds(e2, i2.tag);
      }
      n3();
    }
  }
  return r2;
}
function vs(e2, t2, n2) {
  const r2 = e2._updateTags;
  let i2, s2 = false, o2 = false;
  void 0 !== n2 && (i2 = n2.onUpdate, ds(e2, n2.tag), s2 = n2.skipTransforms || false, o2 = n2.discrete || false), i2 && e2._deferred.push(i2);
  const l2 = e2._editorState;
  let c2 = e2._pendingEditorState, a2 = false;
  (null === c2 || c2._readOnly) && (c2 = e2._pendingEditorState = Ls(c2 || l2), a2 = true), c2._flushSync = o2;
  const u2 = Xi, f2 = Zi, d2 = Yi, h2 = e2._updating;
  Xi = c2, Zi = false, e2._updating = true, Yi = e2;
  try {
    a2 && (e2._headless ? null !== l2._selection && (c2._selection = l2._selection.clone()) : c2._selection = (function(e3) {
      const t3 = e3.getEditorState()._selection, n4 = vn(e3._window);
      return ki(t3) || null == t3 ? Wi(t3, n4, e3, null) : t3.clone();
    })(e2));
    const n3 = e2._compositionKey;
    t2(), s2 = xs(e2, s2), (function(e3, t3) {
      const n4 = t3.getEditorState()._selection, r4 = e3._selection;
      if (ki(r4)) {
        const e4 = r4.anchor, t4 = r4.focus;
        let i3;
        if ("text" === e4.type && (i3 = e4.getNode(), i3.selectionTransform(n4, r4)), "text" === t4.type) {
          const e5 = t4.getNode();
          i3 !== e5 && e5.selectionTransform(n4, r4);
        }
      }
    })(c2, e2), e2._dirtyType !== se && (s2 ? (function(e3, t3) {
      const n4 = t3._dirtyLeaves, r4 = e3._nodeMap;
      for (const e4 of n4) {
        const t4 = r4.get(e4);
        hi(t4) && t4.isAttached() && t4.isSimpleText() && !t4.isUnmergeable() && tt(t4);
      }
    })(c2, e2) : (function(e3, t3) {
      const n4 = t3._dirtyLeaves, r4 = t3._dirtyElements, i3 = e3._nodeMap, s3 = St(), o3 = /* @__PURE__ */ new Map();
      let l3 = n4, c3 = l3.size, a3 = r4, u3 = a3.size;
      for (; c3 > 0 || u3 > 0; ) {
        if (c3 > 0) {
          t3._dirtyLeaves = /* @__PURE__ */ new Set();
          for (const e4 of l3) {
            const r5 = i3.get(e4);
            hi(r5) && r5.isAttached() && r5.isSimpleText() && !r5.isUnmergeable() && tt(r5), void 0 !== r5 && fs(r5, s3) && us(t3, r5, o3), n4.add(e4);
          }
          if (l3 = t3._dirtyLeaves, c3 = l3.size, c3 > 0) {
            ts++;
            continue;
          }
        }
        t3._dirtyLeaves = /* @__PURE__ */ new Set(), t3._dirtyElements = /* @__PURE__ */ new Map();
        for (const e4 of a3) {
          const n5 = e4[0], l4 = e4[1];
          if ("root" !== n5 && !l4) continue;
          const c4 = i3.get(n5);
          void 0 !== c4 && fs(c4, s3) && us(t3, c4, o3), r4.set(n5, l4);
        }
        l3 = t3._dirtyLeaves, c3 = l3.size, a3 = t3._dirtyElements, u3 = a3.size, ts++;
      }
      t3._dirtyLeaves = n4, t3._dirtyElements = r4;
    })(c2, e2), xs(e2), (function(e3, t3, n4, r4) {
      const i3 = e3._nodeMap, s3 = t3._nodeMap, o3 = [];
      for (const [e4] of r4) {
        const t4 = s3.get(e4);
        void 0 !== t4 && (t4.isAttached() || (bs(t4) && Bn(t4, e4, i3, s3, o3, r4), i3.has(e4) || r4.delete(e4), o3.push(e4)));
      }
      for (const e4 of o3) s3.delete(e4);
      for (const e4 of n4) {
        const t4 = s3.get(e4);
        void 0 === t4 || t4.isAttached() || (i3.has(e4) || n4.delete(e4), s3.delete(e4));
      }
    })(l2, c2, e2._dirtyLeaves, e2._dirtyElements));
    n3 !== e2._compositionKey && (c2._flushSync = true);
    const r3 = c2._selection;
    if (ki(r3)) {
      const e3 = c2._nodeMap, t3 = r3.anchor.key, n4 = r3.focus.key;
      void 0 !== e3.get(t3) && void 0 !== e3.get(n4) || Re(19);
    } else wi(r3) && 0 === r3._nodes.size && (c2._selection = null);
  } catch (t3) {
    return t3 instanceof Error && e2._onError(t3), e2._pendingEditorState = l2, e2._dirtyType = le, e2._cloneNotNeeded.clear(), e2._dirtyLeaves = /* @__PURE__ */ new Set(), e2._dirtyElements.clear(), void ps(e2);
  } finally {
    Xi = u2, Zi = f2, Yi = d2, e2._updating = h2, ts = 0;
  }
  const g2 = e2._dirtyType !== se || (function(e3, t3) {
    const n3 = t3.getEditorState()._selection, r3 = e3._selection;
    if (null !== r3) {
      if (r3.dirty || !r3.is(n3)) return true;
    } else if (null !== n3) return true;
    return false;
  })(c2, e2);
  g2 ? c2._flushSync ? (c2._flushSync = false, ps(e2)) : a2 && ot((() => {
    ps(e2);
  })) : (c2._flushSync = false, a2 && (r2.clear(), e2._deferred = [], e2._pendingEditorState = null));
}
function Ss(e2, t2, n2) {
  e2._updating ? e2._updates.push([t2, n2]) : vs(e2, t2, n2);
}
class Cs {
  constructor(e2, t2, n2) {
    this.element = e2, this.before = t2 || null, this.after = n2 || null;
  }
  withBefore(e2) {
    return new Cs(this.element, e2, this.after);
  }
  withAfter(e2) {
    return new Cs(this.element, this.before, e2);
  }
  withElement(e2) {
    return new Cs(e2, this.before, this.after);
  }
  insertChild(e2) {
    const t2 = this.before || this.getManagedLineBreak();
    return null !== t2 && t2.parentElement !== this.element && Re(222), this.element.insertBefore(e2, t2), this;
  }
  removeChild(e2) {
    return e2.parentElement !== this.element && Re(223), this.element.removeChild(e2), this;
  }
  replaceChild(e2, t2) {
    return t2.parentElement !== this.element && Re(224), this.element.replaceChild(e2, t2), this;
  }
  getFirstChild() {
    const e2 = this.after ? this.after.nextSibling : this.element.firstChild;
    return e2 === this.before || e2 === this.getManagedLineBreak() ? null : e2;
  }
  getManagedLineBreak() {
    return this.element.__lexicalLineBreak || null;
  }
  setManagedLineBreak(e2) {
    if (null === e2) this.removeManagedLineBreak();
    else {
      const t2 = "decorator" === e2 && (Y || X);
      this.insertManagedLineBreak(t2);
    }
  }
  removeManagedLineBreak() {
    const e2 = this.getManagedLineBreak();
    if (e2) {
      const t2 = this.element, n2 = "IMG" === e2.nodeName ? e2.nextSibling : null;
      n2 && t2.removeChild(n2), t2.removeChild(e2), t2.__lexicalLineBreak = void 0;
    }
  }
  insertManagedLineBreak(e2) {
    const t2 = this.getManagedLineBreak();
    if (t2) {
      if (e2 === ("IMG" === t2.nodeName)) return;
      this.removeManagedLineBreak();
    }
    const n2 = this.element, r2 = this.before, i2 = document.createElement("br");
    if (n2.insertBefore(i2, r2), e2) {
      const e3 = document.createElement("img");
      e3.setAttribute("data-lexical-linebreak", "true"), e3.style.cssText = "display: inline !important; border: 0px !important; margin: 0px !important;", e3.alt = "", n2.insertBefore(e3, i2), n2.__lexicalLineBreak = e3;
    } else n2.__lexicalLineBreak = i2;
  }
  getFirstChildOffset() {
    let e2 = 0;
    for (let t2 = this.after; null !== t2; t2 = t2.previousSibling) e2++;
    return e2;
  }
  resolveChildIndex(e2, t2, n2, r2) {
    if (n2 === this.element) {
      const t3 = this.getFirstChildOffset();
      return [e2, Math.min(t3 + e2.getChildrenSize(), Math.max(t3, r2))];
    }
    const i2 = Ts(t2, n2);
    i2.push(r2);
    const s2 = Ts(t2, this.element);
    let o2 = e2.getIndexWithinParent();
    for (let e3 = 0; e3 < s2.length; e3++) {
      const t3 = i2[e3], n3 = s2[e3];
      if (void 0 === t3 || t3 < n3) break;
      if (t3 > n3) {
        o2 += 1;
        break;
      }
    }
    return [e2.getParentOrThrow(), o2];
  }
}
function Ts(e2, t2) {
  const n2 = [];
  let r2 = t2;
  for (; r2 !== e2 && null !== r2; r2 = t2.parentNode) {
    let e3 = 0;
    for (let t3 = r2.previousSibling; null !== t3; t3 = r2.previousSibling) e3++;
    n2.push(e3);
  }
  return r2 !== e2 && Re(225), n2.reverse();
}
class ks extends Vr {
  constructor(e2) {
    super(e2), this.__first = null, this.__last = null, this.__size = 0, this.__format = 0, this.__style = "", this.__indent = 0, this.__dir = null;
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__first = e2.__first, this.__last = e2.__last, this.__size = e2.__size, this.__indent = e2.__indent, this.__format = e2.__format, this.__style = e2.__style, this.__dir = e2.__dir;
  }
  getFormat() {
    return this.getLatest().__format;
  }
  getFormatType() {
    const e2 = this.getFormat();
    return Ae[e2] || "";
  }
  getStyle() {
    return this.getLatest().__style;
  }
  getIndent() {
    return this.getLatest().__indent;
  }
  getChildren() {
    const e2 = [];
    let t2 = this.getFirstChild();
    for (; null !== t2; ) e2.push(t2), t2 = t2.getNextSibling();
    return e2;
  }
  getChildrenKeys() {
    const e2 = [];
    let t2 = this.getFirstChild();
    for (; null !== t2; ) e2.push(t2.__key), t2 = t2.getNextSibling();
    return e2;
  }
  getChildrenSize() {
    return this.getLatest().__size;
  }
  isEmpty() {
    return 0 === this.getChildrenSize();
  }
  isDirty() {
    const e2 = ls()._dirtyElements;
    return null !== e2 && e2.has(this.__key);
  }
  isLastChild() {
    const e2 = this.getLatest(), t2 = this.getParentOrThrow().getLastChild();
    return null !== t2 && t2.is(e2);
  }
  getAllTextNodes() {
    const e2 = [];
    let t2 = this.getFirstChild();
    for (; null !== t2; ) {
      if (hi(t2) && e2.push(t2), bs(t2)) {
        const n2 = t2.getAllTextNodes();
        e2.push(...n2);
      }
      t2 = t2.getNextSibling();
    }
    return e2;
  }
  getFirstDescendant() {
    let e2 = this.getFirstChild();
    for (; bs(e2); ) {
      const t2 = e2.getFirstChild();
      if (null === t2) break;
      e2 = t2;
    }
    return e2;
  }
  getLastDescendant() {
    let e2 = this.getLastChild();
    for (; bs(e2); ) {
      const t2 = e2.getLastChild();
      if (null === t2) break;
      e2 = t2;
    }
    return e2;
  }
  getDescendantByIndex(e2) {
    const t2 = this.getChildren(), n2 = t2.length;
    if (e2 >= n2) {
      const e3 = t2[n2 - 1];
      return bs(e3) && e3.getLastDescendant() || e3 || null;
    }
    const r2 = t2[e2];
    return bs(r2) && r2.getFirstDescendant() || r2 || null;
  }
  getFirstChild() {
    const e2 = this.getLatest().__first;
    return null === e2 ? null : Ct(e2);
  }
  getFirstChildOrThrow() {
    const e2 = this.getFirstChild();
    return null === e2 && Re(45, this.__key), e2;
  }
  getLastChild() {
    const e2 = this.getLatest().__last;
    return null === e2 ? null : Ct(e2);
  }
  getLastChildOrThrow() {
    const e2 = this.getLastChild();
    return null === e2 && Re(96, this.__key), e2;
  }
  getChildAtIndex(e2) {
    const t2 = this.getChildrenSize();
    let n2, r2;
    if (e2 < t2 / 2) {
      for (n2 = this.getFirstChild(), r2 = 0; null !== n2 && r2 <= e2; ) {
        if (r2 === e2) return n2;
        n2 = n2.getNextSibling(), r2++;
      }
      return null;
    }
    for (n2 = this.getLastChild(), r2 = t2 - 1; null !== n2 && r2 >= e2; ) {
      if (r2 === e2) return n2;
      n2 = n2.getPreviousSibling(), r2--;
    }
    return null;
  }
  getTextContent() {
    let e2 = "";
    const t2 = this.getChildren(), n2 = t2.length;
    for (let r2 = 0; r2 < n2; r2++) {
      const i2 = t2[r2];
      e2 += i2.getTextContent(), bs(i2) && r2 !== n2 - 1 && !i2.isInline() && (e2 += Ne);
    }
    return e2;
  }
  getTextContentSize() {
    let e2 = 0;
    const t2 = this.getChildren(), n2 = t2.length;
    for (let r2 = 0; r2 < n2; r2++) {
      const i2 = t2[r2];
      e2 += i2.getTextContentSize(), bs(i2) && r2 !== n2 - 1 && !i2.isInline() && (e2 += Ne.length);
    }
    return e2;
  }
  getDirection() {
    return this.getLatest().__dir;
  }
  hasFormat(e2) {
    if ("" !== e2) {
      const t2 = Ie[e2];
      return !!(this.getFormat() & t2);
    }
    return false;
  }
  select(e2, t2) {
    is();
    const n2 = Ri();
    let r2 = e2, i2 = t2;
    const s2 = this.getChildrenSize();
    if (!this.canBeEmpty()) {
      if (0 === e2 && 0 === t2) {
        const e3 = this.getFirstChild();
        if (hi(e3) || bs(e3)) return e3.select(0, 0);
      } else if (!(void 0 !== e2 && e2 !== s2 || void 0 !== t2 && t2 !== s2)) {
        const e3 = this.getLastChild();
        if (hi(e3) || bs(e3)) return e3.select();
      }
    }
    void 0 === r2 && (r2 = s2), void 0 === i2 && (i2 = s2);
    const o2 = this.__key;
    return ki(n2) ? (n2.anchor.set(o2, r2, "element"), n2.focus.set(o2, i2, "element"), n2.dirty = true, n2) : Ii(o2, r2, o2, i2, "element", "element");
  }
  selectStart() {
    const e2 = this.getFirstDescendant();
    return e2 ? e2.selectStart() : this.select();
  }
  selectEnd() {
    const e2 = this.getLastDescendant();
    return e2 ? e2.selectEnd() : this.select();
  }
  clear() {
    const e2 = this.getWritable();
    return this.getChildren().forEach(((e3) => e3.remove())), e2;
  }
  append(...e2) {
    return this.splice(this.getChildrenSize(), 0, e2);
  }
  setDirection(e2) {
    const t2 = this.getWritable();
    return t2.__dir = e2, t2;
  }
  setFormat(e2) {
    return this.getWritable().__format = "" !== e2 ? Ie[e2] : 0, this;
  }
  setStyle(e2) {
    return this.getWritable().__style = e2 || "", this;
  }
  setIndent(e2) {
    return this.getWritable().__indent = e2, this;
  }
  splice(e2, t2, n2) {
    const r2 = n2.length, i2 = this.getChildrenSize(), s2 = this.getWritable();
    e2 + t2 <= i2 || Re(226, String(e2), String(t2), String(i2));
    const o2 = s2.__key, l2 = [], c2 = [], a2 = this.getChildAtIndex(e2 + t2);
    let u2 = null, f2 = i2 - t2 + r2;
    if (0 !== e2) if (e2 === i2) u2 = this.getLastChild();
    else {
      const t3 = this.getChildAtIndex(e2);
      null !== t3 && (u2 = t3.getPreviousSibling());
    }
    if (t2 > 0) {
      let e3 = null === u2 ? this.getFirstChild() : u2.getNextSibling();
      for (let n3 = 0; n3 < t2; n3++) {
        null === e3 && Re(100);
        const t3 = e3.getNextSibling(), n4 = e3.__key;
        mt(e3.getWritable()), c2.push(n4), e3 = t3;
      }
    }
    let d2 = u2;
    for (let e3 = 0; e3 < r2; e3++) {
      const t3 = n2[e3];
      null !== d2 && t3.is(d2) && (u2 = d2 = d2.getPreviousSibling());
      const r3 = t3.getWritable();
      r3.__parent === o2 && f2--, mt(r3);
      const i3 = t3.__key;
      if (null === d2) s2.__first = i3, r3.__prev = null;
      else {
        const e4 = d2.getWritable();
        e4.__next = i3, r3.__prev = e4.__key;
      }
      t3.__key === o2 && Re(76), r3.__parent = o2, l2.push(i3), d2 = t3;
    }
    if (e2 + t2 === i2) {
      if (null !== d2) {
        d2.getWritable().__next = null, s2.__last = d2.__key;
      }
    } else if (null !== a2) {
      const e3 = a2.getWritable();
      if (null !== d2) {
        const t3 = d2.getWritable();
        e3.__prev = d2.__key, t3.__next = a2.__key;
      } else e3.__prev = null;
    }
    if (s2.__size = f2, c2.length) {
      const e3 = Ri();
      if (ki(e3)) {
        const t3 = new Set(c2), n3 = new Set(l2), { anchor: r3, focus: i3 } = e3;
        ws(r3, t3, n3) && Ui(r3, r3.getNode(), this, u2, a2), ws(i3, t3, n3) && Ui(i3, i3.getNode(), this, u2, a2), 0 !== f2 || this.canBeEmpty() || dn(this) || this.remove();
      }
    }
    return s2;
  }
  getDOMSlot(e2) {
    return new Cs(e2);
  }
  exportDOM(e2) {
    const { element: t2 } = super.exportDOM(e2);
    if (t2 && Tn(t2)) {
      const e3 = this.getIndent();
      e3 > 0 && (t2.style.paddingInlineStart = 40 * e3 + "px");
    }
    return { element: t2 };
  }
  exportJSON() {
    return { children: [], direction: this.getDirection(), format: this.getFormatType(), indent: this.getIndent(), type: "element", version: 1 };
  }
  insertNewAfter(e2, t2) {
    return null;
  }
  canIndent() {
    return true;
  }
  collapseAtStart(e2) {
    return false;
  }
  excludeFromCopy(e2) {
    return false;
  }
  canReplaceWith(e2) {
    return true;
  }
  canInsertAfter(e2) {
    return true;
  }
  canBeEmpty() {
    return true;
  }
  canInsertTextBefore() {
    return true;
  }
  canInsertTextAfter() {
    return true;
  }
  isInline() {
    return false;
  }
  isShadowRoot() {
    return false;
  }
  canMergeWith(e2) {
    return false;
  }
  extractWithChild(e2, t2, n2) {
    return false;
  }
  canMergeWhenEmpty() {
    return false;
  }
  reconcileObservedMutation(e2, t2) {
    const n2 = this.getDOMSlot(e2);
    let r2 = n2.getFirstChild();
    for (let e3 = this.getFirstChild(); e3; e3 = e3.getNextSibling()) {
      const i2 = t2.getElementByKey(e3.getKey());
      null !== i2 && (null == r2 ? (n2.insertChild(i2), r2 = i2) : r2 !== i2 && n2.replaceChild(i2, r2), r2 = r2.nextSibling);
    }
  }
}
function bs(e2) {
  return e2 instanceof ks;
}
function ws(e2, t2, n2) {
  let r2 = e2.getNode();
  for (; r2; ) {
    const e3 = r2.__key;
    if (t2.has(e3) && !n2.has(e3)) return true;
    r2 = r2.getParent();
  }
  return false;
}
class Ns extends Vr {
  constructor(e2) {
    super(e2);
  }
  decorate(e2, t2) {
    Re(47);
  }
  isIsolated() {
    return false;
  }
  isInline() {
    return true;
  }
  isKeyboardSelectable() {
    return true;
  }
}
function Es(e2) {
  return e2 instanceof Ns;
}
class Ps extends ks {
  static getType() {
    return "root";
  }
  static clone() {
    return new Ps();
  }
  constructor() {
    super("root"), this.__cachedText = null;
  }
  getTopLevelElementOrThrow() {
    Re(51);
  }
  getTextContent() {
    const e2 = this.__cachedText;
    return !rs() && ls()._dirtyType !== se || null === e2 ? super.getTextContent() : e2;
  }
  remove() {
    Re(52);
  }
  replace(e2) {
    Re(53);
  }
  insertBefore(e2) {
    Re(54);
  }
  insertAfter(e2) {
    Re(55);
  }
  updateDOM(e2, t2) {
    return false;
  }
  append(...e2) {
    for (let t2 = 0; t2 < e2.length; t2++) {
      const n2 = e2[t2];
      bs(n2) || Es(n2) || Re(56);
    }
    return super.append(...e2);
  }
  static importJSON(e2) {
    const t2 = Et();
    return t2.setFormat(e2.format), t2.setIndent(e2.indent), t2.setDirection(e2.direction), t2;
  }
  exportJSON() {
    return { children: [], direction: this.getDirection(), format: this.getFormatType(), indent: this.getIndent(), type: "root", version: 1 };
  }
  collapseAtStart() {
    return true;
  }
}
function Fs(e2) {
  return e2 instanceof Ps;
}
function Ls(e2) {
  return new Ms(new Map(e2._nodeMap));
}
function Os() {
  return new Ms(/* @__PURE__ */ new Map([["root", new Ps()]]));
}
function Ds(e2) {
  const t2 = e2.exportJSON(), n2 = e2.constructor;
  if (t2.type !== n2.getType() && Re(130, n2.name), bs(e2)) {
    const r2 = t2.children;
    Array.isArray(r2) || Re(59, n2.name);
    const i2 = e2.getChildren();
    for (let e3 = 0; e3 < i2.length; e3++) {
      const t3 = Ds(i2[e3]);
      r2.push(t3);
    }
  }
  return t2;
}
class Ms {
  constructor(e2, t2) {
    this._nodeMap = e2, this._selection = t2 || null, this._flushSync = false, this._readOnly = false;
  }
  isEmpty() {
    return 1 === this._nodeMap.size && null === this._selection;
  }
  read(e2, t2) {
    return _s(t2 && t2.editor || null, this, e2);
  }
  clone(e2) {
    const t2 = new Ms(this._nodeMap, void 0 === e2 ? this._selection : e2);
    return t2._readOnly = true, t2;
  }
  toJSON() {
    return _s(null, this, (() => ({ root: Ds(Et()) })));
  }
}
class Is extends ks {
  static getType() {
    return "artificial";
  }
  createDOM(e2) {
    return document.createElement("div");
  }
}
class As extends ks {
  constructor(e2) {
    super(e2), this.__textFormat = 0, this.__textStyle = "";
  }
  static getType() {
    return "paragraph";
  }
  getTextFormat() {
    return this.getLatest().__textFormat;
  }
  setTextFormat(e2) {
    const t2 = this.getWritable();
    return t2.__textFormat = e2, t2;
  }
  hasTextFormat(e2) {
    const t2 = De[e2];
    return !!(this.getTextFormat() & t2);
  }
  getFormatFlags(e2, t2) {
    return _t(this.getLatest().__textFormat, e2, t2);
  }
  getTextStyle() {
    return this.getLatest().__textStyle;
  }
  setTextStyle(e2) {
    const t2 = this.getWritable();
    return t2.__textStyle = e2, t2;
  }
  static clone(e2) {
    return new As(e2.__key);
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__textFormat = e2.__textFormat, this.__textStyle = e2.__textStyle;
  }
  createDOM(e2) {
    const t2 = document.createElement("p"), n2 = qt(e2.theme, "paragraph");
    if (void 0 !== n2) {
      t2.classList.add(...n2);
    }
    return t2;
  }
  updateDOM(e2, t2, n2) {
    return false;
  }
  static importDOM() {
    return { p: (e2) => ({ conversion: Bs, priority: 0 }) };
  }
  exportDOM(e2) {
    const { element: t2 } = super.exportDOM(e2);
    if (t2 && Tn(t2)) {
      this.isEmpty() && t2.append(document.createElement("br"));
      const e3 = this.getFormatType();
      t2.style.textAlign = e3;
      const n2 = this.getDirection();
      n2 && (t2.dir = n2);
    }
    return { element: t2 };
  }
  static importJSON(e2) {
    const t2 = zs();
    return t2.setFormat(e2.format), t2.setIndent(e2.indent), t2.setDirection(e2.direction), t2.setTextFormat(e2.textFormat), t2;
  }
  exportJSON() {
    return { ...super.exportJSON(), textFormat: this.getTextFormat(), textStyle: this.getTextStyle(), type: "paragraph", version: 1 };
  }
  insertNewAfter(e2, t2) {
    const n2 = zs();
    n2.setTextFormat(e2.format), n2.setTextStyle(e2.style);
    const r2 = this.getDirection();
    return n2.setDirection(r2), n2.setFormat(this.getFormatType()), n2.setStyle(this.getTextStyle()), this.insertAfter(n2, t2), n2;
  }
  collapseAtStart() {
    const e2 = this.getChildren();
    if (0 === e2.length || hi(e2[0]) && "" === e2[0].getTextContent().trim()) {
      if (null !== this.getNextSibling()) return this.selectNext(), this.remove(), true;
      if (null !== this.getPreviousSibling()) return this.selectPrevious(), this.remove(), true;
    }
    return false;
  }
}
function Bs(e2) {
  const t2 = zs();
  return e2.style && (t2.setFormat(e2.style.textAlign), Mn(e2, t2)), { node: t2 };
}
function zs() {
  return gn(new As());
}
function Ws(e2) {
  return e2 instanceof As;
}
const Rs = 0, Ks = 1, $s = 3, Us = 4;
function Vs(e2, t2, n2, r2) {
  const i2 = e2._keyToDOMMap;
  i2.clear(), e2._editorState = Os(), e2._pendingEditorState = r2, e2._compositionKey = null, e2._dirtyType = se, e2._cloneNotNeeded.clear(), e2._dirtyLeaves = /* @__PURE__ */ new Set(), e2._dirtyElements.clear(), e2._normalizedNodes = /* @__PURE__ */ new Set(), e2._updateTags = /* @__PURE__ */ new Set(), e2._updates = [], e2._blockCursorElement = null;
  const s2 = e2._observer;
  null !== s2 && (s2.disconnect(), e2._observer = null), null !== t2 && (t2.textContent = ""), null !== n2 && (n2.textContent = "", i2.set("root", n2));
}
function js(e2) {
  const t2 = e2 || {}, n2 = as(), r2 = t2.theme || {}, i2 = void 0 === e2 ? n2 : t2.parentEditor || null, s2 = t2.disableEvents || false, o2 = Os(), l2 = t2.namespace || (null !== i2 ? i2._config.namespace : It()), c2 = t2.editorState, a2 = [Ps, ri, jr, _i, As, Is, ...t2.nodes || []], { onError: u2, html: f2 } = t2, d2 = void 0 === t2.editable || t2.editable;
  let h2;
  if (void 0 === e2 && null !== n2) h2 = n2._nodes;
  else {
    h2 = /* @__PURE__ */ new Map();
    for (let e3 = 0; e3 < a2.length; e3++) {
      let t3 = a2[e3], n3 = null, r3 = null;
      if ("function" != typeof t3) {
        const e4 = t3;
        t3 = e4.replace, n3 = e4.with, r3 = e4.withKlass || null;
      }
      const i3 = t3.getType(), s3 = t3.transform(), o3 = /* @__PURE__ */ new Set();
      null !== s3 && o3.add(s3), h2.set(i3, { exportDOM: f2 && f2.export ? f2.export.get(t3) : void 0, klass: t3, replace: n3, replaceWithKlass: r3, transforms: o3 });
    }
  }
  const g2 = new Hs(o2, i2, h2, { disableEvents: s2, namespace: l2, theme: r2 }, u2 || console.error, (function(e3, t3) {
    const n3 = /* @__PURE__ */ new Map(), r3 = /* @__PURE__ */ new Set(), i3 = (e4) => {
      Object.keys(e4).forEach(((t4) => {
        let r4 = n3.get(t4);
        void 0 === r4 && (r4 = [], n3.set(t4, r4)), r4.push(e4[t4]);
      }));
    };
    return e3.forEach(((e4) => {
      const t4 = e4.klass.importDOM;
      if (null == t4 || r3.has(t4)) return;
      r3.add(t4);
      const n4 = t4.call(e4.klass);
      null !== n4 && i3(n4);
    })), t3 && i3(t3), n3;
  })(h2, f2 ? f2.import : void 0), d2);
  return void 0 !== c2 && (g2._pendingEditorState = c2, g2._dirtyType = le), g2;
}
class Hs {
  constructor(e2, t2, n2, r2, i2, s2, o2) {
    this._parentEditor = t2, this._rootElement = null, this._editorState = e2, this._pendingEditorState = null, this._compositionKey = null, this._deferred = [], this._keyToDOMMap = /* @__PURE__ */ new Map(), this._updates = [], this._updating = false, this._listeners = { decorator: /* @__PURE__ */ new Set(), editable: /* @__PURE__ */ new Set(), mutation: /* @__PURE__ */ new Map(), root: /* @__PURE__ */ new Set(), textcontent: /* @__PURE__ */ new Set(), update: /* @__PURE__ */ new Set() }, this._commands = /* @__PURE__ */ new Map(), this._config = r2, this._nodes = n2, this._decorators = {}, this._pendingDecorators = null, this._dirtyType = se, this._cloneNotNeeded = /* @__PURE__ */ new Set(), this._dirtyLeaves = /* @__PURE__ */ new Set(), this._dirtyElements = /* @__PURE__ */ new Map(), this._normalizedNodes = /* @__PURE__ */ new Set(), this._updateTags = /* @__PURE__ */ new Set(), this._observer = null, this._key = It(), this._onError = i2, this._htmlConversions = s2, this._editable = o2, this._headless = null !== t2 && t2._headless, this._window = null, this._blockCursorElement = null;
  }
  isComposing() {
    return null != this._compositionKey;
  }
  registerUpdateListener(e2) {
    const t2 = this._listeners.update;
    return t2.add(e2), () => {
      t2.delete(e2);
    };
  }
  registerEditableListener(e2) {
    const t2 = this._listeners.editable;
    return t2.add(e2), () => {
      t2.delete(e2);
    };
  }
  registerDecoratorListener(e2) {
    const t2 = this._listeners.decorator;
    return t2.add(e2), () => {
      t2.delete(e2);
    };
  }
  registerTextContentListener(e2) {
    const t2 = this._listeners.textcontent;
    return t2.add(e2), () => {
      t2.delete(e2);
    };
  }
  registerRootListener(e2) {
    const t2 = this._listeners.root;
    return e2(this._rootElement, null), t2.add(e2), () => {
      e2(null, this._rootElement), t2.delete(e2);
    };
  }
  registerCommand(e2, t2, n2) {
    void 0 === n2 && Re(35);
    const r2 = this._commands;
    r2.has(e2) || r2.set(e2, [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()]);
    const i2 = r2.get(e2);
    void 0 === i2 && Re(36, String(e2));
    const s2 = i2[n2];
    return s2.add(t2), () => {
      s2.delete(t2), i2.every(((e3) => 0 === e3.size)) && r2.delete(e2);
    };
  }
  registerMutationListener(e2, t2, n2) {
    const r2 = this.resolveRegisteredNodeAfterReplacements(this.getRegisteredNode(e2)).klass, i2 = this._listeners.mutation;
    i2.set(t2, r2);
    const s2 = n2 && n2.skipInitialization;
    return void 0 !== s2 && s2 || this.initializeMutationListener(t2, r2), () => {
      i2.delete(t2);
    };
  }
  getRegisteredNode(e2) {
    const t2 = this._nodes.get(e2.getType());
    return void 0 === t2 && Re(37, e2.name), t2;
  }
  resolveRegisteredNodeAfterReplacements(e2) {
    for (; e2.replaceWithKlass; ) e2 = this.getRegisteredNode(e2.replaceWithKlass);
    return e2;
  }
  initializeMutationListener(e2, t2) {
    const n2 = this._editorState, r2 = On(n2).get(t2.getType());
    if (!r2) return;
    const i2 = /* @__PURE__ */ new Map();
    for (const e3 of r2.keys()) i2.set(e3, "created");
    i2.size > 0 && e2(i2, { dirtyLeaves: /* @__PURE__ */ new Set(), prevEditorState: n2, updateTags: /* @__PURE__ */ new Set(["registerMutationListener"]) });
  }
  registerNodeTransformToKlass(e2, t2) {
    const n2 = this.getRegisteredNode(e2);
    return n2.transforms.add(t2), n2;
  }
  registerNodeTransform(e2, t2) {
    const n2 = this.registerNodeTransformToKlass(e2, t2), r2 = [n2], i2 = n2.replaceWithKlass;
    if (null != i2) {
      const e3 = this.registerNodeTransformToKlass(i2, t2);
      r2.push(e3);
    }
    var s2, o2;
    return s2 = this, o2 = e2.getType(), Ss(s2, (() => {
      const e3 = os();
      if (e3.isEmpty()) return;
      if ("root" === o2) return void Et().markDirty();
      const t3 = e3._nodeMap;
      for (const [, e4] of t3) e4.markDirty();
    }), null === s2._pendingEditorState ? { tag: "history-merge" } : void 0), () => {
      r2.forEach(((e3) => e3.transforms.delete(t2)));
    };
  }
  hasNode(e2) {
    return this._nodes.has(e2.getType());
  }
  hasNodes(e2) {
    return e2.every(this.hasNode.bind(this));
  }
  dispatchCommand(e2, t2) {
    return en(this, e2, t2);
  }
  getDecorators() {
    return this._decorators;
  }
  getRootElement() {
    return this._rootElement;
  }
  getKey() {
    return this._key;
  }
  setRootElement(e2) {
    const t2 = this._rootElement;
    if (e2 !== t2) {
      const n2 = qt(this._config.theme, "root"), r2 = this._pendingEditorState || this._editorState;
      if (this._rootElement = e2, Vs(this, t2, e2, r2), null !== t2 && (this._config.disableEvents || $r(t2), null != n2 && t2.classList.remove(...n2)), null !== e2) {
        const t3 = (function(e3) {
          const t4 = e3.ownerDocument;
          return t4 && t4.defaultView || null;
        })(e2), r3 = e2.style;
        r3.userSelect = "text", r3.whiteSpace = "pre-wrap", r3.wordBreak = "break-word", e2.setAttribute("data-lexical-editor", "true"), this._window = t3, this._dirtyType = le, Ye(this), this._updateTags.add("history-merge"), ps(this), this._config.disableEvents || (function(e3, t4) {
          const n3 = e3.ownerDocument, r4 = Nr.get(n3);
          (void 0 === r4 || r4 < 1) && n3.addEventListener("selectionchange", Rr), Nr.set(n3, (r4 || 0) + 1), e3.__lexicalEditor = t4;
          const i2 = zr(e3);
          for (let n4 = 0; n4 < Cr.length; n4++) {
            const [r5, s2] = Cr[n4], o2 = "function" == typeof s2 ? (e4) => {
              Jr(e4) || (Kr(e4), (t4.isEditable() || "click" === r5) && s2(e4, t4));
            } : (e4) => {
              if (Jr(e4)) return;
              Kr(e4);
              const n5 = t4.isEditable();
              switch (r5) {
                case "cut":
                  return n5 && en(t4, B, e4);
                case "copy":
                  return en(t4, A, e4);
                case "paste":
                  return n5 && en(t4, c, e4);
                case "dragstart":
                  return n5 && en(t4, D, e4);
                case "dragover":
                  return n5 && en(t4, M, e4);
                case "dragend":
                  return n5 && en(t4, I, e4);
                case "focus":
                  return n5 && en(t4, $, e4);
                case "blur":
                  return n5 && en(t4, U, e4);
                case "drop":
                  return n5 && en(t4, L, e4);
              }
            };
            e3.addEventListener(r5, o2), i2.push((() => {
              e3.removeEventListener(r5, o2);
            }));
          }
        })(e2, this), null != n2 && e2.classList.add(...n2);
      } else this._editorState = r2, this._pendingEditorState = null, this._window = null;
      ys("root", this, false, e2, t2);
    }
  }
  getElementByKey(e2) {
    return this._keyToDOMMap.get(e2) || null;
  }
  getEditorState() {
    return this._editorState;
  }
  setEditorState(e2, t2) {
    e2.isEmpty() && Re(38);
    let n2 = e2;
    n2._readOnly && (n2 = Ls(e2), n2._selection = e2._selection ? e2._selection.clone() : null), Xe(this);
    const r2 = this._pendingEditorState, i2 = this._updateTags, s2 = void 0 !== t2 ? t2.tag : null;
    null === r2 || r2.isEmpty() || (null != s2 && i2.add(s2), ps(this)), this._pendingEditorState = n2, this._dirtyType = le, this._dirtyElements.set("root", false), this._compositionKey = null, null != s2 && i2.add(s2), this._updating || ps(this);
  }
  parseEditorState(e2, t2) {
    return (function(e3, t3, n2) {
      const r2 = Os(), i2 = Xi, s2 = Zi, o2 = Yi, l2 = t3._dirtyElements, c2 = t3._dirtyLeaves, a2 = t3._cloneNotNeeded, u2 = t3._dirtyType;
      t3._dirtyElements = /* @__PURE__ */ new Map(), t3._dirtyLeaves = /* @__PURE__ */ new Set(), t3._cloneNotNeeded = /* @__PURE__ */ new Set(), t3._dirtyType = 0, Xi = r2, Zi = false, Yi = t3;
      try {
        const i3 = t3._nodes;
        gs(e3.root, i3), n2 && n2(), r2._readOnly = true;
      } catch (e4) {
        e4 instanceof Error && t3._onError(e4);
      } finally {
        t3._dirtyElements = l2, t3._dirtyLeaves = c2, t3._cloneNotNeeded = a2, t3._dirtyType = u2, Xi = i2, Zi = s2, Yi = o2;
      }
      return r2;
    })("string" == typeof e2 ? JSON.parse(e2) : e2, this, t2);
  }
  read(e2) {
    return ps(this), this.getEditorState().read(e2, { editor: this });
  }
  update(e2, t2) {
    Ss(this, e2, t2);
  }
  focus(e2, t2 = {}) {
    const n2 = this._rootElement;
    null !== n2 && (n2.setAttribute("autocapitalize", "off"), Ss(this, (() => {
      const e3 = Ri(), n3 = Et();
      null !== e3 ? e3.dirty = true : 0 !== n3.getChildrenSize() && ("rootStart" === t2.defaultSelection ? n3.selectStart() : n3.selectEnd());
    }), { onUpdate: () => {
      n2.removeAttribute("autocapitalize"), e2 && e2();
    }, tag: "focus" }), null === this._pendingEditorState && n2.removeAttribute("autocapitalize"));
  }
  blur() {
    const e2 = this._rootElement;
    null !== e2 && e2.blur();
    const t2 = vn(this._window);
    null !== t2 && t2.removeAllRanges();
  }
  isEditable() {
    return this._editable;
  }
  setEditable(e2) {
    this._editable !== e2 && (this._editable = e2, ys("editable", this, true, e2));
  }
  toJSON() {
    return { editorState: this._editorState.toJSON() };
  }
}
Hs.version = "0.21.0+prod.esm";
export {
  r as $,
  A,
  Ks as B,
  Cn as C,
  Dn as D,
  Et as E,
  Fs as F,
  pt as G,
  Es as H,
  Is as I,
  J,
  K,
  Gr as L,
  Mi as M,
  Ai as N,
  Ft as O,
  Pn as P,
  js as Q,
  Ri as R,
  wi as S,
  Tn as T,
  Us as U,
  Ct as V,
  W,
  Bi as X,
  Ns as Y,
  k as Z,
  w as _,
  hi as a,
  c as a0,
  N as a1,
  nt as a2,
  F as a3,
  P as a4,
  E as a5,
  Mn as a6,
  lt as a7,
  B as a8,
  z as a9,
  t as aA,
  zi as aB,
  xi as aC,
  rs as aD,
  De as aE,
  Sn as aF,
  Ht as aa,
  M as ab,
  bt as ac,
  D as ad,
  L as ae,
  b as af,
  C as ag,
  s as ah,
  i as ai,
  p as aj,
  m as ak,
  S as al,
  Yt as am,
  v as an,
  Hi as ao,
  O as ap,
  d as aq,
  a as ar,
  l as as,
  f as at,
  u as au,
  Ei as av,
  In as aw,
  Ki as ax,
  $s as ay,
  $ as az,
  bs as b,
  ct as c,
  ks as d,
  R as e,
  Rs as f,
  gn as g,
  hs as h,
  g as i,
  h as j,
  ki as k,
  dn as l,
  bn as m,
  n,
  kn as o,
  pi as p,
  qr as q,
  ri as r,
  e as s,
  di as t,
  Ws as u,
  vn as v,
  wn as w,
  o as x,
  yi as y,
  zs as z
};
