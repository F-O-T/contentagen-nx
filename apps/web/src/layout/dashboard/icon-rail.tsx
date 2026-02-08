import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
   Link,
   useLocation,
   useParams,
   useRouter,
} from "@tanstack/react-router";
import { BadgeCheck, CreditCard, LogOut, Sparkles } from "lucide-react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import type { SubSidebarSection } from "@/hooks/use-sidebar-nav";
import { useSidebarNav } from "@/hooks/use-sidebar-nav";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { CompactScopeSwitcher } from "./compact-scope-switcher";
import type { IconRailItem } from "./icon-rail-items";
import {
   analyticsItems,
   bottomItems,
   contentItems,
   topItems,
} from "./icon-rail-items";
import { LanguageCommand } from "./language-command";
import { ThemeSwitcher } from "./theme-switcher";

const CATEGORY_LABELS: Record<string, string> = {
   content: "Conteúdo",
   analytics: "Analytics",
};

function CategoryLabel({ category }: { category: string }) {
   const label = CATEGORY_LABELS[category];
   if (!label) return null;

   return (
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 pt-3 pb-1">
         {label}
      </span>
   );
}

function IconRailButton({
   item,
   isActive,
   slug,
   onSubSidebarToggle,
}: {
   item: IconRailItem;
   isActive: boolean;
   slug: string;
   onSubSidebarToggle: (section: SubSidebarSection) => void;
}) {
   const Icon = item.icon;
   const resolvedRoute = item.route?.replace("$slug", slug) ?? null;

   const handleClick = useCallback(() => {
      if (item.hasSubSidebar) {
         onSubSidebarToggle(item.id as SubSidebarSection);
      }
   }, [item.hasSubSidebar, item.id, onSubSidebarToggle]);

   const buttonClasses = cn(
      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
      isActive
         ? "bg-primary/10 text-primary"
         : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
   );

   // Search button (no route, no sub-sidebar) -- just a placeholder button
   if (!resolvedRoute && !item.hasSubSidebar) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <button
                  aria-label={item.label}
                  className={buttonClasses}
                  type="button"
               >
                  <Icon className="size-5" />
               </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
               {item.label}
            </TooltipContent>
         </Tooltip>
      );
   }

   // Items with sub-sidebar: toggle sub-sidebar AND navigate
   if (item.hasSubSidebar && resolvedRoute) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <Link
                  aria-label={item.label}
                  className={buttonClasses}
                  onClick={handleClick}
                  to={resolvedRoute}
               >
                  <Icon className="size-5" />
               </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
               {item.label}
            </TooltipContent>
         </Tooltip>
      );
   }

   // Regular navigation items
   if (resolvedRoute) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <Link
                  aria-label={item.label}
                  className={buttonClasses}
                  to={resolvedRoute}
               >
                  <Icon className="size-5" />
               </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
               {item.label}
            </TooltipContent>
         </Tooltip>
      );
   }

   return null;
}

function CompactNavUser() {
   return (
      <ErrorBoundary
         fallbackRender={() => <div className="size-7 rounded-full bg-muted" />}
      >
         <Suspense
            fallback={
               <div className="size-7 rounded-full bg-muted animate-pulse" />
            }
         >
            <CompactNavUserContent />
         </Suspense>
      </ErrorBoundary>
   );
}

