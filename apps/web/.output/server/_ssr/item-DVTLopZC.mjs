import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { S as Separator } from "./separator-BiZoIitR.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { S as Slot } from "../_chunks/_libs/@radix-ui/react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
function ItemGroup({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "ul",
    {
      className: cn("group/item-group flex flex-col", className),
      "data-slot": "item-group",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 9,
      columnNumber: 7
    },
    this
  );
}
function ItemSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Separator,
    {
      className: cn("my-0", className),
      "data-slot": "item-separator",
      orientation: "horizontal",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 22,
      columnNumber: 7
    },
    this
  );
}
const itemVariants = cva(
  "group/item flex items-center border border-transparent text-sm rounded-md transition-colors [a]:hover:bg-accent/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    defaultVariants: {
      size: "default",
      variant: "default"
    },
    variants: {
      size: {
        default: "p-4 gap-4 ",
        sm: "py-3 px-4 gap-2.5"
      },
      variant: {
        default: "bg-transparent",
        muted: "bg-muted/50",
        outline: "border-border"
      }
    }
  }
);
function Item({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Comp,
    {
      className: cn(itemVariants({ className, size, variant })),
      "data-size": size,
      "data-slot": "item",
      "data-variant": variant,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 62,
      columnNumber: 7
    },
    this
  );
}
const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5",
  {
    defaultVariants: {
      variant: "default"
    },
    variants: {
      variant: {
        default: "bg-transparent",
        icon: " size-8 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-4",
        image: "size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover"
      }
    }
  }
);
function ItemMedia({
  className,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(itemMediaVariants({ className, variant })),
      "data-slot": "item-media",
      "data-variant": variant,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 94,
      columnNumber: 7
    },
    this
  );
}
function ItemContent({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className
      ),
      "data-slot": "item-content",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 105,
      columnNumber: 7
    },
    this
  );
}
function ItemTitle({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "flex items-center gap-2 text-sm leading-snug font-medium",
        className
      ),
      "data-slot": "item-title",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 118,
      columnNumber: 7
    },
    this
  );
}
function ItemDescription({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "p",
    {
      className: cn(
        "text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      ),
      "data-slot": "item-description",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 131,
      columnNumber: 7
    },
    this
  );
}
function ItemActions({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("flex items-center gap-2", className),
      "data-slot": "item-actions",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/item.tsx",
      lineNumber: 145,
      columnNumber: 7
    },
    this
  );
}
export {
  Item as I,
  ItemMedia as a,
  ItemContent as b,
  ItemTitle as c,
  ItemDescription as d,
  ItemGroup as e,
  ItemActions as f,
  ItemSeparator as g
};
