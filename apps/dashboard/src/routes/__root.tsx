import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { PostHogWrapper } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import { ThemeProvider } from "@/layout/theme-provider";
import appCss from "@packages/ui/globals.css?url";
import {
   HeadContent,
   Outlet,
   Scripts,
   createRootRouteWithContext,
   redirect,
} from "@tanstack/react-router";
import type { RouterContext } from "../router";
import brandConfig from "@packages/brand/index.json";
export const Route = createRootRouteWithContext<RouterContext>()({
   ssr: true,
   wrapInSuspense: true,
   head: () => ({
      links: [
         {
            href: appCss,
            rel: "stylesheet",
         },
         { rel: "icon", href: "/favicon.svg" },
      ],
      meta: [
         {
            title: `${brandConfig.name} - ${brandConfig.catch}`,
         },
         {
            charSet: "UTF-8",
         },
         {
            name: "viewport",
            content: "width=device-width, initial-scale=1.0",
         },
      ],
      scripts: [
         ...(!import.meta.env.PROD
            ? [
                 {
                    type: "module",
                    children: `import RefreshRuntime from "/@react-refresh"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true`,
                 },
                 {
                    type: "module",
                    src: "/@vite/client",
                 },
              ]
            : []),
         {
            type: "module",
            src: import.meta.env.PROD
               ? "/assets/entry-client.js"
               : "/src/entry-client.tsx",
         },
      ],
   }),
   loader: async ({ location }) => {
      if (location.href === "/") {
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   component: RootComponent,
});

function RootComponent() {
   return (
      <html lang="en">
         <head>
            <HeadContent />
         </head>
         <body>
            <PostHogWrapper>
               <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
               >
                  <Toaster />
                  <Outlet /> {/* Start rendering router matches */}
                  <TanStackRouterDevtools position="bottom-left" />
               </ThemeProvider>
            </PostHogWrapper>
            <Scripts />
         </body>
      </html>
   );
}
