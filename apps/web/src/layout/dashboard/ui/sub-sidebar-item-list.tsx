import { Button } from "@packages/ui/components/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   Link,
   useLocation,
   useParams,
   useRouter,
} from "@tanstack/react-router";
import {
   ChevronDown,
   GitBranch,
   LayoutDashboard,
   Lightbulb,
   Plus,
   RotateCcw,
} from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { orpc } from "@/integrations/orpc/client";
import type { SubSidebarSection } from "../hooks/use-sidebar-nav";
import { dataManagementNavSections } from "./data-management-nav-items";
import type {
   SettingsNavItemDef,
   SettingsNavSection,
} from "./settings-nav-items";
import { SubSidebarContextMenu } from "./sub-sidebar-context-menu";

interface SubSidebarItemListProps {
   section: SubSidebarSection;
   searchQuery: string;
   onItemClick?: () => void;
}

export function SubSidebarItemList({
   section,
   searchQuery,
   onItemClick,
}: SubSidebarItemListProps) {
   return (
      <ErrorBoundary
         fallbackRender={({ error }) => (
            <div className="flex-1 flex items-center justify-center p-4">
               <p className="text-sm text-destructive text-center">
                  Erro ao carregar lista: {(error as Error).message}
               </p>
            </div>
         )}
      >
         <Suspense fallback={<ItemListSkeleton />}>
            <ItemListContent
               onItemClick={onItemClick}
               searchQuery={searchQuery}
               section={section}
            />
         </Suspense>
      </ErrorBoundary>
   );
}

function ItemListSkeleton() {
   return (
      <div className="flex-1 flex flex-col gap-1 p-2">
         {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
               className="h-8 w-full rounded-md"
               key={`sidebar-skeleton-${i + 1}`}
            />
         ))}
      </div>
   );
}

function ItemListContent({
   section,
   searchQuery,
   onItemClick,
}: SubSidebarItemListProps) {
   if (section === "dashboards") {
      return (
         <DashboardList onItemClick={onItemClick} searchQuery={searchQuery} />
      );
   }
   if (section === "data-management") {
      return (
         <DataManagementItemList
            onItemClick={onItemClick}
            searchQuery={searchQuery}
         />
      );
   }
   return <InsightList onItemClick={onItemClick} searchQuery={searchQuery} />;
}

const INSIGHT_ICONS: Record<string, typeof Lightbulb> = {
   trends: Lightbulb,
   funnels: GitBranch,
   retention: RotateCcw,
};

function getInsightIcon(type: string) {
   return INSIGHT_ICONS[type] ?? Lightbulb;
}

function DashboardList({
   searchQuery,
   onItemClick,
}: {
   searchQuery: string;
   onItemClick?: () => void;
}) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const { data: dashboards } = useSuspenseQuery(
      orpc.dashboards.list.queryOptions({}),
   );

   const filtered = useMemo(() => {
      if (!searchQuery.trim()) return dashboards;
      const query = searchQuery.toLowerCase();
      return dashboards.filter((d) => d.name.toLowerCase().includes(query));
   }, [dashboards, searchQuery]);

   if (filtered.length === 0) {
      return (
         <EmptyState
            hasSearchQuery={searchQuery.trim().length > 0}
            section="dashboards"
            slug={slug}
         />
      );
   }

   return (
      <div className="flex-1 overflow-y-auto p-1">
         <ul className="flex flex-col gap-0.5">
            {filtered.map((dashboard) => (
               <li className="group" key={dashboard.id}>
                  <div
                     className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        "text-foreground hover:bg-accent",
                     )}
                  >
                     <Link
                        className="flex items-center gap-2 min-w-0 flex-1"
                        onClick={onItemClick}
                        params={{
                           slug,
                           teamSlug,
                           dashboardId: dashboard.id,
                        }}
                        to={
                           "/$slug/$teamSlug/analytics/dashboards/$dashboardId"
                        }
                     >
                        <LayoutDashboard className="size-4 flex-shrink-0" />
                        <span className="truncate">{dashboard.name}</span>
                     </Link>
                     <SubSidebarContextMenu
                        item={{
                           id: dashboard.id,
                           name: dashboard.name,
                        }}
                        section="dashboards"
                     />
                  </div>
               </li>
            ))}
         </ul>
      </div>
   );
}

function InsightList({
   searchQuery,
   onItemClick,
}: {
   searchQuery: string;
   onItemClick?: () => void;
}) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const { data: insights } = useSuspenseQuery(
      orpc.insights.list.queryOptions({}),
   );

   const filtered = useMemo(() => {
      if (!searchQuery.trim()) return insights;
      const query = searchQuery.toLowerCase();
      return insights.filter((i) => i.name.toLowerCase().includes(query));
   }, [insights, searchQuery]);

   if (filtered.length === 0) {
      return (
         <EmptyState
            hasSearchQuery={searchQuery.trim().length > 0}
            section="insights"
            slug={slug}
         />
      );
   }

   return (
      <div className="flex-1 overflow-y-auto p-1">
         <ul className="flex flex-col gap-0.5">
            {filtered.map((insight) => {
               const Icon = getInsightIcon(insight.type);
               return (
                  <li className="group" key={insight.id}>
                     <div
                        className={cn(
                           "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                           "text-foreground hover:bg-accent",
                        )}
                     >
                        <Link
                           className="flex items-center gap-2 min-w-0 flex-1"
                           onClick={onItemClick}
                           params={{
                              slug,
                              teamSlug,
                              insightId: insight.id,
                           }}
                           to={"/$slug/$teamSlug/analytics/insights/$insightId"}
                        >
                           <Icon className="size-4 flex-shrink-0" />
                           <span className="truncate">{insight.name}</span>
                        </Link>
                        <SubSidebarContextMenu
                           item={{
                              id: insight.id,
                              name: insight.name,
                           }}
                           section="insights"
                        />
                     </div>
                  </li>
               );
            })}
         </ul>
      </div>
   );
}

