import { useTRPC } from "@/integrations/clients";
import brand from "@packages/brand/index.json";
import logo from "@packages/brand/logo.svg";
import { useQuery } from "@tanstack/react-query";
import {
   createFileRoute,
   Outlet,
   useLocation,
   useRouter,
} from "@tanstack/react-router";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
export const Route = createFileRoute("/auth")({
   loader: async ({ context }) => {
      await context.queryClient.prefetchQuery(
         context.trpc.sessionHelper.getSession.queryOptions(),
      );
      return;
   },

   component: AuthLayout,
});

function AuthLayout() {
   const location = useLocation();
   const router = useRouter();
   const trpc = useTRPC();
   const { data: session } = useQuery(
      trpc.sessionHelper.getSession.queryOptions(),
   );
   useIsomorphicLayoutEffect(() => {
      if (session) {
         router.navigate({
            to: "/agents",
            search: location.search,
            replace: true,
         });
      }
   }, [session, location]);
   return (
      <div className="overflow-hidden relative w-full min-h-screen bg-background">
         <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"
         />
         <div aria-hidden="true" className="absolute w-full h-full">
            <div className="absolute top-0 left-0 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-gradient-radial from-primary/20 via-primary/5" />
            <div className="absolute right-0 bottom-0 to-transparent rounded-full translate-x-1/2 translate-y-1/2 h-[500px] w-[500px] bg-gradient-radial from-secondary/20 via-secondary/5" />
         </div>
         <main className="flex relative flex-col justify-center items-center px-4 w-full min-h-screen">
            <section
               className="space-y-4 w-full max-w-md duration-700 animate-in slide-in-from-bottom-4 fade-in"
               key={location.pathname}
            >
               <header className="flex flex-col justify-center items-center space-y-2 text-center">
                  <div className="flex gap-2 justify-center items-center">
                     <figure className="text-primary">
                        <img alt="Project logo" className="size-8" src={logo} />
                     </figure>
                     <h1 className="font-bold tracking-tight text-primary text-2xl">
                        {brand.name}
                     </h1>
                  </div>
               </header>
               <section aria-label="Authentication">
                  <Outlet />
               </section>
            </section>
         </main>
      </div>
   );
}
