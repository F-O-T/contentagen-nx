import { r as reactExports, c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { T as Tooltip, g as Legend, R as ResponsiveContainer } from "../_libs/recharts.mjs";
const THEMES = { dark: ".dark", light: "" };
const ChartContext = reactExports.createContext(null);
function useChart() {
  const context = reactExports.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}
function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}) {
  const uniqueId = reactExports.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ChartContext.Provider, { value: { config }, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
        className
      ),
      "data-chart": chartId,
      "data-slot": "chart",
      ...props,
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ChartStyle, { config, id: chartId }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
          lineNumber: 62,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ResponsiveContainer, { children }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
          lineNumber: 63,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
      lineNumber: 53,
      columnNumber: 10
    },
    this
  ) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
    lineNumber: 52,
    columnNumber: 7
  }, this);
}
const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config2]) => config2.theme || config2.color
  );
  if (!colorConfig.length) {
    return null;
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "style",
    {
      dangerouslySetInnerHTML: {
        __html: Object.entries(THEMES).map(
          ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.[theme] || itemConfig.color;
            return color ? `  --color-${key}: ${color};` : null;
          }).join("\n")}
}
`
        ).join("\n")
      }
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
      lineNumber: 81,
      columnNumber: 7
    },
    void 0
  );
};
const ChartTooltip = Tooltip;
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey
}) {
  const { config } = useChart();
  const tooltipLabel = reactExports.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }
    const [item] = payload;
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;
    if (labelFormatter) {
      return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, payload) }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
        lineNumber: 145,
        columnNumber: 13
      }, this);
    }
    if (!value) {
      return null;
    }
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: cn("font-medium", labelClassName), children: value }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
      lineNumber: 155,
      columnNumber: 14
    }, this);
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey
  ]);
  if (!active || !payload?.length) {
    return null;
  }
  const nestLabel = payload.length === 1 && indicator !== "dot";
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      ),
      children: [
        !nestLabel ? tooltipLabel : null,
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid gap-1.5", children: payload.filter((item) => item.type !== "none").map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(
            config,
            item,
            key
          );
          const indicatorColor = color || item.payload.fill || item.color;
          return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "div",
            {
              className: cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                indicator === "dot" && "items-center"
              ),
              children: formatter && item?.value !== void 0 && item.name ? formatter(
                item.value,
                item.name,
                item,
                index,
                item.payload
              ) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
                itemConfig?.icon ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(itemConfig.icon, {}, void 0, false, {
                  fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                  lineNumber: 212,
                  columnNumber: 34
                }, this) : !hideIndicator && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "div",
                  {
                    className: cn(
                      "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                      {
                        "h-2.5 w-2.5": indicator === "dot",
                        "my-0.5": nestLabel && indicator === "dashed",
                        "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                        "w-1": indicator === "line"
                      }
                    ),
                    style: {
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                    lineNumber: 215,
                    columnNumber: 37
                  },
                  this
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "div",
                  {
                    className: cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    ),
                    children: [
                      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid gap-1.5", children: [
                        nestLabel ? tooltipLabel : null,
                        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-muted-foreground", children: itemConfig?.label || item.name }, void 0, false, {
                          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                          lineNumber: 245,
                          columnNumber: 37
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                        lineNumber: 243,
                        columnNumber: 34
                      }, this),
                      item.value && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-foreground font-mono font-medium tabular-nums", children: item.value.toLocaleString() }, void 0, false, {
                        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                        lineNumber: 250,
                        columnNumber: 37
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                    lineNumber: 237,
                    columnNumber: 31
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                lineNumber: 210,
                columnNumber: 28
              }, this)
            },
            item.dataKey,
            false,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
              lineNumber: 194,
              columnNumber: 22
            },
            this
          );
        }) }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
          lineNumber: 180,
          columnNumber: 10
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
      lineNumber: 173,
      columnNumber: 7
    },
    this
  );
}
const ChartLegend = Legend;
function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey
}) {
  const { config } = useChart();
  if (!payload?.length) {
    return null;
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      ),
      children: payload.filter((item) => item.type !== "none").map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(
          config,
          item,
          key
        );
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "div",
          {
            className: cn(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
            ),
            children: [
              itemConfig?.icon && !hideIcon ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(itemConfig.icon, {}, void 0, false, {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                lineNumber: 310,
                columnNumber: 25
              }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "div",
                {
                  className: "h-2 w-2 shrink-0 rounded-[2px]",
                  style: {
                    backgroundColor: item.color
                  }
                },
                void 0,
                false,
                {
                  fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
                  lineNumber: 312,
                  columnNumber: 25
                },
                this
              ),
              itemConfig?.label
            ]
          },
          item.value,
          true,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
            lineNumber: 303,
            columnNumber: 19
          },
          this
        );
      })
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/chart.tsx",
      lineNumber: 285,
      columnNumber: 7
    },
    this
  );
}
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) {
    return void 0;
  }
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : void 0;
  let configLabelKey = key;
  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key];
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key];
  }
  return configLabelKey in config ? config[configLabelKey] : config[key];
}
export {
  ChartContainer as C,
  ChartTooltip as a,
  ChartTooltipContent as b,
  ChartLegend as c,
  ChartLegendContent as d
};
