import { e, n, t, r, d, o } from "./core.mjs";
import { r as reactExports } from "../../../_libs/react.mjs";
var s = (...s2) => {
  const c = reactExports.createContext(null), p = e(...s2), l = (e2) => {
    const { initialStep: c2, initialMetadata: p2 } = e2 ?? {}, l2 = reactExports.useMemo(() => n(s2, c2), [c2]), [d$1, f] = reactExports.useState(l2), [b, u] = reactExports.useState(() => t(s2, p2)), v = reactExports.useMemo(() => {
      const e3 = s2[d$1], n$1 = d$1 === s2.length - 1;
      return { all: s2, current: e3, isLast: n$1, isFirst: 0 === d$1, metadata: b, setMetadata(e4, t2) {
        u((a) => a[e4] === t2 ? a : { ...a, [e4]: t2 });
      }, getMetadata: (e4) => b[e4], resetMetadata(e4) {
        u(t(s2, e4 ? p2 : void 0));
      }, next() {
        o(s2, d$1 + 1, (e4) => {
          f(e4);
        });
      }, prev() {
        o(s2, d$1 - 1, (e4) => {
          f(e4);
        });
      }, get: (e4) => s2.find((t2) => t2.id === e4), goTo(e4) {
        const t2 = s2.findIndex((t3) => t3.id === e4);
        if (-1 === t2) throw new Error(`Step with id "${e4}" not found.`);
        o(s2, t2, (e5) => {
          f(e5);
        });
      }, reset() {
        o(s2, n(s2, c2), (e4) => {
          f(e4);
        });
      }, async beforeNext(e4) {
        await d({ stepper: v, direction: "next", callback: e4, before: true });
      }, async afterNext(e4) {
        this.next(), await d({ stepper: v, direction: "next", callback: e4, before: false });
      }, async beforePrev(e4) {
        await d({ stepper: v, direction: "prev", callback: e4, before: true });
      }, async afterPrev(e4) {
        this.prev(), await d({ stepper: v, direction: "prev", callback: e4, before: false });
      }, async beforeGoTo(e4, t2) {
        await d({ stepper: v, direction: "goTo", callback: t2, before: true, targetId: e4 });
      }, async afterGoTo(e4, t2) {
        this.goTo(e4), await d({ stepper: v, direction: "goTo", callback: t2, before: false, targetId: e4 });
      }, ...r(s2, e3, d$1) };
    }, [d$1, b]);
    return v;
  };
  return { steps: s2, utils: p, Scoped: ({ initialStep: e2, initialMetadata: t2, children: a }) => reactExports.createElement(c.Provider, { value: l({ initialStep: e2, initialMetadata: t2 }) }, a), useStepper: (e2 = {}) => reactExports.useContext(c) ?? l(e2) };
};
export {
  s
};
