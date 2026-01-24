import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Container = reactExports.forwardRef(({ children, style, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("table", {
    align: "center",
    width: "100%",
    ...props,
    border: 0,
    cellPadding: "0",
    cellSpacing: "0",
    ref,
    role: "presentation",
    style: {
      maxWidth: "37.5em",
      ...style
    },
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", {
      style: { width: "100%" },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children })
    }) })
  });
});
Container.displayName = "Container";
export {
  Container as C
};
