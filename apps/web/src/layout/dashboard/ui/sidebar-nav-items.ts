import type { LucideIcon } from "lucide-react";
import {
   BarChart3,
   ClipboardList,
   Database,
   FileText,
   FlaskConical,
   House,
   ImageIcon,
   LayoutDashboard,
   Library,
   Lightbulb,
   Network,
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
   /** PostHog early access flag key — if set, item is hidden when user is not enrolled */
   earlyAccessFlag?: string;
   /** Stage of the early access feature, used to render the correct badge (override when PostHog feature is missing) */
   earlyAccessStage?: "alpha" | "beta" | "concept" | "general-availability";
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
            route: "/$slug/$teamSlug/home",
         },
         {
            id: "content",
            label: "Conteudos",
            icon: FileText,
            route: "/$slug/$teamSlug/content",
            quickAction: { type: "create", target: "navigate" },
         },
         {
            id: "forms",
            label: "Formularios",
            icon: ClipboardList,
            route: "/$slug/$teamSlug/forms",
            quickAction: { type: "create", target: "navigate" },
            earlyAccessFlag: "forms-beta",
         },
         {
            id: "experiments",
            label: "Experimentos",
            icon: FlaskConical,
            route: "/$slug/$teamSlug/experiments",
            quickAction: { type: "create", target: "sheet" },
            earlyAccessFlag: "experiments",
            earlyAccessStage: "alpha" as const,
         },
         {
            id: "clusters",
            label: "Clusters",
            icon: Network,
            route: "/$slug/$teamSlug/clusters",
            quickAction: { type: "create", target: "sheet" } as const,
         },
      ],
   },
   {
      id: "biblioteca",
      label: "Biblioteca",
      icon: Library,
      items: [
         {
            id: "assets",
            label: "Imagens",
            icon: ImageIcon,
            route: "/$slug/$teamSlug/assets",
            earlyAccessFlag: "asset-bank",
            earlyAccessStage: "alpha",
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
            route: "/$slug/$teamSlug/analytics/dashboards",
            quickAction: { type: "create", target: "sub-menu" },
            subPanel: "dashboards",
         },
         {
            id: "insights",
            label: "Insights",
            icon: Lightbulb,
            route: "/$slug/$teamSlug/analytics/insights",
            quickAction: { type: "create", target: "sub-menu" },
            subPanel: "insights",
         },
         {
            id: "data-management",
            label: "Dados",
            icon: Database,
            route: "/$slug/$teamSlug/analytics/data-management",
            quickAction: { type: "create", target: "sub-menu" },
            subPanel: "data-management",
         },
      ],
   },
];
