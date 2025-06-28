import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/pages/sign-in/ui/sign-in-page";

export const Route = createFileRoute("/auth/sign-in")({
   component: RouteComponent,
   ssr: true,
});

function RouteComponent() {
   return <SignInPage />;
}
