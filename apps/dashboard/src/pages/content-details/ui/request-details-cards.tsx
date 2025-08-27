import type { ContentSelect } from "@packages/database/schema";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";

import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";
import { Calendar, Clock, Type, Link2, Tags, Globe } from "lucide-react";

export function ContentDetailsCard({
   content,
   relatedSlugs,
}: {
   content: ContentSelect;
   relatedSlugs: string[];
}) {
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
               value={content.meta?.title ? `# ${content.meta.title}` : ""}
            />
            <InfoItem
               icon={<Link2 className="h-4 w-4" />}
               label="Description"
               value={
                  content.meta?.description
                     ? `\n- ${content.meta.description}`
                     : ""
               }
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
                     label="Keywords"
                     value={
                        content.meta?.keywords?.length
                           ? content.meta.keywords
                                .map((kw) => `- ${kw}`)
                                .join("\n")
                           : ""
                     }
                  />
               </div>
               <InfoItem
                  icon={<Globe className="h-4 w-4" />}
                  label="Sources"
                  value={
                     content.meta?.sources?.length
                        ? content.meta.sources
                             .map((src) => `- [${src}](${src})`)
                             .join("\n")
                        : ""
                  }
               />
               <InfoItem
                  icon={<Link2 className="h-4 w-4" />}
                  label="Slug"
                  value={content.meta?.slug ? `# ${content.meta.slug}` : ""}
               />
               <Separator className="col-span-2" />
               <div className="col-span-2">
                  <InfoItem
                     icon={<Link2 className="h-4 w-4" />}
                     label="Related Slugs"
                     value={
                        relatedSlugs?.length
                           ? relatedSlugs.map((slug) => `- ${slug}`).join("\n")
                           : "None"
                     }
                  />
               </div>
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
