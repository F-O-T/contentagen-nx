import { env } from "@/config/env";
import { polarClient } from "@polar-sh/better-auth";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useState,
} from "react";

export const betterAuthClient = createAuthClient({
   baseURL: `${env.VITE_SERVER_URL}/api/v1/auth`,
   plugins: [emailOTPClient(), polarClient()],
});

export type Session = typeof betterAuthClient.$Infer.Session;

type PolarCustomerState = {
   customer?: any;
   subscriptions?: any[];
   benefits?: any[];
   meters?: any[];
};

type SessionContextType = {
   session: Session | null;
   isLoading: boolean;
   error: Error | null;
   polarCustomerState: PolarCustomerState | null;
   isPolarLoading: boolean;
   polarError: Error | null;
   refreshPolarState: () => Promise<void>;
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
   const {
      data: session,
      isPending: isLoading,
      error,
   } = betterAuthClient.useSession();
   const [polarCustomerState, setPolarCustomerState] =
      useState<PolarCustomerState | null>(null);
   const [isPolarLoading, setIsPolarLoading] = useState(false);
   const [polarError, setPolarError] = useState<Error | null>(null);

   // Function to fetch polar customer state
   const refreshPolarState = useCallback(async () => {
      if (!session?.user) return;

      try {
         setIsPolarLoading(true);
         setPolarError(null);

         // Fetch customer state and subscriptions from polar
         const [customerState, subscriptions, benefits] = await Promise.all([
            betterAuthClient.customer.state(),
            betterAuthClient.customer.subscriptions.list(),
            betterAuthClient.customer.benefits.list(),
         ]);

         setPolarCustomerState({
            customer: customerState.data,
            subscriptions: subscriptions.data as any,
            benefits: benefits.data as any,
            meters: [], // Will add meters if needed
         });
      } catch (err) {
         setPolarError(err as Error);
         console.error("Failed to fetch polar customer state:", err);
      } finally {
         setIsPolarLoading(false);
      }
   }, [session?.user]);

   // Sync polar session data with better auth session
   useEffect(() => {
      if (session?.user) {
         refreshPolarState();
      } else {
         // Clear polar state when no session
         setPolarCustomerState(null);
      }
   }, [session, refreshPolarState]);

   return (
      <sessionContext.Provider
         value={{
            session: session || null,
            isLoading,
            error,
            polarCustomerState,
            isPolarLoading,
            polarError,
            refreshPolarState,
         }}
      >
         {children}
      </sessionContext.Provider>
   );
};
