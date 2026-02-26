import { env } from "@packages/environment/client";

import { PostHogWrapper, PosthogRouterTracker } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import { ThemeProvider } from "@packages/ui/lib/theme-provider";
import appCss from "@packages/ui/styles/globals.css?url";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
   ClientOnly,
   createRootRouteWithContext,
   HeadContent,
   Scripts,
   useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { GlobalAlertDialog } from "@/hooks/use-alert-dialog";
import { GlobalCredenza } from "@/hooks/use-credenza";
import { GlobalSheet } from "@/hooks/use-sheet";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import type { RouterContext } from "../integrations/tanstack-query/root-provider";

export const Route = createRootRouteWithContext<RouterContext>()({
   beforeLoad: async ({ context }) => {
      await context.queryClient.prefetchQuery(
         context.orpc.session.getSession.queryOptions(),
      );
   },
   head: () => ({
      meta: [
         {
            charSet: "utf-8",
         },
         {
            name: "viewport",
            content: "width=device-width, initial-scale=1",
         },
         {
            title: "Contentta",
         },
      ],
      links: [
         {
            href: "/favicon.svg",
            rel: "icon",
         },

         {
            rel: "stylesheet",
            href: appCss,
            precedence: "default",
         },
      ],
   }),

   shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
   const routerState = useRouterState();

   return (
      <html lang="pt-BR" suppressHydrationWarning>
         <head>
            <HeadContent />
         </head>
         <body>
            <PostHogWrapper env={env}>
               <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
               >
                  {children}
                  <PosthogRouterTracker
                     location={{
                        href:
                           typeof window !== "undefined"
                              ? window.location.href
                              : "",
                        pathname: routerState.location.pathname,
                        search: routerState.location.search,
                     }}
                  />
                  <Toaster position="top-right" richColors />
                  <GlobalSheet />
                  <GlobalCredenza />
                  <GlobalAlertDialog />
                  <ClientOnly>
                     <TanStackDevtools
                        config={{
                           position: "top-right",
                        }}
                        plugins={[
                           {
                              name: "Tanstack Router",
                              render: <TanStackRouterDevtoolsPanel />,
                           },
                           TanStackQueryDevtools,
                        ]}
                     />
                  </ClientOnly>
               </ThemeProvider>
            </PostHogWrapper>
            <Scripts />
         </body>
      </html>
   );
}
