import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { FeatureStageBadge } from "@packages/ui/components/feature-stage-badge";
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
import {
   Link,
   useLocation,
   useParams,
   useRouter,
} from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useEarlyAccess } from "@/hooks/use-early-access";
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
   teamSlug,
   pathname,
}: {
   item: SettingsNavItemDef;
   slug: string;
   teamSlug: string;
   pathname: string;
}) {
   const { isEnrolled, getFeatureStage } = useEarlyAccess();
   const router = useRouter();
   const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
   const { pathname: resolvedHref } = router.buildLocation({
      to: item.href,
      params: { slug, teamSlug },
   });
   const isActive = pathname === resolvedHref;

   // Filter children based on early access enrollment
   const visibleChildren = item.children?.filter((child) => {
      if (!child.earlyAccessFlag) return true;
      return isEnrolled(child.earlyAccessFlag);
   });

   const hasChildren = visibleChildren && visibleChildren.length > 0;

   const isChildActive = visibleChildren?.some(
      (child) =>
         pathname ===
         router.buildLocation({ to: child.href, params: { slug, teamSlug } })
            .pathname,
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
                     {visibleChildren?.map((child) => {
                        const childActive =
                           pathname ===
                           router.buildLocation({
                              to: child.href,
                              params: { slug, teamSlug },
                           }).pathname;
                        const earlyStage =
                           child.earlyAccessFlag &&
                           isEnrolled(child.earlyAccessFlag)
                              ? getFeatureStage(child.earlyAccessFlag)
                              : null;
                        return (
                           <SidebarMenuSubItem key={child.id}>
                              <SidebarMenuSubButton
                                 asChild
                                 className={cn(
                                    childActive && "bg-primary/10 text-primary",
                                 )}
                              >
                                 <Link
                                    params={{ slug, teamSlug }}
                                    to={child.href}
                                 >
                                    <span>{child.title}</span>
                                    {earlyStage && (
                                       <FeatureStageBadge
                                          aria-hidden="true"
                                          className="ml-auto text-[10px] px-1 py-0"
                                          showIcon={false}
                                          stage={earlyStage}
                                       />
                                    )}
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
               <Link params={{ slug, teamSlug }} to={item.href}>
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
            <Link params={{ slug, teamSlug }} to={item.href}>
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
   teamSlug,
   pathname,
   forceOpen,
}: {
   section: SettingsNavSection;
   slug: string;
   teamSlug: string;
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
                           teamSlug={teamSlug}
                        />
                     ))}
                  </SidebarMenu>
               </SidebarGroupContent>
            </CollapsibleContent>
         </SidebarGroup>
      </Collapsible>
   );
}

export function SettingsSidebar({ search }: { search: string }) {
   const { activeOrganization } = useActiveOrganization();
   const { teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const { pathname } = useLocation();

   const filteredSections = settingsNavSections.map((section) =>
      filterSection(section, search),
   );

   return (
      <>
         {filteredSections.map((section) => (
            <NavSection
               forceOpen={search.length > 0}
               key={section.id}
               pathname={pathname}
               section={section}
               slug={activeOrganization.slug}
               teamSlug={teamSlug ?? ""}
            />
         ))}
      </>
   );
}
