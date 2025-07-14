import { arcjetProtect } from "@/integrations/arcjet";
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
   redirect,
   Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@packages/ui/components/sonner";
import { getReactPosthogConfig } from "@packages/posthog";
import { PostHogProvider } from "posthog-js/react";
export interface MyRouterContext {
   eden: EdenClientType;
   queryClient: QueryClient;
}
const posthogConfig = getReactPosthogConfig();
export const Route = createRootRouteWithContext<MyRouterContext>()({
   component: () => (
      <RootDocument>
         <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
               <PostHogProvider
                  apiKey={posthogConfig.api_key}
                  options={{
                     api_host: posthogConfig.api_host,
                     defaults: "2025-05-24",
                  }}
               >
                  <Toaster /> <Outlet />
               </PostHogProvider>
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
         { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
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
   beforeLoad: async ({ location }) => {
      const decision = await arcjetProtect();

      if (!decision) return;

      if (decision.isDenied()) {
         throw redirect({ to: "/auth/sign-in" });
      }

      // Redirect from root path to sign-in
      if (location.pathname === "/") {
         throw redirect({ to: "/auth/sign-in" });
      }
   },
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
