import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Head = reactExports.forwardRef(({ children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs("head", {
  ...props,
  ref,
  children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", {
      content: "text/html; charset=UTF-8",
      httpEquiv: "Content-Type"
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "x-apple-disable-message-reformatting" }),
    children
  ]
}));
Head.displayName = "Head";
export {
  Head as H
};
