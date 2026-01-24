import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Hr = reactExports.forwardRef(({ style, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("hr", {
  ...props,
  ref,
  style: {
    width: "100%",
    border: "none",
    borderTop: "1px solid #eaeaea",
    ...style
  }
}));
Hr.displayName = "Hr";
export {
  Hr as H
};
