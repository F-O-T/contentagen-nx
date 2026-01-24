import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import {
   Activity,
   CreditCard,
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
   {
      href: "/$slug/settings/usage",
      icon: Activity,
      id: "usage",
      title: "Uso de IA",
   },
   {
      href: "/$slug/settings/billing",
      icon: CreditCard,
      id: "billing",
      title: "Assinatura",
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
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
