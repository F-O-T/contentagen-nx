import { treaty } from "@elysiajs/eden";
import { clientEnv } from "@packages/environment/client";
import type { App } from "@server/index";

const reservedRoutes = ["auth", "home", "api"];

function getOrganizationSlugFromUrl(): string | undefined {
   if (typeof window === "undefined") return undefined;
   const pathSegments = window.location.pathname.split("/").filter(Boolean);
   const firstSegment = pathSegments[0];
   if (!firstSegment) return undefined;
   if (reservedRoutes.includes(firstSegment)) return undefined;
   return firstSegment;
}

export const elysia = treaty<App>(clientEnv.VITE_SERVER_URL, {
   fetch: {
      credentials: "include",
   },
   headers: (_path, _options) => {
      const slug = getOrganizationSlugFromUrl();
      return { "x-organization-slug": slug ?? "" };
   },
});
