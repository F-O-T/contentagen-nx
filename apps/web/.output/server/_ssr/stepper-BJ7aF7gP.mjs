import { c as jsxDevRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { c as cn, B as Button } from "./router-HyRWfAJI.mjs";
import { S as Slot } from "../_chunks/_libs/@radix-ui/react-slot.mjs";
import { s } from "../_chunks/_libs/@stepperize/react.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
const StepperContext = reactExports.createContext(null);
const useStepperProvider = () => {
  const context = reactExports.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a StepperProvider.");
  }
  return context;
};
const defineStepper = (...steps) => {
  const { Scoped, useStepper, ...rest } = s(...steps);
  const StepperContainer = ({
    children,
    className,
    ...props
  }) => {
    const methods = useStepper();
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        className: cn("w-full", className),
        "date-component": "stepper",
        ...props,
        children: typeof children === "function" ? children({ methods }) : children
      },
      void 0,
      false,
      {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
        lineNumber: 35,
        columnNumber: 10
      },
      void 0
    );
  };
  return {
    ...rest,
    Stepper: {
      Controls: ({ children, className, asChild, ...props }) => {
        const Comp = asChild ? Slot : "div";
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Comp,
          {
            className: cn("flex justify-end gap-4", className),
            "date-component": "stepper-controls",
            ...props,
            children
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
            lineNumber: 51,
            columnNumber: 16
          },
          void 0
        );
      },
      Description,
      Navigation: ({
        children,
        "aria-label": ariaLabel = "Stepper Navigation",
        ...props
      }) => {
        const { variant } = useStepperProvider();
        const { current } = useStepper();
        const currentIndex = rest.utils.getIndex(current.id);
        const childrenArray = reactExports.Children.toArray(children);
        const totalSteps = childrenArray.length;
        if (totalSteps === 0) {
          return null;
        }
        if (variant === "line") {
          return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "nav",
            {
              "aria-label": ariaLabel,
              className: "mb-5",
              "date-component": "stepper-navigation",
              ...props,
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "ol",
                  {
                    className: classForNavigationList({ variant }),
                    "date-component": "stepper-navigation-list",
                    children
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                    lineNumber: 87,
                    columnNumber: 25
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "span",
                  {
                    className: "text-sm text-muted-foreground whitespace-nowrap",
                    "date-component": "stepper-step-counter",
                    children: `Passo ${currentIndex + 1} de ${totalSteps}`
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                    lineNumber: 93,
                    columnNumber: 25
                  },
                  void 0
                )
              ] }, void 0, true, {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                lineNumber: 86,
                columnNumber: 22
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 80,
              columnNumber: 19
            },
            void 0
          );
        }
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "nav",
          {
            "aria-label": ariaLabel,
            className: "mb-5",
            "date-component": "stepper-navigation",
            ...props,
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "ol",
              {
                className: classForNavigationList({ variant }),
                "date-component": "stepper-navigation-list",
                children
              },
              void 0,
              false,
              {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                lineNumber: 111,
                columnNumber: 19
              },
              void 0
            )
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
            lineNumber: 105,
            columnNumber: 16
          },
          void 0
        );
      },
      Panel: ({ children, asChild, ...props }) => {
        const Comp = asChild ? Slot : "div";
        const { tracking } = useStepperProvider();
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Comp,
          {
            "date-component": "stepper-step-panel",
            ref: (node) => scrollIntoStepperPanel(node, tracking),
            ...props,
            children
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
            lineNumber: 125,
            columnNumber: 16
          },
          void 0
        );
      },
      Provider: ({
        variant = "line",
        labelOrientation = "horizontal",
        tracking = false,
        children,
        className,
        ...props
      }) => {
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          StepperContext.Provider,
          {
            value: { labelOrientation, tracking, variant },
            children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              Scoped,
              {
                initialMetadata: props.initialMetadata,
                initialStep: props.initialStep,
                children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(StepperContainer, { className, ...props, children }, void 0, false, {
                  fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                  lineNumber: 150,
                  columnNumber: 22
                }, void 0)
              },
              void 0,
              false,
              {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                lineNumber: 146,
                columnNumber: 19
              },
              void 0
            )
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
            lineNumber: 143,
            columnNumber: 16
          },
          void 0
        );
      },
      Step: ({ children, className, icon, ...props }) => {
        const { variant, labelOrientation } = useStepperProvider();
        const { current } = useStepper();
        const utils = rest.utils;
        const steps2 = rest.steps;
        const stepIndex = utils.getIndex(props.of);
        const step = steps2[stepIndex];
        const currentIndex = utils.getIndex(current.id);
        const isLast = utils.getLast().id === props.of;
        const isActive = current.id === props.of;
        const dataState = getStepState(currentIndex, stepIndex);
        const childMap = useStepChildren(children);
        const title = childMap.get("title");
        const description = childMap.get("description");
        const panel = childMap.get("panel");
        if (variant === "line") {
          return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "li",
            {
              className: cn(className),
              "data-state": dataState,
              "date-component": "stepper-step",
              children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  "aria-current": isActive ? "step" : void 0,
                  className: cn(
                    "h-1 w-8 rounded-full transition-colors duration-300",
                    dataState === "completed" || dataState === "active" ? "bg-primary" : "bg-muted"
                  ),
                  "date-component": "stepper-step-indicator",
                  id: `step-${step?.id}`,
                  type: "button",
                  ...props
                },
                void 0,
                false,
                {
                  fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                  lineNumber: 185,
                  columnNumber: 22
                },
                void 0
              )
            },
            void 0,
            false,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 180,
              columnNumber: 19
            },
            void 0
          );
        }
        if (variant === "circle") {
          return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "li",
            {
              className: cn(
                "flex shrink-0 items-center gap-4 rounded-md transition-colors",
                className
              ),
              "date-component": "stepper-step",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  CircleStepIndicator,
                  {
                    currentStep: stepIndex + 1,
                    totalSteps: steps2.length
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                    lineNumber: 211,
                    columnNumber: 22
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "div",
                  {
                    className: "flex flex-col items-start gap-1",
                    "date-component": "stepper-step-content",
                    children: [
                      title,
                      description
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                    lineNumber: 215,
                    columnNumber: 22
                  },
                  void 0
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 204,
              columnNumber: 19
            },
            void 0
          );
        }
        return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(jsxDevRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "li",
            {
              className: cn([
                "group peer relative flex items-center gap-2 bg-red",
                "data-[variant=vertical]:flex-row",
                "data-[label-orientation=vertical]:w-full",
                "data-[label-orientation=vertical]:flex-col",
                "data-[label-orientation=vertical]:justify-center"
              ]),
              "data-disabled": props.disabled,
              "data-label-orientation": labelOrientation,
              "data-state": dataState,
              "data-variant": variant,
              "date-component": "stepper-step",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  Button,
                  {
                    "aria-controls": `step-panel-${props.of}`,
                    "aria-current": isActive ? "step" : void 0,
                    "aria-posinset": stepIndex + 1,
                    "aria-selected": isActive,
                    "aria-setsize": steps2.length,
                    className: "rounded-full",
                    "date-component": "stepper-step-indicator",
                    id: `step-${step?.id}`,
                    onKeyDown: (e) => onStepKeyDown(
                      e,
                      utils.getNext(props.of),
                      utils.getPrev(props.of)
                    ),
                    role: "tab",
                    size: "icon",
                    tabIndex: dataState !== "inactive" ? 0 : -1,
                    type: "button",
                    variant: dataState !== "inactive" ? "default" : "secondary",
                    ...props,
                    children: icon ?? stepIndex + 1
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                    lineNumber: 242,
                    columnNumber: 22
                  },
                  void 0
                ),
                variant === "horizontal" && labelOrientation === "vertical" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  StepperSeparator,
                  {
                    disabled: props.disabled,
                    isLast,
                    labelOrientation,
                    orientation: "horizontal",
                    state: dataState
                  },
                  void 0,
                  false,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                    lineNumber: 271,
                    columnNumber: 28
                  },
                  void 0
                ),
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                  "div",
                  {
                    className: "flex flex-col items-start",
                    "date-component": "stepper-step-content",
                    children: [
                      title,
                      description
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                    lineNumber: 279,
                    columnNumber: 22
                  },
                  void 0
                )
              ]
            },
            void 0,
            true,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 228,
              columnNumber: 19
            },
            void 0
          ),
          variant === "horizontal" && labelOrientation === "horizontal" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            StepperSeparator,
            {
              disabled: props.disabled,
              isLast,
              orientation: "horizontal",
              state: dataState
            },
            void 0,
            false,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 290,
              columnNumber: 25
            },
            void 0
          ),
          variant === "vertical" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex gap-4", children: [
            !isLast && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-center ps-[calc(var(--spacing)_*_4.5_-_1px)]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              StepperSeparator,
              {
                disabled: props.disabled,
                isLast,
                orientation: "vertical",
                state: dataState
              },
              void 0,
              false,
              {
                fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
                lineNumber: 302,
                columnNumber: 31
              },
              void 0
            ) }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 301,
              columnNumber: 28
            }, void 0),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "my-3 flex-1 ps-4", children: panel }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 310,
              columnNumber: 25
            }, void 0)
          ] }, void 0, true, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
            lineNumber: 299,
            columnNumber: 22
          }, void 0)
        ] }, void 0, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
          lineNumber: 227,
          columnNumber: 16
        }, void 0);
      },
      Title
    },
    useStepper
  };
};
const Title = ({
  children,
  className,
  asChild,
  ...props
}) => {
  const Comp = asChild ? Slot : "h4";
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Comp,
    {
      className: cn("text-base font-medium", className),
      "date-component": "stepper-step-title",
      ...props,
      children
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
      lineNumber: 331,
      columnNumber: 7
    },
    void 0
  );
};
const Description = ({
  children,
  className,
  asChild,
  ...props
}) => {
  const Comp = asChild ? Slot : "p";
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Comp,
    {
      className: cn("text-sm text-muted-foreground", className),
      "date-component": "stepper-step-description",
      ...props,
      children
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
      lineNumber: 350,
      columnNumber: 7
    },
    void 0
  );
};
const StepperSeparator = ({
  orientation,
  isLast,
  labelOrientation,
  state,
  disabled
}) => {
  if (isLast) {
    return null;
  }
  return (
    // biome-ignore lint/a11y/useSemanticElements: <no need>
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        "aria-orientation": orientation || "horizontal",
        "aria-valuemax": 100,
        "aria-valuemin": 0,
        "aria-valuenow": 50,
        className: classForSeparator({ labelOrientation, orientation }),
        "data-disabled": disabled,
        "data-orientation": orientation,
        "data-state": state,
        "date-component": "stepper-separator",
        role: "separator",
        tabIndex: -1
      },
      void 0,
      false,
      {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
        lineNumber: 376,
        columnNumber: 7
      },
      void 0
    )
  );
};
const CircleStepIndicator = ({
  currentStep,
  totalSteps,
  size = 80,
  strokeWidth = 6
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const fillPercentage = currentStep / totalSteps * 100;
  const dashOffset = circumference - circumference * fillPercentage / 100;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      "aria-valuemax": totalSteps,
      "aria-valuemin": 1,
      "aria-valuenow": currentStep,
      className: "relative inline-flex items-center justify-center",
      "date-component": "stepper-step-indicator",
      role: "progressbar",
      tabIndex: -1,
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { height: size, width: size, children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("title", { children: "Step Indicator" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
            lineNumber: 413,
            columnNumber: 13
          }, void 0),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "circle",
            {
              className: "text-muted-foreground",
              cx: size / 2,
              cy: size / 2,
              fill: "none",
              r: radius,
              stroke: "currentColor",
              strokeWidth
            },
            void 0,
            false,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 414,
              columnNumber: 13
            },
            void 0
          ),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "circle",
            {
              className: "text-primary transition-all duration-300 ease-in-out",
              cx: size / 2,
              cy: size / 2,
              fill: "none",
              r: radius,
              stroke: "currentColor",
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
              strokeWidth,
              transform: `rotate(-90 ${size / 2} ${size / 2})`
            },
            void 0,
            false,
            {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
              lineNumber: 423,
              columnNumber: 13
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
          lineNumber: 412,
          columnNumber: 10
        }, void 0),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { "aria-live": "polite", className: "text-sm font-medium", children: [
          currentStep,
          " of ",
          totalSteps
        ] }, void 0, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
          lineNumber: 437,
          columnNumber: 13
        }, void 0) }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
          lineNumber: 436,
          columnNumber: 10
        }, void 0)
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/stepper.tsx",
      lineNumber: 403,
      columnNumber: 7
    },
    void 0
  );
};
const classForNavigationList = cva("flex gap-2", {
  variants: {
    variant: {
      circle: "flex-row items-center justify-between",
      horizontal: "flex-row items-center justify-between",
      line: "flex-row items-center gap-1.5",
      vertical: "flex-col"
    }
  }
});
const classForSeparator = cva(
  [
    "bg-muted",
    "data-[state=completed]:bg-primary data-[disabled]:opacity-50",
    "transition-all duration-300 ease-in-out"
  ],
  {
    variants: {
      labelOrientation: {
        vertical: "absolute left-[calc(50%+30px)] right-[calc(-50%+20px)] top-5 block shrink-0"
      },
      orientation: {
        horizontal: "h-0.5 flex-1",
        vertical: "h-full w-0.5"
      }
    }
  }
);
function scrollIntoStepperPanel(node, tracking) {
  if (tracking) {
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
const useStepChildren = (children) => {
  return reactExports.useMemo(() => extractChildren(children), [children]);
};
const extractChildren = (children) => {
  const childrenArray = reactExports.Children.toArray(children);
  const map = /* @__PURE__ */ new Map();
  for (const child of childrenArray) {
    if (reactExports.isValidElement(child)) {
      if (child.type === Title) {
        map.set("title", child);
      } else if (child.type === Description) {
        map.set("description", child);
      } else {
        map.set("panel", child);
      }
    }
  }
  return map;
};
const onStepKeyDown = (e, nextStep, prevStep) => {
  const { key } = e;
  const directions = {
    next: ["ArrowRight", "ArrowDown"],
    prev: ["ArrowLeft", "ArrowUp"]
  };
  if (directions.next.includes(key) || directions.prev.includes(key)) {
    const direction = directions.next.includes(key) ? "next" : "prev";
    const step = direction === "next" ? nextStep : prevStep;
    if (!step) {
      return;
    }
    const stepElement = document.getElementById(`step-${step.id}`);
    if (!stepElement) {
      return;
    }
    const isActive = stepElement.parentElement?.getAttribute("data-state") !== "inactive";
    if (isActive || direction === "prev") {
      stepElement.focus();
    }
  }
};
const getStepState = (currentIndex, stepIndex) => {
  if (currentIndex === stepIndex) {
    return "active";
  }
  if (currentIndex > stepIndex) {
    return "completed";
  }
  return "inactive";
};
export {
  defineStepper as d
};
