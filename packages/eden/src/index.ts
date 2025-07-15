//TODO DELETAR
import type { App } from "@api";
import { treaty } from "@elysiajs/eden";
export type EdenClientType = ReturnType<typeof treaty<App>>;
export function createEdenAdapter(url: string): EdenClientType {
   return treaty<App>(url, {
      fetch: {
         credentials: "include",
      },
   });
}

export function createQueryKey(
   path: string,
   params?: Record<string, unknown>,
): unknown[] {
   const baseKey = path.split(".").join("-");
   if (params && Object.keys(params).length > 0) {
      return [baseKey, params];
   }

   return [baseKey];
}
