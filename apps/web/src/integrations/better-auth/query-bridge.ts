import type { QueryClient } from "@tanstack/react-query";

/**
 * Module-level reference to the QueryClient instance.
 * This allows Better Auth client to invalidate queries on success.
 */
let queryClient: QueryClient | null = null;

/**
 * Set the QueryClient instance. Should be called once when the app initializes.
 */
export function setQueryClient(client: QueryClient): void {
   queryClient = client;
}

/**
 * Get the current QueryClient instance.
 * Used by Better Auth client to invalidate queries on success.
 */
export function getQueryClient(): QueryClient | null {
   return queryClient;
}

/**
 * Invalidate all queries. Called by Better Auth on successful operations.
 */
export function invalidateAllQueries(): void {
   if (queryClient) {
      queryClient.invalidateQueries();
   }
}
