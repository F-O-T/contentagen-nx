// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { SettingsLayout } from "@/layout/dashboard/ui/settings-layout";

vi.mock("@packages/ui/hooks/use-mobile", () => ({
   useIsMobile: () => false,
}));

vi.mock("@packages/ui/components/sidebar", () => ({
   Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
   SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
   SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
   SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
   SidebarManager: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
   SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@tanstack/react-router", () => ({
   useLocation: () => ({ pathname: "/acme/settings" }),
   useParams: () => ({ slug: "acme", teamSlug: "team-1" }),
   Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
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

vi.mock("@/layout/dashboard/ui/settings-sidebar", () => ({
   SettingsSidebar: () => <div>Settings Sidebar</div>,
}));

describe("SettingsLayout", () => {
   it("renders settings sidebar and children", () => {
      render(
         <SettingsLayout>
            <div>Settings Content</div>
         </SettingsLayout>,
      );

      expect(screen.getByText("Settings Sidebar")).toBeTruthy();
      expect(screen.getByText("Settings Content")).toBeTruthy();
   });
});
