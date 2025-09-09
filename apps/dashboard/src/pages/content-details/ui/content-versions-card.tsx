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

interface ContentVersionsCardProps {
   contentId: string;
   onVersionClick: (
      version: RouterOutput["content"]["getVersions"][number],
   ) => void;
}

export function ContentVersionsCard({
   contentId,
   onVersionClick,
}: ContentVersionsCardProps) {
   const trpc = useTRPC();

   const { data: versions } = useSuspenseQuery(
      trpc.content.getVersions.queryOptions({
         contentId,
      }),
   );

   if (!versions || !Array.isArray(versions) || versions.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Versions
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground text-sm">
                  No versions available yet.
               </p>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               Content Versions
            </CardTitle>
            <CardDescription>
               A history of all changes made to this content
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
                     <CardTitle>Version {version.version}</CardTitle>
                     <CardDescription>
                        Changes made in this version{" "}
                        {version.meta?.diff?.length}
                     </CardDescription>
                  </CardHeader>
               </Card>
            ))}
         </CardContent>
      </Card>
   );
}
