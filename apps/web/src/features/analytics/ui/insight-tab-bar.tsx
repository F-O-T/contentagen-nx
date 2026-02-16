import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import type { InsightType } from "../hooks/use-insight-config";

interface InsightTabBarProps {
   activeTab: InsightType;
   onTabChange: (tab: InsightType) => void;
   onSave?: () => void;
   isSaving?: boolean;
}

const tabs: Array<{ id: InsightType; label: string }> = [
   { id: "trends", label: "Trends" },
   { id: "funnels", label: "Funnels" },
   { id: "retention", label: "Retention" },
];

export function InsightTabBar({
   activeTab,
   onTabChange,
   onSave,
   isSaving,
}: InsightTabBarProps) {
   return (
      <div className="flex items-center justify-between border-b pb-0">
         <div className="flex items-center gap-0">
            {tabs.map((tab) => (
               <button
                  className={cn(
                     "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                     activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                  )}
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  type="button"
               >
                  {tab.label}
               </button>
            ))}
         </div>
         {onSave && (
            <Button disabled={isSaving} onClick={onSave} size="sm">
               {isSaving ? "Salvando..." : "Salvar insight"}
            </Button>
         )}
      </div>
   );
}
