// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "@/layout/dashboard/dashboard-layout";

const { setActiveTeamMock } = vi.hoisted(() => ({
   setActiveTeamMock: vi.fn(),
}));

if (!window.matchMedia) {
   window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
   })) as typeof window.matchMedia;
}

vi.mock("@/hooks/use-active-organization", () => ({
   useActiveOrganization: () => ({
      activeOrganization: {
         id: "org-1",
         name: "Acme",
         slug: "acme",
      },
      activeSubscription: null,
   }),
}));

vi.mock("@/hooks/use-active-team", () => ({
   useActiveTeam: () => ({
      activeTeam: null,
      activeTeamId: null,
      teams: [{ id: "team-1", name: "Core" }],
   }),
}));

vi.mock("@/hooks/use-last-organization", () => ({
   useLastOrganization: () => ({
      getLastSlug: vi.fn(),
      setLastSlug: vi.fn(),
   }),
}));

vi.mock("@/integrations/better-auth/auth-client", () => ({
   authClient: {
      organization: {
         setActiveTeam: setActiveTeamMock,
      },
   },
}));

vi.mock("@/integrations/orpc/client", () => ({
   orpc: {
      session: {
         getSession: {
            queryKey: () => ["session.getSession"],
         },
      },
   },
}));

vi.mock("@/layout/dashboard/app-sidebar", () => ({
   AppSidebar: () => null,
}));

vi.mock("@/layout/dashboard/site-header", () => ({
   SiteHeader: () => null,
}));

function renderWithClient() {
   const queryClient = new QueryClient({
      defaultOptions: {
         queries: {
            retry: false,
         },
      },
   });

   return render(
      <QueryClientProvider client={queryClient}>
         <DashboardLayout>
            <div>Child content</div>
         </DashboardLayout>
      </QueryClientProvider>,
   );
}

describe("DashboardLayout", () => {
   it("sets an active team when missing", async () => {
      renderWithClient();

      await waitFor(() => {
         expect(setActiveTeamMock).toHaveBeenCalledWith({
            teamId: "team-1",
         });
      });
   });
});
