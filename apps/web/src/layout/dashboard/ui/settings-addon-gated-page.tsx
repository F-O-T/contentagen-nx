import { Button } from "@packages/ui/components/button";
import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SettingsAddonGatedPageProps {
   title: string;
   description: string;
   lockedText: string;
   addonName: string;
   icon: LucideIcon;
}

export function SettingsAddonGatedPage({
   title,
   description,
   lockedText,
   addonName,
   icon: Icon,
}: SettingsAddonGatedPageProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
         </div>
         <div className="flex flex-col items-center justify-center py-12">
            <Lock className="size-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
               {lockedText}
            </p>
            <Button className="mt-4" variant="default">
               Ativar addon {addonName}
            </Button>
         </div>
      </div>
   );
}
