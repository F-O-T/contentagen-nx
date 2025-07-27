import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/pages/forgot-password/ui/forgot-password-page";

export const Route = createFileRoute("/auth/forgot-password")({
   component: RouteComponent,
   ssr: true,
   wrapInSuspense: true,
});

function RouteComponent() {
   return <ForgotPasswordPage />;
}
