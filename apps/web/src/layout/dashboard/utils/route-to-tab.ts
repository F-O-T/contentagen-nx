import type { TabType } from "@/hooks/use-tab-store";

// ── Types ────────────────────────────────────────────────────────────────────

type RouteTabMapping = {
   /** Regex tested against the resolved pathname (after slug/teamId substitution) */
   pattern: RegExp;
   type: TabType;
   icon: string;
   /** Derive a label from the route params. Detail pages get placeholder labels that are updated later. */
   labelFn: (params: Record<string, string>) => string;
};

type TabMetadata = {
   type: TabType;
   icon: string;
   label: string;
};

// ── Route mappings ───────────────────────────────────────────────────────────
// Order matters: more specific patterns must come before generic ones.

const ROUTE_TAB_MAPPINGS: RouteTabMapping[] = [
   // Home (shown as Dashboard)
   {
      pattern: /\/home$/,
      type: "dashboard",
      icon: "LayoutDashboard",
      labelFn: () => "Dashboard",
   },

   // Content
   {
      pattern: /\/content$/,
      type: "content-list",
      icon: "FileText",
      labelFn: () => "Conteudos",
   },

   // Search
   {
      pattern: /\/search$/,
      type: "search",
      icon: "Search",
      labelFn: () => "Pesquisar",
   },

   // Analytics — Dashboards
   {
      pattern: /\/analytics\/dashboards\/[^/]+$/,
      type: "dashboard",
      icon: "LayoutDashboard",
      labelFn: () => "Dashboard",
   },
   {
      pattern: /\/analytics\/dashboards$/,
      type: "dashboard",
      icon: "LayoutDashboard",
      labelFn: () => "Dashboards",
   },

   // Analytics — Insights
   {
      pattern: /\/analytics\/insights\/new$/,
      type: "insight-new",
      icon: "Lightbulb",
      labelFn: () => "Novo insight",
   },
   {
      pattern: /\/analytics\/insights\/[^/]+$/,
      type: "insight",
      icon: "Lightbulb",
      labelFn: () => "Insight",
   },
   {
      pattern: /\/analytics\/insights$/,
      type: "insight",
      icon: "Lightbulb",
      labelFn: () => "Insights",
   },

   // Analytics — Data Management
   {
      pattern: /\/analytics\/data-management\/event-definitions$/,
      type: "data-management",
      icon: "Database",
      labelFn: () => "Definicoes de eventos",
   },
   {
      pattern: /\/analytics\/data-management$/,
      type: "data-management",
      icon: "Database",
      labelFn: () => "Dados",
   },

   // Forms
   {
      pattern: /\/forms\/[^/]+\/submissions$/,
      type: "form-submissions",
      icon: "ClipboardList",
      labelFn: () => "Submissoes",
   },
   {
      pattern: /\/forms\/[^/]+$/,
      type: "form",
      icon: "ClipboardList",
      labelFn: () => "Formulario",
   },
   {
      pattern: /\/forms$/,
      type: "form",
      icon: "ClipboardList",
      labelFn: () => "Formularios",
   },

   // Settings (all settings sub-routes map to a single "Settings" tab type)
   {
      pattern: /\/settings/,
      type: "settings",
      icon: "Settings",
      labelFn: () => "Configuracoes",
   },

   // Billing
   {
      pattern: /\/billing$/,
      type: "billing",
      icon: "CreditCard",
      labelFn: () => "Faturamento",
   },

   // Plans
   {
      pattern: /\/plans$/,
      type: "plans",
      icon: "Sparkles",
      labelFn: () => "Planos",
   },
];

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve tab metadata from a pathname and route params.
 *
 * The pathname should be the full resolved pathname (e.g. "/my-org/team-1/home").
 * Params are the TanStack Router params (slug, teamId, etc.).
 */
export function resolveTabMetadata(
   pathname: string,
   params: Record<string, string>,
): TabMetadata {
   for (const mapping of ROUTE_TAB_MAPPINGS) {
      if (mapping.pattern.test(pathname)) {
         return {
            type: mapping.type,
            icon: mapping.icon,
            label: mapping.labelFn(params),
         };
      }
   }

   // Fallback for unknown routes
   return {
      type: "generic",
      icon: "FileText",
      label: "Pagina",
   };
}

/**
 * Build the TanStack Router `to` path (with $param placeholders) from a resolved pathname.
 *
 * For example: "/my-org/team-1/home" → "/$slug/$teamSlug/home"
 *
 * This re-parameterizes known dynamic segments.
 */
export function pathnameToRoutePath(
   pathname: string,
   params: Record<string, string>,
): string {
   let route = pathname;

   // Replace known param values back to $param placeholders
   if (params.slug) {
      route = route.replace(`/${params.slug}`, "/$slug");
   }
   if (params.teamSlug) {
      route = route.replace(`/${params.teamSlug}`, "/$teamSlug");
   }
   if (params.contentId) {
      route = route.replace(`/${params.contentId}`, "/$contentId");
   }
   if (params.dashboardId) {
      route = route.replace(`/${params.dashboardId}`, "/$dashboardId");
   }
   if (params.insightId) {
      route = route.replace(`/${params.insightId}`, "/$insightId");
   }
   if (params.formId) {
      route = route.replace(`/${params.formId}`, "/$formId");
   }

   return route;
}
