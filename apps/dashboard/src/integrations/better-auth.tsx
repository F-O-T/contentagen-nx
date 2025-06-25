import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { reactStartCookies } from "better-auth/react-start";
import { createContext, useContext, useState } from "react";
import { env } from "@/config/env";
export const betterAuthClient = createAuthClient({
	baseURL: `${env.VITE_SERVER_URL}/api/v1/auth`,
	plugins: [reactStartCookies(), emailOTPClient()],
});
export type Session = typeof betterAuthClient.$Infer.Session;

type SessionContextType = {
	session: Session;
	setSession: (session: Session) => void;
};

const sessionContext = createContext<SessionContextType | null>(null);

export const useBetterAuthSession = () => {
	const context = useContext(sessionContext);
	if (context === null) {
		throw new Error("SessionProvider context not found");
	}
	return context;
};

export const BetterAuthSessionProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [session, setSession] = useState({} as Session);

	return (
		<sessionContext.Provider value={{ session, setSession }}>
			{children}
		</sessionContext.Provider>
	);
};
