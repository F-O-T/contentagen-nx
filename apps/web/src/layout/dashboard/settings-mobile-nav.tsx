import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useNavigate } from "@tanstack/react-router";
import { CreditCard, Settings2, Shield, User } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

const settingsNavItems = [
   {
      description: "Gerencie seu nome, email e foto",
      href: "/$slug/settings/profile",
      icon: User,
      id: "profile",
      title: "Perfil",
   },
   {
      description: "Senha e autenticação em dois fatores",
      href: "/$slug/settings/security",
      icon: Shield,
      id: "security",
      title: "Segurança",
   },
   {
      description: "Tema, idioma e privacidade",
      href: "/$slug/settings/preferences",
      icon: Settings2,
      id: "preferences",
      title: "Preferências",
   },
];

export function SettingsMobileNav() {
   const { activeOrganization } = useActiveOrganization();
   const navigate = useNavigate();

   return (
      <div className="grid gap-4">
         {settingsNavItems.map((item) => (
            <QuickAccessCard
               description={item.description}
               icon={<item.icon className="size-4" />}
               key={item.id}
               onClick={() =>
                  navigate({
                     params: { slug: activeOrganization.slug },
                     to: item.href,
                  })
               }
               title={item.title}
            />
         ))}
         <QuickAccessCard
            description="Plano, uso e gastos"
            icon={<CreditCard className="size-4" />}
            onClick={() =>
               navigate({
                  params: { slug: activeOrganization.slug },
                  to: "/$slug/billing",
               })
            }
            title="Billing"
         />
      </div>
   );
}
