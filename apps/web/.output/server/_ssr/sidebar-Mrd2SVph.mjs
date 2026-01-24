import { r as reactExports, c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { c as cn, b as Sheet, d as SheetContent, e as SheetHeader, f as SheetTitle, g as SheetDescription, B as Button } from "./router-HyRWfAJI.mjs";
import { T as TooltipProvider, a as Tooltip, b as TooltipTrigger, c as TooltipContent } from "./tooltip-qHzlPmbI.mjs";
import { u as useIsMobile } from "./use-mobile-93PxuXfB.mjs";
import { S as Slot } from "../_chunks/_libs/@radix-ui/react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { j as Menu, f as ChevronLeft, c as ChevronRight } from "../_libs/lucide-react.mjs";
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SidebarContext = reactExports.createContext(null);
function useSidebar() {
  const context = reactExports.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = reactExports.useState(false);
  const [_open, _setOpen] = reactExports.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = reactExports.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );
  const toggleSidebar = reactExports.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  reactExports.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = reactExports.useMemo(
    () => ({
      isMobile,
      open,
      openMobile,
      setOpen,
      setOpenMobile,
      state,
      toggleSidebar
    }),
    [
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar
    ]
  );
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
        className
      ),
      "data-slot": "sidebar-wrapper",
      style: {
        "--sidebar-width": SIDEBAR_WIDTH,
        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        ...style
      },
      ...props,
      children
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 142,
      columnNumber: 13
    },
    this
  ) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
    lineNumber: 141,
    columnNumber: 10
  }, this) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
    lineNumber: 140,
    columnNumber: 7
  }, this);
}
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        className: cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        ),
        "data-slot": "sidebar",
        ...props,
        children
      },
      void 0,
      false,
      {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
        lineNumber: 180,
        columnNumber: 10
      },
      this
    );
  }
  if (isMobile) {
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Sheet, { onOpenChange: setOpenMobile, open: openMobile, ...props, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      SheetContent,
      {
        className: "bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden",
        "data-mobile": "true",
        "data-sidebar": "sidebar",
        "data-slot": "sidebar",
        side,
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(SheetHeader, { className: "sr-only", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(SheetTitle, { children: "Sidebar" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
              lineNumber: 209,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(SheetDescription, { children: "Displays the mobile sidebar." }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
              lineNumber: 210,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
            lineNumber: 208,
            columnNumber: 16
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex h-full w-full flex-col", children }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
            lineNumber: 214,
            columnNumber: 16
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
        lineNumber: 196,
        columnNumber: 13
      },
      this
    ) }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 195,
      columnNumber: 10
    }, this);
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: "group peer text-sidebar-foreground hidden md:block",
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-side": side,
      "data-slot": "sidebar",
      "data-state": state,
      "data-variant": variant,
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: cn(
              "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
            ),
            "data-slot": "sidebar-gap"
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
            lineNumber: 230,
            columnNumber: 10
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: cn(
              "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
              side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              // Adjust the padding for floating and inset variants.
              variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
              className
            ),
            "data-slot": "sidebar-container",
            ...props,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                className: "bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm",
                "data-sidebar": "sidebar",
                "data-slot": "sidebar-inner",
                children
              },
              void 0,
              false,
              {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
                lineNumber: 256,
                columnNumber: 13
              },
              this
            )
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
            lineNumber: 241,
            columnNumber: 10
          },
          this
        )
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 221,
      columnNumber: 7
    },
    this
  );
}
function SidebarTrigger({
  className,
  onClick,
  ...props
}) {
  const { toggleSidebar, state, isMobile } = useSidebar();
  const tooltipText = state === "expanded" ? "Ocultar" : "Abrir";
  const button = /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Button,
    {
      "aria-label": tooltipText,
      className: cn("size-7", className),
      "data-sidebar": "trigger",
      "data-slot": "sidebar-trigger",
      onClick: (event) => {
        onClick?.(event);
        toggleSidebar();
      },
      size: "icon",
      variant: "ghost",
      ...props,
      children: isMobile ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Menu, {}, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
        lineNumber: 292,
        columnNumber: 13
      }, this) : state === "expanded" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ChevronLeft, {}, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
        lineNumber: 294,
        columnNumber: 13
      }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ChevronRight, {}, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
        lineNumber: 296,
        columnNumber: 13
      }, this)
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 278,
      columnNumber: 7
    },
    this
  );
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Tooltip, { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipTrigger, { asChild: true, children: button }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 303,
      columnNumber: 10
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipContent, { children: tooltipText }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 304,
      columnNumber: 10
    }, this)
  ] }, void 0, true, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
    lineNumber: 302,
    columnNumber: 7
  }, this);
}
function SidebarInset({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "main",
    {
      className: cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      ),
      "data-slot": "sidebar-inset",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 336,
      columnNumber: 7
    },
    this
  );
}
function SidebarHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("flex flex-col gap-2 p-2", className),
      "data-sidebar": "header",
      "data-slot": "sidebar-header",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 364,
      columnNumber: 7
    },
    this
  );
}
function SidebarContent({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      ),
      "data-sidebar": "content",
      "data-slot": "sidebar-content",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 400,
      columnNumber: 7
    },
    this
  );
}
function SidebarGroup({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("relative flex w-full min-w-0 flex-col p-2", className),
      "data-sidebar": "group",
      "data-slot": "sidebar-group",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 414,
      columnNumber: 7
    },
    this
  );
}
function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Comp,
    {
      className: cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      ),
      "data-sidebar": "group-label",
      "data-slot": "sidebar-group-label",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 431,
      columnNumber: 7
    },
    this
  );
}
function SidebarGroupContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("w-full text-sm", className),
      "data-sidebar": "group-content",
      "data-slot": "sidebar-group-content",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 472,
      columnNumber: 7
    },
    this
  );
}
function SidebarMenu({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "ul",
    {
      className: cn("flex w-full min-w-0 flex-col gap-1", className),
      "data-sidebar": "menu",
      "data-slot": "sidebar-menu",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 483,
      columnNumber: 7
    },
    this
  );
}
function SidebarMenuItem({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "li",
    {
      className: cn("group/menu-item relative", className),
      "data-sidebar": "menu-item",
      "data-slot": "sidebar-menu-item",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 494,
      columnNumber: 7
    },
    this
  );
}
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default"
    },
    variants: {
      size: {
        default: "h-8 text-sm",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
        sm: "h-7 text-xs"
      },
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
      }
    }
  }
);
function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Comp,
    {
      className: cn(sidebarMenuButtonVariants({ size, variant }), className),
      "data-active": isActive,
      "data-sidebar": "menu-button",
      "data-size": size,
      "data-slot": "sidebar-menu-button",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 543,
      columnNumber: 7
    },
    this
  );
  if (!tooltip) {
    return button;
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip
    };
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Tooltip, { children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipTrigger, { asChild: true, children: button }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
      lineNumber: 565,
      columnNumber: 10
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      TooltipContent,
      {
        align: "center",
        hidden: state !== "collapsed" || isMobile,
        side: "right",
        ...tooltip
      },
      void 0,
      false,
      {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
        lineNumber: 566,
        columnNumber: 10
      },
      this
    )
  ] }, void 0, true, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/sidebar.tsx",
    lineNumber: 564,
    columnNumber: 7
  }, this);
}
export {
  SidebarProvider as S,
  SidebarInset as a,
  Sidebar as b,
  SidebarHeader as c,
  SidebarContent as d,
  SidebarTrigger as e,
  SidebarMenu as f,
  SidebarMenuItem as g,
  SidebarMenuButton as h,
  SidebarGroup as i,
  SidebarGroupContent as j,
  SidebarGroupLabel as k,
  useSidebar as u
};
