import { Input } from "@packages/ui/components/input";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useEarlyAccess } from "@/hooks/use-early-access";
import {
   type SettingsNavItemDef,
   settingsNavSections,
} from "./settings-nav-items";

function flattenItems(items: SettingsNavItemDef[]): SettingsNavItemDef[] {
   return items.flatMap((item) => (item.children ? item.children : [item]));
}

export function SettingsMobileNav() {
   const { activeOrganization } = useActiveOrganization();
   const { isEnrolled } = useEarlyAccess();
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
               placeholder="Pesquisar configurações..."
               value={search}
            />
         </div>

         {settingsNavSections.map((section) => {
            const allItems = flattenItems(section.items);
            const filtered = (
               q
                  ? allItems.filter((item) =>
                       item.title.toLowerCase().includes(q),
                    )
                  : allItems
            ).filter((item) => {
               // Filter by early access enrollment
               if (!item.earlyAccessFlag) return true;
               return isEnrolled(item.earlyAccessFlag);
            });

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
                                 params: { slug: activeOrganization.slug },
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
