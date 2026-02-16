import {
   type AuthClientError,
   createAuthClient as createBetterAuthClient,
} from "@packages/authentication/client";
import { toast } from "sonner";
import { invalidateAllQueries } from "./query-bridge";

// Error tracking for showing error modal after repeated errors
const ERROR_THRESHOLD = 3;
const ERROR_WINDOW_MS = 60 * 1000;

type ErrorEntry = {
   count: number;
   firstOccurrence: number;
};

const errorTracker = new Map<string, ErrorEntry>();

function getErrorKey(path: string, code: string): string {
   return `${path}:${code}`;
}

function shouldShowErrorModal(path: string, code: string): boolean {
   const key = getErrorKey(path, code);
   const now = Date.now();
   const entry = errorTracker.get(key);

   if (!entry || now - entry.firstOccurrence > ERROR_WINDOW_MS) {
      errorTracker.set(key, { count: 1, firstOccurrence: now });
      return false;
   }

   entry.count += 1;

   if (entry.count >= ERROR_THRESHOLD) {
      errorTracker.delete(key);
      return true;
   }

   return false;
}

function handleAuthError(error: AuthClientError) {
   const path = "auth";
   const code = `HTTP_${error.status}`;
   const message = error.message || error.statusText;

   // For now, just show toast. Error modal can be added later
   if (shouldShowErrorModal(path, code)) {
      // TODO: Show error modal
      console.error("Auth error (repeated):", { path, code, message });
   }

   toast.error(message, {
      description: `${path} (${code})`,
   });
}

export const authClient = createBetterAuthClient({
   // Empty string allows Better Auth to infer base URL from current origin
   apiBaseUrl: "",
   onError: handleAuthError,
   onSuccess: () => {
      // Invalidate all queries after any successful Better Auth operation
      // This ensures cache stays fresh after org/team/user updates
      invalidateAllQueries();
   },
});

// Re-export useful hooks and functions from Better Auth
export const { useSession, signIn, signUp, signOut } = authClient;

// Type exports for session inference
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
