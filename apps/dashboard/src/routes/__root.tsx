import type { EdenClientType } from "@packages/eden";
import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import appCss from "@packages/ui/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryProvider } from "@/integrations/tanstack-query";

export interface MyRouterContext {
  eden: EdenClientType;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <RootDocument>
      <QueryProvider>
        <SidebarProvider
          style={
            {
              "--header-height": "calc(var(--spacing) * 12)",
              "--sidebar-width": "calc(var(--spacing) * 72)",
            } as React.CSSProperties
          }
        >
          <SidebarInset>
            <div className="flex flex-1 flex-col max-h-[calc(95dvh-var(--header-height))] overflow-y-auto">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4">
                  <Outlet />
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
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
        title: "TanStack Start Starter",
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
