import { j as jsxRuntimeExports } from "../../../_libs/react.mjs";
const Font = ({ fontFamily, fallbackFontFamily, webFont, fontStyle = "normal", fontWeight = 400 }) => {
  const src = webFont ? `src: url(${webFont.url}) format('${webFont.format}');` : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("style", { dangerouslySetInnerHTML: { __html: `
    @font-face {
      font-family: '${fontFamily}';
      font-style: ${fontStyle};
      font-weight: ${fontWeight};
      mso-font-alt: '${Array.isArray(fallbackFontFamily) ? fallbackFontFamily[0] : fallbackFontFamily}';
      ${src}
    }

    * {
      font-family: '${fontFamily}', ${Array.isArray(fallbackFontFamily) ? fallbackFontFamily.join(", ") : fallbackFontFamily};
    }
  ` } });
};
export {
  Font as F
};
