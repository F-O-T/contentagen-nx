import { createArcjetDashboard } from "@packages/arcjet/dashboard";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

export const arcjetProtect = createIsomorphicFn()
   .client(() => {})
   .server(async () => {
      if (!process.env.ARCJET_KEY) {
         console.log("ARCJET_KEY is not set, skipping arcjet protection");
         return;
      }
      const aj = createArcjetDashboard(process.env.ARCJET_KEY);

      const request = getWebRequest();
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
         headers[key] = value;
      });

      const arcjetRequest = {
         ...request,
         headers,
      };

      const decision = await aj.protect(arcjetRequest, { requested: 5 });
      return decision;
   });
