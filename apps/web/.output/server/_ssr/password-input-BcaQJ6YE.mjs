import { r as reactExports, c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { I as Input } from "./input-NG6T6sy1.mjs";
import { c as cn } from "./router-HyRWfAJI.mjs";
import { E as EyeOff, b as Eye } from "../_libs/lucide-react.mjs";
function PasswordInput({
  className,
  containerProps,
  ...props
}) {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  const toggleVisibility = () => setIsVisible((prevState) => !prevState);
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "div",
    {
      ...containerProps,
      className: cn("relative", containerProps?.className),
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          Input,
          {
            className: cn("pe-9", className),
            placeholder: "Password",
            type: isVisible ? "text" : "password",
            ...props
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/password-input.tsx",
            lineNumber: 23,
            columnNumber: 10
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            "aria-controls": "password",
            "aria-label": isVisible ? "Hide password" : "Show password",
            "aria-pressed": isVisible,
            className: "absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            onClick: toggleVisibility,
            type: "button",
            children: isVisible ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(EyeOff, { "aria-hidden": "true", size: 16, strokeWidth: 2 }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/password-input.tsx",
              lineNumber: 38,
              columnNumber: 16
            }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Eye, { "aria-hidden": "true", size: 16, strokeWidth: 2 }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/password-input.tsx",
              lineNumber: 40,
              columnNumber: 16
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/password-input.tsx",
            lineNumber: 29,
            columnNumber: 10
          },
          this
        )
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/password-input.tsx",
      lineNumber: 19,
      columnNumber: 7
    },
    this
  );
}
export {
  PasswordInput as P
};
