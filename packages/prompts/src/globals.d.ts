declare module "*.md";
declare module "*.md?raw" {
   const content: string;
   export default content;
}
