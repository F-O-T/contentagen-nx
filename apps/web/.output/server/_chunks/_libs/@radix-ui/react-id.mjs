import { r as reactExports, a as React } from "../../../_libs/react.mjs";
import { u as useLayoutEffect2 } from "./react-use-layout-effect.mjs";
var useReactId = React[" useId ".trim().toString()] || (() => void 0);
var count = 0;
function useId(deterministicId) {
  const [id, setId] = reactExports.useState(useReactId());
  useLayoutEffect2(() => {
    setId((reactId) => reactId ?? String(count++));
  }, [deterministicId]);
  return deterministicId || (id ? `radix-${id}` : "");
}
export {
  useId as u
};
