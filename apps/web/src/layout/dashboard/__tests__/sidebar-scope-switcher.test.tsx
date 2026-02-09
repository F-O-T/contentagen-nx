// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@packages/ui/components/sidebar";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { SidebarScopeSwitcher } from "@/layout/dashboard/ui/sidebar-scope-switcher";

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
      projectCount: 1,
      projectLimit: null,
   }),
}));

vi.mock("@/hooks/use-active-team", () => ({
   useActiveTeam: () => ({
      activeTeam: { id: "team-1", name: "Core" },
      activeTeamId: "team-1",
      teams: [
         { id: "team-1", name: "Core" },
         { id: "team-2", name: "Beta" },
      ],
   }),
}));

vi.mock("@/features/organization/hooks/use-set-active-organization", () => ({
   useSetActiveOrganization: () => ({
      isPending: false,
      setActiveOrganization: vi.fn(),
   }),
}));

vi.mock("@/hooks/use-sheet", () => ({
   useSheet: () => ({
      closeSheet: vi.fn(),
      openSheet: vi.fn(),
   }),
}));

vi.mock("@/integrations/better-auth/auth-client", () => ({
   authClient: {
      organization: {
         setActiveTeam: vi.fn(),
      },
   },
}));

vi.mock("@/integrations/orpc/client", () => ({
   orpc: {
      organization: {
         getOrganizations: {
            queryOptions: () => ({
               queryKey: ["organization.getOrganizations"],
               queryFn: async () => [
                  { id: "org-1", name: "Acme", slug: "acme" },
                  { id: "org-2", name: "Beta", slug: "beta" },
               ],
            }),
         },
      },
      session: {
         getSession: {
            queryKey: () => ["session.getSession"],
         },
      },
   },
}));


vi.mock("@tanstack/react-router", () => ({
   useParams: () => ({ slug: "acme" }),
   useLocation: () => ({ pathname: "/acme/home" }),
   useRouter: () => ({
      navigate: vi.fn(),
      state: {
         location: {
            pathname: "/acme/home",
         },
      },
   }),
}));

function renderWithClient() {
   const queryClient = new QueryClient({
      defaultOptions: {
         queries: {
            retry: false,
         },
      },
   });

   queryClient.setQueryData(["organization.getOrganizations"], [
      { id: "org-1", name: "Acme", slug: "acme" },
      { id: "org-2", name: "Beta", slug: "beta" },
   ]);

   return render(
      <QueryClientProvider client={queryClient}>
         <SidebarProvider>
            <Suspense fallback={null}>
               <SidebarScopeSwitcher />
            </Suspense>
         </SidebarProvider>
      </QueryClientProvider>,
   );
}

describe("SidebarScopeSwitcher", () => {
   it("renders separate org and team triggers", () => {
      renderWithClient();

      expect(screen.getByLabelText(/organizacao/i)).toBeTruthy();
      expect(screen.getByLabelText(/projeto/i)).toBeTruthy();
   });
});
