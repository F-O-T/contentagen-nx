// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsLayout } from "@/layout/dashboard/ui/settings-layout";

vi.mock("@packages/ui/hooks/use-mobile", () => ({
   useIsMobile: () => false,
}));

vi.mock("@tanstack/react-router", () => ({
   useLocation: () => ({ pathname: "/acme/settings" }),
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
   SettingsSidebar: () => null,
}));

describe("SettingsLayout", () => {
   it("renders settings sidebar as attached panel", () => {
      render(
         <SettingsLayout>
            <div />
         </SettingsLayout>,
      );

      expect(screen.getByText(/configuracoes/i)).toBeTruthy();
   });
});
