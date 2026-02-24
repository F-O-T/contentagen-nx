import { getDevMagicLink } from "@packages/authentication/server";
import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "@/integrations/better-auth/auth-server";

function handleDevMagicLink(request: Request): Response | null {
   const url = new URL(request.url);
   if (url.pathname !== "/api/auth/dev/magic-link") return null;
   const email = url.searchParams.get("email") ?? "";
   return Response.json({ url: getDevMagicLink(email) ?? null });
}

export const Route = createFileRoute("/api/auth/$")({
   server: {
      handlers: {
         GET: ({ request }) =>
            handleDevMagicLink(request) ?? getAuth().handler(request),
         POST: ({ request }) => getAuth().handler(request),
      },
   },
});
