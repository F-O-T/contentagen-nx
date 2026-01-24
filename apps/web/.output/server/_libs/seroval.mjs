var L$1 = ((i) => (i[i.AggregateError = 1] = "AggregateError", i[i.ArrowFunction = 2] = "ArrowFunction", i[i.ErrorPrototypeStack = 4] = "ErrorPrototypeStack", i[i.ObjectAssign = 8] = "ObjectAssign", i[i.BigIntTypedArray = 16] = "BigIntTypedArray", i[i.RegExp = 32] = "RegExp", i))(L$1 || {});
var N$1 = Symbol.asyncIterator, fr = Symbol.hasInstance, I$1 = Symbol.isConcatSpreadable, b = Symbol.iterator, Sr = Symbol.match, mr$1 = Symbol.matchAll, pr$1 = Symbol.replace, dr$1 = Symbol.search, gr = Symbol.species, yr = Symbol.split, Nr$1 = Symbol.toPrimitive, P$1 = Symbol.toStringTag, br$1 = Symbol.unscopables;
var qr = { 0: "Symbol.asyncIterator", 1: "Symbol.hasInstance", 2: "Symbol.isConcatSpreadable", 3: "Symbol.iterator", 4: "Symbol.match", 5: "Symbol.matchAll", 6: "Symbol.replace", 7: "Symbol.search", 8: "Symbol.species", 9: "Symbol.split", 10: "Symbol.toPrimitive", 11: "Symbol.toStringTag", 12: "Symbol.unscopables" }, Ce$1 = { [N$1]: 0, [fr]: 1, [I$1]: 2, [b]: 3, [Sr]: 4, [mr$1]: 5, [pr$1]: 6, [dr$1]: 7, [gr]: 8, [yr]: 9, [Nr$1]: 10, [P$1]: 11, [br$1]: 12 }, Qr = { 2: "!0", 3: "!1", 1: "void 0", 0: "null", 4: "-0", 5: "1/0", 6: "-1/0", 7: "0/0" }, o = void 0;
var ve$1 = { 0: "Error", 1: "EvalError", 2: "RangeError", 3: "ReferenceError", 4: "SyntaxError", 5: "TypeError", 6: "URIError" };
function c(e, r, t, n, a, s2, i, u2, l, g2, S, d2) {
  return { t: e, i: r, s: t, c: n, m: a, p: s2, e: i, a: u2, f: l, b: g2, o: S, l: d2 };
}
function D(e) {
  return c(2, o, e, o, o, o, o, o, o, o, o, o);
}
var Z = D(2), $$1 = D(3), Ae$1 = D(1), Re$1 = D(0), tt = D(4), nt = D(5), ot = D(6), at = D(7);
function sn(e) {
  switch (e) {
    case '"':
      return '\\"';
    case "\\":
      return "\\\\";
    case `
`:
      return "\\n";
    case "\r":
      return "\\r";
    case "\b":
      return "\\b";
    case "	":
      return "\\t";
    case "\f":
      return "\\f";
    case "<":
      return "\\x3C";
    case "\u2028":
      return "\\u2028";
    case "\u2029":
      return "\\u2029";
    default:
      return o;
  }
}
function y$1(e) {
  let r = "", t = 0, n;
  for (let a = 0, s2 = e.length; a < s2; a++) n = sn(e[a]), n && (r += e.slice(t, a) + n, t = a + 1);
  return t === 0 ? r = e : r += e.slice(t), r;
}
var U$1 = "__SEROVAL_REFS__", ce$1 = "$R", Ee$1 = `self.${ce$1}`;
function ln(e) {
  return e == null ? `${Ee$1}=${Ee$1}||[]` : `(${Ee$1}=${Ee$1}||{})["${y$1(e)}"]=[]`;
}
var Cr = /* @__PURE__ */ new Map(), j$1 = /* @__PURE__ */ new Map();
function vr(e) {
  return Cr.has(e);
}
function st(e) {
  if (vr(e)) return Cr.get(e);
  throw new Ie$1(e);
}
typeof globalThis != "undefined" ? Object.defineProperty(globalThis, U$1, { value: j$1, configurable: true, writable: false, enumerable: false }) : typeof window != "undefined" ? Object.defineProperty(window, U$1, { value: j$1, configurable: true, writable: false, enumerable: false }) : typeof self != "undefined" ? Object.defineProperty(self, U$1, { value: j$1, configurable: true, writable: false, enumerable: false }) : typeof global != "undefined" && Object.defineProperty(global, U$1, { value: j$1, configurable: true, writable: false, enumerable: false });
function xe$1(e) {
  return e instanceof EvalError ? 1 : e instanceof RangeError ? 2 : e instanceof ReferenceError ? 3 : e instanceof SyntaxError ? 4 : e instanceof TypeError ? 5 : e instanceof URIError ? 6 : 0;
}
function Sn(e) {
  let r = ve$1[xe$1(e)];
  return e.name !== r ? { name: e.name } : e.constructor.name !== r ? { name: e.constructor.name } : {};
}
function q(e, r) {
  let t = Sn(e), n = Object.getOwnPropertyNames(e);
  for (let a = 0, s2 = n.length, i; a < s2; a++) i = n[a], i !== "name" && i !== "message" && (i === "stack" ? r & 4 && (t = t || {}, t[i] = e[i]) : (t = t || {}, t[i] = e[i]));
  return t;
}
function Te(e) {
  return Object.isFrozen(e) ? 3 : Object.isSealed(e) ? 2 : Object.isExtensible(e) ? 0 : 1;
}
function Oe$1(e) {
  switch (e) {
    case Number.POSITIVE_INFINITY:
      return nt;
    case Number.NEGATIVE_INFINITY:
      return ot;
  }
  return e !== e ? at : Object.is(e, -0) ? tt : c(0, o, e, o, o, o, o, o, o, o, o, o);
}
function X(e) {
  return c(1, o, y$1(e), o, o, o, o, o, o, o, o, o);
}
function we$1(e) {
  return c(3, o, "" + e, o, o, o, o, o, o, o, o, o);
}
function lt(e) {
  return c(4, e, o, o, o, o, o, o, o, o, o, o);
}
function he$1(e, r) {
  let t = r.valueOf();
  return c(5, e, t !== t ? "" : r.toISOString(), o, o, o, o, o, o, o, o, o);
}
function ze$1(e, r) {
  return c(6, e, o, y$1(r.source), r.flags, o, o, o, o, o, o, o);
}
function ct(e, r) {
  return c(17, e, Ce$1[r], o, o, o, o, o, o, o, o, o);
}
function ft(e, r) {
  return c(18, e, y$1(st(r)), o, o, o, o, o, o, o, o, o);
}
function fe$1(e, r, t) {
  return c(25, e, t, y$1(r), o, o, o, o, o, o, o, o);
}
function _e$1(e, r, t) {
  return c(9, e, o, o, o, o, o, t, o, o, Te(r), o);
}
function ke$1(e, r) {
  return c(21, e, o, o, o, o, o, o, r, o, o, o);
}
function De(e, r, t) {
  return c(15, e, o, r.constructor.name, o, o, o, o, t, r.byteOffset, o, r.length);
}
function Fe$1(e, r, t) {
  return c(16, e, o, r.constructor.name, o, o, o, o, t, r.byteOffset, o, r.byteLength);
}
function Be$1(e, r, t) {
  return c(20, e, o, o, o, o, o, o, t, r.byteOffset, o, r.byteLength);
}
function Me$1(e, r, t) {
  return c(13, e, xe$1(r), o, y$1(r.message), t, o, o, o, o, o, o);
}
function Ve$1(e, r, t) {
  return c(14, e, xe$1(r), o, y$1(r.message), t, o, o, o, o, o, o);
}
function Le(e, r) {
  return c(7, e, o, o, o, o, o, r, o, o, o, o);
}
function Ue(e, r) {
  return c(28, o, o, o, o, o, o, [e, r], o, o, o, o);
}
function je$1(e, r) {
  return c(30, o, o, o, o, o, o, [e, r], o, o, o, o);
}
function Ye$1(e, r, t) {
  return c(31, e, o, o, o, o, o, t, r, o, o, o);
}
function We(e, r) {
  return c(32, e, o, o, o, o, o, o, r, o, o, o);
}
function Ge$1(e, r) {
  return c(33, e, o, o, o, o, o, o, r, o, o, o);
}
function Ke$1(e, r) {
  return c(34, e, o, o, o, o, o, o, r, o, o, o);
}
var mn = { parsing: 1, serialization: 2, deserialization: 3 };
function pn(e) {
  return `Seroval Error (step: ${mn[e]})`;
}
var dn = (e, r) => pn(e), Se$1 = class Se extends Error {
  constructor(t, n) {
    super(dn(t));
    this.cause = n;
  }
}, z = class extends Se$1 {
  constructor(r) {
    super("parsing", r);
  }
};
function _$1(e) {
  return `Seroval Error (specific: ${e})`;
}
var x$1 = class x extends Error {
  constructor(t) {
    super(_$1(1));
    this.value = t;
  }
}, O$1 = class O extends Error {
  constructor(r) {
    super(_$1(2));
  }
}, Q = class extends Error {
  constructor(r) {
    super(_$1(3));
  }
}, Ie$1 = class Ie extends Error {
  constructor(t) {
    super(_$1(5));
    this.value = t;
  }
}, ee$1 = class ee extends Error {
  constructor(r) {
    super(_$1(9));
  }
};
var Y$1 = class Y {
  constructor(r, t) {
    this.value = r;
    this.replacement = t;
  }
};
var re$1 = () => {
  let e = { p: 0, s: 0, f: 0 };
  return e.p = new Promise((r, t) => {
    e.s = r, e.f = t;
  }), e;
}, gn = (e, r) => {
  e.s(r), e.p.s = 1, e.p.v = r;
}, yn = (e, r) => {
  e.f(r), e.p.s = 2, e.p.v = r;
}, mt = re$1.toString(), pt = gn.toString(), dt = yn.toString(), Rr = () => {
  let e = [], r = [], t = true, n = false, a = 0, s2 = (l, g2, S) => {
    for (S = 0; S < a; S++) r[S] && r[S][g2](l);
  }, i = (l, g2, S, d2) => {
    for (g2 = 0, S = e.length; g2 < S; g2++) d2 = e[g2], !t && g2 === S - 1 ? l[n ? "return" : "throw"](d2) : l.next(d2);
  }, u2 = (l, g2) => (t && (g2 = a++, r[g2] = l), i(l), () => {
    t && (r[g2] = r[a], r[a--] = void 0);
  });
  return { __SEROVAL_STREAM__: true, on: (l) => u2(l), next: (l) => {
    t && (e.push(l), s2(l, "next"));
  }, throw: (l) => {
    t && (e.push(l), s2(l, "throw"), t = false, n = false, r.length = 0);
  }, return: (l) => {
    t && (e.push(l), s2(l, "return"), t = false, n = true, r.length = 0);
  } };
}, gt = Rr.toString(), Er$1 = (e) => (r) => () => {
  let t = 0, n = { [e]: () => n, next: () => {
    if (t > r.d) return { done: true, value: void 0 };
    let a = t++, s2 = r.v[a];
    if (a === r.t) throw s2;
    return { done: a === r.d, value: s2 };
  } };
  return n;
}, yt = Er$1.toString(), Ir = (e, r) => (t) => () => {
  let n = 0, a = -1, s2 = false, i = [], u2 = [], l = (S = 0, d2 = u2.length) => {
    for (; S < d2; S++) u2[S].s({ done: true, value: void 0 });
  };
  t.on({ next: (S) => {
    let d2 = u2.shift();
    d2 && d2.s({ done: false, value: S }), i.push(S);
  }, throw: (S) => {
    let d2 = u2.shift();
    d2 && d2.f(S), l(), a = i.length, s2 = true, i.push(S);
  }, return: (S) => {
    let d2 = u2.shift();
    d2 && d2.s({ done: true, value: S }), l(), a = i.length, i.push(S);
  } });
  let g2 = { [e]: () => g2, next: () => {
    if (a === -1) {
      let H = n++;
      if (H >= i.length) {
        let $r = r();
        return u2.push($r), $r.p;
      }
      return { done: false, value: i[H] };
    }
    if (n > a) return { done: true, value: void 0 };
    let S = n++, d2 = i[S];
    if (S !== a) return { done: false, value: d2 };
    if (s2) throw d2;
    return { done: true, value: d2 };
  } };
  return g2;
}, Nt = Ir.toString(), Pr = (e) => {
  let r = atob(e), t = r.length, n = new Uint8Array(t);
  for (let a = 0; a < t; a++) n[a] = r.charCodeAt(a);
  return n.buffer;
}, bt = Pr.toString();
var Ct = {}, vt = {};
var At = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }, Rt = { 0: "[]", 1: mt, 2: pt, 3: dt, 4: gt, 5: bt };
function M$1(e) {
  return "__SEROVAL_STREAM__" in e;
}
function te() {
  return Rr();
}
function Ze$1(e) {
  let r = te(), t = e[N$1]();
  async function n() {
    try {
      let a = await t.next();
      a.done ? r.return(a.value) : (r.next(a.value), await n());
    } catch (a) {
      r.throw(a);
    }
  }
  return n().catch(() => {
  }), r;
}
function $e(e) {
  let r = [], t = -1, n = -1, a = e[b]();
  for (; ; ) try {
    let s2 = a.next();
    if (r.push(s2.value), s2.done) {
      n = r.length - 1;
      break;
    }
  } catch (s2) {
    t = r.length, r.push(s2);
  }
  return { v: r, t, d: n };
}
function pe$1(e, r) {
  return { plugins: r.plugins, mode: e, marked: /* @__PURE__ */ new Set(), features: 63 ^ (r.disabledFeatures || 0), refs: r.refs || /* @__PURE__ */ new Map(), depthLimit: r.depthLimit || 1e3 };
}
function de$1(e, r) {
  e.marked.add(r);
}
function Tr(e, r) {
  let t = e.refs.size;
  return e.refs.set(r, t), t;
}
function qe(e, r) {
  let t = e.refs.get(r);
  return t != null ? (de$1(e, t), { type: 1, value: lt(t) }) : { type: 0, value: Tr(e, r) };
}
function W$1(e, r) {
  let t = qe(e, r);
  return t.type === 1 ? t : vr(r) ? { type: 2, value: ft(t.value, r) } : t;
}
function E$1(e, r) {
  let t = W$1(e, r);
  if (t.type !== 0) return t.value;
  if (r in Ce$1) return ct(t.value, r);
  throw new x$1(r);
}
function k$1(e, r) {
  let t = qe(e, At[r]);
  return t.type === 1 ? t.value : c(26, t.value, r, o, o, o, o, o, o, o, o, o);
}
function Xe$1(e) {
  let r = qe(e, Ct);
  return r.type === 1 ? r.value : c(27, r.value, o, o, o, o, o, o, E$1(e, b), o, o, o);
}
function Qe$1(e) {
  let r = qe(e, vt);
  return r.type === 1 ? r.value : c(29, r.value, o, o, o, o, o, [k$1(e, 1), E$1(e, N$1)], o, o, o, o);
}
function er$1(e, r, t, n) {
  return c(t ? 11 : 10, e, o, o, o, n, o, o, o, o, Te(r), o);
}
function rr$1(e, r, t, n) {
  return c(8, r, o, o, o, o, { k: t, v: n }, o, k$1(e, 0), o, o, o);
}
function xt(e, r, t) {
  return c(22, r, t, o, o, o, o, o, k$1(e, 1), o, o, o);
}
function tr(e, r, t) {
  let n = new Uint8Array(t), a = "";
  for (let s2 = 0, i = n.length; s2 < i; s2++) a += String.fromCharCode(n[s2]);
  return c(19, r, y$1(btoa(a)), o, o, o, o, o, k$1(e, 5), o, o, o);
}
var ae = ((t) => (t[t.Vanilla = 1] = "Vanilla", t[t.Cross = 2] = "Cross", t))(ae || {});
function Js(e) {
  return e;
}
function wt(e, r) {
  for (let t = 0, n = r.length; t < n; t++) {
    let a = r[t];
    e.has(a) || (e.add(a), a.extends && wt(e, a.extends));
  }
}
function A$1(e) {
  if (e) {
    let r = /* @__PURE__ */ new Set();
    return wt(r, e), [...r];
  }
}
var yo = () => T, No = yo.toString(), Lt = /=>/.test(No);
function or$1(e, r) {
  return Lt ? (e.length === 1 ? e[0] : "(" + e.join(",") + ")") + "=>" + (r.startsWith("{") ? "(" + r + ")" : r) : "function(" + e.join(",") + "){return " + r + "}";
}
function Ut(e, r) {
  return Lt ? (e.length === 1 ? e[0] : "(" + e.join(",") + ")") + "=>{" + r + "}" : "function(" + e.join(",") + "){" + r + "}";
}
var Wt = "hjkmoquxzABCDEFGHIJKLNPQRTUVWXYZ$_", jt = Wt.length, Gt = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_", Yt = Gt.length;
function kr(e) {
  let r = e % jt, t = Wt[r];
  for (e = (e - r) / jt; e > 0; ) r = e % Yt, t += Gt[r], e = (e - r) / Yt;
  return t;
}
var bo = /^[$A-Z_][0-9A-Z_$]*$/i;
function Dr(e) {
  let r = e[0];
  return (r === "$" || r === "_" || r >= "A" && r <= "Z" || r >= "a" && r <= "z") && bo.test(e);
}
function ye$1(e) {
  switch (e.t) {
    case 0:
      return e.s + "=" + e.v;
    case 2:
      return e.s + ".set(" + e.k + "," + e.v + ")";
    case 1:
      return e.s + ".add(" + e.v + ")";
    case 3:
      return e.s + ".delete(" + e.k + ")";
  }
}
function Co(e) {
  let r = [], t = e[0];
  for (let n = 1, a = e.length, s2, i = t; n < a; n++) s2 = e[n], s2.t === 0 && s2.v === i.v ? t = { t: 0, s: s2.s, k: o, v: ye$1(t) } : s2.t === 2 && s2.s === i.s ? t = { t: 2, s: ye$1(t), k: s2.k, v: s2.v } : s2.t === 1 && s2.s === i.s ? t = { t: 1, s: ye$1(t), k: o, v: s2.v } : s2.t === 3 && s2.s === i.s ? t = { t: 3, s: ye$1(t), k: s2.k, v: o } : (r.push(t), t = s2), i = s2;
  return r.push(t), r;
}
function qt(e) {
  if (e.length) {
    let r = "", t = Co(e);
    for (let n = 0, a = t.length; n < a; n++) r += ye$1(t[n]) + ",";
    return r;
  }
  return o;
}
var vo = "Object.create(null)", Ao = "new Set", Ro = "new Map", Eo = "Promise.resolve", Io = "Promise.reject", Po = { 3: "Object.freeze", 2: "Object.seal", 1: "Object.preventExtensions", 0: o };
function Xt(e, r) {
  return { mode: e, plugins: r.plugins, features: r.features, marked: new Set(r.markedRefs), stack: [], flags: [], assignments: [] };
}
function sr$1(e) {
  return { mode: 2, base: Xt(2, e), state: e, child: o };
}
var Fr = class {
  constructor(r) {
    this._p = r;
  }
  serialize(r) {
    return f$1(this._p, r);
  }
};
function To(e, r) {
  let t = e.valid.get(r);
  t == null && (t = e.valid.size, e.valid.set(r, t));
  let n = e.vars[t];
  return n == null && (n = kr(t), e.vars[t] = n), n;
}
function Oo(e) {
  return ce$1 + "[" + e + "]";
}
function m$1(e, r) {
  return e.mode === 1 ? To(e.state, r) : Oo(r);
}
function h(e, r) {
  e.marked.add(r);
}
function Br(e, r) {
  return e.marked.has(r);
}
function Vr(e, r, t) {
  r !== 0 && (h(e.base, t), e.base.flags.push({ type: r, value: m$1(e, t) }));
}
function wo(e) {
  let r = "";
  for (let t = 0, n = e.flags, a = n.length; t < a; t++) {
    let s2 = n[t];
    r += Po[s2.type] + "(" + s2.value + "),";
  }
  return r;
}
function Qt(e) {
  let r = qt(e.assignments), t = wo(e);
  return r ? t ? r + t : r : t;
}
function en(e, r, t) {
  e.assignments.push({ t: 0, s: r, k: o, v: t });
}
function ho(e, r, t) {
  e.base.assignments.push({ t: 1, s: m$1(e, r), k: o, v: t });
}
function ge$1(e, r, t, n) {
  e.base.assignments.push({ t: 2, s: m$1(e, r), k: t, v: n });
}
function Kt(e, r, t) {
  e.base.assignments.push({ t: 3, s: m$1(e, r), k: t, v: o });
}
function Ne$1(e, r, t, n) {
  en(e.base, m$1(e, r) + "[" + t + "]", n);
}
function Mr(e, r, t, n) {
  en(e.base, m$1(e, r) + "." + t, n);
}
function V(e, r) {
  return r.t === 4 && e.stack.includes(r.i);
}
function se(e, r, t) {
  return e.mode === 1 && !Br(e.base, r) ? t : m$1(e, r) + "=" + t;
}
function zo(e) {
  return U$1 + '.get("' + e.s + '")';
}
function Ht(e, r, t, n) {
  return t ? V(e.base, t) ? (h(e.base, r), Ne$1(e, r, n, m$1(e, t.i)), "") : f$1(e, t) : "";
}
function _o(e, r) {
  let t = r.i, n = r.a, a = n.length;
  if (a > 0) {
    e.base.stack.push(t);
    let s2 = Ht(e, t, n[0], 0), i = s2 === "";
    for (let u2 = 1, l; u2 < a; u2++) l = Ht(e, t, n[u2], u2), s2 += "," + l, i = l === "";
    return e.base.stack.pop(), Vr(e, r.o, r.i), "[" + s2 + (i ? ",]" : "]");
  }
  return "[]";
}
function Jt(e, r, t, n) {
  if (typeof t == "string") {
    let a = Number(t), s2 = a >= 0 && a.toString() === t || Dr(t);
    if (V(e.base, n)) {
      let i = m$1(e, n.i);
      return h(e.base, r.i), s2 && a !== a ? Mr(e, r.i, t, i) : Ne$1(e, r.i, s2 ? t : '"' + t + '"', i), "";
    }
    return (s2 ? t : '"' + t + '"') + ":" + f$1(e, n);
  }
  return "[" + f$1(e, t) + "]:" + f$1(e, n);
}
function rn(e, r, t) {
  let n = t.k, a = n.length;
  if (a > 0) {
    let s2 = t.v;
    e.base.stack.push(r.i);
    let i = Jt(e, r, n[0], s2[0]);
    for (let u2 = 1, l = i; u2 < a; u2++) l = Jt(e, r, n[u2], s2[u2]), i += (l && i && ",") + l;
    return e.base.stack.pop(), "{" + i + "}";
  }
  return "{}";
}
function ko(e, r) {
  return Vr(e, r.o, r.i), rn(e, r, r.p);
}
function Do(e, r, t, n) {
  let a = rn(e, r, t);
  return a !== "{}" ? "Object.assign(" + n + "," + a + ")" : n;
}
function Fo(e, r, t, n, a) {
  let s2 = e.base, i = f$1(e, a), u2 = Number(n), l = u2 >= 0 && u2.toString() === n || Dr(n);
  if (V(s2, a)) l && u2 !== u2 ? Mr(e, r.i, n, i) : Ne$1(e, r.i, l ? n : '"' + n + '"', i);
  else {
    let g2 = s2.assignments;
    s2.assignments = t, l && u2 !== u2 ? Mr(e, r.i, n, i) : Ne$1(e, r.i, l ? n : '"' + n + '"', i), s2.assignments = g2;
  }
}
function Bo(e, r, t, n, a) {
  if (typeof n == "string") Fo(e, r, t, n, a);
  else {
    let s2 = e.base, i = s2.stack;
    s2.stack = [];
    let u2 = f$1(e, a);
    s2.stack = i;
    let l = s2.assignments;
    s2.assignments = t, Ne$1(e, r.i, f$1(e, n), u2), s2.assignments = l;
  }
}
function Mo(e, r, t) {
  let n = t.k, a = n.length;
  if (a > 0) {
    let s2 = [], i = t.v;
    e.base.stack.push(r.i);
    for (let u2 = 0; u2 < a; u2++) Bo(e, r, s2, n[u2], i[u2]);
    return e.base.stack.pop(), qt(s2);
  }
  return o;
}
function Lr(e, r, t) {
  if (r.p) {
    let n = e.base;
    if (n.features & 8) t = Do(e, r, r.p, t);
    else {
      h(n, r.i);
      let a = Mo(e, r, r.p);
      if (a) return "(" + se(e, r.i, t) + "," + a + m$1(e, r.i) + ")";
    }
  }
  return t;
}
function Vo(e, r) {
  return Vr(e, r.o, r.i), Lr(e, r, vo);
}
function Lo$1(e) {
  return 'new Date("' + e.s + '")';
}
function Uo(e, r) {
  if (e.base.features & 32) return "/" + r.c + "/" + r.m;
  throw new O$1(r);
}
function Zt(e, r, t) {
  let n = e.base;
  return V(n, t) ? (h(n, r), ho(e, r, m$1(e, t.i)), "") : f$1(e, t);
}
function jo(e, r) {
  let t = Ao, n = r.a, a = n.length, s2 = r.i;
  if (a > 0) {
    e.base.stack.push(s2);
    let i = Zt(e, s2, n[0]);
    for (let u2 = 1, l = i; u2 < a; u2++) l = Zt(e, s2, n[u2]), i += (l && i && ",") + l;
    e.base.stack.pop(), i && (t += "([" + i + "])");
  }
  return t;
}
function $t(e, r, t, n, a) {
  let s2 = e.base;
  if (V(s2, t)) {
    let i = m$1(e, t.i);
    if (h(s2, r), V(s2, n)) {
      let l = m$1(e, n.i);
      return ge$1(e, r, i, l), "";
    }
    if (n.t !== 4 && n.i != null && Br(s2, n.i)) {
      let l = "(" + f$1(e, n) + ",[" + a + "," + a + "])";
      return ge$1(e, r, i, m$1(e, n.i)), Kt(e, r, a), l;
    }
    let u2 = s2.stack;
    return s2.stack = [], ge$1(e, r, i, f$1(e, n)), s2.stack = u2, "";
  }
  if (V(s2, n)) {
    let i = m$1(e, n.i);
    if (h(s2, r), t.t !== 4 && t.i != null && Br(s2, t.i)) {
      let l = "(" + f$1(e, t) + ",[" + a + "," + a + "])";
      return ge$1(e, r, m$1(e, t.i), i), Kt(e, r, a), l;
    }
    let u2 = s2.stack;
    return s2.stack = [], ge$1(e, r, f$1(e, t), i), s2.stack = u2, "";
  }
  return "[" + f$1(e, t) + "," + f$1(e, n) + "]";
}
function Yo(e, r) {
  let t = Ro, n = r.e.k, a = n.length, s2 = r.i, i = r.f, u2 = m$1(e, i.i), l = e.base;
  if (a > 0) {
    let g2 = r.e.v;
    l.stack.push(s2);
    let S = $t(e, s2, n[0], g2[0], u2);
    for (let d2 = 1, H = S; d2 < a; d2++) H = $t(e, s2, n[d2], g2[d2], u2), S += (H && S && ",") + H;
    l.stack.pop(), S && (t += "([" + S + "])");
  }
  return i.t === 26 && (h(l, i.i), t = "(" + f$1(e, i) + "," + t + ")"), t;
}
function Wo(e, r) {
  return G$1(e, r.f) + '("' + r.s + '")';
}
function Go(e, r) {
  return "new " + r.c + "(" + f$1(e, r.f) + "," + r.b + "," + r.l + ")";
}
function Ko(e, r) {
  return "new DataView(" + f$1(e, r.f) + "," + r.b + "," + r.l + ")";
}
function Ho(e, r) {
  let t = r.i;
  e.base.stack.push(t);
  let n = Lr(e, r, 'new AggregateError([],"' + r.m + '")');
  return e.base.stack.pop(), n;
}
function Jo(e, r) {
  return Lr(e, r, "new " + ve$1[r.s] + '("' + r.m + '")');
}
function Zo(e, r) {
  let t, n = r.f, a = r.i, s2 = r.s ? Eo : Io, i = e.base;
  if (V(i, n)) {
    let u2 = m$1(e, n.i);
    t = s2 + (r.s ? "().then(" + or$1([], u2) + ")" : "().catch(" + Ut([], "throw " + u2) + ")");
  } else {
    i.stack.push(a);
    let u2 = f$1(e, n);
    i.stack.pop(), t = s2 + "(" + u2 + ")";
  }
  return t;
}
function $o(e, r) {
  return "Object(" + f$1(e, r.f) + ")";
}
function G$1(e, r) {
  let t = f$1(e, r);
  return r.t === 4 ? t : "(" + t + ")";
}
function qo(e, r) {
  if (e.mode === 1) throw new O$1(r);
  return "(" + se(e, r.s, G$1(e, r.f) + "()") + ").p";
}
function Xo(e, r) {
  if (e.mode === 1) throw new O$1(r);
  return G$1(e, r.a[0]) + "(" + m$1(e, r.i) + "," + f$1(e, r.a[1]) + ")";
}
function Qo(e, r) {
  if (e.mode === 1) throw new O$1(r);
  return G$1(e, r.a[0]) + "(" + m$1(e, r.i) + "," + f$1(e, r.a[1]) + ")";
}
function ea(e, r) {
  let t = e.base.plugins;
  if (t) for (let n = 0, a = t.length; n < a; n++) {
    let s2 = t[n];
    if (s2.tag === r.c) return e.child == null && (e.child = new Fr(e)), s2.serialize(r.s, e.child, { id: r.i });
  }
  throw new Q(r.c);
}
function ra(e, r) {
  let t = "", n = false;
  return r.f.t !== 4 && (h(e.base, r.f.i), t = "(" + f$1(e, r.f) + ",", n = true), t += se(e, r.i, "(" + yt + ")(" + m$1(e, r.f.i) + ")"), n && (t += ")"), t;
}
function ta(e, r) {
  return G$1(e, r.a[0]) + "(" + f$1(e, r.a[1]) + ")";
}
function na(e, r) {
  let t = r.a[0], n = r.a[1], a = e.base, s2 = "";
  t.t !== 4 && (h(a, t.i), s2 += "(" + f$1(e, t)), n.t !== 4 && (h(a, n.i), s2 += (s2 ? "," : "(") + f$1(e, n)), s2 && (s2 += ",");
  let i = se(e, r.i, "(" + Nt + ")(" + m$1(e, n.i) + "," + m$1(e, t.i) + ")");
  return s2 ? s2 + i + ")" : i;
}
function oa(e, r) {
  return G$1(e, r.a[0]) + "(" + f$1(e, r.a[1]) + ")";
}
function aa(e, r) {
  let t = se(e, r.i, G$1(e, r.f) + "()"), n = r.a.length;
  if (n) {
    let a = f$1(e, r.a[0]);
    for (let s2 = 1; s2 < n; s2++) a += "," + f$1(e, r.a[s2]);
    return "(" + t + "," + a + "," + m$1(e, r.i) + ")";
  }
  return t;
}
function sa(e, r) {
  return m$1(e, r.i) + ".next(" + f$1(e, r.f) + ")";
}
function ia(e, r) {
  return m$1(e, r.i) + ".throw(" + f$1(e, r.f) + ")";
}
function ua(e, r) {
  return m$1(e, r.i) + ".return(" + f$1(e, r.f) + ")";
}
function la(e, r) {
  switch (r.t) {
    case 17:
      return qr[r.s];
    case 18:
      return zo(r);
    case 9:
      return _o(e, r);
    case 10:
      return ko(e, r);
    case 11:
      return Vo(e, r);
    case 5:
      return Lo$1(r);
    case 6:
      return Uo(e, r);
    case 7:
      return jo(e, r);
    case 8:
      return Yo(e, r);
    case 19:
      return Wo(e, r);
    case 16:
    case 15:
      return Go(e, r);
    case 20:
      return Ko(e, r);
    case 14:
      return Ho(e, r);
    case 13:
      return Jo(e, r);
    case 12:
      return Zo(e, r);
    case 21:
      return $o(e, r);
    case 22:
      return qo(e, r);
    case 25:
      return ea(e, r);
    case 26:
      return Rt[r.s];
    default:
      throw new O$1(r);
  }
}
function f$1(e, r) {
  switch (r.t) {
    case 2:
      return Qr[r.s];
    case 0:
      return "" + r.s;
    case 1:
      return '"' + r.s + '"';
    case 3:
      return r.s + "n";
    case 4:
      return m$1(e, r.i);
    case 23:
      return Xo(e, r);
    case 24:
      return Qo(e, r);
    case 27:
      return ra(e, r);
    case 28:
      return ta(e, r);
    case 29:
      return na(e, r);
    case 30:
      return oa(e, r);
    case 31:
      return aa(e, r);
    case 32:
      return sa(e, r);
    case 33:
      return ia(e, r);
    case 34:
      return ua(e, r);
    default:
      return se(e, r.i, la(e, r));
  }
}
function ur$1(e, r) {
  let t = f$1(e, r), n = r.i;
  if (n == null) return t;
  let a = Qt(e.base), s2 = m$1(e, n), i = e.state.scopeId, u2 = i == null ? "" : ce$1, l = a ? "(" + t + "," + a + s2 + ")" : t;
  if (u2 === "") return r.t === 10 && !a ? "(" + l + ")" : l;
  let g2 = i == null ? "()" : "(" + ce$1 + '["' + y$1(i) + '"])';
  return "(" + or$1([u2], l) + ")" + g2;
}
var jr = class {
  constructor(r, t) {
    this._p = r;
    this.depth = t;
  }
  parse(r) {
    return R$1(this._p, this.depth, r);
  }
}, Yr = class {
  constructor(r, t) {
    this._p = r;
    this.depth = t;
  }
  parse(r) {
    return R$1(this._p, this.depth, r);
  }
  parseWithError(r) {
    return K$1(this._p, this.depth, r);
  }
  isAlive() {
    return this._p.state.alive;
  }
  pushPendingState() {
    Jr(this._p);
  }
  popPendingState() {
    be$1(this._p);
  }
  onParse(r) {
    ie$1(this._p, r);
  }
  onError(r) {
    Kr(this._p, r);
  }
};
function ca(e) {
  return { alive: true, pending: 0, initial: true, buffer: [], onParse: e.onParse, onError: e.onError, onDone: e.onDone };
}
function Wr(e) {
  return { type: 2, base: pe$1(2, e), state: ca(e) };
}
function fa(e, r, t) {
  let n = [];
  for (let a = 0, s2 = t.length; a < s2; a++) a in t ? n[a] = R$1(e, r, t[a]) : n[a] = 0;
  return n;
}
function Sa(e, r, t, n) {
  return _e$1(t, n, fa(e, r, n));
}
function Gr(e, r, t) {
  let n = Object.entries(t), a = [], s2 = [];
  for (let i = 0, u2 = n.length; i < u2; i++) a.push(y$1(n[i][0])), s2.push(R$1(e, r, n[i][1]));
  return b in t && (a.push(E$1(e.base, b)), s2.push(Ue(Xe$1(e.base), R$1(e, r, $e(t))))), N$1 in t && (a.push(E$1(e.base, N$1)), s2.push(je$1(Qe$1(e.base), R$1(e, r, e.type === 1 ? te() : Ze$1(t))))), P$1 in t && (a.push(E$1(e.base, P$1)), s2.push(X(t[P$1]))), I$1 in t && (a.push(E$1(e.base, I$1)), s2.push(t[I$1] ? Z : $$1)), { k: a, v: s2 };
}
function Ur(e, r, t, n, a) {
  return er$1(t, n, a, Gr(e, r, n));
}
function ma(e, r, t, n) {
  return ke$1(t, R$1(e, r, n.valueOf()));
}
function pa(e, r, t, n) {
  return De(t, n, R$1(e, r, n.buffer));
}
function da(e, r, t, n) {
  return Fe$1(t, n, R$1(e, r, n.buffer));
}
function ga(e, r, t, n) {
  return Be$1(t, n, R$1(e, r, n.buffer));
}
function tn(e, r, t, n) {
  let a = q(n, e.base.features);
  return Me$1(t, n, a ? Gr(e, r, a) : o);
}
function ya(e, r, t, n) {
  let a = q(n, e.base.features);
  return Ve$1(t, n, a ? Gr(e, r, a) : o);
}
function Na(e, r, t, n) {
  let a = [], s2 = [];
  for (let [i, u2] of n.entries()) a.push(R$1(e, r, i)), s2.push(R$1(e, r, u2));
  return rr$1(e.base, t, a, s2);
}
function ba(e, r, t, n) {
  let a = [];
  for (let s2 of n.keys()) a.push(R$1(e, r, s2));
  return Le(t, a);
}
function Ca(e, r, t, n) {
  let a = Ye$1(t, k$1(e.base, 4), []);
  return e.type === 1 || (Jr(e), n.on({ next: (s2) => {
    if (e.state.alive) {
      let i = K$1(e, r, s2);
      i && ie$1(e, We(t, i));
    }
  }, throw: (s2) => {
    if (e.state.alive) {
      let i = K$1(e, r, s2);
      i && ie$1(e, Ge$1(t, i));
    }
    be$1(e);
  }, return: (s2) => {
    if (e.state.alive) {
      let i = K$1(e, r, s2);
      i && ie$1(e, Ke$1(t, i));
    }
    be$1(e);
  } })), a;
}
function va(e, r, t) {
  if (this.state.alive) {
    let n = K$1(this, r, t);
    n && ie$1(this, c(23, e, o, o, o, o, o, [k$1(this.base, 2), n], o, o, o, o)), be$1(this);
  }
}
function Aa(e, r, t) {
  if (this.state.alive) {
    let n = K$1(this, r, t);
    n && ie$1(this, c(24, e, o, o, o, o, o, [k$1(this.base, 3), n], o, o, o, o));
  }
  be$1(this);
}
function Ra(e, r, t, n) {
  let a = Tr(e.base, {});
  return e.type === 2 && (Jr(e), n.then(va.bind(e, a, r), Aa.bind(e, a, r))), xt(e.base, t, a);
}
function Ea(e, r, t, n, a) {
  for (let s2 = 0, i = a.length; s2 < i; s2++) {
    let u2 = a[s2];
    if (u2.parse.sync && u2.test(n)) return fe$1(t, u2.tag, u2.parse.sync(n, new jr(e, r), { id: t }));
  }
  return o;
}
function Ia(e, r, t, n, a) {
  for (let s2 = 0, i = a.length; s2 < i; s2++) {
    let u2 = a[s2];
    if (u2.parse.stream && u2.test(n)) return fe$1(t, u2.tag, u2.parse.stream(n, new Yr(e, r), { id: t }));
  }
  return o;
}
function nn(e, r, t, n) {
  let a = e.base.plugins;
  return a ? e.type === 1 ? Ea(e, r, t, n, a) : Ia(e, r, t, n, a) : o;
}
function Pa(e, r, t, n, a) {
  switch (a) {
    case Object:
      return Ur(e, r, t, n, false);
    case o:
      return Ur(e, r, t, n, true);
    case Date:
      return he$1(t, n);
    case Error:
    case EvalError:
    case RangeError:
    case ReferenceError:
    case SyntaxError:
    case TypeError:
    case URIError:
      return tn(e, r, t, n);
    case Number:
    case Boolean:
    case String:
    case BigInt:
      return ma(e, r, t, n);
    case ArrayBuffer:
      return tr(e.base, t, n);
    case Int8Array:
    case Int16Array:
    case Int32Array:
    case Uint8Array:
    case Uint16Array:
    case Uint32Array:
    case Uint8ClampedArray:
    case Float32Array:
    case Float64Array:
      return pa(e, r, t, n);
    case DataView:
      return ga(e, r, t, n);
    case Map:
      return Na(e, r, t, n);
    case Set:
      return ba(e, r, t, n);
  }
  if (a === Promise || n instanceof Promise) return Ra(e, r, t, n);
  let s2 = e.base.features;
  if (s2 & 32 && a === RegExp) return ze$1(t, n);
  if (s2 & 16) switch (a) {
    case BigInt64Array:
    case BigUint64Array:
      return da(e, r, t, n);
  }
  if (s2 & 1 && typeof AggregateError != "undefined" && (a === AggregateError || n instanceof AggregateError)) return ya(e, r, t, n);
  if (n instanceof Error) return tn(e, r, t, n);
  if (b in n || N$1 in n) return Ur(e, r, t, n, !!a);
  throw new x$1(n);
}
function xa(e, r, t, n) {
  if (Array.isArray(n)) return Sa(e, r, t, n);
  if (M$1(n)) return Ca(e, r, t, n);
  let a = n.constructor;
  if (a === Y$1) return R$1(e, r, n.replacement);
  let s2 = nn(e, r, t, n);
  return s2 || Pa(e, r, t, n, a);
}
function Ta(e, r, t) {
  let n = W$1(e.base, t);
  if (n.type !== 0) return n.value;
  let a = nn(e, r, n.value, t);
  if (a) return a;
  throw new x$1(t);
}
function R$1(e, r, t) {
  if (r >= e.base.depthLimit) throw new ee$1(e.base.depthLimit);
  switch (typeof t) {
    case "boolean":
      return t ? Z : $$1;
    case "undefined":
      return Ae$1;
    case "string":
      return X(t);
    case "number":
      return Oe$1(t);
    case "bigint":
      return we$1(t);
    case "object": {
      if (t) {
        let n = W$1(e.base, t);
        return n.type === 0 ? xa(e, r + 1, n.value, t) : n.value;
      }
      return Re$1;
    }
    case "symbol":
      return E$1(e.base, t);
    case "function":
      return Ta(e, r, t);
    default:
      throw new x$1(t);
  }
}
function ie$1(e, r) {
  e.state.initial ? e.state.buffer.push(r) : Hr(e, r, false);
}
function Kr(e, r) {
  if (e.state.onError) e.state.onError(r);
  else throw r instanceof z ? r : new z(r);
}
function on(e) {
  e.state.onDone && e.state.onDone();
}
function Hr(e, r, t) {
  try {
    e.state.onParse(r, t);
  } catch (n) {
    Kr(e, n);
  }
}
function Jr(e) {
  e.state.pending++;
}
function be$1(e) {
  --e.state.pending <= 0 && on(e);
}
function K$1(e, r, t) {
  try {
    return R$1(e, r, t);
  } catch (n) {
    return Kr(e, n), o;
  }
}
function Zr(e, r) {
  let t = K$1(e, 0, r);
  t && (Hr(e, t, true), e.state.initial = false, Oa(e, e.state), e.state.pending <= 0 && lr$1(e));
}
function Oa(e, r) {
  for (let t = 0, n = r.buffer.length; t < n; t++) Hr(e, r.buffer[t], false);
}
function lr$1(e) {
  e.state.alive && (on(e), e.state.alive = false);
}
function an(e, r) {
  let t = A$1(r.plugins), n = Wr({ plugins: t, refs: r.refs, disabledFeatures: r.disabledFeatures, onParse(a, s2) {
    let i = sr$1({ plugins: t, features: n.base.features, scopeId: r.scopeId, markedRefs: n.base.marked }), u2;
    try {
      u2 = ur$1(i, a);
    } catch (l) {
      r.onError && r.onError(l);
      return;
    }
    r.onSerialize(u2, s2);
  }, onError: r.onError, onDone: r.onDone });
  return Zr(n, e), lr$1.bind(null, n);
}
var R = ((a) => (a[a.AggregateError = 1] = "AggregateError", a[a.ArrowFunction = 2] = "ArrowFunction", a[a.ErrorPrototypeStack = 4] = "ErrorPrototypeStack", a[a.ObjectAssign = 8] = "ObjectAssign", a[a.BigIntTypedArray = 16] = "BigIntTypedArray", a))(R || {});
function Nr(o2) {
  switch (o2) {
    case '"':
      return '\\"';
    case "\\":
      return "\\\\";
    case `
`:
      return "\\n";
    case "\r":
      return "\\r";
    case "\b":
      return "\\b";
    case "	":
      return "\\t";
    case "\f":
      return "\\f";
    case "<":
      return "\\x3C";
    case "\u2028":
      return "\\u2028";
    case "\u2029":
      return "\\u2029";
    default:
      return;
  }
}
function d(o2) {
  let e = "", r = 0, t;
  for (let n = 0, a = o2.length; n < a; n++) t = Nr(o2[n]), t && (e += o2.slice(r, n) + t, r = n + 1);
  return r === 0 ? e = o2 : e += o2.slice(r), e;
}
function br(o2) {
  switch (o2) {
    case "\\\\":
      return "\\";
    case '\\"':
      return '"';
    case "\\n":
      return `
`;
    case "\\r":
      return "\r";
    case "\\b":
      return "\b";
    case "\\t":
      return "	";
    case "\\f":
      return "\f";
    case "\\x3C":
      return "<";
    case "\\u2028":
      return "\u2028";
    case "\\u2029":
      return "\u2029";
    default:
      return o2;
  }
}
function N(o2) {
  return o2.replace(/(\\\\|\\"|\\n|\\r|\\b|\\t|\\f|\\u2028|\\u2029|\\x3C)/g, br);
}
var O2 = "__SEROVAL_REFS__";
function f(o2, e) {
  if (!o2) throw e;
}
var Be = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map();
function je(o2) {
  return Be.has(o2);
}
function Ar(o2) {
  return C.has(o2);
}
function Ke(o2) {
  return f(je(o2), new ie(o2)), Be.get(o2);
}
function Je(o2) {
  return f(Ar(o2), new le(o2)), C.get(o2);
}
typeof globalThis != "undefined" ? Object.defineProperty(globalThis, O2, { value: C, configurable: true, writable: false, enumerable: false }) : typeof window != "undefined" ? Object.defineProperty(window, O2, { value: C, configurable: true, writable: false, enumerable: false }) : typeof self != "undefined" ? Object.defineProperty(self, O2, { value: C, configurable: true, writable: false, enumerable: false }) : typeof global != "undefined" && Object.defineProperty(global, O2, { value: C, configurable: true, writable: false, enumerable: false });
function Ye(o2, e) {
  for (let r = 0, t = e.length; r < t; r++) {
    let n = e[r];
    o2.has(n) || (o2.add(n), n.extends && Ye(o2, n.extends));
  }
}
function m(o2) {
  if (o2) {
    let e = /* @__PURE__ */ new Set();
    return Ye(e, o2), [...e];
  }
}
var ce = { [Symbol.asyncIterator]: 0, [Symbol.hasInstance]: 1, [Symbol.isConcatSpreadable]: 2, [Symbol.iterator]: 3, [Symbol.match]: 4, [Symbol.matchAll]: 5, [Symbol.replace]: 6, [Symbol.search]: 7, [Symbol.species]: 8, [Symbol.split]: 9, [Symbol.toPrimitive]: 10, [Symbol.toStringTag]: 11, [Symbol.unscopables]: 12 }, Ge = { 0: Symbol.asyncIterator, 1: Symbol.hasInstance, 2: Symbol.isConcatSpreadable, 3: Symbol.iterator, 4: Symbol.match, 5: Symbol.matchAll, 6: Symbol.replace, 7: Symbol.search, 8: Symbol.species, 9: Symbol.split, 10: Symbol.toPrimitive, 11: Symbol.toStringTag, 12: Symbol.unscopables }, He = { 2: true, 3: false, 1: void 0, 0: null, 4: -0, 5: Number.POSITIVE_INFINITY, 6: Number.NEGATIVE_INFINITY, 7: Number.NaN };
var ue = { 0: "Error", 1: "EvalError", 2: "RangeError", 3: "ReferenceError", 4: "SyntaxError", 5: "TypeError", 6: "URIError" }, Ze = { 0: Error, 1: EvalError, 2: RangeError, 3: ReferenceError, 4: SyntaxError, 5: TypeError, 6: URIError }, s = void 0;
function u(o2, e, r, t, n, a, i, l, c2, p, h2, X2) {
  return { t: o2, i: e, s: r, l: t, c: n, m: a, p: i, e: l, a: c2, f: p, b: h2, o: X2 };
}
function x2(o2) {
  return u(2, s, o2, s, s, s, s, s, s, s, s, s);
}
var I = x2(2), A = x2(3), pe = x2(1), de = x2(0), Xe = x2(4), Qe = x2(5), er = x2(6), rr = x2(7);
function me(o2) {
  return o2 instanceof EvalError ? 1 : o2 instanceof RangeError ? 2 : o2 instanceof ReferenceError ? 3 : o2 instanceof SyntaxError ? 4 : o2 instanceof TypeError ? 5 : o2 instanceof URIError ? 6 : 0;
}
function wr(o2) {
  let e = ue[me(o2)];
  return o2.name !== e ? { name: o2.name } : o2.constructor.name !== e ? { name: o2.constructor.name } : {};
}
function j(o2, e) {
  let r = wr(o2), t = Object.getOwnPropertyNames(o2);
  for (let n = 0, a = t.length, i; n < a; n++) i = t[n], i !== "name" && i !== "message" && (i === "stack" ? e & 4 && (r = r || {}, r[i] = o2[i]) : (r = r || {}, r[i] = o2[i]));
  return r;
}
function fe(o2) {
  return Object.isFrozen(o2) ? 3 : Object.isSealed(o2) ? 2 : Object.isExtensible(o2) ? 0 : 1;
}
function ge(o2) {
  switch (o2) {
    case Number.POSITIVE_INFINITY:
      return Qe;
    case Number.NEGATIVE_INFINITY:
      return er;
  }
  return o2 !== o2 ? rr : Object.is(o2, -0) ? Xe : u(0, s, o2, s, s, s, s, s, s, s, s, s);
}
function w(o2) {
  return u(1, s, d(o2), s, s, s, s, s, s, s, s, s);
}
function Se2(o2) {
  return u(3, s, "" + o2, s, s, s, s, s, s, s, s, s);
}
function sr(o2) {
  return u(4, o2, s, s, s, s, s, s, s, s, s, s);
}
function he(o2, e) {
  let r = e.valueOf();
  return u(5, o2, r !== r ? "" : e.toISOString(), s, s, s, s, s, s, s, s, s);
}
function ye(o2, e) {
  return u(6, o2, s, s, d(e.source), e.flags, s, s, s, s, s, s);
}
function ve(o2, e) {
  let r = new Uint8Array(e), t = r.length, n = new Array(t);
  for (let a = 0; a < t; a++) n[a] = r[a];
  return u(19, o2, n, s, s, s, s, s, s, s, s, s);
}
function or(o2, e) {
  return u(17, o2, ce[e], s, s, s, s, s, s, s, s, s);
}
function nr(o2, e) {
  return u(18, o2, d(Ke(e)), s, s, s, s, s, s, s, s, s);
}
function _(o2, e, r) {
  return u(25, o2, r, s, d(e), s, s, s, s, s, s, s);
}
function Ne(o2, e, r) {
  return u(9, o2, s, e.length, s, s, s, s, r, s, s, fe(e));
}
function be(o2, e) {
  return u(21, o2, s, s, s, s, s, s, s, e, s, s);
}
function xe(o2, e, r) {
  return u(15, o2, s, e.length, e.constructor.name, s, s, s, s, r, e.byteOffset, s);
}
function Ie2(o2, e, r) {
  return u(16, o2, s, e.length, e.constructor.name, s, s, s, s, r, e.byteOffset, s);
}
function Ae(o2, e, r) {
  return u(20, o2, s, e.byteLength, s, s, s, s, s, r, e.byteOffset, s);
}
function we(o2, e, r) {
  return u(13, o2, me(e), s, s, d(e.message), r, s, s, s, s, s);
}
function Ee(o2, e, r) {
  return u(14, o2, me(e), s, s, d(e.message), r, s, s, s, s, s);
}
function Pe(o2, e, r) {
  return u(7, o2, s, e, s, s, s, s, r, s, s, s);
}
function M(o2, e) {
  return u(28, s, s, s, s, s, s, s, [o2, e], s, s, s);
}
function U(o2, e) {
  return u(30, s, s, s, s, s, s, s, [o2, e], s, s, s);
}
function L(o2, e, r) {
  return u(31, o2, s, s, s, s, s, s, r, e, s, s);
}
function Re(o2, e) {
  return u(32, o2, s, s, s, s, s, s, s, e, s, s);
}
function Oe(o2, e) {
  return u(33, o2, s, s, s, s, s, s, s, e, s, s);
}
function Ce(o2, e) {
  return u(34, o2, s, s, s, s, s, s, s, e, s, s);
}
var { toString: _e } = Object.prototype;
function Er(o2, e) {
  return e instanceof Error ? `Seroval caught an error during the ${o2} process.
  
${e.name}
${e.message}

- For more information, please check the "cause" property of this error.
- If you believe this is an error in Seroval, please submit an issue at https://github.com/lxsmnsyc/seroval/issues/new` : `Seroval caught an error during the ${o2} process.

"${_e.call(e)}"

For more information, please check the "cause" property of this error.`;
}
var ee2 = class extends Error {
  constructor(r, t) {
    super(Er(r, t));
    this.cause = t;
  }
}, E = class extends ee2 {
  constructor(e) {
    super("parsing", e);
  }
}, ze = class extends ee2 {
  constructor(e) {
    super("deserialization", e);
  }
}, g = class extends Error {
  constructor(r) {
    super(`The value ${_e.call(r)} of type "${typeof r}" cannot be parsed/serialized.
      
There are few workarounds for this problem:
- Transform the value in a way that it can be serialized.
- If the reference is present on multiple runtimes (isomorphic), you can use the Reference API to map the references.`);
    this.value = r;
  }
}, y = class extends Error {
  constructor(e) {
    super('Unsupported node type "' + e.t + '".');
  }
}, W = class extends Error {
  constructor(e) {
    super('Missing plugin for tag "' + e + '".');
  }
}, P = class extends Error {
  constructor(e) {
    super('Missing "' + e + '" instance.');
  }
}, ie = class extends Error {
  constructor(r) {
    super('Missing reference for the value "' + _e.call(r) + '" of type "' + typeof r + '"');
    this.value = r;
  }
}, le = class extends Error {
  constructor(e) {
    super('Missing reference for id "' + d(e) + '"');
  }
}, ke = class extends Error {
  constructor(e) {
    super('Unknown TypedArray "' + e + '"');
  }
};
var T$1 = class T2 {
  constructor(e, r) {
    this.value = e;
    this.replacement = r;
  }
};
var ar = {}, ir = {};
var lr = { 0: {}, 1: {}, 2: {}, 3: {}, 4: {} };
function re() {
  let o2, e;
  return { promise: new Promise((r, t) => {
    o2 = r, e = t;
  }), resolve(r) {
    o2(r);
  }, reject(r) {
    e(r);
  } };
}
function Fe(o2) {
  return "__SEROVAL_STREAM__" in o2;
}
function K() {
  let o2 = /* @__PURE__ */ new Set(), e = [], r = true, t = true;
  function n(l) {
    for (let c2 of o2.keys()) c2.next(l);
  }
  function a(l) {
    for (let c2 of o2.keys()) c2.throw(l);
  }
  function i(l) {
    for (let c2 of o2.keys()) c2.return(l);
  }
  return { __SEROVAL_STREAM__: true, on(l) {
    r && o2.add(l);
    for (let c2 = 0, p = e.length; c2 < p; c2++) {
      let h2 = e[c2];
      c2 === p - 1 && !r ? t ? l.return(h2) : l.throw(h2) : l.next(h2);
    }
    return () => {
      r && o2.delete(l);
    };
  }, next(l) {
    r && (e.push(l), n(l));
  }, throw(l) {
    r && (e.push(l), a(l), r = false, t = false, o2.clear());
  }, return(l) {
    r && (e.push(l), i(l), r = false, t = true, o2.clear());
  } };
}
function Ve(o2) {
  let e = K(), r = o2[Symbol.asyncIterator]();
  async function t() {
    try {
      let n = await r.next();
      n.done ? e.return(n.value) : (e.next(n.value), await t());
    } catch (n) {
      e.throw(n);
    }
  }
  return t().catch(() => {
  }), e;
}
function ur(o2) {
  return () => {
    let e = [], r = [], t = 0, n = -1, a = false;
    function i() {
      for (let c2 = 0, p = r.length; c2 < p; c2++) r[c2].resolve({ done: true, value: void 0 });
    }
    o2.on({ next(c2) {
      let p = r.shift();
      p && p.resolve({ done: false, value: c2 }), e.push(c2);
    }, throw(c2) {
      let p = r.shift();
      p && p.reject(c2), i(), n = e.length, e.push(c2), a = true;
    }, return(c2) {
      let p = r.shift();
      p && p.resolve({ done: true, value: c2 }), i(), n = e.length, e.push(c2);
    } });
    function l() {
      let c2 = t++, p = e[c2];
      if (c2 !== n) return { done: false, value: p };
      if (a) throw p;
      return { done: true, value: p };
    }
    return { [Symbol.asyncIterator]() {
      return this;
    }, async next() {
      if (n === -1) {
        let c2 = t++;
        if (c2 >= e.length) {
          let p = re();
          return r.push(p), await p.promise;
        }
        return { done: false, value: e[c2] };
      }
      return t > n ? { done: true, value: void 0 } : l();
    } };
  };
}
function J(o2) {
  let e = [], r = -1, t = -1, n = o2[Symbol.iterator]();
  for (; ; ) try {
    let a = n.next();
    if (e.push(a.value), a.done) {
      t = e.length - 1;
      break;
    }
  } catch (a) {
    r = e.length, e.push(a);
  }
  return { v: e, t: r, d: t };
}
function pr(o2) {
  return () => {
    let e = 0;
    return { [Symbol.iterator]() {
      return this;
    }, next() {
      if (e > o2.d) return { done: true, value: s };
      let r = e++, t = o2.v[r];
      if (r === o2.t) throw t;
      return { done: r === o2.d, value: t };
    } };
  };
}
async function Me(o2) {
  try {
    return [1, await o2];
  } catch (e) {
    return [0, e];
  }
}
var Y2 = class {
  constructor(e) {
    this.marked = /* @__PURE__ */ new Set();
    this.plugins = e.plugins, this.features = 31 ^ (e.disabledFeatures || 0), this.refs = e.refs || /* @__PURE__ */ new Map();
  }
  markRef(e) {
    this.marked.add(e);
  }
  isMarked(e) {
    return this.marked.has(e);
  }
  createIndex(e) {
    let r = this.refs.size;
    return this.refs.set(e, r), r;
  }
  getIndexedValue(e) {
    let r = this.refs.get(e);
    return r != null ? (this.markRef(r), { type: 1, value: sr(r) }) : { type: 0, value: this.createIndex(e) };
  }
  getReference(e) {
    let r = this.getIndexedValue(e);
    return r.type === 1 ? r : je(e) ? { type: 2, value: nr(r.value, e) } : r;
  }
  parseWellKnownSymbol(e) {
    let r = this.getReference(e);
    return r.type !== 0 ? r.value : (f(e in ce, new g(e)), or(r.value, e));
  }
  parseSpecialReference(e) {
    let r = this.getIndexedValue(lr[e]);
    return r.type === 1 ? r.value : u(26, r.value, e, s, s, s, s, s, s, s, s, s);
  }
  parseIteratorFactory() {
    let e = this.getIndexedValue(ar);
    return e.type === 1 ? e.value : u(27, e.value, s, s, s, s, s, s, s, this.parseWellKnownSymbol(Symbol.iterator), s, s);
  }
  parseAsyncIteratorFactory() {
    let e = this.getIndexedValue(ir);
    return e.type === 1 ? e.value : u(29, e.value, s, s, s, s, s, s, [this.parseSpecialReference(1), this.parseWellKnownSymbol(Symbol.asyncIterator)], s, s, s);
  }
  createObjectNode(e, r, t, n) {
    return u(t ? 11 : 10, e, s, s, s, s, n, s, s, s, s, fe(r));
  }
  createMapNode(e, r, t, n) {
    return u(8, e, s, s, s, s, s, { k: r, v: t, s: n }, s, this.parseSpecialReference(0), s, s);
  }
  createPromiseConstructorNode(e, r) {
    return u(22, e, r, s, s, s, s, s, s, this.parseSpecialReference(1), s, s);
  }
};
var k = class extends Y2 {
  async parseItems(e) {
    let r = [];
    for (let t = 0, n = e.length; t < n; t++) t in e && (r[t] = await this.parse(e[t]));
    return r;
  }
  async parseArray(e, r) {
    return Ne(e, r, await this.parseItems(r));
  }
  async parseProperties(e) {
    let r = Object.entries(e), t = [], n = [];
    for (let i = 0, l = r.length; i < l; i++) t.push(d(r[i][0])), n.push(await this.parse(r[i][1]));
    let a = Symbol.iterator;
    return a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(M(this.parseIteratorFactory(), await this.parse(J(e))))), a = Symbol.asyncIterator, a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(U(this.parseAsyncIteratorFactory(), await this.parse(Ve(e))))), a = Symbol.toStringTag, a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(w(e[a]))), a = Symbol.isConcatSpreadable, a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(e[a] ? I : A)), { k: t, v: n, s: t.length };
  }
  async parsePlainObject(e, r, t) {
    return this.createObjectNode(e, r, t, await this.parseProperties(r));
  }
  async parseBoxed(e, r) {
    return be(e, await this.parse(r.valueOf()));
  }
  async parseTypedArray(e, r) {
    return xe(e, r, await this.parse(r.buffer));
  }
  async parseBigIntTypedArray(e, r) {
    return Ie2(e, r, await this.parse(r.buffer));
  }
  async parseDataView(e, r) {
    return Ae(e, r, await this.parse(r.buffer));
  }
  async parseError(e, r) {
    let t = j(r, this.features);
    return we(e, r, t ? await this.parseProperties(t) : s);
  }
  async parseAggregateError(e, r) {
    let t = j(r, this.features);
    return Ee(e, r, t ? await this.parseProperties(t) : s);
  }
  async parseMap(e, r) {
    let t = [], n = [];
    for (let [a, i] of r.entries()) t.push(await this.parse(a)), n.push(await this.parse(i));
    return this.createMapNode(e, t, n, r.size);
  }
  async parseSet(e, r) {
    let t = [];
    for (let n of r.keys()) t.push(await this.parse(n));
    return Pe(e, r.size, t);
  }
  async parsePromise(e, r) {
    let [t, n] = await Me(r);
    return u(12, e, t, s, s, s, s, s, s, await this.parse(n), s, s);
  }
  async parsePlugin(e, r) {
    let t = this.plugins;
    if (t) for (let n = 0, a = t.length; n < a; n++) {
      let i = t[n];
      if (i.parse.async && i.test(r)) return _(e, i.tag, await i.parse.async(r, this, { id: e }));
    }
    return s;
  }
  async parseStream(e, r) {
    return L(e, this.parseSpecialReference(4), await new Promise((t, n) => {
      let a = [], i = r.on({ next: (l) => {
        this.markRef(e), this.parse(l).then((c2) => {
          a.push(Re(e, c2));
        }, (c2) => {
          n(c2), i();
        });
      }, throw: (l) => {
        this.markRef(e), this.parse(l).then((c2) => {
          a.push(Oe(e, c2)), t(a), i();
        }, (c2) => {
          n(c2), i();
        });
      }, return: (l) => {
        this.markRef(e), this.parse(l).then((c2) => {
          a.push(Ce(e, c2)), t(a), i();
        }, (c2) => {
          n(c2), i();
        });
      } });
    }));
  }
  async parseObject(e, r) {
    if (Array.isArray(r)) return this.parseArray(e, r);
    if (Fe(r)) return this.parseStream(e, r);
    let t = r.constructor;
    if (t === T$1) return this.parse(r.replacement);
    let n = await this.parsePlugin(e, r);
    if (n) return n;
    switch (t) {
      case Object:
        return this.parsePlainObject(e, r, false);
      case s:
        return this.parsePlainObject(e, r, true);
      case Date:
        return he(e, r);
      case RegExp:
        return ye(e, r);
      case Error:
      case EvalError:
      case RangeError:
      case ReferenceError:
      case SyntaxError:
      case TypeError:
      case URIError:
        return this.parseError(e, r);
      case Number:
      case Boolean:
      case String:
      case BigInt:
        return this.parseBoxed(e, r);
      case ArrayBuffer:
        return ve(e, r);
      case Int8Array:
      case Int16Array:
      case Int32Array:
      case Uint8Array:
      case Uint16Array:
      case Uint32Array:
      case Uint8ClampedArray:
      case Float32Array:
      case Float64Array:
        return this.parseTypedArray(e, r);
      case DataView:
        return this.parseDataView(e, r);
      case Map:
        return this.parseMap(e, r);
      case Set:
        return this.parseSet(e, r);
    }
    if (t === Promise || r instanceof Promise) return this.parsePromise(e, r);
    let a = this.features;
    if (a & 16) switch (t) {
      case BigInt64Array:
      case BigUint64Array:
        return this.parseBigIntTypedArray(e, r);
    }
    if (a & 1 && typeof AggregateError != "undefined" && (t === AggregateError || r instanceof AggregateError)) return this.parseAggregateError(e, r);
    if (r instanceof Error) return this.parseError(e, r);
    if (Symbol.iterator in r || Symbol.asyncIterator in r) return this.parsePlainObject(e, r, !!t);
    throw new g(r);
  }
  async parseFunction(e) {
    let r = this.getReference(e);
    if (r.type !== 0) return r.value;
    let t = await this.parsePlugin(r.value, e);
    if (t) return t;
    throw new g(e);
  }
  async parse(e) {
    switch (typeof e) {
      case "boolean":
        return e ? I : A;
      case "undefined":
        return pe;
      case "string":
        return w(e);
      case "number":
        return ge(e);
      case "bigint":
        return Se2(e);
      case "object": {
        if (e) {
          let r = this.getReference(e);
          return r.type === 0 ? await this.parseObject(r.value, e) : r.value;
        }
        return de;
      }
      case "symbol":
        return this.parseWellKnownSymbol(e);
      case "function":
        return this.parseFunction(e);
      default:
        throw new g(e);
    }
  }
  async parseTop(e) {
    try {
      return await this.parse(e);
    } catch (r) {
      throw r instanceof E ? r : new E(r);
    }
  }
};
var $ = class extends k {
  constructor() {
    super(...arguments);
    this.mode = "cross";
  }
};
function dr(o2) {
  switch (o2) {
    case "Int8Array":
      return Int8Array;
    case "Int16Array":
      return Int16Array;
    case "Int32Array":
      return Int32Array;
    case "Uint8Array":
      return Uint8Array;
    case "Uint16Array":
      return Uint16Array;
    case "Uint32Array":
      return Uint32Array;
    case "Uint8ClampedArray":
      return Uint8ClampedArray;
    case "Float32Array":
      return Float32Array;
    case "Float64Array":
      return Float64Array;
    case "BigInt64Array":
      return BigInt64Array;
    case "BigUint64Array":
      return BigUint64Array;
    default:
      throw new ke(o2);
  }
}
function mr(o2, e) {
  switch (e) {
    case 3:
      return Object.freeze(o2);
    case 1:
      return Object.preventExtensions(o2);
    case 2:
      return Object.seal(o2);
    default:
      return o2;
  }
}
var F = class {
  constructor(e) {
    this.plugins = e.plugins, this.refs = e.refs || /* @__PURE__ */ new Map();
  }
  deserializeReference(e) {
    return this.assignIndexedValue(e.i, Je(N(e.s)));
  }
  deserializeArray(e) {
    let r = e.l, t = this.assignIndexedValue(e.i, new Array(r)), n;
    for (let a = 0; a < r; a++) n = e.a[a], n && (t[a] = this.deserialize(n));
    return mr(t, e.o), t;
  }
  deserializeProperties(e, r) {
    let t = e.s;
    if (t) {
      let n = e.k, a = e.v;
      for (let i = 0, l; i < t; i++) l = n[i], typeof l == "string" ? r[N(l)] = this.deserialize(a[i]) : r[this.deserialize(l)] = this.deserialize(a[i]);
    }
    return r;
  }
  deserializeObject(e) {
    let r = this.assignIndexedValue(e.i, e.t === 10 ? {} : /* @__PURE__ */ Object.create(null));
    return this.deserializeProperties(e.p, r), mr(r, e.o), r;
  }
  deserializeDate(e) {
    return this.assignIndexedValue(e.i, new Date(e.s));
  }
  deserializeRegExp(e) {
    return this.assignIndexedValue(e.i, new RegExp(N(e.c), e.m));
  }
  deserializeSet(e) {
    let r = this.assignIndexedValue(e.i, /* @__PURE__ */ new Set()), t = e.a;
    for (let n = 0, a = e.l; n < a; n++) r.add(this.deserialize(t[n]));
    return r;
  }
  deserializeMap(e) {
    let r = this.assignIndexedValue(e.i, /* @__PURE__ */ new Map()), t = e.e.k, n = e.e.v;
    for (let a = 0, i = e.e.s; a < i; a++) r.set(this.deserialize(t[a]), this.deserialize(n[a]));
    return r;
  }
  deserializeArrayBuffer(e) {
    let r = new Uint8Array(e.s);
    return this.assignIndexedValue(e.i, r.buffer);
  }
  deserializeTypedArray(e) {
    let r = dr(e.c), t = this.deserialize(e.f);
    return this.assignIndexedValue(e.i, new r(t, e.b, e.l));
  }
  deserializeDataView(e) {
    let r = this.deserialize(e.f);
    return this.assignIndexedValue(e.i, new DataView(r, e.b, e.l));
  }
  deserializeDictionary(e, r) {
    if (e.p) {
      let t = this.deserializeProperties(e.p, {});
      Object.assign(r, t);
    }
    return r;
  }
  deserializeAggregateError(e) {
    let r = this.assignIndexedValue(e.i, new AggregateError([], N(e.m)));
    return this.deserializeDictionary(e, r);
  }
  deserializeError(e) {
    let r = Ze[e.s], t = this.assignIndexedValue(e.i, new r(N(e.m)));
    return this.deserializeDictionary(e, t);
  }
  deserializePromise(e) {
    let r = re(), t = this.assignIndexedValue(e.i, r), n = this.deserialize(e.f);
    return e.s ? r.resolve(n) : r.reject(n), t.promise;
  }
  deserializeBoxed(e) {
    return this.assignIndexedValue(e.i, Object(this.deserialize(e.f)));
  }
  deserializePlugin(e) {
    let r = this.plugins;
    if (r) {
      let t = N(e.c);
      for (let n = 0, a = r.length; n < a; n++) {
        let i = r[n];
        if (i.tag === t) return this.assignIndexedValue(e.i, i.deserialize(e.s, this, { id: e.i }));
      }
    }
    throw new W(e.c);
  }
  deserializePromiseConstructor(e) {
    return this.assignIndexedValue(e.i, this.assignIndexedValue(e.s, re()).promise);
  }
  deserializePromiseResolve(e) {
    let r = this.refs.get(e.i);
    f(r, new P("Promise")), r.resolve(this.deserialize(e.a[1]));
  }
  deserializePromiseReject(e) {
    let r = this.refs.get(e.i);
    f(r, new P("Promise")), r.reject(this.deserialize(e.a[1]));
  }
  deserializeIteratorFactoryInstance(e) {
    this.deserialize(e.a[0]);
    let r = this.deserialize(e.a[1]);
    return pr(r);
  }
  deserializeAsyncIteratorFactoryInstance(e) {
    this.deserialize(e.a[0]);
    let r = this.deserialize(e.a[1]);
    return ur(r);
  }
  deserializeStreamConstructor(e) {
    let r = this.assignIndexedValue(e.i, K()), t = e.a.length;
    if (t) for (let n = 0; n < t; n++) this.deserialize(e.a[n]);
    return r;
  }
  deserializeStreamNext(e) {
    let r = this.refs.get(e.i);
    f(r, new P("Stream")), r.next(this.deserialize(e.f));
  }
  deserializeStreamThrow(e) {
    let r = this.refs.get(e.i);
    f(r, new P("Stream")), r.throw(this.deserialize(e.f));
  }
  deserializeStreamReturn(e) {
    let r = this.refs.get(e.i);
    f(r, new P("Stream")), r.return(this.deserialize(e.f));
  }
  deserializeIteratorFactory(e) {
    this.deserialize(e.f);
  }
  deserializeAsyncIteratorFactory(e) {
    this.deserialize(e.a[1]);
  }
  deserializeTop(e) {
    try {
      return this.deserialize(e);
    } catch (r) {
      throw new ze(r);
    }
  }
  deserialize(e) {
    switch (e.t) {
      case 2:
        return He[e.s];
      case 0:
        return e.s;
      case 1:
        return N(e.s);
      case 3:
        return BigInt(e.s);
      case 4:
        return this.refs.get(e.i);
      case 18:
        return this.deserializeReference(e);
      case 9:
        return this.deserializeArray(e);
      case 10:
      case 11:
        return this.deserializeObject(e);
      case 5:
        return this.deserializeDate(e);
      case 6:
        return this.deserializeRegExp(e);
      case 7:
        return this.deserializeSet(e);
      case 8:
        return this.deserializeMap(e);
      case 19:
        return this.deserializeArrayBuffer(e);
      case 16:
      case 15:
        return this.deserializeTypedArray(e);
      case 20:
        return this.deserializeDataView(e);
      case 14:
        return this.deserializeAggregateError(e);
      case 13:
        return this.deserializeError(e);
      case 12:
        return this.deserializePromise(e);
      case 17:
        return Ge[e.s];
      case 21:
        return this.deserializeBoxed(e);
      case 25:
        return this.deserializePlugin(e);
      case 22:
        return this.deserializePromiseConstructor(e);
      case 23:
        return this.deserializePromiseResolve(e);
      case 24:
        return this.deserializePromiseReject(e);
      case 28:
        return this.deserializeIteratorFactoryInstance(e);
      case 30:
        return this.deserializeAsyncIteratorFactoryInstance(e);
      case 31:
        return this.deserializeStreamConstructor(e);
      case 32:
        return this.deserializeStreamNext(e);
      case 33:
        return this.deserializeStreamThrow(e);
      case 34:
        return this.deserializeStreamReturn(e);
      case 27:
        return this.deserializeIteratorFactory(e);
      case 29:
        return this.deserializeAsyncIteratorFactory(e);
      default:
        throw new y(e);
    }
  }
};
var v = class extends Y2 {
  parseItems(e) {
    let r = [];
    for (let t = 0, n = e.length; t < n; t++) t in e && (r[t] = this.parse(e[t]));
    return r;
  }
  parseArray(e, r) {
    return Ne(e, r, this.parseItems(r));
  }
  parseProperties(e) {
    let r = Object.entries(e), t = [], n = [];
    for (let i = 0, l = r.length; i < l; i++) t.push(d(r[i][0])), n.push(this.parse(r[i][1]));
    let a = Symbol.iterator;
    return a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(M(this.parseIteratorFactory(), this.parse(J(e))))), a = Symbol.asyncIterator, a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(U(this.parseAsyncIteratorFactory(), this.parse(K())))), a = Symbol.toStringTag, a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(w(e[a]))), a = Symbol.isConcatSpreadable, a in e && (t.push(this.parseWellKnownSymbol(a)), n.push(e[a] ? I : A)), { k: t, v: n, s: t.length };
  }
  parsePlainObject(e, r, t) {
    return this.createObjectNode(e, r, t, this.parseProperties(r));
  }
  parseBoxed(e, r) {
    return be(e, this.parse(r.valueOf()));
  }
  parseTypedArray(e, r) {
    return xe(e, r, this.parse(r.buffer));
  }
  parseBigIntTypedArray(e, r) {
    return Ie2(e, r, this.parse(r.buffer));
  }
  parseDataView(e, r) {
    return Ae(e, r, this.parse(r.buffer));
  }
  parseError(e, r) {
    let t = j(r, this.features);
    return we(e, r, t ? this.parseProperties(t) : s);
  }
  parseAggregateError(e, r) {
    let t = j(r, this.features);
    return Ee(e, r, t ? this.parseProperties(t) : s);
  }
  parseMap(e, r) {
    let t = [], n = [];
    for (let [a, i] of r.entries()) t.push(this.parse(a)), n.push(this.parse(i));
    return this.createMapNode(e, t, n, r.size);
  }
  parseSet(e, r) {
    let t = [];
    for (let n of r.keys()) t.push(this.parse(n));
    return Pe(e, r.size, t);
  }
  parsePlugin(e, r) {
    let t = this.plugins;
    if (t) for (let n = 0, a = t.length; n < a; n++) {
      let i = t[n];
      if (i.parse.sync && i.test(r)) return _(e, i.tag, i.parse.sync(r, this, { id: e }));
    }
  }
  parseStream(e, r) {
    return L(e, this.parseSpecialReference(4), []);
  }
  parsePromise(e, r) {
    return this.createPromiseConstructorNode(e, this.createIndex({}));
  }
  parseObject(e, r) {
    if (Array.isArray(r)) return this.parseArray(e, r);
    if (Fe(r)) return this.parseStream(e, r);
    let t = r.constructor;
    if (t === T$1) return this.parse(r.replacement);
    let n = this.parsePlugin(e, r);
    if (n) return n;
    switch (t) {
      case Object:
        return this.parsePlainObject(e, r, false);
      case void 0:
        return this.parsePlainObject(e, r, true);
      case Date:
        return he(e, r);
      case RegExp:
        return ye(e, r);
      case Error:
      case EvalError:
      case RangeError:
      case ReferenceError:
      case SyntaxError:
      case TypeError:
      case URIError:
        return this.parseError(e, r);
      case Number:
      case Boolean:
      case String:
      case BigInt:
        return this.parseBoxed(e, r);
      case ArrayBuffer:
        return ve(e, r);
      case Int8Array:
      case Int16Array:
      case Int32Array:
      case Uint8Array:
      case Uint16Array:
      case Uint32Array:
      case Uint8ClampedArray:
      case Float32Array:
      case Float64Array:
        return this.parseTypedArray(e, r);
      case DataView:
        return this.parseDataView(e, r);
      case Map:
        return this.parseMap(e, r);
      case Set:
        return this.parseSet(e, r);
    }
    if (t === Promise || r instanceof Promise) return this.parsePromise(e, r);
    let a = this.features;
    if (a & 16) switch (t) {
      case BigInt64Array:
      case BigUint64Array:
        return this.parseBigIntTypedArray(e, r);
    }
    if (a & 1 && typeof AggregateError != "undefined" && (t === AggregateError || r instanceof AggregateError)) return this.parseAggregateError(e, r);
    if (r instanceof Error) return this.parseError(e, r);
    if (Symbol.iterator in r || Symbol.asyncIterator in r) return this.parsePlainObject(e, r, !!t);
    throw new g(r);
  }
  parseFunction(e) {
    let r = this.getReference(e);
    if (r.type !== 0) return r.value;
    let t = this.parsePlugin(r.value, e);
    if (t) return t;
    throw new g(e);
  }
  parse(e) {
    switch (typeof e) {
      case "boolean":
        return e ? I : A;
      case "undefined":
        return pe;
      case "string":
        return w(e);
      case "number":
        return ge(e);
      case "bigint":
        return Se2(e);
      case "object": {
        if (e) {
          let r = this.getReference(e);
          return r.type === 0 ? this.parseObject(r.value, e) : r.value;
        }
        return de;
      }
      case "symbol":
        return this.parseWellKnownSymbol(e);
      case "function":
        return this.parseFunction(e);
      default:
        throw new g(e);
    }
  }
  parseTop(e) {
    try {
      return this.parse(e);
    } catch (r) {
      throw r instanceof E ? r : new E(r);
    }
  }
};
var oe = class extends v {
  constructor(r) {
    super(r);
    this.alive = true;
    this.pending = 0;
    this.initial = true;
    this.buffer = [];
    this.onParseCallback = r.onParse, this.onErrorCallback = r.onError, this.onDoneCallback = r.onDone;
  }
  onParseInternal(r, t) {
    try {
      this.onParseCallback(r, t);
    } catch (n) {
      this.onError(n);
    }
  }
  flush() {
    for (let r = 0, t = this.buffer.length; r < t; r++) this.onParseInternal(this.buffer[r], false);
  }
  onParse(r) {
    this.initial ? this.buffer.push(r) : this.onParseInternal(r, false);
  }
  onError(r) {
    if (this.onErrorCallback) this.onErrorCallback(r);
    else throw r;
  }
  onDone() {
    this.onDoneCallback && this.onDoneCallback();
  }
  pushPendingState() {
    this.pending++;
  }
  popPendingState() {
    --this.pending <= 0 && this.onDone();
  }
  parseProperties(r) {
    let t = Object.entries(r), n = [], a = [];
    for (let l = 0, c2 = t.length; l < c2; l++) n.push(d(t[l][0])), a.push(this.parse(t[l][1]));
    let i = Symbol.iterator;
    return i in r && (n.push(this.parseWellKnownSymbol(i)), a.push(M(this.parseIteratorFactory(), this.parse(J(r))))), i = Symbol.asyncIterator, i in r && (n.push(this.parseWellKnownSymbol(i)), a.push(U(this.parseAsyncIteratorFactory(), this.parse(Ve(r))))), i = Symbol.toStringTag, i in r && (n.push(this.parseWellKnownSymbol(i)), a.push(w(r[i]))), i = Symbol.isConcatSpreadable, i in r && (n.push(this.parseWellKnownSymbol(i)), a.push(r[i] ? I : A)), { k: n, v: a, s: n.length };
  }
  handlePromiseSuccess(r, t) {
    let n = this.parseWithError(t);
    n && this.onParse(u(23, r, s, s, s, s, s, s, [this.parseSpecialReference(2), n], s, s, s)), this.popPendingState();
  }
  handlePromiseFailure(r, t) {
    if (this.alive) {
      let n = this.parseWithError(t);
      n && this.onParse(u(24, r, s, s, s, s, s, s, [this.parseSpecialReference(3), n], s, s, s));
    }
    this.popPendingState();
  }
  parsePromise(r, t) {
    let n = this.createIndex({});
    return t.then(this.handlePromiseSuccess.bind(this, n), this.handlePromiseFailure.bind(this, n)), this.pushPendingState(), this.createPromiseConstructorNode(r, n);
  }
  parsePlugin(r, t) {
    let n = this.plugins;
    if (n) for (let a = 0, i = n.length; a < i; a++) {
      let l = n[a];
      if (l.parse.stream && l.test(t)) return _(r, l.tag, l.parse.stream(t, this, { id: r }));
    }
    return s;
  }
  parseStream(r, t) {
    let n = L(r, this.parseSpecialReference(4), []);
    return this.pushPendingState(), t.on({ next: (a) => {
      if (this.alive) {
        let i = this.parseWithError(a);
        i && this.onParse(Re(r, i));
      }
    }, throw: (a) => {
      if (this.alive) {
        let i = this.parseWithError(a);
        i && this.onParse(Oe(r, i));
      }
      this.popPendingState();
    }, return: (a) => {
      if (this.alive) {
        let i = this.parseWithError(a);
        i && this.onParse(Ce(r, i));
      }
      this.popPendingState();
    } }), n;
  }
  parseWithError(r) {
    try {
      return this.parse(r);
    } catch (t) {
      return this.onError(t), s;
    }
  }
  start(r) {
    let t = this.parseWithError(r);
    t && (this.onParseInternal(t, true), this.initial = false, this.flush(), this.pending <= 0 && this.destroy());
  }
  destroy() {
    this.alive && (this.onDone(), this.alive = false);
  }
  isAlive() {
    return this.alive;
  }
};
var G = class extends oe {
  constructor() {
    super(...arguments);
    this.mode = "cross";
  }
};
async function go(o2, e = {}) {
  let r = m(e.plugins);
  return await new $({ plugins: r, disabledFeatures: e.disabledFeatures, refs: e.refs }).parseTop(o2);
}
function So(o2, e) {
  let r = m(e.plugins), t = new G({ plugins: r, refs: e.refs, disabledFeatures: e.disabledFeatures, onParse: e.onParse, onError: e.onError, onDone: e.onDone });
  return t.start(o2), t.destroy.bind(t);
}
var ne = class extends F {
  constructor(r) {
    super(r);
    this.mode = "vanilla";
    this.marked = new Set(r.markedRefs);
  }
  assignIndexedValue(r, t) {
    return this.marked.has(r) && this.refs.set(r, t), t;
  }
};
function Lo(o2, e = {}) {
  let r = m(e.plugins);
  return new ne({ plugins: r, markedRefs: o2.m }).deserializeTop(o2.t);
}
export {
  Js as J,
  Lo as L,
  So as S,
  an as a,
  go as g,
  ln as l,
  te as t
};
