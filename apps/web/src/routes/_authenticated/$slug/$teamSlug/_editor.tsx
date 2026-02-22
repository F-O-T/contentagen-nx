import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$slug/$teamSlug/_editor")(
   {
      component: EditorLayoutRoute,
      ssr: false,
   },
);

function EditorLayoutRoute() {
   return <Outlet />;
}
