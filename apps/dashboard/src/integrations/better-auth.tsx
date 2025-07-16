import { env } from "@/config/env";
import { createAuthClient } from "@packages/authentication/client";
export const betterAuthClient = createAuthClient({
   apiBaseUrl: env.VITE_SERVER_URL,
});

export type Session = typeof betterAuthClient.$Infer.Session;
