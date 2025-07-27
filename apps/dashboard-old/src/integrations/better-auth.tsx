import { clientEnv } from "@packages/environment/client";
import { createAuthClient } from "@packages/authentication/client";
export const betterAuthClient = createAuthClient({
   apiBaseUrl: clientEnv.VITE_SERVER_URL,
});

export type Session = typeof betterAuthClient.$Infer.Session;
