import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/config/env";
export const betterAuthClient = createAuthClient({
	baseURL: `${env.VITE_SERVER_URL}/api/v1/auth`,
	plugins: [emailOTPClient()],
});
export type Session = typeof betterAuthClient.$Infer.Session;

export const sessionMiddleware = async () => {
	return await betterAuthClient.getSession();
};
