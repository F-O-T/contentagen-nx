import { QueryProvider } from "@/integrations/tanstack-query";
import { ThemeProvider } from "@/layout/theme-provider";
import brandConfig from "@packages/brand/index.json";
import type { EdenClientType } from "@packages/eden";
import appCss from "@packages/ui/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import {
   createRootRouteWithContext,
   HeadContent,
   Outlet,
   Scripts,
} from "@tanstack/react-router";

export interface MyRouterContext {
   eden: EdenClientType;
   queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
   component: () => (
      <RootDocument>
         <QueryProvider>
            <ThemeProvider>
               <Outlet />
            </ThemeProvider>
         </QueryProvider>
      </RootDocument>
   ),
   head: () => ({
      links: [
         {
            href: appCss,
            rel: "stylesheet",
         },
      ],
      meta: [
         {
            charSet: "utf-8",
         },
         {
            content: "width=device-width, initial-scale=1",
            name: "viewport",
         },
         {
            title: brandConfig.name,
         },
      ],
   }),
});

function RootDocument({ children }: { children: React.ReactNode }) {
   return (
      <html lang="en">
         <head>
            <HeadContent />
         </head>
         <body>
            {children}
            <Scripts />
         </body>
      </html>
   );
}
