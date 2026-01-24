import { c as jsxDevRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { L as Lt, j as jt } from "../_libs/input-otp.mjs";
import { a as Minus } from "../_libs/lucide-react.mjs";
function InputOTP({
  className,
  containerClassName,
  ...props
}) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Lt,
    {
      className: cn("disabled:cursor-not-allowed", className),
      containerClassName: cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      ),
      "data-slot": "input-otp",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/input-otp.tsx",
      lineNumber: 16,
      columnNumber: 7
    },
    this
  );
}
function InputOTPGroup({ className, ...props }) {
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn("flex items-center", className),
      "data-slot": "input-otp-group",
      ...props
    },
    void 0,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/input-otp.tsx",
      lineNumber: 30,
      columnNumber: 7
    },
    this
  );
}
function InputOTPSlot({
  index,
  className,
  ...props
}) {
  const inputOTPContext = reactExports.useContext(jt);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      className: cn(
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        className
      ),
      "data-active": isActive,
      "data-slot": "input-otp-slot",
      ...props,
      children: [
        char,
        hasFakeCaret && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "animate-caret-blink bg-foreground h-4 w-px duration-1000" }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/input-otp.tsx",
          lineNumber: 61,
          columnNumber: 16
        }, this) }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/input-otp.tsx",
          lineNumber: 60,
          columnNumber: 13
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/input-otp.tsx",
      lineNumber: 49,
      columnNumber: 7
    },
    this
  );
}
function InputOTPSeparator({ ...props }) {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: <no>
    // biome-ignore lint/a11y/useSemanticElements: <no>
    // biome-ignore lint/a11y/useAriaPropsForRole: <no>
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { "data-slot": "input-otp-separator", role: "separator", ...props, children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Minus, {}, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/input-otp.tsx",
      lineNumber: 74,
      columnNumber: 10
    }, this) }, void 0, false, {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/input-otp.tsx",
      lineNumber: 73,
      columnNumber: 7
    }, this)
  );
}
export {
  InputOTP as I,
  InputOTPGroup as a,
  InputOTPSlot as b,
  InputOTPSeparator as c
};
