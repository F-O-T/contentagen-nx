"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { SiteHeader } from "./site-header";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarInset } from "@packages/ui/components/sidebar";
import { ChartAreaInteractive } from "./chart-area-interactive";
import { DataTable } from "./data-table";
import { SectionCards } from "./section-cards";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

