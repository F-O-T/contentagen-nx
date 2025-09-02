import {
   Card,
   CardHeader,
   CardContent,
   CardTitle,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import { Calendar, Clock, Tag, Link2, Circle } from "lucide-react";
import type { IdeaSelect } from "@packages/database/schema";

export function IdeaMetaCard({ idea }: { idea: IdeaSelect }) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Meta Information</CardTitle>
            <CardDescription>
               Additional details about this idea.
            </CardDescription>
         </CardHeader>
         <CardContent className="flex flex-col gap-2">
            <InfoItem
               icon={<Circle className="w-4 h-4" />}
               label="Status"
               value={idea.status ?? "Unknown"}
            />
            <InfoItem
               icon={<Tag className="w-4 h-4" />}
               label="Tags"
               value={
                  idea.meta?.tags?.length ? idea.meta.tags.join(", ") : "None"
               }
            />
            <InfoItem
               icon={<Link2 className="w-4 h-4" />}
               label="Sources"
               value={
                  idea.meta?.sources?.length
                     ? idea.meta.sources.join(", ")
                     : "None"
               }
            />
            <div className="grid gap-2 grid-cols-2">
               <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Created"
                  value={
                     idea.createdAt
                        ? new Date(idea.createdAt).toLocaleString()
                        : "Unknown"
                  }
               />
               <InfoItem
                  icon={<Clock className="w-4 h-4" />}
                  label="Updated"
                  value={
                     idea.updatedAt
                        ? new Date(idea.updatedAt).toLocaleString()
                        : "Unknown"
                  }
               />
            </div>
         </CardContent>
      </Card>
   );
}
