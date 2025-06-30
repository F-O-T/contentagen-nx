declare module "@packages/layouts/astro/*" {
  import { AstroComponentFactory } from "astro";
  const component: AstroComponentFactory<Record<string, any>>;
  export default component;
}