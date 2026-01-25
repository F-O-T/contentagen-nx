import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
   beforeLoad: ({ location }) => {
      throw redirect({
         to: "/auth/sign-in",
         search: {
            redirect: location.href,
         },
      });
   },
   component: () => null,
});
