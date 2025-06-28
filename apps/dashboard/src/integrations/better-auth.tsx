import { env } from "@/config/env";
import { polarClient } from "@polar-sh/better-auth";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const betterAuthClient = createAuthClient({
   baseURL: `${env.VITE_SERVER_URL}/api/v1/auth`,
   plugins: [emailOTPClient(), polarClient()],
});

export type Session = typeof betterAuthClient.$Infer.Session;
