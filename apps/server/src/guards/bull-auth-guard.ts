import { env, isProduction } from "@api/config/env";

// Authentication constants
const ADMIN_USER = env.AP_QUEUE_UI_USERNAME;
const ADMIN_PASS = env.AP_QUEUE_UI_PASSWORD;
const COOKIE_NAME = "bull_auth"; // simple flag
const COOKIE_VALUE = "1";
const COOKIE_OPTS = "HttpOnly; SameSite=Strict; Max-Age=3600"; // 1 hour

/**
 * Check if request has valid authentication cookie
 */
function hasAuthCookie(request: Request): boolean {
   const cookieHeader = request.headers.get("cookie");
   if (!cookieHeader) return false;
   return cookieHeader
      .split(";")
      .some((c) => c.trim().startsWith(`${COOKIE_NAME}=${COOKIE_VALUE}`));
}

/**
 * Bull Board authentication middleware
 * Handles both cookie-based and query parameter authentication
 * Only enforces authentication in production environment
 */
export function bullAuth(request: Request) {
   // Skip authentication in non-production environments
   if (!isProduction) {
      return;
   }

   // Already authenticated via cookie?
   if (hasAuthCookie(request)) {
      return;
   }

   // First-time check via querystring
   const url = new URL(request.url);
   const admin = url.searchParams.get("admin");
   const password = url.searchParams.get("password");

   if (admin === ADMIN_USER && password === ADMIN_PASS) {
      // Set auth cookie for subsequent requests
      return new Response(null, {
         status: 302,
         headers: {
            Location: url.pathname,
            "Set-Cookie": `${COOKIE_NAME}=${COOKIE_VALUE}; ${COOKIE_OPTS}`,
         },
      });
   }

   return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
   });
}
