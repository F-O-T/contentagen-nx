import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useRouter } from "@tanstack/react-router";
import { Building2, Mail, Users } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

export function QuickAccessCards() {
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();
   const quickAccessItems = [
      {
         description: "Description",
         icon: <Building2 className="size-5" />,
         onClick: () =>
            router.navigate({
               params: {
                  slug: activeOrganization.slug,
               },
               to: "/$slug/organization/teams",
            }),
         title: "Title",
      },
      {
         description: "Description",
         icon: <Users className="size-5" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               to: "/$slug/organization/members",
            }),
         title: "Title",
      },
      {
         description: "Description",
         icon: <Mail className="size-5" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               to: "/$slug/organization/invites",
            }),
         title: "Title",
      },
   ];

   return (
      <div className="col-span-1 grid grid-cols-2 gap-4">
         {quickAccessItems.map((item, index) => (
            <QuickAccessCard
               description={item.description}
               icon={item.icon}
               key={`quick-access-${index + 1}`}
               onClick={item.onClick}
               title={item.title}
            />
         ))}
      </div>
   );
}
