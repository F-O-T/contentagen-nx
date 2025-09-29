import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { translate } from "@packages/localization";
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
import { useMissingImagesNotification } from "../../content-list/lib/use-missing-images-notification";
import { useState } from "react";
import { ContentVersionsCard } from "./content-versions-card";
import { VersionDetailsCredenza } from "./version-details-credenza";
import type { RouterOutput } from "@packages/api/client";
import { MultiStepLoader } from "@/widgets/multi-step-loader/ui/multi-step-loader";

export function ContentRequestDetailsPage() {
   const { id } = useParams({
      from: "/_dashboard/content/$id",
   });
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [editingBody, setEditingBody] = useState(false);
   const [selectedVersion, setSelectedVersion] = useState<
      RouterOutput["content"]["versions"]["getVersions"][number] | null
   >(null);
   const [versionDetailsOpen, setVersionDetailsOpen] = useState(false);

   const handleVersionClick = (
      version: RouterOutput["content"]["versions"]["getVersions"][number],
   ) => {
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
         agentId: data.agentId ?? "",
      }),
   );

   // Calculate subscription enabled state using useMemo
   const isGenerating = useMemo(
      () => data?.status && ["pending"].includes(data.status),
      [data?.status],
   );

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {
            contentId: id,
         },
         {
            async onData(data) {
               toast.success(
                  data.message || 
                  translate("pages.content-details.messages.status-updated", {
                     status: data.status,
                  }),
               );
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
            <TalkingMascot
               message={translate("pages.content-details.mascot-message")}
            />
         )}

         {isGenerating && data?.status ? (
            <MultiStepLoader
               loading={isGenerating}
               loadingStates={[
                  {
                     text: "🤔 Brewing creative ideas...",
                  },
                  {
                     text: "📚 Researching and analyzing...",
                  },
                  {
                     text: "✍️ Crafting compelling content...",
                  },
                  {
                     text: "🔍 Polishing and perfecting...",
                  },
                  {
                     text: "🎨 Adding final touches...",
                  },
                  {
                     text: "🎉 Ready for review...",
                  },
               ]}
            />
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
