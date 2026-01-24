import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Section = reactExports.forwardRef(({ children, style, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("table", {
    align: "center",
    width: "100%",
    border: 0,
    cellPadding: "0",
    cellSpacing: "0",
    role: "presentation",
    ...props,
    ref,
    style,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children }) }) })
  });
});
Section.displayName = "Section";
export {
  Section as S
};
