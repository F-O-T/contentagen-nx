import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { GeneratedContentDisplay } from "./generated-content-display";
import { useTRPC } from "@/integrations/clients";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import {
   ContentBasicDetailsCard,
   ContentMetaDetailsCard,
} from "./request-details-cards";

import { ContentDetailsQuickActions } from "./content-details-quick-actions";
import { ContentStatsCard } from "./content-stats-card";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useMemo } from "react";
import { ContentLoadingDisplay } from "./content-loading-display";
import { useMissingImagesNotification } from "../../content-list/lib/use-missing-images-notification";
import { useState } from "react";
import { ContentVersionsCard } from "./content-versions-card";
import { VersionDetailsCredenza } from "./version-details-credenza";
import type { ContentVersionSelect } from "@packages/database/schema";

export function ContentRequestDetailsPage() {
   const { id } = useParams({
      from: "/_dashboard/content/$id",
   });
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [editingBody, setEditingBody] = useState(false);
   const [selectedVersion, setSelectedVersion] =
      useState<ContentVersionSelect | null>(null);
   const [versionDetailsOpen, setVersionDetailsOpen] = useState(false);

   const handleVersionClick = (version: ContentVersionSelect) => {
      setSelectedVersion(version);
      setVersionDetailsOpen(true);
   };

   // Initialize missing images notification hook
   useMissingImagesNotification();
   const { data } = useSuspenseQuery(
      trpc.content.get.queryOptions({
         id,
      }),
   );

   // Fetch related slugs if slug and agentId are available
   const { data: relatedSlugs } = useSuspenseQuery(
      trpc.content.getRelatedSlugs.queryOptions({
         slug: data?.meta?.slug ?? "",
         agentId: data.agentId,
      }),
   );

   // Calculate subscription enabled state using useMemo
   const isGenerating = useMemo(
      () =>
         data?.status &&
         [
            "pending",
            "planning",
            "researching",
            "writing",
            "editing",
            "analyzing",
            "grammar_checking",
         ].includes(data.status),
      [data?.status],
   );

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {
            contentId: id,
         },
         {
            async onData(data) {
               toast.success(`Content status updated to ${data.status}`);
               await queryClient.invalidateQueries({
                  queryKey: trpc.content.get.queryKey({
                     id,
                  }),
               });
            },
            enabled: Boolean(isGenerating),
         },
      ),
   );

   return (
      <main className="h-full w-full flex flex-col gap-4">
         {!isGenerating && (
            <TalkingMascot message="Here's your content request details! You can review, edit, and manage your generated content. Use the export options to get your content in different formats." />
         )}

         {isGenerating && data?.status ? (
            <ContentLoadingDisplay status={data.status} />
         ) : (
            <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
               <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                  <ContentStatsCard content={data} />

                  <GeneratedContentDisplay
                     content={data}
                     editingBody={editingBody}
                     setEditingBody={setEditingBody}
                  />
               </div>
               <div className="col-span-1 gap-4 flex flex-col">
                  <ContentDetailsQuickActions
                     content={data}
                     onEditBody={() => setEditingBody(true)}
                  />
                  <ContentBasicDetailsCard content={data} />
                  <ContentMetaDetailsCard
                     content={data}
                     relatedSlugs={relatedSlugs}
                  />
                  <ContentVersionsCard
                     contentId={id}
                     onVersionClick={handleVersionClick}
                  />
               </div>
            </div>
         )}
         {selectedVersion && (
            <VersionDetailsCredenza
               version={selectedVersion}
               isOpen={versionDetailsOpen}
               onClose={() => setVersionDetailsOpen(false)}
            />
         )}
      </main>
   );
}
