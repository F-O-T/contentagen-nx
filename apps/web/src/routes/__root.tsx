import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@packages/ui/lib/theme-provider";
import { Toaster } from "@packages/ui/components/sonner";
import appCss from "@packages/ui/styles/globals.css?url";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import type { RouterContext } from "../integrations/tanstack-query/root-provider";
import { GlobalSheet } from "@/hooks/use-sheet";
import { GlobalCredenza } from "@/hooks/use-credenza";
import { GlobalAlertDialog } from "@/hooks/use-alert-dialog";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? <>{children}</> : null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    // Prefetch session for SSR - this populates the QueryClient cache
    await context.queryClient.prefetchQuery(
      context.orpc.session.getSession.queryOptions({}),
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
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
          <GlobalSheet />
          <GlobalCredenza />
          <GlobalAlertDialog />
          <ClientOnly>
            <TanStackDevtools
              config={{
                position: "bottom-right",
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
        <Scripts />
      </body>
    </html>
  );
}