function filterSection(
   section: SettingsNavSection,
   query: string,
): SettingsNavSection {
   if (!query) return section;
   const filteredItems = section.items.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()),
   );
   return { ...section, items: filteredItems };
}

function DataManagementItemList({
   searchQuery,
   onItemClick,
}: {
   searchQuery: string;
   onItemClick?: () => void;
}) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const { pathname } = useLocation();

   const filteredSections = useMemo(
      () =>
         dataManagementNavSections.map((section) =>
            filterSection(section, searchQuery),
         ),
      [searchQuery],
   );

   const hasResults = filteredSections.some(
      (section) => section.items.length > 0,
   );

   if (!hasResults) {
      return (
         <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
               Nenhum item encontrado
            </p>
         </div>
      );
   }

   return (
      <div className="flex-1 overflow-y-auto p-1">
         {filteredSections.map((section) => (
            <DataManagementSection
               forceOpen={searchQuery.length > 0}
               key={section.id}
               onItemClick={onItemClick}
               pathname={pathname}
               section={section}
               slug={slug}
               teamSlug={teamSlug}
            />
         ))}
      </div>
   );
}

function DataManagementSection({
   section,
   slug,
   teamSlug,
   pathname,
   forceOpen,
   onItemClick,
}: {
   section: SettingsNavSection;
   slug: string;
   teamSlug: string;
   pathname: string;
   forceOpen: boolean;
   onItemClick?: () => void;
}) {
   const [isOpen, setIsOpen] = useState(section.defaultOpen);
   const effectiveOpen = forceOpen || isOpen;

   if (section.items.length === 0) return null;

   return (
      <Collapsible onOpenChange={setIsOpen} open={effectiveOpen}>
         <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 group">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
               {section.label}
            </span>
            <ChevronDown
               className={cn(
                  "size-3.5 text-muted-foreground/50 transition-transform",
                  !effectiveOpen && "-rotate-90",
               )}
            />
         </CollapsibleTrigger>
         <CollapsibleContent>
            <ul className="flex flex-col gap-0.5 px-1 pb-1">
               {section.items.map((item) => (
                  <DataManagementNavItem
                     item={item}
                     key={item.id}
                     onItemClick={onItemClick}
                     pathname={pathname}
                     slug={slug}
                     teamSlug={teamSlug}
                  />
               ))}
            </ul>
         </CollapsibleContent>
      </Collapsible>
   );
}

function DataManagementNavItem({
   item,
   slug,
   teamSlug,
   pathname,
   onItemClick,
}: {
   item: SettingsNavItemDef;
   slug: string;
   teamSlug: string;
   pathname: string;
   onItemClick?: () => void;
}) {
   const router = useRouter();
   const { pathname: resolvedHref } = router.buildLocation({
      to: item.href,
      params: { slug, teamSlug },
   });
   const isActive = pathname === resolvedHref;

   return (
      <li>
         <Link
            className={cn(
               "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
               isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-accent",
            )}
            onClick={onItemClick}
            params={{ slug, teamSlug }}
            to={item.href}
         >
            {item.icon && <item.icon className="size-4 flex-shrink-0" />}
            <span className="truncate">{item.title}</span>
         </Link>
      </li>
   );
}

function EmptyState({
   section,
   hasSearchQuery,
   slug,
}: {
   section: SubSidebarSection;
   hasSearchQuery: boolean;
   slug: string;
}) {
   const label = section === "dashboards" ? "dashboard" : "insight";
   const { teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const teamSegment = teamSlug ? `/${teamSlug}` : "";
   const listRoute =
      section === "dashboards"
         ? `/${slug}${teamSegment}/analytics/dashboards`
         : `/${slug}${teamSegment}/analytics/insights`;

   if (hasSearchQuery) {
      return (
         <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
               {section === "dashboards"
                  ? "Nenhum dashboard encontrado"
                  : "Nenhum insight encontrado"}
            </p>
         </div>
      );
   }

   return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
         <p className="text-sm text-muted-foreground text-center">
            {section === "dashboards"
               ? "Nenhum dashboard encontrado"
               : "Nenhum insight encontrado"}
         </p>
         <Button asChild size="sm" variant="outline">
            <Link to={listRoute}>
               <Plus className="size-3.5" />
               Novo {label}
            </Link>
         </Button>
      </div>
   );
}
