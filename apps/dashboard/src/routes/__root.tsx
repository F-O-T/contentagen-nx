import { clientEnv } from "@packages/environment/client";
import { PostHogWrapper, PosthogRouterTracker } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import { TooltipProvider } from "@packages/ui/components/tooltip";
import { useQuery } from "@tanstack/react-query";
import {
   createRootRoute,
   HeadContent,
   Outlet,
   redirect,
   useLocation,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { NotFoundComponent } from "@/default/not-found";
import { QueryProvider, useTRPC } from "@/integrations/clients";
import { ThemeProvider } from "@/layout/theme-provider";

// Lazy load non-critical root components to improve LCP
const DiffView = lazy(() =>
   import("@/features/content/ui/diff-view").then((m) => ({ default: m.DiffView }))
);
const GlobalAlertDialog = lazy(() =>
   import("@/hooks/use-alert-dialog").then((m) => ({ default: m.GlobalAlertDialog }))
);
const GlobalCredenza = lazy(() =>
   import("@/hooks/use-credenza").then((m) => ({ default: m.GlobalCredenza }))
);
const GlobalSheet = lazy(() =>
   import("@/hooks/use-sheet").then((m) => ({ default: m.GlobalSheet }))
);

// Only load devtools in development
const TanStackRouterDevtools =
   import.meta.env.DEV
      ? lazy(() =>
           import("@tanstack/react-router-devtools").then((m) => ({
              default: m.TanStackRouterDevtools,
           }))
        )
      : () => null;

declare module "@tanstack/react-router" {
   interface StaticDataRouteOption {
      breadcrumb?: string;
   }
}
export const Route = createRootRoute({
   component: RootComponent,
   head: () => ({
      links: [
         {
            href: "/favicon.svg",
            rel: "icon",
         },
      ],
      meta: [
         {
            content: "O seu cms ",
            name: "description",
         },
         {
            title: "Contentta",
         },
      ],
   }),
   loader: async ({ location }: { location: { href: string } }) => {
      if (location.href === "/") {
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   notFoundComponent: () => (
      <div className="h-screen w-screen">
         <NotFoundComponent />
      </div>
   ),
   staticData: {
      breadcrumb: "Home",
   },
   wrapInSuspense: true,
});

function TelemetryAwarePostHogWrapper({
   children,
}: {
   children: React.ReactNode;
}) {
   const trpc = useTRPC();
   const location = useLocation();
   const { data: hasConsent = false } = useQuery(
      trpc.session.getTelemetryConsent.queryOptions(undefined, {
         meta: { skipGlobalInvalidation: true },
      }),
   );

   return (
      <PostHogWrapper env={clientEnv} hasConsent={hasConsent}>
         <PosthogRouterTracker location={location} />
         {children}
      </PostHogWrapper>
   );
}

function RootComponent() {
   return (
      <>
         <HeadContent />
         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryProvider>
               <TooltipProvider delayDuration={300}>
                  <TelemetryAwarePostHogWrapper>
                     <Toaster />
                     <Outlet />
                     {/* Lazy load non-critical overlay components */}
                     <Suspense fallback={null}>
                        <GlobalAlertDialog />
                        <GlobalCredenza />
                        <GlobalSheet />
                        <DiffView />
                        <TanStackRouterDevtools position="bottom-left" />
                     </Suspense>
                  </TelemetryAwarePostHogWrapper>
               </TooltipProvider>
            </QueryProvider>
         </ThemeProvider>
      </>
   );
}
