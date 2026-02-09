import { Card, CardContent } from "@packages/ui/components/card";
import { Construction } from "lucide-react";

interface SettingsPlaceholderPageProps {
   title: string;
   description: string;
}

export function SettingsPlaceholderPage({
   title,
   description,
}: SettingsPlaceholderPageProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
         </div>
         <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
               <Construction className="size-10 text-muted-foreground mb-4" />
               <p className="text-sm font-medium text-muted-foreground">
                  Em breve
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                  Esta funcionalidade está em desenvolvimento.
               </p>
            </CardContent>
         </Card>
      </div>
   );
}
