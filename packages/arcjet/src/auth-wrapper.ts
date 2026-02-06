import type { AuthInstance } from "@packages/authentication/server";

export async function wrapAuthHandler(
   authInstance: AuthInstance,
): Promise<(request: Request) => Promise<Response>> {
   return async (request: Request): Promise<Response> => {
      return authInstance.handler(request);
   };
}
