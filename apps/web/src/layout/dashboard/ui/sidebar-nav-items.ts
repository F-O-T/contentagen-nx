import type { LucideIcon } from "lucide-react";
import {
   BarChart3,
   ClipboardList,
   Database,
   FileText,
   House,
   LayoutDashboard,
   Lightbulb,
} from "lucide-react";
import type { SubSidebarSection } from "../hooks/use-sidebar-nav";

export type NavItemAction = {
   type: "create";
   /** Route to navigate to for creation, or "sheet" to open a create sheet */
   target: "navigate" | "sheet" | "sub-menu";
};

export type NavItemDef = {
   id: string;
   label: string;
   icon: LucideIcon;
   route: string;
   /** Show a '+' quick-action button */
   quickAction?: NavItemAction;
   /** Item expands a floating sub-panel */
   subPanel?: SubSidebarSection;
};

export type NavGroupDef = {
   id: string;
   label: string;
   icon?: LucideIcon;
   items: NavItemDef[];
};

export const navGroups: NavGroupDef[] = [
   {
      id: "main",
      label: "Principal",
      items: [
         {
            id: "home",
            label: "Inicio",
            icon: House,
            route: "/$slug/home",
         },
         {
            id: "content",
            label: "Conteudos",
            icon: FileText,
            route: "/$slug/content",
            quickAction: { type: "create", target: "navigate" },
         },
         {
            id: "forms",
            label: "Formularios",
            icon: ClipboardList,
            route: "/$slug/forms",
            quickAction: { type: "create", target: "navigate" },
         },
      ],
   },
   {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      items: [
         {
            id: "dashboards",
            label: "Dashboards",
            icon: LayoutDashboard,
            route: "/$slug/analytics/dashboards",
            quickAction: { type: "create", target: "sub-menu" },
            subPanel: "dashboards",
         },
         {
            id: "insights",
            label: "Insights",
            icon: Lightbulb,
            route: "/$slug/analytics/insights",
            quickAction: { type: "create", target: "sub-menu" },
            subPanel: "insights",
         },
         {
            id: "data-management",
            label: "Dados",
            icon: Database,
            route: "/$slug/analytics/data-management",
         },
      ],
   },
];
