import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useNavigate } from "@tanstack/react-router";
import { Building, Mail, Users, Users2 } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

const organizationNavItems = [
   {
      description: "Description",
      href: "/$slug/organization",
      icon: Building,
      id: "overview",
      title: "Visão Geral",
   },
   {
      description: "Description",
      href: "/$slug/organization/members",
      icon: Users,
      id: "members",
      title: "Membros",
   },
   {
      description: "Description",
      href: "/$slug/organization/teams",
      icon: Users2,
      id: "teams",
      title: "Equipes",
   },
   {
      description: "Description",
      href: "/$slug/organization/invites",
      icon: Mail,
      id: "invites",
      title: "Convites",
   },
];

export function OrganizationMobileNav() {
   const { activeOrganization } = useActiveOrganization();
   const navigate = useNavigate();

   return (
      <div className="grid gap-4">
         {organizationNavItems.map((item) => (
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
      </div>
   );
}
