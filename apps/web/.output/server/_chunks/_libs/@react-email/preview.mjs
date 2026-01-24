import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const PREVIEW_MAX_LENGTH = 150;
const Preview = reactExports.forwardRef(({ children = "", ...props }, ref) => {
  const text = (Array.isArray(children) ? children.join("") : children).substring(0, PREVIEW_MAX_LENGTH);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
    style: {
      display: "none",
      overflow: "hidden",
      lineHeight: "1px",
      opacity: 0,
      maxHeight: 0,
      maxWidth: 0
    },
    "data-skip-in-text": true,
    ...props,
    ref,
    children: [text, renderWhiteSpace(text)]
  });
});
Preview.displayName = "Preview";
const whiteSpaceCodes = " ‌​‍‎‏\uFEFF";
const renderWhiteSpace = (text) => {
  if (text.length >= PREVIEW_MAX_LENGTH) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: whiteSpaceCodes.repeat(PREVIEW_MAX_LENGTH - text.length) });
};
export {
  Preview as P
};
