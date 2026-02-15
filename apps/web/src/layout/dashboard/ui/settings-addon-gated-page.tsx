import { Button } from "@packages/ui/components/button";
import type { LucideIcon } from "lucide-react";
import { Check, Lock } from "lucide-react";
import type { ReactNode } from "react";

interface SettingsAddonGatedPageProps {
   title: string;
   description: string;
   addonName: string;
   addonDescription: string;
   icon: LucideIcon;
   features: { title: string; description: string }[];
   previewContent?: ReactNode;
}

export function SettingsAddonGatedPage({
   title,
   description,
   addonName,
   addonDescription,
   icon: Icon,
   features,
   previewContent,
}: SettingsAddonGatedPageProps) {
   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
         </div>

         <div className="rounded-lg border bg-card p-8">
            <div className="flex flex-col items-center text-center max-w-lg mx-auto">
               <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 mb-4">
                  <Icon className="size-6 text-primary" />
               </div>

               <div className="flex items-center gap-2 mb-2">
                  <Lock className="size-4 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                     Requer addon {addonName}
                  </span>
               </div>

               <p className="text-sm text-muted-foreground mt-1">
                  {addonDescription}
               </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {features.map((feature) => (
                  <div
                     className="flex gap-3 rounded-md border bg-background p-4"
                     key={feature.title}
                  >
                     <div className="flex items-center justify-center size-5 rounded-full bg-primary/10 shrink-0 mt-0.5">
                        <Check className="size-3 text-primary" />
                     </div>
                     <div>
                        <p className="text-sm font-medium">{feature.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                           {feature.description}
                        </p>
                     </div>
                  </div>
               ))}
            </div>

            {previewContent && (
               <div className="relative mt-8 overflow-hidden rounded-md border">
                  <div className="pointer-events-none select-none opacity-60 blur-[2px]">
                     {previewContent}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
               </div>
            )}

            <div className="mt-8 flex justify-center">
               <Button size="lg">Conhecer addon {addonName}</Button>
            </div>
         </div>
      </div>
   );
}
