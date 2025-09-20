import {
   Card,
   CardHeader,
   CardContent,
   CardTitle,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import { Calendar, Clock, Tag, Link2, Circle } from "lucide-react";
import { translate } from "@packages/localization";
import type { IdeaSelect } from "@packages/database/schema";

export function IdeaMetaCard({ idea }: { idea: IdeaSelect }) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("pages.idea-details.meta.title")}</CardTitle>
            <CardDescription>
               {translate("pages.idea-details.meta.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex flex-col gap-2">
            <InfoItem
               icon={<Circle className="w-4 h-4" />}
               label={translate("pages.idea-details.meta.status")}
               value={
                  idea.status ?? translate("pages.idea-details.meta.unknown")
               }
            />
            <InfoItem
               icon={<Tag className="w-4 h-4" />}
               label={translate("pages.idea-details.meta.tags")}
               value={
                  idea.meta?.tags?.length
                     ? idea.meta.tags.join(", ")
                     : translate("pages.idea-details.meta.none")
               }
            />
            <InfoItem
               icon={<Link2 className="w-4 h-4" />}
               label={translate("pages.idea-details.meta.sources")}
               value={
                  idea.meta?.sources?.length
                     ? idea.meta.sources.join(", ")
                     : translate("pages.idea-details.meta.none")
               }
            />
            <div className="grid gap-2 grid-cols-2">
               <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label={translate("pages.idea-details.meta.created")}
                  value={
                     idea.createdAt
                        ? new Date(idea.createdAt).toLocaleString()
                        : translate("pages.idea-details.meta.unknown")
                  }
               />
               <InfoItem
                  icon={<Clock className="w-4 h-4" />}
                  label={translate("pages.idea-details.meta.updated")}
                  value={
                     idea.updatedAt
                        ? new Date(idea.updatedAt).toLocaleString()
                        : translate("pages.idea-details.meta.unknown")
                  }
               />
            </div>
         </CardContent>
      </Card>
   );
}
