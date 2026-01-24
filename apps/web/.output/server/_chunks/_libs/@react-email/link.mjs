import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Link = reactExports.forwardRef(({ target = "_blank", style, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("a", {
  ...props,
  ref,
  style: {
    color: "#067df7",
    textDecorationLine: "none",
    ...style
  },
  target,
  children: props.children
}));
Link.displayName = "Link";
export {
  Link as L
};
