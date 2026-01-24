import { R as Ri, k as ki, a as hi } from "../../../_libs/lexical.mjs";
function o(o2) {
  const i = window.location.origin, a = (a2) => {
    if (a2.origin !== i) return;
    const r = o2.getRootElement();
    if (document.activeElement !== r) return;
    const s = a2.data;
    if ("string" == typeof s) {
      let i2;
      try {
        i2 = JSON.parse(s);
      } catch (e) {
        return;
      }
      if (i2 && "nuanria_messaging" === i2.protocol && "request" === i2.type) {
        const r2 = i2.payload;
        if (r2 && "makeChanges" === r2.functionId) {
          const i3 = r2.args;
          if (i3) {
            const [r3, s2, c, g, d, f] = i3;
            o2.update((() => {
              const o3 = Ri();
              if (ki(o3)) {
                const e = o3.anchor;
                let t = e.getNode(), i4 = 0, f2 = 0;
                if (hi(t) && r3 >= 0 && s2 >= 0 && (i4 = r3, f2 = r3 + s2, o3.setTextNodeRange(t, i4, t, f2)), i4 === f2 && "" === c || (o3.insertRawText(c), t = e.getNode()), hi(t)) {
                  i4 = g, f2 = g + d;
                  const e2 = t.getTextContentSize();
                  i4 = i4 > e2 ? e2 : i4, f2 = f2 > e2 ? e2 : f2, o3.setTextNodeRange(t, i4, t, f2);
                }
                a2.stopImmediatePropagation();
              }
            }));
          }
        }
      }
    }
  };
  return window.addEventListener("message", a, true), () => {
    window.removeEventListener("message", a, true);
  };
}
export {
  o
};
