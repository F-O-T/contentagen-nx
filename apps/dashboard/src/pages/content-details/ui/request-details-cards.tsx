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
import { useMemo } from "react";

export function ContentBasicDetailsCard({
   content,
}: {
   content: ContentSelect;
}) {
   const infoItems = useMemo(
      () => [
         {
            icon: <Type className="h-4 w-4" />,
            label: "Title",
            value: content.meta?.title ? `# ${content.meta.title}` : "",
         },
         {
            icon: <Link2 className="h-4 w-4" />,
            label: "Description",
            value: content.meta?.description
               ? `\n- ${content.meta.description}`
               : "",
         },
      ],
      [content.meta?.title, content.meta?.description],
   );

   const dateItems = useMemo(
      () => [
         {
            icon: <Calendar className="h-4 w-4" />,
            label: "Last Updated",
            value: new Date(content.updatedAt).toLocaleDateString(),
         },
         {
            icon: <Calendar className="h-4 w-4" />,
            label: "Created At",
            value: new Date(content.createdAt).toLocaleDateString(),
         },
      ],
      [content.updatedAt, content.createdAt],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Content Details</CardTitle>
            <CardDescription>
               Basic information about your content
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            {infoItems.map((item) => (
               <InfoItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            ))}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
               {dateItems.map((item) => (
                  <InfoItem
                     key={item.label}
                     icon={item.icon}
                     label={item.label}
                     value={item.value}
                  />
               ))}
            </div>
         </CardContent>
      </Card>
   );
}

export function ContentMetaDetailsCard({
   content,
   relatedSlugs,
}: {
   content: ContentSelect;
   relatedSlugs: string[];
}) {
   const metaItems = useMemo(
      () => [
         {
            icon: <Tags className="h-4 w-4" />,
            label: "Keywords",
            value: content.meta?.keywords?.length
               ? content.meta.keywords.map((kw) => `- ${kw}`).join("\n")
               : "",
         },
         {
            icon: <Globe className="h-4 w-4" />,
            label: "Sources",
            value: content.meta?.sources?.length
               ? content.meta.sources
                    .map((src) => `- [${src}](${src})`)
                    .join("\n")
               : "",
         },
         {
            icon: <Link2 className="h-4 w-4" />,
            label: "Slug",
            value: content.meta?.slug ? `# ${content.meta.slug}` : "",
         },
         {
            icon: <Link2 className="h-4 w-4" />,
            label: "Related Slugs",
            value: relatedSlugs?.length
               ? relatedSlugs.map((slug) => `- ${slug}`).join("\n")
               : "None",
         },
      ],
      [
         content.meta?.keywords,
         content.meta?.sources,
         content.meta?.slug,
         relatedSlugs,
      ],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Meta Information</CardTitle>
            <CardDescription>
               Keywords, sources, and technical details
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
               {metaItems.map((item) => (
                  <InfoItem
                     key={item.label}
                     icon={item.icon}
                     label={item.label}
                     value={item.value}
                  />
               ))}
            </div>
         </CardContent>
      </Card>
   );
}

export function ContentStatsCard({ content }: { content: ContentSelect }) {
   const statsItems = useMemo(
      () => [
         {
            icon: <Type className="h-4 w-4" />,
            label: "Word Count",
            value: content.stats?.wordsCount || "",
         },
         {
            icon: <Clock className="h-4 w-4" />,
            label: "Read Time",
            value: `${content.stats?.readTimeMinutes || 0} min`,
         },
      ],
      [content.stats?.wordsCount, content.stats?.readTimeMinutes],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Content Stats</CardTitle>
            <CardDescription>
               Statistics and metadata about your generated content
            </CardDescription>
         </CardHeader>

         <CardContent className="grid grid-cols-2 gap-4">
            {statsItems.map((item) => (
               <InfoItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            ))}
         </CardContent>
      </Card>
   );
}
