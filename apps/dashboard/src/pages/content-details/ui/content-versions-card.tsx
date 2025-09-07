import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { User, FileText } from "lucide-react";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ContentVersionSelect } from "@packages/database/schema";

interface ContentVersionsCardProps {
   contentId: string;
   onVersionClick: (version: ContentVersionSelect) => void;
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

   const formatDate = (date: Date | string) => {
      const d = new Date(date);
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.floor(
         Math.abs(now.getTime() - d.getTime()) / msPerDay,
      );
      if (diffDays === 0) return "today";
      if (diffDays === 1) return "yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return d.toLocaleDateString();
   };

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
               <div
                  key={version.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onVersionClick(version)}
               >
                  <div className="flex items-center gap-3">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline">v{version.version}</Badge>
                           <span className="text-sm text-muted-foreground">
                              {formatDate(version.createdAt.toDateString())}
                           </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                           <User className="h-3 w-3" />
                           <span>{version.userId}</span>
                        </div>
                     </div>
                  </div>
                  <Button variant="ghost" size="sm">
                     View Details
                  </Button>
               </div>
            ))}
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                        const first = versions[0];
                        if (first) onVersionClick(first);
                     }}
                  >
                     View All {versions.length} Versions
                  </Button>
                  </Button>
               </div>
            )}
         </CardContent>
      </Card>
   );
}
