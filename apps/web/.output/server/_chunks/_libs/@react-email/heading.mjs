import { r as reactExports, j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const withMargin = (props) => {
  const candidates = [
    withSpace(props.m, ["margin"]),
    withSpace(props.mx, ["marginLeft", "marginRight"]),
    withSpace(props.my, ["marginTop", "marginBottom"]),
    withSpace(props.mt, ["marginTop"]),
    withSpace(props.mr, ["marginRight"]),
    withSpace(props.mb, ["marginBottom"]),
    withSpace(props.ml, ["marginLeft"])
  ];
  const mergedStyles = {};
  for (const style of candidates) if (Object.keys(style).length > 0) Object.assign(mergedStyles, style);
  return mergedStyles;
};
const withSpace = (value, properties) => {
  const styles = {};
  if (value === void 0) return styles;
  if (Number.isNaN(Number.parseFloat(String(value)))) return styles;
  for (const property of properties) styles[property] = `${value}px`;
  return styles;
};
const Heading = reactExports.forwardRef(({ as: Tag = "h1", children, style, m, mx, my, mt, mr, mb, ml, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, {
    ...props,
    ref,
    style: {
      ...withMargin({
        m,
        mx,
        my,
        mt,
        mr,
        mb,
        ml
      }),
      ...style
    },
    children
  });
});
Heading.displayName = "Heading";
export {
  Heading as H
};