function CompactNavUserContent() {
   const { activeOrganization } = useActiveOrganization();
   const { openAlertDialog } = useAlertDialog();
   const router = useRouter();
   const queryClient = useQueryClient();
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const handleLogout = useCallback(async () => {
      await authClient.signOut({
         fetchOptions: {
            onError: ({ error }) => {
               toast.error(error.message, { id: "logout" });
            },
            onRequest: () => {
               toast.loading("Saindo...", { id: "logout" });
            },
            onSuccess: async () => {
               await queryClient.invalidateQueries({
                  queryKey: orpc.session.getSession.queryKey({}),
               });
               router.navigate({
                  to: "/auth/sign-in",
               });
               toast.success("Você saiu com sucesso", { id: "logout" });
            },
         },
      });
   }, [queryClient, router]);

   const handleLogoutClick = useCallback(() => {
      openAlertDialog({
         actionLabel: "Sair",
         cancelLabel: "Cancelar",
         description: "Tem certeza que deseja sair da sua conta?",
         onAction: handleLogout,
         title: "Sair da Conta",
         variant: "destructive",
      });
   }, [openAlertDialog, handleLogout]);

   return (
      <DropdownMenu>
         <Tooltip>
            <TooltipTrigger asChild>
               <DropdownMenuTrigger asChild>
                  <button
                     aria-label={session?.user.name ?? "Conta"}
                     className="flex items-center justify-center rounded-full p-0.5 hover:bg-accent transition-colors"
                     type="button"
                  >
                     <Avatar className="size-7">
                        <AvatarImage
                           alt={session?.user.name}
                           src={session?.user.image ?? ""}
                        />
                        <AvatarFallback className="text-xs">
                           {session?.user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                     </Avatar>
                  </button>
               </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
               {session?.user.name ?? "Conta"}
            </TooltipContent>
         </Tooltip>
         <DropdownMenuContent
            align="start"
            className="min-w-56 rounded-lg"
            side="right"
            sideOffset={8}
         >
            {/* Header */}
            <DropdownMenuLabel className="p-0 font-normal">
               <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                     <AvatarImage
                        alt={session?.user.name}
                        src={session?.user.image ?? ""}
                     />
                     <AvatarFallback className="rounded-lg">
                        {session?.user.name?.charAt(0) || "?"}
                     </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                     <span className="truncate font-medium">
                        {session?.user.name}
                     </span>
                     <span className="max-w-52 truncate text-xs text-muted-foreground">
                        {session?.user.email}
                     </span>
                  </div>
               </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Upgrade */}
            <DropdownMenuGroup>
               <DropdownMenuItem asChild>
                  <a href={`/${activeOrganization.slug}/billing`}>
                     <Sparkles />
                     {"Atualizar para Pro"}
                  </a>
               </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {/* Navigation */}
            <DropdownMenuGroup>
               <DropdownMenuItem asChild>
                  <a href={`/${activeOrganization.slug}/settings`}>
                     <BadgeCheck />
                     {"Conta"}
                  </a>
               </DropdownMenuItem>
               <DropdownMenuItem asChild>
                  <a href={`/${activeOrganization.slug}/billing`}>
                     <CreditCard />
                     {"Cobrança"}
                  </a>
               </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {/* Preferences */}
            <DropdownMenuLabel>{"Preferencias"}</DropdownMenuLabel>
            <div className="px-2 py-1.5 space-y-2">
               <div className="flex items-center justify-between">
                  <span className="text-sm">{"Tema"}</span>
                  <ThemeSwitcher />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm">{"Idioma"}</span>
                  <LanguageCommand />
               </div>
            </div>
            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem onClick={handleLogoutClick}>
               <LogOut />
               {"Sair"}
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

export function IconRail() {
   const { pathname } = useLocation();
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? pathname.split("/")[1] ?? "";
   const { activeSubSidebar, toggleSubSidebar } = useSidebarNav();

   const isItemActive = useCallback(
      (item: IconRailItem) => {
         if (!item.route) return false;

         const resolvedRoute = item.route.replace("$slug", slug);

         // For sub-sidebar items, also check if the sub-sidebar is open for that section
         if (item.hasSubSidebar) {
            return (
               activeSubSidebar === item.id ||
               pathname.startsWith(resolvedRoute)
            );
         }

         return pathname.startsWith(resolvedRoute);
      },
      [slug, pathname, activeSubSidebar],
   );

   return (
      <aside className="flex h-screen w-12 flex-col border-r bg-background">
         {/* Top area: Org avatar + Search */}
         <div className="flex flex-col items-center gap-2 px-1 pt-3 pb-2">
            <CompactScopeSwitcher />
            {topItems.map((item) => (
               <IconRailButton
                  isActive={isItemActive(item)}
                  item={item}
                  key={item.id}
                  onSubSidebarToggle={toggleSubSidebar}
                  slug={slug}
               />
            ))}
         </div>

         {/* Content group */}
         <div className="flex flex-col items-center gap-1 px-1">
            <CategoryLabel category="content" />
            {contentItems.map((item) => (
               <IconRailButton
                  isActive={isItemActive(item)}
                  item={item}
                  key={item.id}
                  onSubSidebarToggle={toggleSubSidebar}
                  slug={slug}
               />
            ))}
         </div>

         {/* Analytics group */}
         <div className="flex flex-col items-center gap-1 px-1">
            <CategoryLabel category="analytics" />
            {analyticsItems.map((item) => (
               <IconRailButton
                  isActive={isItemActive(item)}
                  item={item}
                  key={item.id}
                  onSubSidebarToggle={toggleSubSidebar}
                  slug={slug}
               />
            ))}
         </div>

         {/* Bottom area: Settings + User avatar */}
         <div className="mt-auto flex flex-col items-center gap-2 px-1 pb-3 pt-2">
            {bottomItems.map((item) => (
               <IconRailButton
                  isActive={isItemActive(item)}
                  item={item}
                  key={item.id}
                  onSubSidebarToggle={toggleSubSidebar}
                  slug={slug}
               />
            ))}
            <CompactNavUser />
         </div>
      </aside>
   );
}
