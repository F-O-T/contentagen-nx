import { N } from "./utils.mjs";
import { K, J, e as R, f as Rs, W, i as g$1, j as h$1, k as ki, a as hi, F as Fs } from "../../../_libs/lexical.mjs";
const l = 0, f = 1, p = 2, h = 0, m = 1, g = 2, _ = 3, S = 4;
function y(t, e, n, r, o) {
  if (null === t || 0 === n.size && 0 === r.size && !o) return h;
  const i = e._selection, s = t._selection;
  if (o) return m;
  if (!(ki(i) && ki(s) && s.isCollapsed() && i.isCollapsed())) return h;
  const c = (function(t2, e2, n2) {
    const r2 = t2._nodeMap, o2 = [];
    for (const t3 of e2) {
      const e3 = r2.get(t3);
      void 0 !== e3 && o2.push(e3);
    }
    for (const [t3, e3] of n2) {
      if (!e3) continue;
      const n3 = r2.get(t3);
      void 0 === n3 || Fs(n3) || o2.push(n3);
    }
    return o2;
  })(e, n, r);
  if (0 === c.length) return h;
  if (c.length > 1) {
    const n2 = e._nodeMap, r2 = n2.get(i.anchor.key), o2 = n2.get(s.anchor.key);
    return r2 && o2 && !t._nodeMap.has(r2.__key) && hi(r2) && 1 === r2.__text.length && 1 === i.anchor.offset ? g : h;
  }
  const l2 = c[0], f2 = t._nodeMap.get(l2.__key);
  if (!hi(f2) || !hi(l2) || f2.__mode !== l2.__mode) return h;
  const p2 = f2.__text, y2 = l2.__text;
  if (p2 === y2) return h;
  const k2 = i.anchor, C2 = s.anchor;
  if (k2.key !== C2.key || "text" !== k2.type) return h;
  const x2 = k2.offset, M2 = C2.offset, z = y2.length - p2.length;
  return 1 === z && M2 === x2 - 1 ? g : -1 === z && M2 === x2 + 1 ? _ : -1 === z && M2 === x2 ? S : h;
}
function k(t, e) {
  let n = Date.now(), r = h;
  return (o, i, s, c, d, m2) => {
    const g2 = Date.now();
    if (m2.has("historic")) return r = h, n = g2, p;
    const _2 = y(o, i, c, d, t.isComposing()), S2 = (() => {
      const S3 = null === s || s.editor === t, y2 = m2.has("history-push");
      if (!y2 && S3 && m2.has("history-merge")) return l;
      if (null === o) return f;
      const k2 = i._selection;
      if (!(c.size > 0 || d.size > 0)) return null !== k2 ? l : p;
      if (false === y2 && _2 !== h && _2 === r && g2 < n + e && S3) return l;
      if (1 === c.size) {
        if ((function(t2, e2, n2) {
          const r2 = e2._nodeMap.get(t2), o2 = n2._nodeMap.get(t2), i2 = e2._selection, s2 = n2._selection;
          return !(ki(i2) && ki(s2) && "element" === i2.anchor.type && "element" === i2.focus.type && "text" === s2.anchor.type && "text" === s2.focus.type || !hi(r2) || !hi(o2) || r2.__parent !== o2.__parent) && JSON.stringify(e2.read((() => r2.exportJSON()))) === JSON.stringify(n2.read((() => o2.exportJSON())));
        })(Array.from(c)[0], o, i)) return l;
      }
      return f;
    })();
    return n = g2, r = _2, S2;
  };
}
function C(t) {
  t.undoStack = [], t.redoStack = [], t.current = null;
}
function x(a, u, d) {
  const l2 = k(a, d), h2 = N(a.registerCommand(h$1, (() => ((function(t, e) {
    const n = e.redoStack, r = e.undoStack;
    if (0 !== r.length) {
      const o = e.current, i = r.pop();
      null !== o && (n.push(o), t.dispatchCommand(K, true)), 0 === r.length && t.dispatchCommand(J, false), e.current = i || null, i && i.editor.setEditorState(i.editorState, { tag: "historic" });
    }
  })(a, u), true)), Rs), a.registerCommand(g$1, (() => ((function(t, e) {
    const n = e.redoStack, r = e.undoStack;
    if (0 !== n.length) {
      const o = e.current;
      null !== o && (r.push(o), t.dispatchCommand(J, true));
      const i = n.pop();
      0 === n.length && t.dispatchCommand(K, false), e.current = i || null, i && i.editor.setEditorState(i.editorState, { tag: "historic" });
    }
  })(a, u), true)), Rs), a.registerCommand(W, (() => (C(u), false)), Rs), a.registerCommand(R, (() => (C(u), a.dispatchCommand(K, false), a.dispatchCommand(J, false), true)), Rs), a.registerUpdateListener((({ editorState: t, prevEditorState: e, dirtyLeaves: n, dirtyElements: r, tags: o }) => {
    const i = u.current, d2 = u.redoStack, h3 = u.undoStack, m2 = null === i ? null : i.editorState;
    if (null !== i && t === m2) return;
    const g2 = l2(e, t, i, n, r, o);
    if (g2 === f) 0 !== d2.length && (u.redoStack = [], a.dispatchCommand(K, false)), null !== i && (h3.push({ ...i }), a.dispatchCommand(J, true));
    else if (g2 === p) return;
    u.current = { editor: a, editorState: t };
  })));
  return h2;
}
function M() {
  return { current: null, redoStack: [], undoStack: [] };
}
export {
  M,
  x
};
