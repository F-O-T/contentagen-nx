// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "@/layout/dashboard/ui/dashboard-layout";

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

vi.mock("@packages/posthog/client", () => ({
   identifyClient: vi.fn(),
   setClientGroup: vi.fn(),
}));

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
      lastSlug: null,
      setLastSlug: vi.fn(),
   }),
}));

vi.mock("@/hooks/use-local-storage", () => ({
   useSafeLocalStorage: () => [false, vi.fn()],
}));

vi.mock("@/hooks/use-early-access", () => ({
   EarlyAccessProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
   ),
}));

vi.mock("@/features/feedback/ui/feedback-fab", () => ({
   FeedbackFab: () => null,
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
            queryOptions: () => ({
               queryKey: ["session.getSession"],
               queryFn: async () => ({
                  user: { id: "user-1", email: "test@example.com", name: "Test" },
                  session: { activeOrganizationId: "org-1" },
               }),
            }),
            queryKey: () => ["session.getSession"],
         },
      },
   },
}));

vi.mock("@/layout/dashboard/hooks/use-sidebar-nav", () => ({
   useSidebarNav: () => ({
      activeSubSidebar: null,
      manualClose: false,
      openSubSidebar: vi.fn(),
      closeSubSidebar: vi.fn(),
      toggleSubSidebar: vi.fn(),
      setManualClose: vi.fn(),
   }),
   openSubSidebar: vi.fn(),
   closeSubSidebar: vi.fn(),
   setActiveSection: vi.fn(),
}));

vi.mock("@/layout/dashboard/hooks/use-tab-router-sync", () => ({
   useTabRouterSync: () => ({
      navigateToTab: vi.fn(),
      handleCloseTab: vi.fn(),
      openNewSearchTab: vi.fn(),
   }),
}));

vi.mock("@/layout/dashboard/hooks/use-tab-keyboard-shortcuts", () => ({
   useTabKeyboardShortcuts: vi.fn(),
}));

vi.mock("@/layout/dashboard/ui/app-sidebar", () => ({
   AppSidebar: () => null,
}));

vi.mock("@/layout/dashboard/ui/sidebar-sub-panel", () => ({
   SidebarSubPanel: () => null,
}));

vi.mock("@/layout/dashboard/ui/tab-bar", () => ({
   TabBar: () => null,
}));

vi.mock("@packages/ui/components/tooltip", () => ({
   TooltipProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
   ),
   Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
   TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
   ),
   TooltipContent: () => null,
}));

vi.mock("@tanstack/react-router", () => ({
   useLocation: () => ({ pathname: "/acme/home" }),
}));

function renderWithClient() {
   const queryClient = new QueryClient({
      defaultOptions: {
         queries: {
            retry: false,
         },
      },
   });

   // Pre-seed the session query so useSuspenseQuery resolves immediately
   queryClient.setQueryData(["session.getSession"], {
      user: { id: "user-1", email: "test@example.com", name: "Test" },
      session: { activeOrganizationId: "org-1" },
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

   it("renders child content", () => {
      renderWithClient();

      expect(screen.getAllByText("Child content").length).toBeGreaterThan(0);
   });
});
