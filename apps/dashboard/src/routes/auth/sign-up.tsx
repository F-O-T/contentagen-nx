import { createFileRoute } from "@tanstack/react-router";
import { SignUpPage } from "@/pages/sign-up/ui/sign-up-page";

export const Route = createFileRoute("/auth/sign-up")({
   component: RouteComponent,
   ssr: true,
   wrapInSuspense: true,
});

function RouteComponent() {
   return <SignUpPage />;
}
