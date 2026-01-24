import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      "data-slot": "card",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/card.tsx",
      lineNumber: 6,
      columnNumber: 7
    },
    this
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      "data-slot": "card-header",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/card.tsx",
      lineNumber: 19,
      columnNumber: 7
    },
    this
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("leading-none font-semibold font-serif", className),
      "data-slot": "card-title",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/card.tsx",
      lineNumber: 32,
      columnNumber: 7
    },
    this
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("text-muted-foreground text-sm", className),
      "data-slot": "card-description",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/card.tsx",
      lineNumber: 42,
      columnNumber: 7
    },
    this
  );
}
function CardAction({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      ),
      "data-slot": "card-action",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/card.tsx",
      lineNumber: 52,
      columnNumber: 7
    },
    this
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("px-6", className),
      "data-slot": "card-content",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/card.tsx",
      lineNumber: 65,
      columnNumber: 7
    },
    this
  );
}
export {
  Card as C,
  CardAction as a,
  CardHeader as b,
  CardTitle as c,
  CardDescription as d,
  CardContent as e
};
