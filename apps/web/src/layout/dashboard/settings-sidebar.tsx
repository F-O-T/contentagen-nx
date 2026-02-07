import { Separator } from "@packages/ui/components/separator";
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import {
   CreditCard,
   ExternalLink,
   Settings2,
   Shield,
   User,
} from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

const settingsNavItems = [
   {
      href: "/$slug/settings/profile",
      icon: User,
      id: "profile",
      title: "Perfil",
   },
   {
      href: "/$slug/settings/security",
      icon: Shield,
      id: "security",
      title: "Segurança",
   },
   {
      href: "/$slug/settings/preferences",
      icon: Settings2,
      id: "preferences",
      title: "Preferências",
   },
];

export { settingsNavItems };

export function SettingsSidebar() {
   const { activeOrganization } = useActiveOrganization();
   const { pathname } = useLocation();

   const isActive = (href: string) => {
      const resolvedHref = href.replace("$slug", activeOrganization.slug);
      return pathname === resolvedHref;
   };

   return (
      <SidebarGroup>
         <SidebarGroupContent>
            <SidebarMenu>
               {settingsNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                     <SidebarMenuButton
                        asChild
                        className={
                           isActive(item.href)
                              ? "bg-primary/10 text-primary rounded-lg"
                              : ""
                        }
                     >
                        <Link
                           params={{ slug: activeOrganization.slug }}
                           to={item.href}
                        >
                           <item.icon />
                           <span>{item.title}</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               ))}
            </SidebarMenu>
            <Separator className="my-2" />
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                     <Link
                        params={{ slug: activeOrganization.slug }}
                        to="/$slug/billing"
                     >
                        <CreditCard />
                        <span>Faturamento</span>
                        <ExternalLink className="ml-auto size-4" />
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
