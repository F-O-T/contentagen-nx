import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Html = reactExports.forwardRef(({ children, lang = "en", dir = "ltr", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("html", {
  ...props,
  dir,
  lang,
  ref,
  children
}));
Html.displayName = "Html";
export {
  Html as H
};
