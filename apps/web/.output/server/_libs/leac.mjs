const e = /\n/g;
function n(n2) {
  const o2 = [...n2.matchAll(e)].map(((e2) => e2.index || 0));
  o2.unshift(-1);
  const s2 = t(o2, 0, o2.length);
  return (e2) => r(s2, e2);
}
function t(e2, n2, r2) {
  if (r2 - n2 == 1) return { offset: e2[n2], index: n2 + 1 };
  const o2 = Math.ceil((n2 + r2) / 2), s2 = t(e2, n2, o2), l2 = t(e2, o2, r2);
  return { offset: s2.offset, low: s2, high: l2 };
}
function r(e2, n2) {
  return (function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "index");
  })(e2) ? { line: e2.index, column: n2 - e2.offset } : r(e2.high.offset < n2 ? e2.high : e2.low, n2);
}
function o(e2, t2 = "", r2 = {}) {
  const o2 = "string" != typeof t2 ? t2 : r2, l2 = "string" == typeof t2 ? t2 : "", c2 = e2.map(s), f = !!o2.lineNumbers;
  return function(e3, t3 = 0) {
    const r3 = f ? n(e3) : () => ({ line: 0, column: 0 });
    let o3 = t3;
    const s2 = [];
    e: for (; o3 < e3.length; ) {
      let n2 = false;
      for (const t4 of c2) {
        t4.regex.lastIndex = o3;
        const c3 = t4.regex.exec(e3);
        if (c3 && c3[0].length > 0) {
          if (!t4.discard) {
            const e4 = r3(o3), n3 = "string" == typeof t4.replace ? c3[0].replace(new RegExp(t4.regex.source, t4.regex.flags), t4.replace) : c3[0];
            s2.push({ state: l2, name: t4.name, text: n3, offset: o3, len: c3[0].length, line: e4.line, column: e4.column });
          }
          if (o3 = t4.regex.lastIndex, n2 = true, t4.push) {
            const n3 = t4.push(e3, o3);
            s2.push(...n3.tokens), o3 = n3.offset;
          }
          if (t4.pop) break e;
          break;
        }
      }
      if (!n2) break;
    }
    return { tokens: s2, offset: o3, complete: e3.length <= o3 };
  };
}
function s(e2, n2) {
  return { ...e2, regex: l(e2, n2) };
}
function l(e2, n2) {
  if (0 === e2.name.length) throw new Error(`Rule #${n2} has empty name, which is not allowed.`);
  if ((function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "regex");
  })(e2)) return (function(e3) {
    if (e3.global) throw new Error(`Regular expression /${e3.source}/${e3.flags} contains the global flag, which is not allowed.`);
    return e3.sticky ? e3 : new RegExp(e3.source, e3.flags + "y");
  })(e2.regex);
  if ((function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "str");
  })(e2)) {
    if (0 === e2.str.length) throw new Error(`Rule #${n2} ("${e2.name}") has empty "str" property, which is not allowed.`);
    return new RegExp(c(e2.str), "y");
  }
  return new RegExp(c(e2.name), "y");
}
function c(e2) {
  return e2.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, "\\$&");
}
export {
  o
};
