import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { R as Root, I as Image, F as Fallback } from "../_chunks/_libs/@radix-ui/react-avatar.mjs";
function Avatar({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Root,
    {
      className: cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      ),
      "data-slot": "avatar",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/avatar.tsx",
      lineNumber: 12,
      columnNumber: 7
    },
    this
  );
}
function AvatarImage({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Image,
    {
      className: cn("aspect-square size-full", className),
      "data-slot": "avatar-image",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/avatar.tsx",
      lineNumber: 28,
      columnNumber: 7
    },
    this
  );
}
function AvatarFallback({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Fallback,
    {
      className: cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      ),
      "data-slot": "avatar-fallback",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/avatar.tsx",
      lineNumber: 41,
      columnNumber: 7
    },
    this
  );
}
export {
  Avatar as A,
  AvatarImage as a,
  AvatarFallback as b
};
