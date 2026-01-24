import { Q as js, E as Et, z as zs, R as Ri, S as wi, O as Ft, V as Ct, X as Bi, Y as Ns, g as gn, Z as k, B as Ks, _ as w$1, $ as r$2, a0 as c$1, k as ki, b as bs, a1 as N$3, N as Ai, a2 as nt, a3 as F, a4 as P, a5 as E$3, f as Rs, M as Mi, a as hi } from "../../../_libs/lexical.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
import { g as g$2 } from "./text.mjs";
import { N as N$2, W, j, u as ue, c as ce, n as ne, i as ie, d as de } from "./utils.mjs";
import { M as M$1, x as x$1 } from "./history.mjs";
import { r as reactDomExports } from "../react-dom.mjs";
import { o as o$2 } from "./dragon.mjs";
import { A as At } from "./rich-text.mjs";
import { r as rt, A as At$1 } from "./markdown.mjs";
import { J, I, Z } from "./list.mjs";
import { a as a$4, U, m as m$2 } from "./link.mjs";
import { k as kt, K as Kt, r as re, f as fe, P as Pe, s as se, c as ce$1, S as Se, X as Xe, B as Be, H as He, C as Ce, i as ie$1, V as Ve, n as nt$1 } from "./table.mjs";
function r$1(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var t$1 = r$1((function(e) {
  const n2 = new URLSearchParams();
  n2.append("code", e);
  for (let e2 = 1; e2 < arguments.length; e2++) n2.append("v", arguments[e2]);
  throw Error(`Minified Lexical error #${e}; visit https://lexical.dev/docs/error?${n2} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
const l = reactExports.createContext(null);
function o$1(e, n2) {
  return { getTheme: function() {
    return null != n2 ? n2 : null;
  } };
}
function u$3() {
  const e = reactExports.useContext(l);
  return null == e && t$1(8), e;
}
const s = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement, m$1 = s ? reactExports.useLayoutEffect : reactExports.useEffect, u$2 = { tag: "history-merge" };
function p$2({ initialConfig: a2, children: c2 }) {
  const p2 = reactExports.useMemo((() => {
    const { theme: t2, namespace: c3, nodes: l2, onError: d2, editorState: m2, html: p3 } = a2, f2 = o$1(null, t2), E2 = js({ editable: a2.editable, html: p3, namespace: c3, nodes: l2, onError: (e) => d2(e, E2), theme: t2 });
    return (function(e, t3) {
      if (null === t3) return;
      if (void 0 === t3) e.update((() => {
        const t4 = Et();
        if (t4.isEmpty()) {
          const o2 = zs();
          t4.append(o2);
          const n2 = s ? document.activeElement : null;
          (null !== Ri() || null !== n2 && n2 === e.getRootElement()) && o2.select();
        }
      }), u$2);
      else if (null !== t3) switch (typeof t3) {
        case "string": {
          const o2 = e.parseEditorState(t3);
          e.setEditorState(o2, u$2);
          break;
        }
        case "object":
          e.setEditorState(t3, u$2);
          break;
        case "function":
          e.update((() => {
            Et().isEmpty() && t3(e);
          }), u$2);
      }
    })(E2, m2), [E2, f2];
  }), []);
  return m$1((() => {
    const e = a2.editable, [t2] = p2;
    t2.setEditable(void 0 === e || e);
  }), []), jsxRuntimeExports.jsx(l.Provider, { value: p2, children: c2 });
}
const m = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement ? reactExports.useLayoutEffect : reactExports.useEffect;
function f({ editor: e, ariaActiveDescendant: t2, ariaAutoComplete: i2, ariaControls: a2, ariaDescribedBy: d2, ariaErrorMessage: c2, ariaExpanded: s2, ariaInvalid: u2, ariaLabel: f2, ariaLabelledBy: b2, ariaMultiline: p2, ariaOwns: x2, ariaRequired: E2, autoCapitalize: v2, className: w2, id: y, role: C2 = "textbox", spellCheck: g2 = true, style: h2, tabIndex: L2, "data-testid": D, ...I2 }, R) {
  const [k2, q] = reactExports.useState(e.isEditable()), z = reactExports.useCallback(((t3) => {
    t3 && t3.ownerDocument && t3.ownerDocument.defaultView ? e.setRootElement(t3) : e.setRootElement(null);
  }), [e]), A = reactExports.useMemo((() => /* @__PURE__ */ (function(...e2) {
    return (t3) => {
      e2.forEach(((e3) => {
        "function" == typeof e3 ? e3(t3) : null != e3 && (e3.current = t3);
      }));
    };
  })(R, z)), [z, R]);
  return m((() => (q(e.isEditable()), e.registerEditableListener(((e2) => {
    q(e2);
  })))), [e]), jsxRuntimeExports.jsx("div", { "aria-activedescendant": k2 ? t2 : void 0, "aria-autocomplete": k2 ? i2 : "none", "aria-controls": k2 ? a2 : void 0, "aria-describedby": d2, ...null != c2 ? { "aria-errormessage": c2 } : {}, "aria-expanded": k2 && "combobox" === C2 ? !!s2 : void 0, ...null != u2 ? { "aria-invalid": u2 } : {}, "aria-label": f2, "aria-labelledby": b2, "aria-multiline": p2, "aria-owns": k2 ? x2 : void 0, "aria-readonly": !k2 || void 0, "aria-required": E2, autoCapitalize: v2, className: w2, contentEditable: k2, "data-testid": D, id: y, ref: A, role: k2 ? C2 : void 0, spellCheck: g2, style: h2, tabIndex: L2, ...I2 });
}
const b = reactExports.forwardRef(f);
function p$1(e) {
  return e.getEditorState().read(g$2(e.isComposing()));
}
const x = reactExports.forwardRef(E$2);
function E$2(t2, i2) {
  const { placeholder: a2, ...r2 } = t2, [n2] = u$3();
  return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx(b, { editor: n2, ...r2, ref: i2 }), null != a2 && jsxRuntimeExports.jsx(v, { editor: n2, content: a2 })] });
}
function v({ content: e, editor: i2 }) {
  const a2 = (function(e2) {
    const [t2, i3] = reactExports.useState((() => p$1(e2)));
    return m((() => {
      function t3() {
        const t4 = p$1(e2);
        i3(t4);
      }
      return t3(), N$2(e2.registerUpdateListener((() => {
        t3();
      })), e2.registerEditableListener((() => {
        t3();
      })));
    }), [e2]), t2;
  })(i2), [n2, o2] = reactExports.useState(i2.isEditable());
  if (reactExports.useLayoutEffect((() => (o2(i2.isEditable()), i2.registerEditableListener(((e2) => {
    o2(e2);
  })))), [i2]), !a2) return null;
  let d2 = null;
  return "function" == typeof e ? d2 = e(n2) : null !== e && (d2 = e), null === d2 ? null : jsxRuntimeExports.jsx("div", { "aria-hidden": true, children: d2 });
}
function t(r2, e) {
  return t = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(r3, e2) {
    return r3.__proto__ = e2, r3;
  }, t(r2, e);
}
var o = { error: null }, n$1 = (function(e) {
  var n2, a2;
  function s2() {
    for (var r2, t2 = arguments.length, n3 = new Array(t2), a3 = 0; a3 < t2; a3++) n3[a3] = arguments[a3];
    return (r2 = e.call.apply(e, [this].concat(n3)) || this).state = o, r2.resetErrorBoundary = function() {
      for (var e2, t3 = arguments.length, o2 = new Array(t3), n4 = 0; n4 < t3; n4++) o2[n4] = arguments[n4];
      null == r2.props.onReset || (e2 = r2.props).onReset.apply(e2, o2), r2.reset();
    }, r2;
  }
  a2 = e, (n2 = s2).prototype = Object.create(a2.prototype), n2.prototype.constructor = n2, t(n2, a2), s2.getDerivedStateFromError = function(r2) {
    return { error: r2 };
  };
  var l2 = s2.prototype;
  return l2.reset = function() {
    this.setState(o);
  }, l2.componentDidCatch = function(r2, e2) {
    var t2, o2;
    null == (t2 = (o2 = this.props).onError) || t2.call(o2, r2, e2);
  }, l2.componentDidUpdate = function(r2, e2) {
    var t2, o2, n3, a3, s3 = this.state.error, l3 = this.props.resetKeys;
    null !== s3 && null !== e2.error && (void 0 === (n3 = r2.resetKeys) && (n3 = []), void 0 === (a3 = l3) && (a3 = []), n3.length !== a3.length || n3.some((function(r3, e3) {
      return !Object.is(r3, a3[e3]);
    }))) && (null == (t2 = (o2 = this.props).onResetKeysChange) || t2.call(o2, r2.resetKeys, l3), this.reset());
  }, l2.render = function() {
    var e2 = this.state.error, t2 = this.props, o2 = t2.fallbackRender, n3 = t2.FallbackComponent, a3 = t2.fallback;
    if (null !== e2) {
      var s3 = { error: e2, resetErrorBoundary: this.resetErrorBoundary };
      if (reactExports.isValidElement(a3)) return a3;
      if ("function" == typeof o2) return o2(s3);
      if (n3) return reactExports.createElement(n3, s3);
      throw new Error("react-error-boundary requires either a fallback, fallbackRender, or FallbackComponent prop");
    }
    return this.props.children;
  }, s2;
})(reactExports.Component);
function a$3({ children: r2, onError: t2 }) {
  return jsxRuntimeExports.jsx(n$1, { fallback: jsxRuntimeExports.jsx("div", { style: { border: "1px solid #f00", color: "#f00", padding: "8px" }, children: "An error was thrown." }), onError: t2, children: r2 });
}
function a$2({ delay: a2, externalHistoryState: c2 }) {
  const [l2] = u$3();
  return (function(t2, a3, c3 = 1e3) {
    const l3 = reactExports.useMemo((() => a3 || M$1()), [a3]);
    reactExports.useEffect((() => x$1(t2, l3, c3)), [c3, t2, l3]);
  })(l2, c2, a2), null;
}
const r = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement ? reactExports.useLayoutEffect : reactExports.useEffect;
function i$1({ ignoreHistoryMergeTagChange: t2 = true, ignoreSelectionChange: o2 = false, onChange: i2 }) {
  const [n2] = u$3();
  return r((() => {
    if (i2) return n2.registerUpdateListener((({ editorState: e, dirtyElements: r2, dirtyLeaves: a2, prevEditorState: d2, tags: s2 }) => {
      o2 && 0 === r2.size && 0 === a2.size || t2 && s2.has("history-merge") || d2.isEmpty() || i2(e, n2, s2);
    }));
  }), [n2, t2, o2, i2]), null;
}
const u$1 = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement ? reactExports.useLayoutEffect : reactExports.useEffect;
function c(e) {
  return { initialValueFn: () => e.isEditable(), subscribe: (t2) => e.registerEditableListener(t2) };
}
function a$1() {
  return (function(t2) {
    const [n2] = u$3(), c2 = reactExports.useMemo((() => t2(n2)), [n2, t2]), [a2, l2] = reactExports.useState((() => c2.initialValueFn())), d2 = reactExports.useRef(a2);
    return u$1((() => {
      const { initialValueFn: e, subscribe: t3 } = c2, n3 = e();
      return d2.current !== n3 && (d2.current = n3, l2(n3)), t3(((e2) => {
        d2.current = e2, l2(e2);
      }));
    }), [c2, t2]), a2;
  })(c);
}
const g$1 = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement ? reactExports.useLayoutEffect : reactExports.useEffect;
function E$1(t2) {
  return t2.getEditorState().read(g$2(t2.isComposing()));
}
function h$1({ contentEditable: e, placeholder: r2 = null, ErrorBoundary: n2 }) {
  const [E2] = u$3(), h2 = (function(t2, e2) {
    const [r3, o2] = reactExports.useState((() => t2.getDecorators()));
    return g$1((() => t2.registerDecoratorListener(((t3) => {
      reactDomExports.flushSync((() => {
        o2(t3);
      }));
    }))), [t2]), reactExports.useEffect((() => {
      o2(t2.getDecorators());
    }), [t2]), reactExports.useMemo((() => {
      const o3 = [], n3 = Object.keys(r3);
      for (let i2 = 0; i2 < n3.length; i2++) {
        const c2 = n3[i2], l2 = jsxRuntimeExports.jsx(e2, { onError: (e3) => t2._onError(e3), children: jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: r3[c2] }) }), u2 = t2.getElementByKey(c2);
        null !== u2 && o3.push(reactDomExports.createPortal(l2, u2, c2));
      }
      return o3;
    }), [e2, r3, t2]);
  })(E2, n2);
  return (function(t2) {
    g$1((() => N$2(At(t2), o$2(t2))), [t2]);
  })(E2), jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [e, jsxRuntimeExports.jsx(w, { content: r2 }), h2] });
}
function w({ content: r2 }) {
  const [n2] = u$3(), i2 = (function(t2) {
    const [e, r3] = reactExports.useState((() => E$1(t2)));
    return g$1((() => {
      function e2() {
        const e3 = E$1(t2);
        r3(e3);
      }
      return e2(), N$2(t2.registerUpdateListener((() => {
        e2();
      })), t2.registerEditableListener((() => {
        e2();
      })));
    }), [t2]), e;
  })(n2), l2 = a$1();
  return i2 ? "function" == typeof r2 ? r2(l2) : r2 : null;
}
function d$1(e, t2) {
  return e.getEditorState().read((() => {
    const e2 = Ct(t2);
    return null !== e2 && e2.isSelected();
  }));
}
function u(c2) {
  const [u2] = u$3(), [p2, s2] = reactExports.useState((() => d$1(u2, c2)));
  reactExports.useEffect((() => {
    let e = true;
    const t2 = u2.registerUpdateListener((() => {
      e && s2(d$1(u2, c2));
    }));
    return () => {
      e = false, t2();
    };
  }), [u2, c2]);
  return [p2, reactExports.useCallback(((e) => {
    u2.update((() => {
      let a2 = Ri();
      wi(a2) || (a2 = Bi(), Ft(a2)), wi(a2) && (e ? a2.add(c2) : a2.delete(c2));
    }));
  }), [u2, c2]), reactExports.useCallback((() => {
    u2.update((() => {
      const e = Ri();
      wi(e) && e.clear();
    }));
  }), [u2])];
}
function g({ nodeKey: i2 }) {
  const [c2] = u$3(), [u$12, y, h2] = u(i2), g2 = reactExports.useCallback(((e) => {
    const t2 = Ri();
    return u$12 && wi(t2) && (e.preventDefault(), c2.update((() => {
      t2.getNodes().forEach(((e2) => {
        N$1(e2) && e2.remove();
      }));
    }))), false;
  }), [c2, u$12]);
  return reactExports.useEffect((() => N$2(c2.registerCommand(r$2, ((e) => {
    const t2 = c2.getElementByKey(i2);
    return e.target === t2 && (e.shiftKey || h2(), y(!u$12), true);
  }), Ks), c2.registerCommand(w$1, g2, Ks), c2.registerCommand(k, g2, Ks))), [h2, c2, u$12, i2, g2, y]), reactExports.useEffect((() => {
    const e = c2.getElementByKey(i2), t2 = "selected";
    null !== e && (u$12 ? W(e, t2) : j(e, t2));
  }), [c2, u$12, i2]), null;
}
class O extends Ns {
  static getType() {
    return "horizontalrule";
  }
  static clone(e) {
    return new O(e.__key);
  }
  static importJSON(e) {
    return E();
  }
  static importDOM() {
    return { hr: () => ({ conversion: C, priority: 0 }) };
  }
  exportJSON() {
    return { type: "horizontalrule", version: 1 };
  }
  exportDOM() {
    return { element: document.createElement("hr") };
  }
  createDOM(e) {
    const t2 = document.createElement("hr");
    return W(t2, e.theme.hr), t2;
  }
  getTextContent() {
    return "\n";
  }
  isInline() {
    return false;
  }
  updateDOM() {
    return false;
  }
  decorate() {
    return jsxRuntimeExports.jsx(g, { nodeKey: this.__key });
  }
}
function C() {
  return { node: E() };
}
function E() {
  return gn(new O());
}
function N$1(e) {
  return e instanceof O;
}
const i = [{ dependencies: [O], export: (e) => N$1(e) ? "***" : null, regExp: /^(---|\*\*\*|___)\s?$/, replace: (e, r2, t2, o2) => {
  const l2 = E();
  o2 || null != e.getNextSibling() ? e.replace(l2) : e.insertBefore(l2), l2.selectNext();
}, type: "element" }, ...At$1];
function a({ transformers: e = i }) {
  const [o2] = u$3();
  return reactExports.useEffect((() => rt(o2, e)), [o2, e]), null;
}
function n() {
  const [n2] = u$3();
  return reactExports.useEffect((() => {
    if (!n2.hasNodes([J, I])) throw new Error("ListPlugin: ListNode and/or ListItemNode not registered on editor");
  }), [n2]), (function(t2) {
    reactExports.useEffect((() => Z(t2)), [t2]);
  })(n2), null;
}
function d({ validateUrl: d2, attributes: p2 }) {
  const [f2] = u$3();
  return reactExports.useEffect((() => {
    if (!f2.hasNodes([a$4])) throw new Error("LinkPlugin: LinkNode not registered on editor");
    return N$2(f2.registerCommand(U, ((t2) => {
      if (null === t2) return m$2(t2), true;
      if ("string" == typeof t2) return !(void 0 !== d2 && !d2(t2)) && (m$2(t2, p2), true);
      {
        const { url: r2, target: o2, rel: i2, title: l2 } = t2;
        return m$2(r2, { ...p2, rel: i2, target: o2, title: l2 }), true;
      }
    }), Ks), void 0 !== d2 ? f2.registerCommand(c$1, ((t2) => {
      const e = Ri();
      if (!ki(e) || e.isCollapsed() || !ue(t2, ClipboardEvent)) return false;
      const o2 = t2;
      if (null === o2.clipboardData) return false;
      const i2 = o2.clipboardData.getData("text");
      return !!d2(i2) && (!e.getNodes().some(((t3) => bs(t3))) && (f2.dispatchCommand(U, { ...p2, url: i2 }), t2.preventDefault(), true));
    }), Ks) : () => {
    });
  }), [f2, d2, p2]), null;
}
function p(e) {
  return e.registerCommand(N$3, ((r2) => {
    const f2 = Ri();
    if (!ki(f2)) return false;
    r2.preventDefault();
    const d2 = (function(e2) {
      const r3 = e2.getNodes();
      if (ce(r3, ((e3) => Mi(e3) && e3.canIndent() ? e3 : null)).length > 0) return true;
      const o2 = e2.anchor, c2 = e2.focus, i2 = c2.isBefore(o2) ? c2 : o2, s2 = i2.getNode(), l2 = ne(s2);
      if (l2.canIndent()) {
        const e3 = l2.getKey();
        let t2 = Ai();
        if (t2.anchor.set(e3, 0, "element"), t2.focus.set(e3, 0, "element"), t2 = nt(t2), t2.anchor.is(i2)) return true;
      }
      return false;
    })(f2) ? r2.shiftKey ? F : P : E$3;
    return e.dispatchCommand(d2, void 0);
  }), Rs);
}
function h() {
  const [t2] = u$3();
  return reactExports.useEffect((() => p(t2)), [t2]), null;
}
function N(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var L = N((function(e) {
  const t2 = new URLSearchParams();
  t2.append("code", e);
  for (let e2 = 1; e2 < arguments.length; e2++) t2.append("v", arguments[e2]);
  throw Error(`Minified Lexical error #${e}; visit https://lexical.dev/docs/error?${t2} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
}));
function M({ hasCellMerge: N2 = true, hasCellBackgroundColor: M2 = true, hasTabHandler: R = true, hasHorizontalScroll: k2 = false }) {
  const [T] = u$3();
  return reactExports.useEffect((() => {
    kt(T, k2);
  }), [T, k2]), reactExports.useEffect((() => (T.hasNodes([Kt, re, fe]) || L(10), N$2(T.registerCommand(ce$1, (({ columns: e, rows: t2, includeHeaders: r2 }) => {
    const o2 = Se(Number(t2), Number(e), r2);
    ie(o2);
    const n2 = o2.getFirstDescendant();
    return hi(n2) && n2.select(), true;
  }), Rs), T.registerNodeTransform(Kt, ((e) => {
    const [t2] = Pe(e, null, null), r2 = t2.reduce(((e2, t3) => Math.max(e2, t3.length)), 0), o2 = e.getChildren();
    for (let e2 = 0; e2 < t2.length; ++e2) {
      const n2 = o2[e2];
      if (!n2) continue;
      const l2 = t2[e2].reduce(((e3, t3) => t3 ? 1 + e3 : e3), 0);
      if (l2 !== r2) for (let e3 = l2; e3 < r2; ++e3) {
        const e4 = se(0);
        e4.append(zs()), n2.append(e4);
      }
    }
  }))))), [T]), reactExports.useEffect((() => {
    const e = /* @__PURE__ */ new Map(), t2 = (t3, r2, o3) => {
      const n2 = Ve(t3, o3), l2 = nt$1(t3, n2, T, R);
      e.set(r2, [l2, n2]);
    }, o2 = T.registerMutationListener(Kt, ((r2) => {
      T.getEditorState().read((() => {
        for (const [o3, n2] of r2) {
          const r3 = e.get(o3);
          if ("created" === n2 || "updated" === n2) {
            const { tableNode: n3, tableElement: l2 } = Xe(o3);
            void 0 === r3 ? t2(n3, o3, l2) : l2 !== r3[1] && (r3[0].removeListeners(), e.delete(o3), t2(n3, o3, l2));
          } else "destroyed" === n2 && void 0 !== r3 && (r3[0].removeListeners(), e.delete(o3));
        }
      }), { editor: T });
    }), { skipInitialization: false });
    return () => {
      o2();
      for (const [, [t3]] of e) t3.removeListeners();
    };
  }), [T, R]), reactExports.useEffect((() => {
    if (!N2) return T.registerNodeTransform(re, ((e) => {
      if (e.getColSpan() > 1 || e.getRowSpan() > 1) {
        const [, , t2] = Be(e), [r2] = He(t2, e, e), o2 = r2.length, n2 = r2[0].length;
        let l2 = t2.getFirstChild();
        Ce(l2) || L(175);
        const s2 = [];
        for (let e2 = 0; e2 < o2; e2++) {
          0 !== e2 && (l2 = l2.getNextSibling(), Ce(l2) || L(175));
          let t3 = null;
          for (let o3 = 0; o3 < n2; o3++) {
            const n3 = r2[e2][o3], a2 = n3.cell;
            if (n3.startRow === e2 && n3.startColumn === o3) t3 = a2, s2.push(a2);
            else if (a2.getColSpan() > 1 || a2.getRowSpan() > 1) {
              ie$1(a2) || L(176);
              const e3 = se(a2.__headerState);
              null !== t3 ? t3.insertAfter(e3) : de(l2, e3);
            }
          }
        }
        for (const e2 of s2) e2.setColSpan(1), e2.setRowSpan(1);
      }
    }));
  }), [T, N2]), reactExports.useEffect((() => {
    if (!M2) return T.registerNodeTransform(re, ((e) => {
      null !== e.getBackgroundColor() && e.setBackgroundColor(null);
    }));
  }), [T, M2, N2]), null;
}
export {
  M,
  O,
  a$3 as a,
  a$2 as b,
  h as c,
  d,
  a as e,
  h$1 as h,
  i$1 as i,
  n,
  p$2 as p,
  u$3 as u,
  x
};
