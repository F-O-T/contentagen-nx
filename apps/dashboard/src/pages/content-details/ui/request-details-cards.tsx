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
import { translate } from "@packages/localization";

export function ContentBasicDetailsCard({
   content,
}: {
   content: ContentSelect;
}) {
   const infoItems = useMemo(
      () => [
         {
            icon: <Type className="h-4 w-4" />,
            label: translate("pages.content-details.details.title"),
            value: content.meta?.title ? `# ${content.meta.title}` : "",
         },
         {
            icon: <Link2 className="h-4 w-4" />,
            label: translate("pages.content-details.details.description"),
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
            label: translate("pages.content-details.details.updated"),
            value: new Date(content.updatedAt).toLocaleDateString(),
         },
         {
            icon: <Calendar className="h-4 w-4" />,
            label: translate("pages.content-details.details.created"),
            value: new Date(content.createdAt).toLocaleDateString(),
         },
      ],
      [content.updatedAt, content.createdAt],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">
               {translate("pages.content-details.details.basic-info")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "pages.content-details.details.basic-info-description",
               )}
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
            label: translate("pages.content-details.details.keywords"),
            value: content.meta?.keywords?.length
               ? content.meta.keywords.map((kw) => `- ${kw}`).join("\n")
               : "",
         },
         {
            icon: <Globe className="h-4 w-4" />,
            label: translate("pages.content-details.details.sources"),
            value: content.meta?.sources?.length
               ? content.meta.sources
                    .map((src) => `- [${src}](${src})`)
                    .join("\n")
               : "",
         },
         {
            icon: <Link2 className="h-4 w-4" />,
            label: translate("pages.content-details.details.slug"),
            value: content.meta?.slug ? `# ${content.meta.slug}` : "",
         },
         {
            icon: <Link2 className="h-4 w-4" />,
            label: translate("pages.content-details.details.related-slugs"),
            value: relatedSlugs?.length
               ? relatedSlugs.map((slug) => `- ${slug}`).join("\n")
               : translate("pages.content-details.details.related-slugs-none"),
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
            <CardTitle className="text-lg">
               {translate("pages.content-details.details.meta-info")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "pages.content-details.details.meta-info-description",
               )}
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
            label: translate("pages.content-details.stats.word-count"),
            value: content.stats?.wordsCount || "",
         },
         {
            icon: <Clock className="h-4 w-4" />,
            label: translate("pages.content-details.details.read-time"),
            value: translate(
               "pages.content-details.details.read-time-minutes",
               { minutes: content.stats?.readTimeMinutes || 0 },
            ),
         },
      ],
      [content.stats?.wordsCount, content.stats?.readTimeMinutes],
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">
               {translate("pages.content-details.details.content-stats")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "pages.content-details.details.content-stats-description",
               )}
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
