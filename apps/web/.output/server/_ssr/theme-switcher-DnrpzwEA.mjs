import { r as reactExports, c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { t as useTheme, c as cn, B as Button } from "./router-HyRWfAJI.mjs";
import { _ as _e } from "../_libs/cmdk.mjs";
import { R as Root2, T as Trigger, P as Portal, C as Content2 } from "../_chunks/_libs/@radix-ui/react-popover.mjs";
import { u as useVirtualizer } from "../_chunks/_libs/@tanstack/react-virtual.mjs";
import { T as TooltipProvider, a as Tooltip, b as TooltipTrigger, c as TooltipContent } from "./tooltip-qHzlPmbI.mjs";
import { I as Monitor, a1 as Sun, a2 as Moon, a3 as ChevronsUpDown, u as Plus, C as Check, a4 as Search } from "../_libs/lucide-react.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
function Command({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    _e,
    {
      className: cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className
      ),
      "data-slot": "command",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
      lineNumber: 20,
      columnNumber: 7
    },
    this
  );
}
function CommandInput({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: "flex h-9 items-center gap-2 border-b px-3",
      "data-slot": "command-input-wrapper",
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Search, { className: "size-4 shrink-0 opacity-50" }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
          lineNumber: 71,
          columnNumber: 10
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          _e.Input,
          {
            className: cn(
              "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
              className
            ),
            "data-slot": "command-input",
            ...props
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
            lineNumber: 72,
            columnNumber: 10
          },
          this
        )
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
      lineNumber: 67,
      columnNumber: 7
    },
    this
  );
}
const CommandList = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    _e.List,
    {
      className: cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className
      ),
      "data-slot": "command-list",
      ref,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
      lineNumber: 89,
      columnNumber: 7
    },
    void 0
  );
});
CommandList.displayName = "CommandList";
function CommandEmpty({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    _e.Empty,
    {
      className: "py-6 text-center text-sm",
      "data-slot": "command-empty",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
      lineNumber: 106,
      columnNumber: 7
    },
    this
  );
}
function CommandGroup({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    _e.Group,
    {
      className: cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className
      ),
      "data-slot": "command-group",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
      lineNumber: 119,
      columnNumber: 7
    },
    this
  );
}
function CommandItem({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    _e.Item,
    {
      className: cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      "data-slot": "command-item",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/command.tsx",
      lineNumber: 148,
      columnNumber: 7
    },
    this
  );
}
function Popover({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Root2, { "data-slot": "popover", ...props }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/popover.tsx",
    lineNumber: 10,
    columnNumber: 11
  }, this);
}
function PopoverTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Trigger, { "data-slot": "popover-trigger", ...props }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/popover.tsx",
    lineNumber: 16,
    columnNumber: 11
  }, this);
}
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Portal, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Content2,
    {
      align,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
        className
      ),
      "data-slot": "popover-content",
      sideOffset,
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/popover.tsx",
      lineNumber: 27,
      columnNumber: 10
    },
    this
  ) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/popover.tsx",
    lineNumber: 26,
    columnNumber: 7
  }, this);
}
function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className,
  disabled = false,
  onBlur,
  onCreate,
  createLabel = "Criar"
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [search, setSearch] = reactExports.useState("");
  const [parentNode, setParentNode] = reactExports.useState(
    null
  );
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = reactExports.useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return options;
    return options.filter((option) => {
      return option.label.toLowerCase().includes(searchTerm);
    });
  }, [options, search]);
  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    estimateSize: () => 35,
    getScrollElement: () => parentNode
  });
  const virtualItems = virtualizer.getVirtualItems();
  const refCallback = reactExports.useCallback((node) => {
    if (node) {
      setParentNode(node);
    }
  }, []);
  const handleCreate = () => {
    const trimmedSearch = search.trim();
    if (trimmedSearch && onCreate) {
      onCreate(trimmedSearch);
      setSearch("");
      setOpen(false);
    }
  };
  const showCreateOption = onCreate && search.trim().length > 0 && filteredOptions.length === 0;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Popover, { onOpenChange: setOpen, open, children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      Button,
      {
        "aria-expanded": open,
        className: cn("flex truncate items-center gap-2", className),
        disabled,
        onBlur,
        role: "combobox",
        variant: "outline",
        children: [
          selectedOption ? selectedOption.label : placeholder,
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ChevronsUpDown, { className: "size-4" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
            lineNumber: 108,
            columnNumber: 16
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
        lineNumber: 99,
        columnNumber: 13
      },
      this
    ) }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
      lineNumber: 98,
      columnNumber: 10
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(PopoverContent, { className: " p-0", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Command, { children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
        CommandInput,
        {
          onValueChange: setSearch,
          placeholder: searchPlaceholder,
          value: search
        },
        void 0,
        false,
        {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
          lineNumber: 113,
          columnNumber: 16
        },
        this
      ),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CommandList, { ref: refCallback, children: [
        showCreateOption ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CommandGroup, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          CommandItem,
          {
            onSelect: handleCreate,
            value: `create-${search.trim()}`,
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Plus, { className: "mr-2 h-4 w-4" }, void 0, false, {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
                lineNumber: 125,
                columnNumber: 28
              }, this),
              createLabel,
              ' "',
              search.trim(),
              '"'
            ]
          },
          void 0,
          true,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
            lineNumber: 121,
            columnNumber: 25
          },
          this
        ) }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
          lineNumber: 120,
          columnNumber: 22
        }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CommandEmpty, { children: emptyMessage }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
          lineNumber: 130,
          columnNumber: 22
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CommandGroup, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            style: {
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%"
            },
            children: virtualItems.length > 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                style: {
                  left: 0,
                  position: "absolute",
                  top: 0,
                  transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                  width: "100%"
                },
                children: virtualItems.map((virtualRow) => {
                  const option = filteredOptions[virtualRow.index];
                  if (!option) return null;
                  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                    CommandItem,
                    {
                      onSelect: (currentValue) => {
                        onValueChange?.(
                          currentValue === value ? "" : currentValue
                        );
                        setOpen(false);
                      },
                      ref: virtualizer.measureElement,
                      value: option.value,
                      children: [
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                          Check,
                          {
                            className: cn(
                              "mr-2 h-4 w-4",
                              value === option.value ? "opacity-100" : "opacity-0"
                            )
                          },
                          void 0,
                          false,
                          {
                            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
                            lineNumber: 170,
                            columnNumber: 40
                          },
                          this
                        ),
                        option.label
                      ]
                    },
                    option.value,
                    true,
                    {
                      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
                      lineNumber: 157,
                      columnNumber: 37
                    },
                    this
                  );
                })
              },
              void 0,
              false,
              {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
                lineNumber: 141,
                columnNumber: 28
              },
              this
            ) : null
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
            lineNumber: 133,
            columnNumber: 22
          },
          this
        ) }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
          lineNumber: 132,
          columnNumber: 19
        }, this)
      ] }, void 0, true, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
        lineNumber: 118,
        columnNumber: 16
      }, this)
    ] }, void 0, true, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
      lineNumber: 112,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
      lineNumber: 111,
      columnNumber: 10
    }, this)
  ] }, void 0, true, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/combobox.tsx",
    lineNumber: 97,
    columnNumber: 7
  }, this);
}
function LanguageCommand({ compact = false }) {
  const languageOptions = reactExports.useMemo(
    () => [
      {
        flag: "🇧🇷",
        name: "Português",
        value: "pt-BR"
      }
    ],
    []
  );
  const comboboxOptions = reactExports.useMemo(
    () => languageOptions.map((option) => ({
      label: compact ? option.flag : `${option.flag} ${option.name}`,
      value: option.value
    })),
    [languageOptions, compact]
  );
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Combobox,
    {
      className: "gap-2 flex items-center justify-center",
      emptyMessage: "Nenhum idioma encontrado.",
      onValueChange: () => {
      },
      options: comboboxOptions,
      searchPlaceholder: "Pesquisar idiomas...",
      value: "pt-BR"
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/language-command.tsx",
      lineNumber: 30,
      columnNumber: 7
    },
    this
  );
}
const ThemeSwitcher = ({ className }) => {
  const themes = [
    {
      icon: Monitor,
      key: "system",
      label: "Tema do sistema"
    },
    {
      icon: Sun,
      key: "light",
      label: "Tema claro"
    },
    {
      icon: Moon,
      key: "dark",
      label: "Tema escuro"
    }
  ];
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = reactExports.useState(false);
  const handleThemeClick = reactExports.useCallback(
    (themeKey) => {
      if (!themeKey || themeKey.trim() === "") {
        themeKey = "system";
      }
      setTheme(themeKey);
    },
    [setTheme]
  );
  reactExports.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipProvider, { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border",
        className
      ),
      children: themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Tooltip, { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              "aria-label": label,
              className: "relative h-6 w-6 rounded-full",
              onClick: () => handleThemeClick(
                key
              ),
              type: "button",
              children: [
                isActive && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  motion.div,
                  {
                    className: "absolute inset-0 rounded-full bg-muted",
                    layoutId: "activeTheme",
                    transition: { duration: 0.5, type: "spring" }
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
                    lineNumber: 83,
                    columnNumber: 31
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  Icon,
                  {
                    className: cn(
                      "relative z-10 m-auto h-4 w-4",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
                    lineNumber: 89,
                    columnNumber: 28
                  },
                  void 0
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
              lineNumber: 72,
              columnNumber: 25
            },
            void 0
          ) }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
            lineNumber: 71,
            columnNumber: 22
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(TooltipContent, { children: label }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
            lineNumber: 99,
            columnNumber: 22
          }, void 0)
        ] }, key, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
          lineNumber: 70,
          columnNumber: 19
        }, void 0);
      })
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
      lineNumber: 60,
      columnNumber: 10
    },
    void 0
  ) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/theme-switcher.tsx",
    lineNumber: 59,
    columnNumber: 7
  }, void 0);
};
export {
  LanguageCommand as L,
  ThemeSwitcher as T
};
