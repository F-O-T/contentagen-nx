import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const marginProperties = [
  "margin",
  "marginTop",
  "marginBottom",
  "marginRight",
  "marginLeft",
  "marginInline",
  "marginBlock",
  "marginBlockStart",
  "marginBlockEnd",
  "marginInlineStart",
  "marginInlineEnd"
];
const Body = reactExports.forwardRef(({ children, style, ...props }, ref) => {
  const bodyStyle = {
    background: style?.background,
    backgroundColor: style?.backgroundColor
  };
  if (style) for (const property of marginProperties) bodyStyle[property] = style[property] !== void 0 ? 0 : void 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("body", {
    ...props,
    style: bodyStyle,
    ref,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("table", {
      border: 0,
      width: "100%",
      cellPadding: "0",
      cellSpacing: "0",
      role: "presentation",
      align: "center",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", {
        style,
        children
      }) }) })
    })
  });
});
Body.displayName = "Body";
export {
  Body as B
};
