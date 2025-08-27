import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { GeneratedContentDisplay } from "./generated-content-display";
import { useTRPC } from "@/integrations/clients";
import {
   useQuery,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ContentStatsCard, ContentDetailsCard } from "./request-details-cards";
import { ContentQualityCard } from "./content-quality";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useMemo } from "react";
import { ContentLoadingDisplay } from "./content-loading-display";

export function ContentRequestDetailsPage() {
   const { id } = useParams({
      from: "/_dashboard/content/$id",
   });
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { data } = useSuspenseQuery(
      trpc.content.get.queryOptions({
         id,
      }),
   );

   // Fetch related slugs if slug and agentId are available
   const { data: relatedSlugs = [] } = useQuery(
      trpc.content.getRelatedSlugs.queryOptions(
         {
            slug: data?.meta?.slug ?? "",
            agentId: data.agentId,
         },
         {
            enabled: Boolean(data?.meta?.slug && data.agentId),
         },
      ),
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
               <div className="col-span-1 gap-4 flex flex-col">
                  <ContentQualityCard content={data} />
                  <ContentStatsCard content={data} />
                  <ContentDetailsCard
                     content={data}
                     relatedSlugs={relatedSlugs}
                  />
               </div>
               <div className="col-span-1 md:col-span-2">
                  <GeneratedContentDisplay content={data} />
               </div>
            </div>
         )}
      </main>
   );
}
