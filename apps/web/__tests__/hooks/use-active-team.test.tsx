// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { useActiveTeam } from "@/hooks/use-active-team";

vi.mock("@/integrations/orpc/client", () => ({
   orpc: {
      session: {
         getSession: {
            queryOptions: () => ({
               queryKey: ["session.getSession"],
               queryFn: async () => ({
                  session: { activeTeamId: "team-2" },
               }),
            }),
         },
      },
      organization: {
         getOrganizationTeams: {
            queryOptions: () => ({
               queryKey: ["organization.getOrganizationTeams"],
               queryFn: async () => [
                  { id: "team-1", name: "Team One" },
                  { id: "team-2", name: "Team Two" },
               ],
            }),
         },
      },
   },
}));

function createWrapper() {
   const queryClient = new QueryClient({
      defaultOptions: {
         queries: {
            retry: false,
         },
      },
   });

   return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
         <QueryClientProvider client={queryClient}>
            <Suspense fallback={null}>{children}</Suspense>
         </QueryClientProvider>
      );
   };
}

describe("useActiveTeam", () => {
   it("resolves the active team from session", async () => {
      const { result } = renderHook(() => useActiveTeam(), {
         wrapper: createWrapper(),
      });

      await waitFor(() => {
         expect(result.current.activeTeam?.id).toBe("team-2");
      });

      expect(result.current.activeTeamId).toBe("team-2");
      expect(result.current.teams).toHaveLength(2);
   });
});
