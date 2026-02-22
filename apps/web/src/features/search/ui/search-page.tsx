import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
   ClipboardList,
   FileText,
   LayoutDashboard,
   Lightbulb,
   Plus,
   Search,
} from "lucide-react";
import {
   type KeyboardEvent,
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react";
import { useEarlyAccess } from "@/hooks/use-early-access";
import { replaceCurrentTab } from "@/hooks/use-tab-store";
import { resolveTabMetadata } from "@/layout/dashboard/utils/route-to-tab";
import {
   type SearchResultItem,
   type SearchResultType,
   useSearch,
} from "../hooks/use-search";

// ── Icon mapping ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Search> = {
   FileText,
   LayoutDashboard,
   Lightbulb,
   ClipboardList,
   Search,
};

function getIcon(iconName: string) {
   return ICON_MAP[iconName] ?? FileText;
}

// ── Quick Actions ────────────────────────────────────────────────────────────

type QuickAction = {
   label: string;
   icon: typeof Search;
   route: string;
};

function getQuickActions(slug: string, teamId: string): QuickAction[] {
   return [
      {
         label: "Novo conteudo",
         icon: FileText,
         route: `/${slug}/${teamId}/content`,
      },
      {
         label: "Novo dashboard",
         icon: LayoutDashboard,
         route: `/${slug}/${teamId}/analytics/dashboards`,
      },
      {
         label: "Novo insight",
         icon: Lightbulb,
         route: `/${slug}/${teamId}/analytics/insights/new`,
      },
      {
         label: "Novo formulario",
         icon: ClipboardList,
         route: `/${slug}/${teamId}/forms`,
      },
   ];
}

// ── Component ────────────────────────────────────────────────────────────────

export function SearchPage() {
   const params = useParams({ strict: false }) as {
      slug: string;
      teamId: string;
   };
   const navigate = useNavigate();
   const inputRef = useRef<HTMLInputElement>(null);
   const [selectedIndex, setSelectedIndex] = useState(-1);
   const { isEnrolled } = useEarlyAccess();

   const EARLY_ACCESS_SEARCH_MAP: Record<string, SearchResultType> = {
      "forms-beta": "form",
   };

   const hiddenSearchTypes = useMemo(() => {
      const hidden = new Set<SearchResultType>();
      for (const [flagKey, resultType] of Object.entries(
         EARLY_ACCESS_SEARCH_MAP,
      )) {
         if (!isEnrolled(flagKey)) {
            hidden.add(resultType);
         }
      }
      return hidden;
   }, [isEnrolled]);

   const { query, setQuery, results, hasResults, hasQuery } = useSearch(
      params.slug,
      params.teamId,
      { hiddenTypes: hiddenSearchTypes },
   );

   const quickActions = useMemo(() => {
      const actions = getQuickActions(params.slug, params.teamId);
      return actions.filter((a) => {
         if (a.route.includes("/forms") && !isEnrolled("forms-beta"))
            return false;
         return true;
      });
   }, [params.slug, params.teamId, isEnrolled]);

   // Auto-focus the input on mount
   useEffect(() => {
      inputRef.current?.focus();
   }, []);

   // Reset selection when results change
   useEffect(() => {
      setSelectedIndex(-1);
   }, [results]);

   // ── Navigation ───────────────────────────────────────────────────────────

   const navigateToResult = useCallback(
      (item: SearchResultItem) => {
         // Build the resolved path
         let resolvedPath = item.route;
         for (const [key, value] of Object.entries(item.params)) {
            resolvedPath = resolvedPath.replace(`$${key}`, value);
         }

         // Update the current tab to the destination
         const metadata = resolveTabMetadata(resolvedPath, item.params);
         replaceCurrentTab({
            route: item.route,
            params: item.params,
            label: item.title,
            icon: metadata.icon,
            type: metadata.type,
         });

         navigate({ to: resolvedPath });
      },
      [navigate],
   );

   const navigateToQuickAction = useCallback(
      (route: string) => {
         navigate({ to: route });
      },
      [navigate],
   );

   // ── Keyboard navigation ──────────────────────────────────────────────────

   const allItems = results.flatMap((group) => group.items);

   const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
         if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) =>
               prev < allItems.length - 1 ? prev + 1 : 0,
            );
         } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) =>
               prev > 0 ? prev - 1 : allItems.length - 1,
            );
         } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            const item = allItems[selectedIndex];
            if (item) {
               navigateToResult(item);
            }
         } else if (e.key === "Escape") {
            setQuery("");
            setSelectedIndex(-1);
         }
      },
      [allItems, selectedIndex, navigateToResult, setQuery],
   );

   // ── Render ───────────────────────────────────────────────────────────────

   return (
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center px-4 pt-[15vh]">
         {/* Search header */}
         <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
               <Search className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Pesquisar</h1>
         </div>

         {/* Search input */}
         <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
               className="h-11 pl-9 text-base"
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Buscar conteudos, dashboards, insights..."
               ref={inputRef}
               value={query}
            />
         </div>

         {/* Results area */}
         <div className="mt-6 w-full">
            {hasQuery && hasResults && (
               <SearchResults
                  allItems={allItems}
                  groups={results}
                  onSelect={navigateToResult}
                  selectedIndex={selectedIndex}
               />
            )}

            {hasQuery && !hasResults && (
               <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">
                     Nenhum resultado para &ldquo;{query}&rdquo;
                  </p>
               </div>
            )}

            {!hasQuery && (
               <QuickActionsGrid
                  actions={quickActions}
                  onNavigate={navigateToQuickAction}
               />
            )}
         </div>
      </div>
   );
}

// ── Search Results ───────────────────────────────────────────────────────────

function SearchResults({
   groups,
   allItems: _allItems,
   selectedIndex,
   onSelect,
}: {
   groups: ReturnType<typeof useSearch>["results"];
   allItems: SearchResultItem[];
   selectedIndex: number;
   onSelect: (item: SearchResultItem) => void;
}) {
   let globalIndex = 0;

   return (
      <div className="flex flex-col gap-4">
         {groups.map((group) => (
            <div key={group.type}>
               <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label} ({group.items.length})
               </h3>
               <div className="flex flex-col">
                  {group.items.map((item) => {
                     const currentIndex = globalIndex;
                     globalIndex++;
                     const Icon = getIcon(item.icon);

                     return (
                        <button
                           className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                              currentIndex === selectedIndex
                                 ? "bg-accent text-accent-foreground"
                                 : "hover:bg-muted/50",
                           )}
                           key={item.id}
                           onClick={() => onSelect(item)}
                           type="button"
                        >
                           <Icon className="size-4 shrink-0 text-muted-foreground" />
                           <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">
                                 {item.title}
                              </p>
                              {item.description && (
                                 <p className="truncate text-xs text-muted-foreground">
                                    {item.description}
                                 </p>
                              )}
                           </div>
                        </button>
                     );
                  })}
               </div>
            </div>
         ))}
      </div>
   );
}

// ── Quick Actions Grid ───────────────────────────────────────────────────────

function QuickActionsGrid({
   actions,
   onNavigate,
}: {
   actions: QuickAction[];
   onNavigate: (route: string) => void;
}) {
   return (
      <div>
         <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Acoes rapidas
         </h3>
         <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => {
               const _Icon = action.icon;
               return (
                  <button
                     className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                     key={action.label}
                     onClick={() => onNavigate(action.route)}
                     type="button"
                  >
                     <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                        <Plus className="size-3.5 text-primary" />
                     </div>
                     <span className="font-medium">{action.label}</span>
                  </button>
               );
            })}
         </div>
      </div>
   );
}
