import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
function parseMarginValue(value) {
  if (typeof value === "number") return {
    marginTop: value,
    marginBottom: value,
    marginLeft: value,
    marginRight: value
  };
  if (typeof value === "string") {
    const values = value.toString().trim().split(/\s+/);
    if (values.length === 1) return {
      marginTop: values[0],
      marginBottom: values[0],
      marginLeft: values[0],
      marginRight: values[0]
    };
    if (values.length === 2) return {
      marginTop: values[0],
      marginRight: values[1],
      marginBottom: values[0],
      marginLeft: values[1]
    };
    if (values.length === 3) return {
      marginTop: values[0],
      marginRight: values[1],
      marginBottom: values[2],
      marginLeft: values[1]
    };
    if (values.length === 4) return {
      marginTop: values[0],
      marginRight: values[1],
      marginBottom: values[2],
      marginLeft: values[3]
    };
  }
  return {
    marginTop: void 0,
    marginBottom: void 0,
    marginLeft: void 0,
    marginRight: void 0
  };
}
function computeMargins(properties) {
  let result = {
    marginTop: void 0,
    marginRight: void 0,
    marginBottom: void 0,
    marginLeft: void 0
  };
  for (const [key, value] of Object.entries(properties)) if (key === "margin") result = parseMarginValue(value);
  else if (key === "marginTop") result.marginTop = value;
  else if (key === "marginRight") result.marginRight = value;
  else if (key === "marginBottom") result.marginBottom = value;
  else if (key === "marginLeft") result.marginLeft = value;
  return result;
}
const Text = reactExports.forwardRef(({ style, ...props }, ref) => {
  const defaultMargins = {};
  if (style?.marginTop === void 0) defaultMargins.marginTop = "16px";
  if (style?.marginBottom === void 0) defaultMargins.marginBottom = "16px";
  const margins = computeMargins({
    ...defaultMargins,
    ...style
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
    ...props,
    ref,
    style: {
      fontSize: "14px",
      lineHeight: "24px",
      ...style,
      ...margins
    }
  });
});
Text.displayName = "Text";
export {
  Text as T
};
