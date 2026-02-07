import { env } from "@packages/environment/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
	createMcpHandler,
	protectedResourceHandler,
	withMcpAuth,
} from "mcp-handler";
import { registerTools } from "./tools";

const AUTH_SERVER_URL = env.BETTER_AUTH_URL;
const JWKS_URL = `${AUTH_SERVER_URL}/api/auth/jwks`;
const jwks = createRemoteJWKSet(new URL(JWKS_URL));

// Create base MCP handler
const baseMcpHandler = createMcpHandler(
	(server) => {
		registerTools(server);
	},
	{ serverInfo: { name: "contentta-mcp", version: "1.0.0" } },
	{
		basePath: "/mcp",
		redisUrl: env.REDIS_URL,
		verboseLogs: env.NODE_ENV !== "production",
	},
);

// Wrap with JWT verification
export const mcpRequestHandler = withMcpAuth(
	baseMcpHandler,
	async (_req, bearerToken) => {
		if (!bearerToken) return undefined;

		try {
			const { payload } = await jwtVerify(bearerToken, jwks, {
				issuer: AUTH_SERVER_URL,
			});

			const organizationId =
				(payload as Record<string, unknown>).activeOrganizationId ??
				(payload as Record<string, unknown>).referenceId;
			const userId = payload.sub;

			return {
				token: bearerToken,
				clientId:
					((payload as Record<string, unknown>).clientId as string) ?? "unknown",
				scopes:
					typeof payload.scope === "string"
						? payload.scope.split(" ")
						: [],
				extra: { organizationId, userId },
			};
		} catch (err) {
			console.error("JWT verification failed:", err);
			return undefined;
		}
	},
	{
		required: true,
		resourceUrl: env.SDK_SERVER_URL,
	},
);

// Protected resource metadata handler (RFC 9728)
export const protectedResourceMetadataHandler = protectedResourceHandler({
	authServerUrls: [AUTH_SERVER_URL],
	resourceUrl: env.SDK_SERVER_URL,
});
