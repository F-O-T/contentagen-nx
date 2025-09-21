import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig, passthroughImageService } from "astro/config";

// https://astro.build/config
export default defineConfig({
   image: {
      service: passthroughImageService(),
   },

   integrations: [
      starlight({
         customCss: ["./src/styles/global.css"],
         sidebar: [
            {
               label: "SDK",
               items: [
                  { label: "Overview", link: "/sdk/" },
                  { label: "Setup", link: "/sdk/setup" },
                  { label: "API Reference", link: "/sdk/api" },
                  { label: "Error Handling", link: "/sdk/error-handling" },
                  {
                     label: "Integrations",
                     items: [
                        { label: "AstroJS", link: "/sdk/integrations/astrojs" },
                     ],
                  },
               ],
            },
         ],
         title: "ContentaGen",
         logo: {
            src: "./src/assets/contentagen-logo.svg",
         },
         description: "Documentation for ContentaGen app",
      }),
      mdx(),
   ],

   site: "https://docs.contentagen.com",
   output: "static",
   vite: {
      plugins: [
         tailwindcss(),
      ],
   },
});
