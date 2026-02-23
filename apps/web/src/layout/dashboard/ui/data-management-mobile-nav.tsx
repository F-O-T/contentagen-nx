import { Input } from "@packages/ui/components/input";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { dataManagementNavSections } from "./data-management-nav-items";

export function DataManagementMobileNav() {
   const { activeOrganization } = useActiveOrganization();
   const { teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const navigate = useNavigate();
   const [search, setSearch] = useState("");

   const q = search.toLowerCase();

   return (
      <div className="space-y-6">
         <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
            <Input
               className="pl-8 h-9 text-sm"
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Pesquisar dados..."
               value={search}
            />
         </div>

         {dataManagementNavSections.map((section) => {
            const filtered = q
               ? section.items.filter((item) =>
                    item.title.toLowerCase().includes(q),
                 )
               : section.items;

            if (filtered.length === 0) return null;

            return (
               <div key={section.id}>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                     {section.label}
                  </h2>
                  <div className="grid gap-2">
                     {filtered.map((item) => (
                        <QuickAccessCard
                           description=""
                           icon={
                              item.icon ? (
                                 <item.icon className="size-4" />
                              ) : undefined
                           }
                           key={item.id}
                           onClick={() =>
                              navigate({
                                 params: {
                                    slug: activeOrganization.slug,
                                    teamSlug: teamSlug ?? "",
                                 },
                                 to: item.href,
                              })
                           }
                           title={item.title}
                        />
                     ))}
                  </div>
               </div>
            );
         })}
      </div>
   );
}
