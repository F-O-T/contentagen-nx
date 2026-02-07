import { createFileRoute } from "@tanstack/react-router";
import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@/integrations/better-auth/auth-server";

export const Route = createFileRoute("/.well-known/openid-configuration")({
	server: {
		handlers: {
			GET: () => oauthProviderOpenIdConfigMetadata(getAuth()),
		},
	},
});
