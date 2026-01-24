import { c as jsxDevRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Label } from "./label-BHyVaFv_.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
function FieldGroup({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      ),
      "data-slot": "field-group",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/field.tsx",
      lineNumber: 46,
      columnNumber: 7
    },
    this
  );
}
const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  {
    defaultVariants: {
      orientation: "vertical"
    },
    variants: {
      orientation: {
        horizontal: [
          "flex-row items-center",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
        ],
        responsive: [
          "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
        ],
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"]
      }
    }
  }
);
function Field({
  className,
  orientation = "vertical",
  ...props
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: <no>
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
      "div",
      {
        className: cn(fieldVariants({ orientation }), className),
        "data-orientation": orientation,
        "data-slot": "field",
        role: "group",
        ...props
      },
      void 0,
      false,
      {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/field.tsx",
        lineNumber: 88,
        columnNumber: 7
      },
      this
    )
  );
}
function FieldLabel({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Label,
    {
      className: cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
        className
      ),
      "data-slot": "field-label",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/field.tsx",
      lineNumber: 116,
      columnNumber: 7
    },
    this
  );
}
function FieldDescription({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "p",
    {
      className: cn(
        "text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      ),
      "data-slot": "field-description",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/field.tsx",
      lineNumber: 144,
      columnNumber: 7
    },
    this
  );
}
function FieldError({
  className,
  children,
  errors,
  ...props
}) {
  const content = reactExports.useMemo(() => {
    if (children) {
      return children;
    }
    if (!errors?.length) {
      return null;
    }
    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values()
    ];
    if (uniqueErrors?.length === 1) {
      return uniqueErrors[0]?.message;
    }
    return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("ul", { className: "ml-4 flex list-disc flex-col gap-1", children: uniqueErrors.map(
      (error, index) => error?.message && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("li", { children: error.message }, index, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/field.tsx",
        lineNumber: 216,
        columnNumber: 37
      }, this)
    ) }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/field.tsx",
      lineNumber: 213,
      columnNumber: 10
    }, this);
  }, [children, errors]);
  if (!content) {
    return null;
  }
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("text-destructive text-sm font-normal", className),
      "data-slot": "field-error",
      role: "alert",
      ...props,
      children: content
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/field.tsx",
      lineNumber: 227,
      columnNumber: 7
    },
    this
  );
}
export {
  FieldDescription as F,
  FieldGroup as a,
  Field as b,
  FieldLabel as c,
  FieldError as d
};
