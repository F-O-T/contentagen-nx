import "@/polyfill";

import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";
import { createDb } from "@packages/database/client";
import { createAuth } from "@packages/authentication/server";
import { env } from "@packages/environment/server";
import { getStripeClient } from "@packages/stripe";
import { getElysiaPosthogConfig } from "@packages/posthog/server";
import router from "@/integrations/orpc/router";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";

// Create singleton instances at module level (created once when route file is imported)
const db = createDb({ databaseUrl: env.DATABASE_URL });
const auth = createAuth({ db, env });
const stripeClient = env.STRIPE_SECRET_KEY
	? getStripeClient(env.STRIPE_SECRET_KEY)
	: undefined;
const posthog = env.POSTHOG_KEY
	? getElysiaPosthogConfig(env)
	: undefined;

const handler = new RPCHandler(router);

async function handle({ request }: { request: Request }) {
	// Fetch session per-request (cannot be cached)
	let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
	try {
		session = await auth.api.getSession({ headers: request.headers });
	} catch {
		// Session fetch failed, continue without session
		session = null;
	}

	// Create fully-formed context with all dependencies
	const context: ORPCContextWithAuth = {
		headers: request.headers,
		request,
		auth,
		db,
		session,
		posthog,
		stripeClient,
	};

	const { response } = await handler.handle(request, {
		prefix: "/api/rpc",
		context,
	});

	return response ?? new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/rpc/$")({
	server: {
		handlers: {
			HEAD: handle,
			GET: handle,
			POST: handle,
			PUT: handle,
			PATCH: handle,
			DELETE: handle,
		},
	},
});
