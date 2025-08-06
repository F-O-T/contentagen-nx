import type { ContentSelect } from "@packages/database/schema";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";

import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";
import {
   Calendar,
   Clock,
   MessageSquare,
   Type,
   Link2,
   Tags,
   List,
   Globe,
} from "lucide-react";

export function ContentDetailsCard({ content }: { content: ContentSelect }) {
   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Request Details</CardTitle>
            <CardDescription>
               Information about your content request
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <InfoItem
               icon={<Type className="h-4 w-4" />}
               label="Title"
               value={content.meta?.title || ""}
            />
            <InfoItem
               icon={<Link2 className="h-4 w-4" />}
               label="Slug"
               value={content.meta?.slug || ""}
            />
            <Separator />
            <div className="grid grid-cols-2 gap-4">
               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Last Updated"
                  value={new Date(content.updatedAt).toLocaleDateString()}
               />

               <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Created At"
                  value={new Date(content.createdAt).toLocaleDateString()}
               />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
               <div className="col-span-2">
                  <InfoItem
                     icon={<Tags className="h-4 w-4" />}
                     label="Tags"
                     value={
                        content.meta?.tags?.length
                           ? content.meta.tags.join(", ")
                           : ""
                     }
                  />
               </div>
               <InfoItem
                  icon={<List className="h-4 w-4" />}
                  label="Topics"
                  value={
                     content.meta?.topics?.length
                        ? content.meta.topics.join(", ")
                        : ""
                  }
               />
               <InfoItem
                  icon={<Globe className="h-4 w-4" />}
                  label="Sources"
                  value={
                     content.meta?.sources?.length
                        ? content.meta.sources.join(", ")
                        : ""
                  }
               />
            </div>
         </CardContent>
      </Card>
   );
}

export function ContentStatsCard({ content }: { content: ContentSelect }) {
   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Content Stats</CardTitle>
            <CardDescription>
               Statistics and metadata about your generated content
            </CardDescription>
            <CardAction>
               <Badge>{content.stats?.qualityScore}</Badge>
            </CardAction>
         </CardHeader>

         <CardContent className="grid grid-cols-2 gap-4">
            <InfoItem
               icon={<Type className="h-4 w-4" />}
               label="Word Count"
               value={content.stats?.wordsCount || ""}
            />
            <InfoItem
               icon={<Clock className="h-4 w-4" />}
               label="Read Time"
               value={`${content.stats?.readTimeMinutes || 0} min`}
            />
         </CardContent>
      </Card>
   );
}
