import { createFileRoute } from "@tanstack/react-router";
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@/integrations/better-auth/auth-server";

export const Route = createFileRoute(
	"/.well-known/oauth-authorization-server/$",
)({
	server: {
		handlers: {
			GET: () => oauthProviderAuthServerMetadata(getAuth()),
		},
	},
});
