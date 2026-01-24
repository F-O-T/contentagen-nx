import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Img = reactExports.forwardRef(({ alt, src, width, height, style, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("img", {
  ...props,
  alt,
  height,
  ref,
  src,
  style: {
    display: "block",
    outline: "none",
    border: "none",
    textDecoration: "none",
    ...style
  },
  width
}));
Img.displayName = "Img";
export {
  Img as I
};
