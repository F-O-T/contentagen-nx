import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@packages/ui/components/sonner";
import { QueryProvider } from "@/integrations/clients";
import { ThemeProvider } from "@/layout/theme-provider";
import appCss from "@packages/ui/globals.css?url";
import {
   HeadContent,
   Outlet,
   Scripts,
   createRootRouteWithContext,
} from "@tanstack/react-router";
import type { TrpcClient } from "../integrations/clients";
import type { QueryClient } from "@tanstack/react-query";
export type RouterContext = {
   trpc: TrpcClient;
   head: string;
   queryClient: QueryClient;
};
export const Route = createRootRouteWithContext<RouterContext>()({
   head: () => ({
      links: [
         {
            href: appCss,
            rel: "stylesheet",
         },
         { rel: "icon", href: "/images/favicon.ico" },
      ],
      meta: [
         {
            title: "TanStack Router SSR Basic File Based Streaming",
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
               ? "/static/entry-client.js"
               : "/src/entry-client.tsx",
         },
      ],
   }),
   component: RootComponent,
});

function RootComponent() {
   return (
      <html lang="en">
         <head>
            <HeadContent />
         </head>
         <body>
            <QueryProvider>
               <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
               >
                  <Toaster />
                  <Outlet /> {/* Start rendering router matches */}
                  <TanStackRouterDevtools position="bottom-left" />
               </ThemeProvider>
            </QueryProvider>
            <Scripts />
         </body>
      </html>
   );
}
