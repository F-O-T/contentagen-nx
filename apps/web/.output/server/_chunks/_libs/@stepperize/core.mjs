function e(...e2) {
  return { getAll: () => e2, get: (n2) => e2.find((e3) => e3.id === n2), getIndex: (n2) => e2.findIndex((e3) => e3.id === n2), getByIndex: (n2) => e2[n2], getFirst: () => e2[0], getLast: () => e2[e2.length - 1], getNext: (n2) => e2[e2.findIndex((e3) => e3.id === n2) + 1], getPrev: (n2) => e2[e2.findIndex((e3) => e3.id === n2) - 1], getNeighbors(n2) {
    const t2 = e2.findIndex((e3) => e3.id === n2);
    return { prev: t2 > 0 ? e2[t2 - 1] : null, next: t2 < e2.length - 1 ? e2[t2 + 1] : null };
  } };
}
function n(e2, n2) {
  return Math.max(e2.findIndex((e3) => e3.id === n2), 0);
}
function t(e2, n2) {
  return e2.reduce((e3, t2) => (e3[t2.id] = n2?.[t2.id] ?? null, e3), {});
}
function r(e2, n2, t2) {
  return { switch(e3) {
    const t3 = e3[n2.id];
    return t3?.(n2);
  }, when(n3, r2, i2) {
    const d2 = e2[t2];
    return (Array.isArray(n3) ? d2.id === n3[0] && n3.slice(1).every(Boolean) : d2.id === n3) ? r2?.(d2) : i2?.(d2);
  }, match(n3, t3) {
    const r2 = e2.find((e3) => e3.id === n3);
    if (!r2) return null;
    const i2 = t3[n3];
    return i2?.(r2) ?? null;
  } };
}
async function i(e2, n2) {
  const t2 = await e2();
  return !n2 || false !== t2;
}
var d = async ({ stepper: e2, direction: n2, callback: t2, before: r2, targetId: d2 }) => {
  (!r2 || await i(t2, true)) && ("next" === n2 ? e2.next() : "prev" === n2 ? e2.prev() : "goTo" === n2 && d2 && e2.goTo(d2), r2 || await i(t2, false));
}, o = (e2, n2, t2) => {
  n2 < 0 && s({ steps: e2, newIndex: n2, direction: "next", reason: "it is the first step" }), n2 >= e2.length && s({ steps: e2, newIndex: n2, direction: "prev", reason: "it is the last step" }), t2(n2);
}, s = ({ steps: e2, newIndex: n2, direction: t2, reason: r2 }) => {
  const i2 = e2[n2]?.id ?? `index ${n2}`;
  throw new Error(`Cannot navigate ${t2} from step "${i2}": ${r2}`);
};
export {
  d,
  e,
  n,
  o,
  r,
  t
};
