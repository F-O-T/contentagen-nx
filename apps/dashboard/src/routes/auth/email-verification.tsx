import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { EmailVerificationPage } from "@/pages/email-verification/ui/email-verification-page";

const searchParams = z.object({
	email: z.string().email(),
});
export const Route = createFileRoute("/auth/email-verification")({
	validateSearch: (search) => searchParams.parse(search),
	component: RouteComponent,
	ssr: true,
});

function RouteComponent() {
	return <EmailVerificationPage />;
}
