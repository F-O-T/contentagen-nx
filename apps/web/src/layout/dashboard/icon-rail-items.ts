import type { LucideIcon } from "lucide-react";
import {
   ClipboardList,
   Database,
   FileText,
   House,
   LayoutDashboard,
   Lightbulb,
   Search,
   Settings,
} from "lucide-react";

type IconRailCategory = "content" | "analytics";

export type IconRailItem = {
   id: string;
   label: string;
   icon: LucideIcon;
   route: string | null;
   hasSubSidebar: boolean;
   category: IconRailCategory | null;
};

export const topItems: IconRailItem[] = [
   {
      id: "search",
      label: "Buscar",
      icon: Search,
      route: null,
      hasSubSidebar: false,
      category: null,
   },
];

export const contentItems: IconRailItem[] = [
   {
      id: "home",
      label: "Início",
      icon: House,
      route: "/$slug/home",
      hasSubSidebar: false,
      category: "content",
   },
   {
      id: "content",
      label: "Conteúdos",
      icon: FileText,
      route: "/$slug/content",
      hasSubSidebar: false,
      category: "content",
   },
   {
      id: "forms",
      label: "Formulários",
      icon: ClipboardList,
      route: "/$slug/forms",
      hasSubSidebar: false,
      category: "content",
   },
];

export const analyticsItems: IconRailItem[] = [
   {
      id: "dashboards",
      label: "Dashboards",
      icon: LayoutDashboard,
      route: "/$slug/analytics/dashboards",
      hasSubSidebar: true,
      category: "analytics",
   },
   {
      id: "insights",
      label: "Insights",
      icon: Lightbulb,
      route: "/$slug/analytics/insights",
      hasSubSidebar: true,
      category: "analytics",
   },
   {
      id: "data-management",
      label: "Dados",
      icon: Database,
      route: "/$slug/analytics/data-management",
      hasSubSidebar: false,
      category: "analytics",
   },
];

export const bottomItems: IconRailItem[] = [
   {
      id: "settings",
      label: "Configurações",
      icon: Settings,
      route: "/$slug/settings",
      hasSubSidebar: false,
      category: null,
   },
];
