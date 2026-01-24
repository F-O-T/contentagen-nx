import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { S as Slot } from "../_chunks/_libs/@radix-ui/react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    defaultVariants: {
      variant: "default"
    },
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90"
      }
    }
  }
);
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span";
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Comp,
    {
      className: cn(badgeVariants({ variant }), className),
      "data-slot": "badge",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/badge.tsx",
      lineNumber: 37,
      columnNumber: 7
    },
    this
  );
}
export {
  Badge as B
};
