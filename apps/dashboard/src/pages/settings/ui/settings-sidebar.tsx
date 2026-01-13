import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, CreditCard, Key, Settings2, Shield, User } from "lucide-react";
import { useMemo } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";

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
      href: "/$slug/settings/api-keys",
      icon: Key,
      id: "api-keys",
      title: "API Keys",
   },
   {
      href: "/$slug/settings/usage",
      icon: BarChart3,
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
   const { hasFeature } = useFeatureAccess();

   const isActive = (href: string) => {
      const resolvedHref = href.replace("$slug", activeOrganization.slug);
      return pathname === resolvedHref;
   };

   // Filter nav items based on feature access
   const visibleNavItems = useMemo(() => {
      return settingsNavItems.filter((item) => {
         // Hide API Keys for users without API_ACCESS feature
         if (item.id === "api-keys" && !hasFeature(Feature.API_ACCESS)) {
            return false;
         }
         // Hide Usage for users without any AI features
         if (item.id === "usage" && !hasFeature(Feature.FIM)) {
            return false;
         }
         return true;
      });
   }, [hasFeature]);

   return (
      <SidebarGroup>
         <SidebarGroupContent>
            <SidebarMenu>
               {visibleNavItems.map((item) => (
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
