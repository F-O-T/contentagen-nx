import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Input } from "@packages/ui/components/input";
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
} from "@packages/ui/components/sidebar";
import { cn } from "@packages/ui/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import {
   type SettingsNavItemDef,
   type SettingsNavSection,
   settingsNavSections,
} from "./settings-nav-items";

function matchesSearch(item: SettingsNavItemDef, query: string): boolean {
   const q = query.toLowerCase();
   if (item.title.toLowerCase().includes(q)) return true;
   if (item.children?.some((child) => child.title.toLowerCase().includes(q)))
      return true;
   return false;
}

function filterSection(
   section: SettingsNavSection,
   query: string,
): SettingsNavSection {
   if (!query) return section;
   const filteredItems = section.items.filter((item) =>
      matchesSearch(item, query),
   );
   return { ...section, items: filteredItems };
}

function NavItem({
   item,
   slug,
   pathname,
}: {
   item: SettingsNavItemDef;
   slug: string;
   pathname: string;
}) {
   const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
   const resolvedHref = item.href.replace("$slug", slug);
   const isActive = pathname === resolvedHref;
   const hasChildren = item.children && item.children.length > 0;

   const isChildActive = item.children?.some(
      (child) => pathname === child.href.replace("$slug", slug),
   );

   if (hasChildren) {
      return (
         <Collapsible
            onOpenChange={setIsSubmenuOpen}
            open={isSubmenuOpen || isChildActive}
         >
            <SidebarMenuItem>
               <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                     className={cn(isChildActive && "text-primary")}
                  >
                     {item.icon && <item.icon className="size-4" />}
                     <span>{item.title}</span>
                     <ChevronRight
                        className={cn(
                           "ml-auto size-3.5 transition-transform",
                           (isSubmenuOpen || isChildActive) && "rotate-90",
                        )}
                     />
                  </SidebarMenuButton>
               </CollapsibleTrigger>
               <CollapsibleContent>
                  <SidebarMenuSub>
                     {item.children?.map((child) => {
                        const childResolved = child.href.replace("$slug", slug);
                        const childActive = pathname === childResolved;
                        return (
                           <SidebarMenuSubItem key={child.id}>
                              <SidebarMenuSubButton
                                 asChild
                                 className={cn(
                                    childActive && "bg-primary/10 text-primary",
                                 )}
                              >
                                 <Link params={{ slug }} to={child.href}>
                                    <span>{child.title}</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                        );
                     })}
                  </SidebarMenuSub>
               </CollapsibleContent>
            </SidebarMenuItem>
         </Collapsible>
      );
   }

   if (item.external) {
      return (
         <SidebarMenuItem>
            <SidebarMenuButton asChild>
               <Link params={{ slug }} to={item.href}>
                  {item.icon && <item.icon className="size-4" />}
                  <span>{item.title}</span>
                  <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
      );
   }

   return (
      <SidebarMenuItem>
         <SidebarMenuButton
            asChild
            className={cn(
               isActive && "bg-primary/10 text-primary rounded-lg",
               item.danger && "text-destructive hover:text-destructive",
            )}
         >
            <Link params={{ slug }} to={item.href}>
               {item.icon && <item.icon className="size-4" />}
               <span>{item.title}</span>
            </Link>
         </SidebarMenuButton>
      </SidebarMenuItem>
   );
}

function NavSection({
   section,
   slug,
   pathname,
   forceOpen,
}: {
   section: SettingsNavSection;
   slug: string;
   pathname: string;
   forceOpen: boolean;
}) {
   const [isOpen, setIsOpen] = useState(section.defaultOpen);
   const effectiveOpen = forceOpen || isOpen;

   if (section.items.length === 0) return null;

   return (
      <Collapsible onOpenChange={setIsOpen} open={effectiveOpen}>
         <SidebarGroup className="py-0">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 group">
               <span className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                  {section.label}
               </span>
               <ChevronDown
                  className={cn(
                     "size-3.5 text-sidebar-foreground/50 transition-transform",
                     !effectiveOpen && "-rotate-90",
                  )}
               />
            </CollapsibleTrigger>
            <CollapsibleContent>
               <SidebarGroupContent>
                  <SidebarMenu>
                     {section.items.map((item) => (
                        <NavItem
                           item={item}
                           key={item.id}
                           pathname={pathname}
                           slug={slug}
                        />
                     ))}
                  </SidebarMenu>
               </SidebarGroupContent>
            </CollapsibleContent>
         </SidebarGroup>
      </Collapsible>
   );
}

export function SettingsSidebar() {
   const { activeOrganization } = useActiveOrganization();
   const { pathname } = useLocation();
   const [search, setSearch] = useState("");

   const filteredSections = settingsNavSections.map((section) =>
      filterSection(section, search),
   );

   return (
      <>
         <div className="px-3 py-2">
            <div className="relative">
               <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
               <Input
                  className="pl-8 h-9 bg-sidebar text-sm"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar configurações..."
                  value={search}
               />
            </div>
         </div>
         {filteredSections.map((section) => (
            <NavSection
               forceOpen={search.length > 0}
               key={section.id}
               pathname={pathname}
               section={section}
               slug={activeOrganization.slug}
            />
         ))}
      </>
   );
}
