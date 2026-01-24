import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { P as Provider, R as Root3, T as Trigger, a as Portal, C as Content2, A as Arrow2 } from "../_chunks/_libs/@radix-ui/react-tooltip.mjs";
function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Provider,
    {
      "data-slot": "tooltip-provider",
      delayDuration,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/tooltip.tsx",
      lineNumber: 12,
      columnNumber: 7
    },
    this
  );
}
function Tooltip({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipProvider, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Root3, { "data-slot": "tooltip", ...props }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/tooltip.tsx",
    lineNumber: 25,
    columnNumber: 10
  }, this) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/tooltip.tsx",
    lineNumber: 24,
    columnNumber: 7
  }, this);
}
function TooltipTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Trigger, { "data-slot": "tooltip-trigger", ...props }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/tooltip.tsx",
    lineNumber: 33,
    columnNumber: 11
  }, this);
}
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Portal, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Content2,
    {
      className: cn(
        "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
        className
      ),
      "data-slot": "tooltip-content",
      sideOffset,
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Arrow2, { className: "bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/tooltip.tsx",
          lineNumber: 54,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/tooltip.tsx",
      lineNumber: 44,
      columnNumber: 10
    },
    this
  ) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/tooltip.tsx",
    lineNumber: 43,
    columnNumber: 7
  }, this);
}
export {
  TooltipProvider as T,
  Tooltip as a,
  TooltipTrigger as b,
  TooltipContent as c
};
