import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { FileText } from "lucide-react";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";

interface ContentVersionsCardProps {
   contentId: string;
   onVersionClick: (
      version: RouterOutput["content"]["versions"]["getVersions"][number],
   ) => void;
}

export function ContentVersionsCard({
   contentId,
   onVersionClick,
}: ContentVersionsCardProps) {
   const trpc = useTRPC();

   const { data: versions } = useSuspenseQuery(
      trpc.content.versions.getVersions.queryOptions({
         contentId,
      }),
   );

   if (!versions || !Array.isArray(versions) || versions.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {translate("pages.content-details.versions.title")}
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground text-sm">
                  {translate("pages.content-details.versions.no-versions")}
               </p>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               {translate("pages.content-details.versions.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.content-details.versions.description")}
            </CardDescription>
            <CardAction>
               <Badge variant="outline">{versions.length}</Badge>
            </CardAction>
         </CardHeader>
         <CardContent className="space-y-2">
            {versions.slice(0, 5).map((version) => (
               <Card
                  key={version.id}
                  className="cursor-pointer"
                  onClick={() => onVersionClick(version)}
               >
                  <CardHeader>
                     <CardTitle>
                        {translate(
                           "pages.content-details.versions.version-number",
                           { number: version.version },
                        )}
                     </CardTitle>
                     <CardDescription>
                        {translate(
                           "pages.content-details.versions.changes-count",
                           { count: version.meta?.diff?.length },
                        )}
                     </CardDescription>
                  </CardHeader>
               </Card>
            ))}
         </CardContent>
      </Card>
   );
}
