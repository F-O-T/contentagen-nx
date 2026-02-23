import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { SidebarMenuAction } from "@packages/ui/components/sidebar";
import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { ExternalLink, MoreHorizontal, Pin, Plus } from "lucide-react";
import { togglePinnedItem, useSidebarNav } from "../hooks/use-sidebar-nav";
import type { NavItemDef } from "./sidebar-nav-items";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

function QuickCreateButton({ item }: { item: NavItemDef }) {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   if (!item.quickAction) return null;

   // For sub-menu items (dashboards/insights), delegate to SubSidebarNewMenu
   if (item.quickAction.target === "sub-menu" && item.subPanel) {
      return <SubSidebarNewMenu section={item.subPanel} />;
   }

   // For navigate items, go to the create route
   const handleCreate = () => {
      return navigate({
         to: `${item.route}/new`,
         params: { slug, teamSlug },
      });
   };

   return (
      <SidebarMenuAction onClick={handleCreate} title="Criar novo">
         <Plus className="size-4" />
      </SidebarMenuAction>
   );
}

function MoreMenu({ item }: { item: NavItemDef }) {
   const { pinnedItems } = useSidebarNav();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const router = useRouter();
   const isPinned = pinnedItems.includes(item.id);

   const handleOpenNewTab = () => {
      const { href } = router.buildLocation({
         to: item.route,
         params: { slug, teamSlug },
      });
      window.open(href, "_blank");
   };

   const handleTogglePin = () => {
      togglePinnedItem(item.id);
   };

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <SidebarMenuAction
               className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity data-[state=open]:opacity-100"
               title="Mais opções"
            >
               <MoreHorizontal className="size-4" />
            </SidebarMenuAction>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" side="right" sideOffset={8}>
            <DropdownMenuItem onClick={handleOpenNewTab}>
               <ExternalLink className="size-4" />
               <span>Abrir em nova aba</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleTogglePin}>
               <Pin className="size-4" />
               <span>{isPinned ? "Desafixar" : "Fixar no topo"}</span>
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

export function SidebarItemActions({ item }: { item: NavItemDef }) {
   if (item.subPanel) {
      return null;
   }
   if (item.quickAction) {
      return <QuickCreateButton item={item} />;
   }
   return <MoreMenu item={item} />;
}
