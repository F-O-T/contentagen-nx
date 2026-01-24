import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { B as Button, c as cn } from "./router-HyRWfAJI.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { a5 as CircleAlert } from "../_libs/lucide-react.mjs";
function Empty({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
        className
      ),
      "data-slot": "empty",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/empty.tsx",
      lineNumber: 6,
      columnNumber: 7
    },
    this
  );
}
function EmptyHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className
      ),
      "data-slot": "empty-header",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/empty.tsx",
      lineNumber: 19,
      columnNumber: 7
    },
    this
  );
}
const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      variant: "default"
    },
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6"
      }
    }
  }
);
function EmptyMedia({
  className,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(emptyMediaVariants({ className, variant })),
      "data-slot": "empty-icon",
      "data-variant": variant,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/empty.tsx",
      lineNumber: 51,
      columnNumber: 7
    },
    this
  );
}
function EmptyTitle({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "text-lg font-serif font-medium tracking-tight",
        className
      ),
      "data-slot": "empty-title",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/empty.tsx",
      lineNumber: 62,
      columnNumber: 7
    },
    this
  );
}
function EmptyDescription({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        className
      ),
      "data-slot": "empty-description",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/empty.tsx",
      lineNumber: 75,
      columnNumber: 7
    },
    this
  );
}
function EmptyContent({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
        className
      ),
      "data-slot": "empty-content",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/empty.tsx",
      lineNumber: 88,
      columnNumber: 7
    },
    this
  );
}
function ErrorFallback({
  resetErrorBoundary,
  errorTitle = "Error loading content",
  errorDescription = "Something went wrong while loading this content. Please try again.",
  retryText = "Retry"
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Empty, { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(EmptyHeader, { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CircleAlert, { className: "size-6" }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
        lineNumber: 29,
        columnNumber: 16
      }, this) }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
        lineNumber: 28,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(EmptyTitle, { children: errorTitle }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
        lineNumber: 31,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(EmptyDescription, { children: errorDescription }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
        lineNumber: 32,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
      lineNumber: 27,
      columnNumber: 10
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(EmptyContent, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Button, { onClick: resetErrorBoundary, size: "sm", variant: "outline", children: retryText }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
      lineNumber: 35,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
      lineNumber: 34,
      columnNumber: 10
    }, this)
  ] }, void 0, true, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
    lineNumber: 26,
    columnNumber: 7
  }, this);
}
function createErrorFallback(options) {
  return function CustomErrorFallback(props) {
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ErrorFallback, { ...options, ...props }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/error-fallback.tsx",
      lineNumber: 45,
      columnNumber: 14
    }, this);
  };
}
export {
  Empty as E,
  EmptyContent as a,
  EmptyMedia as b,
  createErrorFallback as c,
  EmptyTitle as d,
  EmptyDescription as e,
  EmptyHeader as f
};
