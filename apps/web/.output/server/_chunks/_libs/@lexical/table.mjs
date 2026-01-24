import { W, j, o as oe$1, u as ue$1 } from "./utils.mjs";
import { d as ks, aw as In, P as Pn, T as Tn, ac as bt$1, s as e, g as gn, b as bs, z as zs, L as Gr, a as hi, t as di, V as Ct$1, ax as Ki, k as ki, R as Ri, al as S, an as v, ak as m, aj as p, ay as $s, af as b, au as u, at as f, ai as i, U as Us, Z as k, _ as w, a8 as B, aq as d, ap as O$1, as as l, a1 as N, az as $, n, aA as t, O as Ft$1, v as vn, aB as zi, x as o, N as Ai, u as Ws, E as Et, l as dn, H as Es, aC as xi, a2 as nt$1, aD as rs, aE as De$1 } from "../../../_libs/lexical.mjs";
import { O, L } from "./clipboard.mjs";
const ne = /^(\d+(?:\.\d+)?)px$/, oe = { BOTH: 3, COLUMN: 2, NO_STATUS: 0, ROW: 1 };
class re extends ks {
  static getType() {
    return "tablecell";
  }
  static clone(e2) {
    return new re(e2.__headerState, e2.__colSpan, e2.__width, e2.__key);
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__rowSpan = e2.__rowSpan, this.__backgroundColor = e2.__backgroundColor;
  }
  static importDOM() {
    return { td: (e2) => ({ conversion: le, priority: 0 }), th: (e2) => ({ conversion: le, priority: 0 }) };
  }
  static importJSON(e2) {
    const t2 = e2.colSpan || 1, n2 = e2.rowSpan || 1;
    return se(e2.headerState, t2, e2.width || void 0).setRowSpan(n2).setBackgroundColor(e2.backgroundColor || null);
  }
  constructor(e2 = oe.NO_STATUS, t2 = 1, n2, o2) {
    super(o2), this.__colSpan = t2, this.__rowSpan = 1, this.__headerState = e2, this.__width = n2, this.__backgroundColor = null;
  }
  createDOM(t2) {
    const n2 = document.createElement(this.getTag());
    return this.__width && (n2.style.width = `${this.__width}px`), this.__colSpan > 1 && (n2.colSpan = this.__colSpan), this.__rowSpan > 1 && (n2.rowSpan = this.__rowSpan), null !== this.__backgroundColor && (n2.style.backgroundColor = this.__backgroundColor), W(n2, t2.theme.tableCell, this.hasHeader() && t2.theme.tableCellHeader), n2;
  }
  exportDOM(e2) {
    const t2 = super.exportDOM(e2);
    if (t2.element && Tn(t2.element)) {
      const e3 = t2.element;
      e3.setAttribute("data-temporary-table-cell-lexical-key", this.getKey()), e3.style.border = "1px solid black", this.__colSpan > 1 && (e3.colSpan = this.__colSpan), this.__rowSpan > 1 && (e3.rowSpan = this.__rowSpan), e3.style.width = `${this.getWidth() || 75}px`, e3.style.verticalAlign = "top", e3.style.textAlign = "start", null === this.__backgroundColor && this.hasHeader() && (e3.style.backgroundColor = "#f2f3f5");
    }
    return t2;
  }
  exportJSON() {
    return { ...super.exportJSON(), backgroundColor: this.getBackgroundColor(), colSpan: this.__colSpan, headerState: this.__headerState, rowSpan: this.__rowSpan, type: "tablecell", width: this.getWidth() };
  }
  getColSpan() {
    return this.getLatest().__colSpan;
  }
  setColSpan(e2) {
    const t2 = this.getWritable();
    return t2.__colSpan = e2, t2;
  }
  getRowSpan() {
    return this.getLatest().__rowSpan;
  }
  setRowSpan(e2) {
    const t2 = this.getWritable();
    return t2.__rowSpan = e2, t2;
  }
  getTag() {
    return this.hasHeader() ? "th" : "td";
  }
  setHeaderStyles(e2, t2 = oe.BOTH) {
    const n2 = this.getWritable();
    return n2.__headerState = e2 & t2 | n2.__headerState & ~t2, n2;
  }
  getHeaderStyles() {
    return this.getLatest().__headerState;
  }
  setWidth(e2) {
    const t2 = this.getWritable();
    return t2.__width = e2, t2;
  }
  getWidth() {
    return this.getLatest().__width;
  }
  getBackgroundColor() {
    return this.getLatest().__backgroundColor;
  }
  setBackgroundColor(e2) {
    const t2 = this.getWritable();
    return t2.__backgroundColor = e2, t2;
  }
  toggleHeaderStyle(e2) {
    const t2 = this.getWritable();
    return (t2.__headerState & e2) === e2 ? t2.__headerState -= e2 : t2.__headerState += e2, t2;
  }
  hasHeaderState(e2) {
    return (this.getHeaderStyles() & e2) === e2;
  }
  hasHeader() {
    return this.getLatest().__headerState !== oe.NO_STATUS;
  }
  updateDOM(e2) {
    return e2.__headerState !== this.__headerState || e2.__width !== this.__width || e2.__colSpan !== this.__colSpan || e2.__rowSpan !== this.__rowSpan || e2.__backgroundColor !== this.__backgroundColor;
  }
  isShadowRoot() {
    return true;
  }
  collapseAtStart() {
    return true;
  }
  canBeEmpty() {
    return false;
  }
  canIndent() {
    return false;
  }
}
function le(e2) {
  const t2 = e2, n2 = e2.nodeName.toLowerCase();
  let o2;
  ne.test(t2.style.width) && (o2 = parseFloat(t2.style.width));
  const r = se("th" === n2 ? oe.ROW : oe.NO_STATUS, t2.colSpan, o2);
  r.__rowSpan = t2.rowSpan;
  const l2 = t2.style.backgroundColor;
  "" !== l2 && (r.__backgroundColor = l2);
  const s = t2.style, h = (s && s.textDecoration || "").split(" "), d2 = "700" === s.fontWeight || "bold" === s.fontWeight, g = h.includes("line-through"), f2 = "italic" === s.fontStyle, m2 = h.includes("underline");
  return { after: (e3) => (0 === e3.length && e3.push(zs()), e3), forChild: (e3, t3) => {
    if (ie(t3) && !bs(e3)) {
      const t4 = zs();
      return Gr(e3) && "\n" === e3.getTextContent() ? null : (hi(e3) && (d2 && e3.toggleFormat("bold"), g && e3.toggleFormat("strikethrough"), f2 && e3.toggleFormat("italic"), m2 && e3.toggleFormat("underline")), t4.append(e3), t4);
    }
    return e3;
  }, node: r };
}
function se(e2, t2 = 1, n2) {
  return gn(new re(e2, t2, n2));
}
function ie(e2) {
  return e2 instanceof re;
}
const ce = e();
function ae(e2) {
  return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
}
var ue = ae((function(e2) {
  const t2 = new URLSearchParams();
  t2.append("code", e2);
  for (let e3 = 1; e3 < arguments.length; e3++) t2.append("v", arguments[e3]);
  throw Error(`Minified Lexical error #${e2}; visit https://lexical.dev/docs/error?${t2} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
const he = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement, de = he && "documentMode" in document ? document.documentMode : null, ge = he && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent);
he && "InputEvent" in window && !de && new window.InputEvent("input");
class fe extends ks {
  static getType() {
    return "tablerow";
  }
  static clone(e2) {
    return new fe(e2.__height, e2.__key);
  }
  static importDOM() {
    return { tr: (e2) => ({ conversion: me, priority: 0 }) };
  }
  static importJSON(e2) {
    return pe(e2.height);
  }
  constructor(e2, t2) {
    super(t2), this.__height = e2;
  }
  exportJSON() {
    return { ...super.exportJSON(), ...this.getHeight() && { height: this.getHeight() }, type: "tablerow", version: 1 };
  }
  createDOM(t2) {
    const n2 = document.createElement("tr");
    return this.__height && (n2.style.height = `${this.__height}px`), W(n2, t2.theme.tableRow), n2;
  }
  extractWithChild(e2, t2, n2) {
    return "html" === n2;
  }
  isShadowRoot() {
    return true;
  }
  setHeight(e2) {
    return this.getWritable().__height = e2, this.__height;
  }
  getHeight() {
    return this.getLatest().__height;
  }
  updateDOM(e2) {
    return e2.__height !== this.__height;
  }
  canBeEmpty() {
    return false;
  }
  canIndent() {
    return false;
  }
}
function me(e2) {
  const t2 = e2;
  let n2;
  return ne.test(t2.style.height) && (n2 = parseFloat(t2.style.height)), { node: pe(n2) };
}
function pe(e2) {
  return gn(new fe(e2));
}
function Ce(e2) {
  return e2 instanceof fe;
}
function Se(e2, t2, n2 = true) {
  const o2 = At();
  for (let r = 0; r < e2; r++) {
    const e3 = pe();
    for (let o3 = 0; o3 < t2; o3++) {
      let t3 = oe.NO_STATUS;
      "object" == typeof n2 ? (0 === r && n2.rows && (t3 |= oe.ROW), 0 === o3 && n2.columns && (t3 |= oe.COLUMN)) : n2 && (0 === r && (t3 |= oe.ROW), 0 === o3 && (t3 |= oe.COLUMN));
      const l2 = se(t3), s = zs();
      s.append(di()), l2.append(s), e3.append(l2);
    }
    o2.append(e3);
  }
  return o2;
}
function He(e2, t2, n2) {
  const [o2, r, l2] = Pe(e2, t2, n2);
  return null === r && ue(207), null === l2 && ue(208), [o2, r, l2];
}
function Pe(e2, t2, n2) {
  const o2 = [];
  let r = null, l2 = null;
  function s(e3) {
    let t3 = o2[e3];
    return void 0 === t3 && (o2[e3] = t3 = []), t3;
  }
  const i2 = e2.getChildren();
  for (let e3 = 0; e3 < i2.length; e3++) {
    const o3 = i2[e3];
    Ce(o3) || ue(209);
    for (let c = o3.getFirstChild(), a = 0; null != c; c = c.getNextSibling()) {
      ie(c) || ue(147);
      const o4 = s(e3);
      for (; void 0 !== o4[a]; ) a++;
      const u2 = { cell: c, startColumn: a, startRow: e3 }, { __rowSpan: h, __colSpan: d2 } = c;
      for (let t3 = 0; t3 < h && !(e3 + t3 >= i2.length); t3++) {
        const n3 = s(e3 + t3);
        for (let e4 = 0; e4 < d2; e4++) n3[a + e4] = u2;
      }
      null !== t2 && null === r && t2.is(c) && (r = u2), null !== n2 && null === l2 && n2.is(c) && (l2 = u2);
    }
  }
  return [o2, r, l2];
}
function Be(e2) {
  let n2;
  if (e2 instanceof re) n2 = e2;
  else if ("__type" in e2) {
    const o3 = oe$1(e2, ie);
    ie(o3) || ue(148), n2 = o3;
  } else {
    const o3 = oe$1(e2.getNode(), ie);
    ie(o3) || ue(148), n2 = o3;
  }
  const o2 = n2.getParent();
  Ce(o2) || ue(149);
  const r = o2.getParent();
  return $t(r) || ue(210), [n2, o2, r];
}
function Le(e2, t2, n2) {
  let o2 = Math.min(t2.startColumn, n2.startColumn), r = Math.min(t2.startRow, n2.startRow), l2 = Math.max(t2.startColumn + t2.cell.__colSpan - 1, n2.startColumn + n2.cell.__colSpan - 1), s = Math.max(t2.startRow + t2.cell.__rowSpan - 1, n2.startRow + n2.cell.__rowSpan - 1), i2 = o2, c = r, a = o2, u2 = r;
  function h(e3) {
    const { cell: t3, startColumn: n3, startRow: i3 } = e3;
    o2 = Math.min(o2, n3), r = Math.min(r, i3), l2 = Math.max(l2, n3 + t3.__colSpan - 1), s = Math.max(s, i3 + t3.__rowSpan - 1);
  }
  for (; o2 < i2 || r < c || l2 > a || s > u2; ) {
    if (o2 < i2) {
      const t3 = u2 - c, n3 = i2 - 1;
      for (let o3 = 0; o3 <= t3; o3++) h(e2[c + o3][n3]);
      i2 = n3;
    }
    if (r < c) {
      const t3 = a - i2, n3 = c - 1;
      for (let o3 = 0; o3 <= t3; o3++) h(e2[n3][i2 + o3]);
      c = n3;
    }
    if (l2 > a) {
      const t3 = u2 - c, n3 = a + 1;
      for (let o3 = 0; o3 <= t3; o3++) h(e2[c + o3][n3]);
      a = n3;
    }
    if (s > u2) {
      const t3 = a - i2, n3 = u2 + 1;
      for (let o3 = 0; o3 <= t3; o3++) h(e2[n3][i2 + o3]);
      u2 = n3;
    }
  }
  return { maxColumn: l2, maxRow: s, minColumn: o2, minRow: r };
}
function De(e2) {
  const [t2, , n2] = Be(e2), o2 = n2.getChildren(), r = o2.length, l2 = o2[0].getChildren().length, s = new Array(r);
  for (let e3 = 0; e3 < r; e3++) s[e3] = new Array(l2);
  for (let e3 = 0; e3 < r; e3++) {
    const n3 = o2[e3].getChildren();
    let r2 = 0;
    for (let o3 = 0; o3 < n3.length; o3++) {
      for (; s[e3][r2]; ) r2++;
      const l3 = n3[o3], i2 = l3.__rowSpan || 1, c = l3.__colSpan || 1;
      for (let t3 = 0; t3 < i2; t3++) for (let n4 = 0; n4 < c; n4++) s[e3 + t3][r2 + n4] = l3;
      if (t2 === l3) return { colSpan: c, columnIndex: r2, rowIndex: e3, rowSpan: i2 };
      r2 += c;
    }
  }
  return null;
}
function Ie(e2) {
  const [[n2, o2, r, l2], [s, i2, c, a]] = ["anchor", "focus"].map(((n3) => {
    const o3 = e2[n3].getNode(), r2 = oe$1(o3, ie);
    ie(r2) || ue(238, n3, o3.getKey(), o3.getType());
    const l3 = r2.getParent();
    Ce(l3) || ue(239, n3);
    const s2 = l3.getParent();
    return $t(s2) || ue(240, n3), [o3, r2, l3, s2];
  }));
  return l2.is(a) || ue(241), { anchorCell: o2, anchorNode: n2, anchorRow: r, anchorTable: l2, focusCell: i2, focusNode: s, focusRow: c, focusTable: a };
}
class Ue {
  constructor(e2, t2, n2) {
    this.anchor = t2, this.focus = n2, t2._selection = this, n2._selection = this, this._cachedNodes = null, this.dirty = false, this.tableKey = e2;
  }
  getStartEndPoints() {
    return [this.anchor, this.focus];
  }
  isValid() {
    return "root" !== this.tableKey && "root" !== this.anchor.key && "element" === this.anchor.type && "root" !== this.focus.key && "element" === this.focus.type;
  }
  isBackward() {
    return this.focus.isBefore(this.anchor);
  }
  getCachedNodes() {
    return this._cachedNodes;
  }
  setCachedNodes(e2) {
    this._cachedNodes = e2;
  }
  is(e2) {
    return ze(e2) && this.tableKey === e2.tableKey && this.anchor.is(e2.anchor) && this.focus.is(e2.focus);
  }
  set(e2, t2, n2) {
    this.dirty = this.dirty || e2 !== this.tableKey || t2 !== this.anchor.key || n2 !== this.focus.key, this.tableKey = e2, this.anchor.key = t2, this.focus.key = n2, this._cachedNodes = null;
  }
  clone() {
    return new Ue(this.tableKey, xi(this.anchor.key, this.anchor.offset, this.anchor.type), xi(this.focus.key, this.focus.offset, this.focus.type));
  }
  isCollapsed() {
    return false;
  }
  extract() {
    return this.getNodes();
  }
  insertRawText(e2) {
  }
  insertText() {
  }
  hasFormat(e2) {
    let t2 = 0;
    this.getNodes().filter(ie).forEach(((e3) => {
      const n3 = e3.getFirstChild();
      Ws(n3) && (t2 |= n3.getTextFormat());
    }));
    const n2 = De$1[e2];
    return !!(t2 & n2);
  }
  insertNodes(e2) {
    const t2 = this.focus.getNode();
    bs(t2) || ue(151);
    nt$1(t2.select(0, t2.getChildrenSize())).insertNodes(e2);
  }
  getShape() {
    const { anchorCell: e2, focusCell: t2 } = Ie(this), n2 = De(e2);
    null === n2 && ue(153);
    const o2 = De(t2);
    null === o2 && ue(155);
    const r = Math.min(n2.columnIndex, o2.columnIndex), l2 = Math.max(n2.columnIndex + n2.colSpan - 1, o2.columnIndex + o2.colSpan - 1), s = Math.min(n2.rowIndex, o2.rowIndex), i2 = Math.max(n2.rowIndex + n2.rowSpan - 1, o2.rowIndex + o2.rowSpan - 1);
    return { fromX: Math.min(r, l2), fromY: Math.min(s, i2), toX: Math.max(r, l2), toY: Math.max(s, i2) };
  }
  getNodes() {
    if (!this.isValid()) return [];
    const e2 = this._cachedNodes;
    if (null !== e2) return e2;
    const { anchorTable: t2, anchorCell: n2, focusCell: o2 } = Ie(this), r = o2.getParents()[1];
    if (r !== t2) {
      if (t2.isParentOf(o2)) {
        const e3 = r.getParent();
        null == e3 && ue(159), this.set(this.tableKey, o2.getKey(), e3.getKey());
      } else {
        const e3 = t2.getParent();
        null == e3 && ue(158), this.set(this.tableKey, e3.getKey(), o2.getKey());
      }
      return this.getNodes();
    }
    const [l2, s, i2] = He(t2, n2, o2), { minColumn: c, maxColumn: a, minRow: u2, maxRow: h } = Le(l2, s, i2), d2 = /* @__PURE__ */ new Map([[t2.getKey(), t2]]);
    let g = null;
    for (let e3 = u2; e3 <= h; e3++) for (let t3 = c; t3 <= a; t3++) {
      const { cell: n3 } = l2[e3][t3], o3 = n3.getParent();
      Ce(o3) || ue(160), o3 !== g && (d2.set(o3.getKey(), o3), g = o3), d2.has(n3.getKey()) || qe(n3, ((e4) => {
        d2.set(e4.getKey(), e4);
      }));
    }
    const f2 = Array.from(d2.values());
    return rs() || (this._cachedNodes = f2), f2;
  }
  getTextContent() {
    const e2 = this.getNodes().filter(((e3) => ie(e3)));
    let t2 = "";
    for (let n2 = 0; n2 < e2.length; n2++) {
      const o2 = e2[n2], r = o2.__parent, l2 = (e2[n2 + 1] || {}).__parent;
      t2 += o2.getTextContent() + (l2 !== r ? "\n" : "	");
    }
    return t2;
  }
}
function ze(e2) {
  return e2 instanceof Ue;
}
function Ye() {
  const e2 = xi("root", 0, "element"), t2 = xi("root", 0, "element");
  return new Ue("root", e2, t2);
}
function qe(e2, t2) {
  const n2 = [[e2]];
  for (let e3 = n2.at(-1); void 0 !== e3 && n2.length > 0; e3 = n2.at(-1)) {
    const o2 = e3.pop();
    void 0 === o2 ? n2.pop() : false !== t2(o2) && bs(o2) && n2.push(o2.getChildren());
  }
}
function Xe(e2, t2 = Pn()) {
  const n2 = Ct$1(e2);
  $t(n2) || ue(231, e2);
  const o2 = Ve(n2, t2.getElementByKey(e2));
  return null === o2 && ue(232, e2), { tableElement: o2, tableNode: n2 };
}
class Je {
  constructor(e2, t2) {
    this.isHighlightingCells = false, this.anchorX = -1, this.anchorY = -1, this.focusX = -1, this.focusY = -1, this.listenersToRemove = /* @__PURE__ */ new Set(), this.tableNodeKey = t2, this.editor = e2, this.table = { columns: 0, domRows: [], rows: 0 }, this.tableSelection = null, this.anchorCellNodeKey = null, this.focusCellNodeKey = null, this.anchorCell = null, this.focusCell = null, this.hasHijackedSelectionStyles = false, this.isSelecting = false, this.shouldCheckSelection = false, this.abortController = new AbortController(), this.listenerOptions = { signal: this.abortController.signal }, this.nextFocus = null, this.trackTable();
  }
  getTable() {
    return this.table;
  }
  removeListeners() {
    this.abortController.abort("removeListeners"), Array.from(this.listenersToRemove).forEach(((e2) => e2())), this.listenersToRemove.clear();
  }
  $lookup() {
    return Xe(this.tableNodeKey, this.editor);
  }
  trackTable() {
    const e2 = new MutationObserver(((e3) => {
      this.editor.getEditorState().read((() => {
        let t2 = false;
        for (let n3 = 0; n3 < e3.length; n3++) {
          const o3 = e3[n3].target.nodeName;
          if ("TABLE" === o3 || "TBODY" === o3 || "THEAD" === o3 || "TR" === o3) {
            t2 = true;
            break;
          }
        }
        if (!t2) return;
        const { tableNode: n2, tableElement: o2 } = this.$lookup();
        this.table = lt(n2, o2);
      }), { editor: this.editor });
    }));
    this.editor.getEditorState().read((() => {
      const { tableNode: t2, tableElement: n2 } = this.$lookup();
      this.table = lt(t2, n2), e2.observe(n2, { attributes: true, childList: true, subtree: true });
    }), { editor: this.editor });
  }
  $clearHighlight() {
    const e2 = this.editor;
    this.isHighlightingCells = false, this.anchorX = -1, this.anchorY = -1, this.focusX = -1, this.focusY = -1, this.tableSelection = null, this.anchorCellNodeKey = null, this.focusCellNodeKey = null, this.anchorCell = null, this.focusCell = null, this.hasHijackedSelectionStyles = false, this.$enableHighlightStyle();
    const { tableNode: t$1, tableElement: n2 } = this.$lookup();
    st(e2, lt(t$1, n2), null), null !== Ri() && (Ft$1(null), e2.dispatchCommand(t, void 0));
  }
  $enableHighlightStyle() {
    const e2 = this.editor, { tableElement: t2 } = this.$lookup();
    j(t2, e2._config.theme.tableSelection), t2.classList.remove("disable-selection"), this.hasHijackedSelectionStyles = false;
  }
  $disableHighlightStyle() {
    const { tableElement: t2 } = this.$lookup();
    W(t2, this.editor._config.theme.tableSelection), this.hasHijackedSelectionStyles = true;
  }
  $updateTableTableSelection(e2) {
    if (null !== e2) {
      e2.tableKey !== this.tableNodeKey && ue(233, e2.tableKey, this.tableNodeKey);
      const t2 = this.editor;
      this.tableSelection = e2, this.isHighlightingCells = true, this.$disableHighlightStyle(), this.updateDOMSelection(), st(t2, this.table, this.tableSelection);
    } else this.$clearHighlight();
  }
  setShouldCheckSelection() {
    this.shouldCheckSelection = true;
  }
  getAndClearShouldCheckSelection() {
    return !!this.shouldCheckSelection && (this.shouldCheckSelection = false, true);
  }
  setNextFocus(e2) {
    this.nextFocus = e2;
  }
  getAndClearNextFocus() {
    const { nextFocus: e2 } = this;
    return null !== e2 && (this.nextFocus = null), e2;
  }
  updateDOMSelection() {
    if (null !== this.anchorCell && null !== this.focusCell) {
      const e2 = vn(this.editor._window);
      e2 && e2.rangeCount > 0 && e2.removeAllRanges();
    }
  }
  $setFocusCellForSelection(e2, t$1 = false) {
    const n2 = this.editor, { tableNode: o2 } = this.$lookup(), r = e2.x, l2 = e2.y;
    if (this.focusCell = e2, this.isHighlightingCells || this.anchorX === r && this.anchorY === l2 && !t$1) {
      if (r === this.focusX && l2 === this.focusY) return false;
    } else this.isHighlightingCells = true, this.$disableHighlightStyle();
    if (this.focusX = r, this.focusY = l2, this.isHighlightingCells) {
      const t$12 = Tt(o2, e2.elem);
      if (null != this.tableSelection && null != this.anchorCellNodeKey && null !== t$12) return this.focusCellNodeKey = t$12.getKey(), this.tableSelection = (function(e3, t2, n3) {
        e3.getKey(), t2.getKey(), n3.getKey();
        const o3 = Ri(), r2 = ze(o3) ? o3.clone() : Ye();
        return r2.set(e3.getKey(), t2.getKey(), n3.getKey()), r2;
      })(o2, this.$getAnchorTableCellOrThrow(), t$12), Ft$1(this.tableSelection), n2.dispatchCommand(t, void 0), st(n2, this.table, this.tableSelection), true;
    }
    return false;
  }
  $getAnchorTableCell() {
    return this.anchorCellNodeKey ? Ct$1(this.anchorCellNodeKey) : null;
  }
  $getAnchorTableCellOrThrow() {
    const e2 = this.$getAnchorTableCell();
    return null === e2 && ue(234), e2;
  }
  $getFocusTableCell() {
    return this.focusCellNodeKey ? Ct$1(this.focusCellNodeKey) : null;
  }
  $getFocusTableCellOrThrow() {
    const e2 = this.$getFocusTableCell();
    return null === e2 && ue(235), e2;
  }
  $setAnchorCellForSelection(e2) {
    this.isHighlightingCells = false, this.anchorCell = e2, this.anchorX = e2.x, this.anchorY = e2.y;
    const { tableNode: t2 } = this.$lookup(), n2 = Tt(t2, e2.elem);
    if (null !== n2) {
      const e3 = n2.getKey();
      this.tableSelection = null != this.tableSelection ? this.tableSelection.clone() : Ye(), this.anchorCellNodeKey = e3;
    }
  }
  $formatCells(e2) {
    const t$1 = Ri();
    ze(t$1) || ue(236);
    const n2 = Ai(), o2 = n2.anchor, r = n2.focus, l2 = t$1.getNodes().filter(ie);
    l2.length > 0 || ue(237);
    const s = l2[0].getFirstChild(), i2 = Ws(s) ? s.getFormatFlags(e2, null) : null;
    l2.forEach(((t2) => {
      o2.set(t2.getKey(), 0, "element"), r.set(t2.getKey(), t2.getChildrenSize(), "element"), n2.formatText(e2, i2);
    })), Ft$1(t$1), this.editor.dispatchCommand(t, void 0);
  }
  $clearText() {
    const { editor: e2 } = this, t$1 = Ct$1(this.tableNodeKey);
    if (!$t(t$1)) throw new Error("Expected TableNode.");
    const n2 = Ri();
    ze(n2) || ue(11);
    const o2 = n2.getNodes().filter(ie);
    if (o2.length !== this.table.columns * this.table.rows) o2.forEach(((e3) => {
      if (bs(e3)) {
        const t2 = zs(), n3 = di();
        t2.append(n3), e3.append(t2), e3.getChildren().forEach(((e4) => {
          e4 !== t2 && e4.remove();
        }));
      }
    })), st(e2, this.table, null), Ft$1(null), e2.dispatchCommand(t, void 0);
    else {
      t$1.selectPrevious(), t$1.remove();
      Et().selectStart();
    }
  }
}
const je = "__lexicalTableSelection";
function Ve(e2, t2) {
  if (!t2) return t2;
  const n2 = "TABLE" === t2.nodeName ? t2 : e2.getDOMSlot(t2).element;
  return "TABLE" !== n2.nodeName && ue(245, t2.nodeName), n2;
}
function Ge(e2) {
  return e2._window;
}
function Qe(e2, t2) {
  for (let n2 = t2, o2 = null; null !== n2; n2 = n2.getParent()) {
    if (e2.is(n2)) return o2;
    ie(n2) && (o2 = n2);
  }
  return null;
}
const Ze = [[S, "down"], [v, "up"], [m, "backward"], [p, "forward"]], et = [u, f, i], tt = [k, w];
function nt(e2, n$1, r, l$1) {
  const s = r.getRootElement(), a = Ge(r);
  null !== s && null !== a || ue(246);
  const h = new Je(r, e2.getKey()), d$1 = Ve(e2, n$1);
  !(function(e3, t2) {
    null !== ot(e3) && ue(205);
    e3[je] = t2;
  })(d$1, h), h.listenersToRemove.add((() => (function(e3, t2) {
    ot(e3) === t2 && delete e3[je];
  })(d$1, h)));
  d$1.addEventListener("mousedown", ((t$1) => {
    if (0 !== t$1.button) return;
    if (!a) return;
    const n2 = rt(t$1.target);
    null !== n2 && r.update((() => {
      const o2 = Ki();
      if (ge && t$1.shiftKey && ft(o2, e2) && (ki(o2) || ze(o2))) {
        const r2 = o2.anchor.getNode(), l2 = Qe(e2, o2.anchor.getNode());
        if (l2) h.$setAnchorCellForSelection(xt(h, l2)), h.$setFocusCellForSelection(n2), bt(t$1);
        else {
          (e2.isBefore(r2) ? e2.selectStart() : e2.selectEnd()).anchor.set(o2.anchor.key, o2.anchor.offset, o2.anchor.type);
        }
      } else h.$setAnchorCellForSelection(n2);
    })), (() => {
      if (h.isSelecting) return;
      const e3 = () => {
        h.isSelecting = false, a.removeEventListener("mouseup", e3), a.removeEventListener("mousemove", t$12);
      }, t$12 = (n3) => {
        if (1 & ~n3.buttons && h.isSelecting) return h.isSelecting = false, a.removeEventListener("mouseup", e3), void a.removeEventListener("mousemove", t$12);
        const o2 = !d$1.contains(n3.target);
        let l2 = null;
        if (o2) {
          for (const e4 of document.elementsFromPoint(n3.clientX, n3.clientY)) if (l2 = d$1.contains(e4) ? rt(e4) : null, l2) break;
        } else l2 = rt(n3.target);
        !l2 || null !== h.focusCell && l2.elem === h.focusCell.elem || (h.setNextFocus({ focusCell: l2, override: o2 }), r.dispatchCommand(t, void 0));
      };
      h.isSelecting = true, a.addEventListener("mouseup", e3, h.listenerOptions), a.addEventListener("mousemove", t$12, h.listenerOptions);
    })();
  }), h.listenerOptions);
  a.addEventListener("mousedown", ((e3) => {
    0 === e3.button && r.update((() => {
      const t2 = Ri(), n2 = e3.target;
      ze(t2) && t2.tableKey === h.tableNodeKey && s.contains(n2) && h.$clearHighlight();
    }));
  }), h.listenerOptions);
  for (const [t2, n2] of Ze) h.listenersToRemove.add(r.registerCommand(t2, ((t3) => wt(r, t3, n2, e2, h)), $s));
  h.listenersToRemove.add(r.registerCommand(b, ((t2) => {
    const n2 = Ri();
    if (ze(n2)) {
      const o2 = Qe(e2, n2.focus.getNode());
      if (null !== o2) return bt(t2), o2.selectEnd(), true;
    }
    return false;
  }), $s));
  const p2 = (n2) => () => {
    const o2 = Ri();
    if (!ft(o2, e2)) return false;
    if (ze(o2)) return h.$clearText(), true;
    if (ki(o2)) {
      if (!ie(Qe(e2, o2.anchor.getNode()))) return false;
      const r2 = o2.anchor.getNode(), l2 = o2.focus.getNode(), s2 = e2.isParentOf(r2), i2 = e2.isParentOf(l2);
      if (s2 && !i2 || i2 && !s2) return h.$clearText(), true;
      const a2 = oe$1(o2.anchor.getNode(), ((e3) => bs(e3))), u2 = a2 && oe$1(a2, ((e3) => bs(e3) && ie(e3.getParent())));
      if (!bs(u2) || !bs(a2)) return false;
      if (n2 === f && null === u2.getPreviousSibling()) return true;
    }
    return false;
  };
  for (const e3 of et) h.listenersToRemove.add(r.registerCommand(e3, p2(e3), Us));
  const C = (t2) => {
    const n2 = Ri();
    if (!ze(n2) && !ki(n2)) return false;
    const o2 = e2.isParentOf(n2.anchor.getNode());
    if (o2 !== e2.isParentOf(n2.focus.getNode())) {
      const t3 = o2 ? "anchor" : "focus", r2 = o2 ? "focus" : "anchor", { key: l2, offset: s2, type: i2 } = n2[r2];
      return e2[n2[t3].isBefore(n2[r2]) ? "selectPrevious" : "selectNext"]()[r2].set(l2, s2, i2), false;
    }
    return !!ze(n2) && (t2 && (t2.preventDefault(), t2.stopPropagation()), h.$clearText(), true);
  };
  for (const e3 of tt) h.listenersToRemove.add(r.registerCommand(e3, C, Us));
  return h.listenersToRemove.add(r.registerCommand(B, ((e3) => {
    const t2 = Ri();
    if (t2) {
      if (!ze(t2) && !ki(t2)) return false;
      O(r, ue$1(e3, ClipboardEvent) ? e3 : null, L(t2));
      const n2 = C(e3);
      return ki(t2) ? (t2.removeText(), true) : n2;
    }
    return false;
  }), Us)), h.listenersToRemove.add(r.registerCommand(d, ((n2) => {
    const o2 = Ri();
    if (!ft(o2, e2)) return false;
    if (ze(o2)) return h.$formatCells(n2), true;
    if (ki(o2)) {
      const e3 = oe$1(o2.anchor.getNode(), ((e4) => ie(e4)));
      if (!ie(e3)) return false;
    }
    return false;
  }), Us)), h.listenersToRemove.add(r.registerCommand(O$1, ((t2) => {
    const n2 = Ri();
    if (!ze(n2) || !ft(n2, e2)) return false;
    const o2 = n2.anchor.getNode(), r2 = n2.focus.getNode();
    if (!ie(o2) || !ie(r2)) return false;
    const [l2, s2, i2] = He(e2, o2, r2), a2 = Math.max(s2.startRow + s2.cell.__rowSpan - 1, i2.startRow + i2.cell.__rowSpan - 1), u2 = Math.max(s2.startColumn + s2.cell.__colSpan - 1, i2.startColumn + i2.cell.__colSpan - 1), h2 = Math.min(s2.startRow, i2.startRow), d2 = Math.min(s2.startColumn, i2.startColumn), g = /* @__PURE__ */ new Set();
    for (let e3 = h2; e3 <= a2; e3++) for (let n3 = d2; n3 <= u2; n3++) {
      const o3 = l2[e3][n3].cell;
      if (g.has(o3)) continue;
      g.add(o3), o3.setFormat(t2);
      const r3 = o3.getChildren();
      for (let e4 = 0; e4 < r3.length; e4++) {
        const n4 = r3[e4];
        bs(n4) && !n4.isInline() && n4.setFormat(t2);
      }
    }
    return true;
  }), Us)), h.listenersToRemove.add(r.registerCommand(l, ((n2) => {
    const o2 = Ri();
    if (!ft(o2, e2)) return false;
    if (ze(o2)) return h.$clearHighlight(), false;
    if (ki(o2)) {
      const l2 = oe$1(o2.anchor.getNode(), ((e3) => ie(e3)));
      if (!ie(l2)) return false;
      if ("string" == typeof n2) {
        const t2 = Nt(r, o2, e2);
        if (t2) return yt(t2, e2, [di(n2)]), true;
      }
    }
    return false;
  }), Us)), l$1 && h.listenersToRemove.add(r.registerCommand(N, ((n2) => {
    const o2 = Ri();
    if (!ki(o2) || !o2.isCollapsed() || !ft(o2, e2)) return false;
    const r2 = St(o2.anchor.getNode());
    return !(null === r2 || !e2.is(_t(r2))) && (bt(n2), (function(e3, n3) {
      const o3 = "next" === n3 ? "getNextSibling" : "getPreviousSibling", r3 = "next" === n3 ? "getFirstChild" : "getLastChild", l2 = e3[o3]();
      if (bs(l2)) return l2.selectEnd();
      const s2 = oe$1(e3, Ce);
      null === s2 && ue(247);
      for (let e4 = s2[o3](); Ce(e4); e4 = e4[o3]()) {
        const t2 = e4[r3]();
        if (bs(t2)) return t2.selectEnd();
      }
      const i2 = oe$1(s2, $t);
      null === i2 && ue(248);
      "next" === n3 ? i2.selectNext() : i2.selectPrevious();
    })(r2, n2.shiftKey ? "previous" : "next"), true);
  }), Us)), h.listenersToRemove.add(r.registerCommand($, ((t2) => e2.isSelected()), $s)), h.listenersToRemove.add(r.registerCommand(n, ((e3) => {
    const { nodes: n2, selection: o2 } = e3, r2 = o2.getStartEndPoints(), l2 = ze(o2), s2 = ki(o2) && null !== oe$1(o2.anchor.getNode(), ((e4) => ie(e4))) && null !== oe$1(o2.focus.getNode(), ((e4) => ie(e4))) || l2;
    if (1 !== n2.length || !$t(n2[0]) || !s2 || null === r2) return false;
    const [c] = r2, a2 = n2[0], h2 = a2.getChildren(), d2 = a2.getFirstChildOrThrow().getChildrenSize(), g = a2.getChildrenSize(), f2 = oe$1(c.getNode(), ((e4) => ie(e4))), p3 = f2 && oe$1(f2, ((e4) => Ce(e4))), C2 = p3 && oe$1(p3, ((e4) => $t(e4)));
    if (!ie(f2) || !Ce(p3) || !$t(C2)) return false;
    const S2 = p3.getIndexWithinParent(), _ = Math.min(C2.getChildrenSize() - 1, S2 + g - 1), w2 = f2.getIndexWithinParent(), b2 = Math.min(p3.getChildrenSize() - 1, w2 + d2 - 1), y = Math.min(w2, b2), N2 = Math.min(S2, _), x = Math.max(w2, b2), T = Math.max(S2, _), v2 = C2.getChildren();
    let R = 0;
    for (let e4 = N2; e4 <= T; e4++) {
      const t2 = v2[e4];
      if (!Ce(t2)) return false;
      const n3 = h2[R];
      if (!Ce(n3)) return false;
      const o3 = t2.getChildren(), r3 = n3.getChildren();
      let l3 = 0;
      for (let e5 = y; e5 <= x; e5++) {
        const t3 = o3[e5];
        if (!ie(t3)) return false;
        const n4 = r3[l3];
        if (!ie(n4)) return false;
        const s3 = t3.getChildren();
        n4.getChildren().forEach(((e6) => {
          if (hi(e6)) {
            zs().append(e6), t3.append(e6);
          } else t3.append(e6);
        })), s3.forEach(((e6) => e6.remove())), l3++;
      }
      R++;
    }
    return true;
  }), Us)), h.listenersToRemove.add(r.registerCommand(t, (() => {
    const n2 = Ri(), o2 = Ki(), l2 = h.getAndClearNextFocus();
    if (null !== l2) {
      const { focusCell: t2 } = l2;
      if (ze(n2) && n2.tableKey === h.tableNodeKey) return (t2.x !== h.focusX || t2.y !== h.focusY) && (h.$setFocusCellForSelection(t2), true);
      if (t2 !== h.anchorCell && ft(n2, e2)) return h.$setFocusCellForSelection(t2), true;
    }
    if (h.getAndClearShouldCheckSelection() && ki(o2) && ki(n2) && n2.isCollapsed()) {
      const o3 = n2.anchor.getNode(), r2 = e2.getFirstChild(), l3 = St(o3);
      if (null !== l3 && Ce(r2)) {
        const n3 = r2.getFirstChild();
        if (ie(n3) && e2.is(oe$1(l3, ((t2) => t2.is(e2) || t2.is(n3))))) return n3.selectStart(), true;
      }
    }
    if (ki(n2)) {
      const { anchor: t2, focus: o3 } = n2, l3 = t2.getNode(), s2 = o3.getNode(), i2 = St(l3), c = St(s2), a2 = !(!i2 || !e2.is(_t(i2))), u2 = !(!c || !e2.is(_t(c))), d2 = a2 !== u2, g = a2 && u2, f2 = n2.isBackward();
      if (d2) {
        const t3 = n2.clone();
        if (u2) {
          const [n3] = He(e2, c, c), o4 = n3[0][0].cell, r2 = n3[n3.length - 1].at(-1).cell;
          t3.focus.set(f2 ? o4.getKey() : r2.getKey(), f2 ? o4.getChildrenSize() : r2.getChildrenSize(), "element");
        } else if (a2) {
          const [n3] = He(e2, i2, i2), o4 = n3[0][0].cell, r2 = n3[n3.length - 1].at(-1).cell;
          t3.anchor.set(f2 ? r2.getKey() : o4.getKey(), f2 ? r2.getChildrenSize() : 0, "element");
        }
        Ft$1(t3), ct(r, h);
      } else g && (i2.is(c) || (h.$setAnchorCellForSelection(xt(h, i2)), h.$setFocusCellForSelection(xt(h, c), true)));
    } else if (n2 && ze(n2) && n2.is(o2) && n2.tableKey === e2.getKey()) {
      const t2 = vn(a);
      if (t2 && t2.anchorNode && t2.focusNode) {
        const o3 = bt$1(t2.focusNode), l3 = o3 && !e2.isParentOf(o3), s2 = bt$1(t2.anchorNode), i2 = s2 && e2.isParentOf(s2);
        if (l3 && i2 && t2.rangeCount > 0) {
          const o4 = zi(t2, r);
          o4 && (o4.anchor.set(e2.getKey(), n2.isBackward() ? e2.getChildrenSize() : 0, "element"), t2.removeAllRanges(), Ft$1(o4));
        }
      }
    }
    return n2 && !n2.is(o2) && (ze(n2) || ze(o2)) && h.tableSelection && !h.tableSelection.is(o2) ? (ze(n2) && n2.tableKey === h.tableNodeKey ? h.$updateTableTableSelection(n2) : !ze(n2) && ze(o2) && o2.tableKey === h.tableNodeKey && h.$updateTableTableSelection(null), false) : (h.hasHijackedSelectionStyles && !e2.isSelected() ? (function(e3, t2) {
      t2.$enableHighlightStyle(), it(t2.table, ((t3) => {
        const n3 = t3.elem;
        t3.highlighted = false, Ct(e3, t3), n3.getAttribute("style") || n3.removeAttribute("style");
      }));
    })(r, h) : !h.hasHijackedSelectionStyles && e2.isSelected() && ct(r, h), false);
  }), Us)), h.listenersToRemove.add(r.registerCommand(o, (() => {
    const t2 = Ri();
    if (!ki(t2) || !t2.isCollapsed() || !ft(t2, e2)) return false;
    const n2 = Nt(r, t2, e2);
    return !!n2 && (yt(n2, e2), true);
  }), Us)), h;
}
function ot(e2) {
  return e2[je] || null;
}
function rt(e2) {
  let t2 = e2;
  for (; null != t2; ) {
    const e3 = t2.nodeName;
    if ("TD" === e3 || "TH" === e3) {
      const e4 = t2._cell;
      return void 0 === e4 ? null : e4;
    }
    t2 = t2.parentNode;
  }
  return null;
}
function lt(e2, t2) {
  const n2 = [], o2 = { columns: 0, domRows: n2, rows: 0 };
  let r = Ve(e2, t2).querySelector("tr"), l2 = 0, s = 0;
  for (n2.length = 0; null != r; ) {
    const e3 = r.nodeName;
    if ("TD" === e3 || "TH" === e3) {
      const e4 = { elem: r, hasBackgroundColor: "" !== r.style.backgroundColor, highlighted: false, x: l2, y: s };
      r._cell = e4;
      let t4 = n2[s];
      void 0 === t4 && (t4 = n2[s] = []), t4[l2] = e4;
    } else {
      const e4 = r.firstChild;
      if (null != e4) {
        r = e4;
        continue;
      }
    }
    const t3 = r.nextSibling;
    if (null != t3) {
      l2++, r = t3;
      continue;
    }
    const o3 = r.parentNode;
    if (null != o3) {
      const e4 = o3.nextSibling;
      if (null == e4) break;
      s++, l2 = 0, r = e4;
    }
  }
  return o2.columns = l2 + 1, o2.rows = s + 1, o2;
}
function st(e2, t2, n2) {
  const o2 = new Set(n2 ? n2.getNodes() : []);
  it(t2, ((t3, n3) => {
    const r = t3.elem;
    o2.has(n3) ? (t3.highlighted = true, pt(e2, t3)) : (t3.highlighted = false, Ct(e2, t3), r.getAttribute("style") || r.removeAttribute("style"));
  }));
}
function it(e2, t2) {
  const { domRows: n2 } = e2;
  for (let e3 = 0; e3 < n2.length; e3++) {
    const o2 = n2[e3];
    if (o2) for (let n3 = 0; n3 < o2.length; n3++) {
      const r = o2[n3];
      if (!r) continue;
      const l2 = bt$1(r.elem);
      null !== l2 && t2(r, l2, { x: n3, y: e3 });
    }
  }
}
function ct(e2, t2) {
  t2.$disableHighlightStyle(), it(t2.table, ((t3) => {
    t3.highlighted = true, pt(e2, t3);
  }));
}
const at = (e2, t2, n2, o2, r) => {
  const l2 = "forward" === r;
  switch (r) {
    case "backward":
    case "forward":
      return n2 !== (l2 ? e2.table.columns - 1 : 0) ? mt(t2.getCellNodeFromCordsOrThrow(n2 + (l2 ? 1 : -1), o2, e2.table), l2) : o2 !== (l2 ? e2.table.rows - 1 : 0) ? mt(t2.getCellNodeFromCordsOrThrow(l2 ? 0 : e2.table.columns - 1, o2 + (l2 ? 1 : -1), e2.table), l2) : l2 ? t2.selectNext() : t2.selectPrevious(), true;
    case "up":
      return 0 !== o2 ? mt(t2.getCellNodeFromCordsOrThrow(n2, o2 - 1, e2.table), false) : t2.selectPrevious(), true;
    case "down":
      return o2 !== e2.table.rows - 1 ? mt(t2.getCellNodeFromCordsOrThrow(n2, o2 + 1, e2.table), true) : t2.selectNext(), true;
    default:
      return false;
  }
};
function ut(e2, t2) {
  let n2, o2;
  if (t2.startColumn === e2.minColumn) n2 = "minColumn";
  else {
    if (t2.startColumn + t2.cell.__colSpan - 1 !== e2.maxColumn) return null;
    n2 = "maxColumn";
  }
  if (t2.startRow === e2.minRow) o2 = "minRow";
  else {
    if (t2.startRow + t2.cell.__rowSpan - 1 !== e2.maxRow) return null;
    o2 = "maxRow";
  }
  return [n2, o2];
}
function ht([e2, t2]) {
  return ["minColumn" === e2 ? "maxColumn" : "minColumn", "minRow" === t2 ? "maxRow" : "minRow"];
}
function dt(e2, t2, [n2, o2]) {
  const r = t2[o2], l2 = e2[r];
  void 0 === l2 && ue(250, o2, String(r));
  const s = t2[n2], i2 = l2[s];
  return void 0 === i2 && ue(250, n2, String(s)), i2;
}
function gt(e2, t2, n2, o2, r) {
  const l2 = Le(t2, n2, o2), s = (function(e3, t3) {
    const { minColumn: n3, maxColumn: o3, minRow: r2, maxRow: l3 } = t3;
    let s2 = 1, i3 = 1, c2 = 1, a2 = 1;
    const u3 = e3[r2], h2 = e3[l3];
    for (let e4 = n3; e4 <= o3; e4++) s2 = Math.max(s2, u3[e4].cell.__rowSpan), a2 = Math.max(a2, h2[e4].cell.__rowSpan);
    for (let t4 = r2; t4 <= l3; t4++) i3 = Math.max(i3, e3[t4][n3].cell.__colSpan), c2 = Math.max(c2, e3[t4][o3].cell.__colSpan);
    return { bottomSpan: a2, leftSpan: i3, rightSpan: c2, topSpan: s2 };
  })(t2, l2), { topSpan: i2, leftSpan: c, bottomSpan: a, rightSpan: u2 } = s, h = (function(e3, t3) {
    const n3 = ut(e3, t3);
    return null === n3 && ue(249, t3.cell.getKey()), n3;
  })(l2, n2), [d2, g] = ht(h);
  let f2 = l2[d2], m2 = l2[g];
  "forward" === r ? f2 += "maxColumn" === d2 ? 1 : c : "backward" === r ? f2 -= "minColumn" === d2 ? 1 : u2 : "down" === r ? m2 += "maxRow" === g ? 1 : i2 : "up" === r && (m2 -= "minRow" === g ? 1 : a);
  const p2 = t2[m2];
  if (void 0 === p2) return false;
  const C = p2[f2];
  if (void 0 === C) return false;
  const [S2, _] = (function(e3, t3, n3) {
    const o3 = Le(e3, t3, n3), r2 = ut(o3, t3);
    if (r2) return [dt(e3, o3, r2), dt(e3, o3, ht(r2))];
    const l3 = ut(o3, n3);
    if (l3) return [dt(e3, o3, ht(l3)), dt(e3, o3, l3)];
    const s2 = ["minColumn", "minRow"];
    return [dt(e3, o3, s2), dt(e3, o3, ht(s2))];
  })(t2, n2, C), w2 = xt(e2, S2.cell), b2 = xt(e2, _.cell);
  return e2.$setAnchorCellForSelection(w2), e2.$setFocusCellForSelection(b2, true), true;
}
function ft(e2, t2) {
  if (ki(e2) || ze(e2)) {
    const n2 = t2.isParentOf(e2.anchor.getNode()), o2 = t2.isParentOf(e2.focus.getNode());
    return n2 && o2;
  }
  return false;
}
function mt(e2, t2) {
  t2 ? e2.selectStart() : e2.selectEnd();
}
function pt(t2, n2) {
  const o2 = n2.elem, r = t2._config.theme;
  ie(bt$1(o2)) || ue(131), W(o2, r.tableCellSelected);
}
function Ct(e2, t2) {
  const o2 = t2.elem;
  ie(bt$1(o2)) || ue(131);
  const r = e2._config.theme;
  j(o2, r.tableCellSelected);
}
function St(e2) {
  const n2 = oe$1(e2, ie);
  return ie(n2) ? n2 : null;
}
function _t(e2) {
  const n2 = oe$1(e2, $t);
  return $t(n2) ? n2 : null;
}
function wt(e2, n2, o2, r, l2) {
  if (("up" === o2 || "down" === o2) && (function(e3) {
    const t2 = e3.getRootElement();
    if (!t2) return false;
    return t2.hasAttribute("aria-controls") && "typeahead-menu" === t2.getAttribute("aria-controls");
  })(e2)) return false;
  const s = Ri();
  if (!ft(s, r)) {
    if (ki(s)) {
      if ("backward" === o2) {
        if (s.focus.offset > 0) return false;
        const e3 = (function(e4) {
          for (let t3 = e4, n3 = e4; null !== n3; t3 = n3, n3 = n3.getParent()) if (bs(n3)) {
            if (n3 !== t3 && n3.getFirstChild() !== t3) return null;
            if (!n3.isInline()) return n3;
          }
          return null;
        })(s.focus.getNode());
        if (!e3) return false;
        const t2 = e3.getPreviousSibling();
        return !!$t(t2) && (bt(n2), n2.shiftKey ? s.focus.set(t2.getParentOrThrow().getKey(), t2.getIndexWithinParent(), "element") : t2.selectEnd(), true);
      }
      if (n2.shiftKey && ("up" === o2 || "down" === o2)) {
        const e3 = s.focus.getNode();
        if (!s.isCollapsed() && ("up" === o2 && !s.isBackward() || "down" === o2 && s.isBackward())) {
          let l3 = oe$1(e3, ((e4) => $t(e4)));
          if (ie(l3) && (l3 = oe$1(l3, $t)), l3 !== r) return false;
          if (!l3) return false;
          const i2 = "down" === o2 ? l3.getNextSibling() : l3.getPreviousSibling();
          if (!i2) return false;
          let a = 0;
          "up" === o2 && bs(i2) && (a = i2.getChildrenSize());
          let h = i2;
          if ("up" === o2 && bs(i2)) {
            const e4 = i2.getLastChild();
            h = e4 || i2, a = hi(h) ? h.getTextContentSize() : 0;
          }
          const d2 = s.clone();
          return d2.focus.set(h.getKey(), a, hi(h) ? "text" : "element"), Ft$1(d2), bt(n2), true;
        }
        if (dn(e3)) {
          const e4 = "up" === o2 ? s.getNodes()[s.getNodes().length - 1] : s.getNodes()[0];
          if (e4) {
            if (null !== Qe(r, e4)) {
              const e5 = r.getFirstDescendant(), t2 = r.getLastDescendant();
              if (!e5 || !t2) return false;
              const [n3] = Be(e5), [o3] = Be(t2), s2 = r.getCordsFromCellNode(n3, l2.table), i2 = r.getCordsFromCellNode(o3, l2.table), c = r.getDOMCellFromCordsOrThrow(s2.x, s2.y, l2.table), a = r.getDOMCellFromCordsOrThrow(i2.x, i2.y, l2.table);
              return l2.$setAnchorCellForSelection(c), l2.$setFocusCellForSelection(a, true), true;
            }
          }
          return false;
        }
        {
          let r2 = oe$1(e3, ((e4) => bs(e4) && !e4.isInline()));
          if (ie(r2) && (r2 = oe$1(r2, $t)), !r2) return false;
          const i2 = "down" === o2 ? r2.getNextSibling() : r2.getPreviousSibling();
          if ($t(i2) && l2.tableNodeKey === i2.getKey()) {
            const e4 = i2.getFirstDescendant(), t2 = i2.getLastDescendant();
            if (!e4 || !t2) return false;
            const [r3] = Be(e4), [l3] = Be(t2), c = s.clone();
            return c.focus.set(("up" === o2 ? r3 : l3).getKey(), "up" === o2 ? 0 : l3.getChildrenSize(), "element"), bt(n2), Ft$1(c), true;
          }
        }
      }
    }
    return "down" === o2 && Ft(e2) && l2.setShouldCheckSelection(), false;
  }
  if (ki(s) && s.isCollapsed()) {
    const { anchor: i2, focus: a } = s, u2 = oe$1(i2.getNode(), ie), h = oe$1(a.getNode(), ie);
    if (!ie(u2) || !u2.is(h)) return false;
    const d2 = _t(u2);
    if (d2 !== r && null != d2) {
      const t2 = Ve(d2, e2.getElementByKey(d2.getKey()));
      if (null != t2) return l2.table = lt(d2, t2), wt(e2, n2, o2, d2, l2);
    }
    if ("backward" === o2 || "forward" === o2) {
      const e3 = i2.type, l3 = i2.offset, a2 = i2.getNode();
      if (!a2) return false;
      const h2 = s.getNodes();
      return (1 !== h2.length || !Es(h2[0])) && (!!(function(e4, n3, o3, r2) {
        return (function(e5, t2, n4) {
          return "element" === e5 && ("backward" === n4 ? null === t2.getPreviousSibling() : null === t2.getNextSibling());
        })(e4, o3, r2) || (function(e5, n4, o4, r3) {
          const l4 = oe$1(o4, ((e6) => bs(e6) && !e6.isInline()));
          if (!l4) return false;
          const s2 = "backward" === r3 ? 0 === n4 : n4 === o4.getTextContentSize();
          return "text" === e5 && s2 && ("backward" === r3 ? null === l4.getPreviousSibling() : null === l4.getNextSibling());
        })(e4, n3, o3, r2);
      })(e3, l3, a2, o2) && (function(e4, n3, o3, r2, l4) {
        const [s2, i3] = He(r2, o3, o3);
        if (!(function(e5, t2, n4) {
          const o4 = e5[0][0], r3 = e5[e5.length - 1][e5[0].length - 1], { startColumn: l5, startRow: s3 } = t2;
          return "backward" === n4 ? l5 === o4.startColumn && s3 === o4.startRow : l5 === r3.startColumn && s3 === r3.startRow;
        })(s2, i3, l4)) return false;
        const a3 = (function(e5, n4, o4) {
          const r3 = oe$1(e5, ((e6) => bs(e6) && !e6.isInline()));
          if (!r3) return;
          const l5 = "backward" === n4 ? r3.getPreviousSibling() : r3.getNextSibling();
          return l5 && $t(l5) ? l5 : "backward" === n4 ? o4.getPreviousSibling() : o4.getNextSibling();
        })(n3, l4, r2);
        if (!a3 || $t(a3)) return false;
        bt(e4), "backward" === l4 ? a3.selectEnd() : a3.selectStart();
        return true;
      })(n2, a2, u2, r, o2));
    }
    const g = e2.getElementByKey(u2.__key), f2 = e2.getElementByKey(i2.key);
    if (null == f2 || null == g) return false;
    let m2;
    if ("element" === i2.type) m2 = f2.getBoundingClientRect();
    else {
      const t2 = vn(Ge(e2));
      if (null === t2 || 0 === t2.rangeCount) return false;
      m2 = t2.getRangeAt(0).getBoundingClientRect();
    }
    const p2 = "up" === o2 ? u2.getFirstChild() : u2.getLastChild();
    if (null == p2) return false;
    const C = e2.getElementByKey(p2.__key);
    if (null == C) return false;
    const S2 = C.getBoundingClientRect();
    if ("up" === o2 ? S2.top > m2.top - m2.height : m2.bottom + m2.height > S2.bottom) {
      bt(n2);
      const e3 = r.getCordsFromCellNode(u2, l2.table);
      if (!n2.shiftKey) return at(l2, r, e3.x, e3.y, o2);
      {
        const t2 = r.getDOMCellFromCordsOrThrow(e3.x, e3.y, l2.table);
        l2.$setAnchorCellForSelection(t2), l2.$setFocusCellForSelection(t2, true);
      }
      return true;
    }
  } else if (ze(s)) {
    const { anchor: i2, focus: c } = s, a = oe$1(i2.getNode(), ie), u2 = oe$1(c.getNode(), ie), [h] = s.getNodes();
    $t(h) || ue(251);
    const d2 = Ve(h, e2.getElementByKey(h.getKey()));
    if (!ie(a) || !ie(u2) || !$t(h) || null == d2) return false;
    l2.$updateTableTableSelection(s);
    const g = lt(h, d2), f2 = r.getCordsFromCellNode(a, g), m2 = r.getDOMCellFromCordsOrThrow(f2.x, f2.y, g);
    if (l2.$setAnchorCellForSelection(m2), bt(n2), n2.shiftKey) {
      const [e3, t2, n3] = He(r, a, u2);
      return gt(l2, e3, t2, n3, o2);
    }
    return u2.selectEnd(), true;
  }
  return false;
}
function bt(e2) {
  e2.preventDefault(), e2.stopImmediatePropagation(), e2.stopPropagation();
}
function yt(e2, t2, n2) {
  const o2 = zs();
  "first" === e2 ? t2.insertBefore(o2) : t2.insertAfter(o2), o2.append(...n2 || []), o2.selectEnd();
}
function Nt(e2, n2, o2) {
  const r = o2.getParent();
  if (!r) return;
  const l2 = vn(Ge(e2));
  if (!l2) return;
  const s = l2.anchorNode, i2 = e2.getElementByKey(r.getKey()), c = Ve(o2, e2.getElementByKey(o2.getKey()));
  if (!s || !i2 || !c || !i2.contains(s) || c.contains(s)) return;
  const a = oe$1(n2.anchor.getNode(), ((e3) => ie(e3)));
  if (!a) return;
  const u2 = oe$1(a, ((e3) => $t(e3)));
  if (!$t(u2) || !u2.is(o2)) return;
  const [h, d2] = He(o2, a, a), g = h[0][0], f2 = h[h.length - 1][h[0].length - 1], { startRow: m2, startColumn: p2 } = d2, C = m2 === g.startRow && p2 === g.startColumn, S2 = m2 === f2.startRow && p2 === f2.startColumn;
  return C ? "first" : S2 ? "last" : void 0;
}
function xt(e2, t2) {
  const { tableNode: n2 } = e2.$lookup(), o2 = n2.getCordsFromCellNode(t2, e2.table);
  return n2.getDOMCellFromCordsOrThrow(o2.x, o2.y, e2.table);
}
function Tt(e2, t2, n2) {
  return Qe(e2, bt$1(t2, n2));
}
function vt(e2, t2, n2, o2) {
  const r = e2.querySelector("colgroup");
  if (!r) return;
  const l2 = [];
  for (let e3 = 0; e3 < n2; e3++) {
    const t3 = document.createElement("col"), n3 = o2 && o2[e3];
    n3 && (t3.style.width = `${n3}px`), l2.push(t3);
  }
  r.replaceChildren(...l2);
}
function Rt(t2, o2, r) {
  r ? (W(t2, o2.theme.tableRowStriping), t2.setAttribute("data-lexical-row-striping", "true")) : (j(t2, o2.theme.tableRowStriping), t2.removeAttribute("data-lexical-row-striping"));
}
const Ot = /* @__PURE__ */ new WeakSet();
function Ft(e2 = Pn()) {
  return Ot.has(e2);
}
function kt(e2, t2) {
  t2 ? Ot.add(e2) : Ot.delete(e2);
}
class Kt extends ks {
  static getType() {
    return "table";
  }
  getColWidths() {
    return this.getLatest().__colWidths;
  }
  setColWidths(e2) {
    const t2 = this.getWritable();
    return t2.__colWidths = e2, t2;
  }
  static clone(e2) {
    return new Kt(e2.__key);
  }
  afterCloneFrom(e2) {
    super.afterCloneFrom(e2), this.__colWidths = e2.__colWidths, this.__rowStriping = e2.__rowStriping;
  }
  static importDOM() {
    return { table: (e2) => ({ conversion: Mt, priority: 1 }) };
  }
  static importJSON(e2) {
    const t2 = At();
    return t2.__rowStriping = e2.rowStriping || false, t2.__colWidths = e2.colWidths, t2;
  }
  constructor(e2) {
    super(e2), this.__rowStriping = false;
  }
  exportJSON() {
    return { ...super.exportJSON(), colWidths: this.getColWidths(), rowStriping: this.__rowStriping ? this.__rowStriping : void 0, type: "table", version: 1 };
  }
  extractWithChild(e2, t2, n2) {
    return "html" === n2;
  }
  getDOMSlot(e2) {
    const t2 = "TABLE" !== e2.nodeName && e2.querySelector("table") || e2;
    return "TABLE" !== t2.nodeName && ue(229), super.getDOMSlot(t2).withAfter(t2.querySelector("colgroup"));
  }
  createDOM(t2, n2) {
    const o2 = document.createElement("table"), r = document.createElement("colgroup");
    if (o2.appendChild(r), vt(o2, 0, this.getColumnCount(), this.getColWidths()), In(r), W(o2, t2.theme.table), this.__rowStriping && Rt(o2, t2, true), Ft(n2)) {
      const n3 = document.createElement("div"), r2 = t2.theme.tableScrollableWrapper;
      return r2 ? W(n3, r2) : n3.style.cssText = "overflow-x: auto;", n3.appendChild(o2), n3;
    }
    return o2;
  }
  updateDOM(e2, t2, n2) {
    return e2.__rowStriping !== this.__rowStriping && Rt(t2, n2, this.__rowStriping), vt(t2, 0, this.getColumnCount(), this.getColWidths()), false;
  }
  exportDOM(e2) {
    const t2 = super.exportDOM(e2), { element: n2 } = t2;
    return { after: (e3) => {
      if (t2.after && (e3 = t2.after(e3)), e3 && Tn(e3) && "TABLE" !== e3.nodeName && (e3 = e3.querySelector("table")), !e3 || !Tn(e3)) return null;
      const [n3] = Pe(this, null, null), o2 = /* @__PURE__ */ new Map();
      for (const e4 of n3) for (const t3 of e4) {
        const e5 = t3.cell.getKey();
        o2.has(e5) || o2.set(e5, { colSpan: t3.cell.getColSpan(), startColumn: t3.startColumn });
      }
      const l2 = /* @__PURE__ */ new Set();
      for (const t3 of e3.querySelectorAll(":scope > tr > [data-temporary-table-cell-lexical-key]")) {
        const e4 = t3.getAttribute("data-temporary-table-cell-lexical-key");
        if (e4) {
          const n4 = o2.get(e4);
          if (t3.removeAttribute("data-temporary-table-cell-lexical-key"), n4) {
            o2.delete(e4);
            for (let e5 = 0; e5 < n4.colSpan; e5++) l2.add(e5 + n4.startColumn);
          }
        }
      }
      const s = e3.querySelector(":scope > colgroup");
      if (s) {
        const t3 = Array.from(e3.querySelectorAll(":scope > colgroup > col")).filter(((e4, t4) => l2.has(t4)));
        s.replaceChildren(...t3);
      }
      const i2 = e3.querySelectorAll(":scope > tr");
      if (i2.length > 0) {
        const t3 = document.createElement("tbody");
        for (const e4 of i2) t3.appendChild(e4);
        e3.append(t3);
      }
      return e3;
    }, element: n2 && Tn(n2) && "TABLE" !== n2.nodeName ? n2.querySelector("table") : n2 };
  }
  canBeEmpty() {
    return false;
  }
  isShadowRoot() {
    return true;
  }
  getCordsFromCellNode(e2, t2) {
    const { rows: n2, domRows: o2 } = t2;
    for (let t3 = 0; t3 < n2; t3++) {
      const n3 = o2[t3];
      if (null != n3) for (let o3 = 0; o3 < n3.length; o3++) {
        const r = n3[o3];
        if (null == r) continue;
        const { elem: l2 } = r, s = Tt(this, l2);
        if (null !== s && e2.is(s)) return { x: o3, y: t3 };
      }
    }
    throw new Error("Cell not found in table.");
  }
  getDOMCellFromCords(e2, t2, n2) {
    const { domRows: o2 } = n2, r = o2[t2];
    if (null == r) return null;
    const l2 = r[e2 < r.length ? e2 : r.length - 1];
    return null == l2 ? null : l2;
  }
  getDOMCellFromCordsOrThrow(e2, t2, n2) {
    const o2 = this.getDOMCellFromCords(e2, t2, n2);
    if (!o2) throw new Error("Cell not found at cords.");
    return o2;
  }
  getCellNodeFromCords(e2, t2, n2) {
    const o2 = this.getDOMCellFromCords(e2, t2, n2);
    if (null == o2) return null;
    const r = bt$1(o2.elem);
    return ie(r) ? r : null;
  }
  getCellNodeFromCordsOrThrow(e2, t2, n2) {
    const o2 = this.getCellNodeFromCords(e2, t2, n2);
    if (!o2) throw new Error("Node at cords not TableCellNode.");
    return o2;
  }
  getRowStriping() {
    return Boolean(this.getLatest().__rowStriping);
  }
  setRowStriping(e2) {
    this.getWritable().__rowStriping = e2;
  }
  canSelectBefore() {
    return true;
  }
  canIndent() {
    return false;
  }
  getColumnCount() {
    const e2 = this.getFirstChild();
    if (!e2) return 0;
    let t2 = 0;
    return e2.getChildren().forEach(((e3) => {
      ie(e3) && (t2 += e3.getColSpan());
    })), t2;
  }
}
function Mt(e2) {
  const t2 = At();
  e2.hasAttribute("data-lexical-row-striping") && t2.setRowStriping(true);
  const n2 = e2.querySelector(":scope > colgroup");
  if (n2) {
    let e3 = [];
    for (const t3 of n2.querySelectorAll(":scope > col")) {
      const n3 = t3.style.width;
      if (!n3 || !ne.test(n3)) {
        e3 = void 0;
        break;
      }
      e3.push(parseFloat(n3));
    }
    e3 && t2.setColWidths(e3);
  }
  return { node: t2 };
}
function At() {
  return gn(new Kt());
}
function $t(e2) {
  return e2 instanceof Kt;
}
export {
  Be as B,
  Ce as C,
  He as H,
  Kt as K,
  Pe as P,
  Se as S,
  Ve as V,
  Xe as X,
  ce as c,
  fe as f,
  ie as i,
  kt as k,
  nt as n,
  re as r,
  se as s
};
