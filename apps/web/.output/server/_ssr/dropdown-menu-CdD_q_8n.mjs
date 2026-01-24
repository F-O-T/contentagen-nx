import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { R as Root2, T as Trigger, P as Portal2, C as Content2, I as Item2, S as Separator2, L as Label2, G as Group2 } from "../_chunks/_libs/@radix-ui/react-dropdown-menu.mjs";
function DropdownMenu({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Root2, { "data-slot": "dropdown-menu", ...props }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
    lineNumber: 11,
    columnNumber: 11
  }, this);
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Trigger,
    {
      "data-slot": "dropdown-menu-trigger",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
      lineNumber: 29,
      columnNumber: 7
    },
    this
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Portal2, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Content2,
    {
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      ),
      "data-slot": "dropdown-menu-content",
      sideOffset,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
      lineNumber: 43,
      columnNumber: 10
    },
    this
  ) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
    lineNumber: 42,
    columnNumber: 7
  }, this);
}
function DropdownMenuGroup({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Group2, { "data-slot": "dropdown-menu-group", ...props }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
    lineNumber: 60,
    columnNumber: 7
  }, this);
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Item2,
    {
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      "data-inset": inset,
      "data-slot": "dropdown-menu-item",
      "data-variant": variant,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
      lineNumber: 74,
      columnNumber: 7
    },
    this
  );
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Label2,
    {
      className: cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      ),
      "data-inset": inset,
      "data-slot": "dropdown-menu-label",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
      lineNumber: 156,
      columnNumber: 7
    },
    this
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Separator2,
    {
      className: cn("bg-border -mx-1 my-1 h-px", className),
      "data-slot": "dropdown-menu-separator",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/dropdown-menu.tsx",
      lineNumber: 173,
      columnNumber: 7
    },
    this
  );
}
export {
  DropdownMenu as D,
  DropdownMenuTrigger as a,
  DropdownMenuContent as b,
  DropdownMenuLabel as c,
  DropdownMenuSeparator as d,
  DropdownMenuGroup as e,
  DropdownMenuItem as f
};
