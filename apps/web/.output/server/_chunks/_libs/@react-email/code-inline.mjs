import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const CodeInline = reactExports.forwardRef(({ children, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        meta ~ .cino {
          display: none !important;
          opacity: 0 !important;
        }

        meta ~ .cio {
          display: block !important;
        }
      ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("code", {
      ...props,
      className: `${props.className ? props.className : ""} cino`,
      children
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
      ...props,
      className: `${props.className ? props.className : ""} cio`,
      ref,
      style: {
        display: "none",
        ...props.style
      },
      children
    })
  ] });
});
CodeInline.displayName = "CodeInline";
export {
  CodeInline as C
};
