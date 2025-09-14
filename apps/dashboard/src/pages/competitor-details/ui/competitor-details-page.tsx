import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CompetitorDetailsActions } from "./competitor-details-actions";
import { CompetitorStatsCard } from "./competitor-stats-card";
import { CompetitorFeaturesCard } from "./competitor-features-card";
import { CompetitorInfoCard } from "./competitor-info-card";
import { CreateEditCompetitorDialog } from "../../competitor-list/features/create-edit-competitor-dialog";
import { useState, useMemo } from "react";
import { CompetitorLoadingDisplay } from "./competitor-loading-display";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export function CompetitorDetailsPage() {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const [showEditDialog, setShowEditDialog] = useState(false);
   const queryClient = useQueryClient();

   const { data: competitor } = useSuspenseQuery(
      trpc.competitor.get.queryOptions({ id }),
   );

   // Calculate subscription enabled state using useMemo
   const isAnalyzing = useMemo(
      () =>
         competitor?.status &&
         ["pending", "crawling", "analyzing"].includes(competitor.status),
      [competitor?.status],
   );

   useSubscription(
      trpc.competitor.onStatusChanged.subscriptionOptions(
         {
            competitorId: id,
         },
         {
            async onData(data) {
               toast.success(`Competitor status updated to ${data.status}`);
               await queryClient.invalidateQueries({
                  queryKey: trpc.competitor.get.queryKey({
                     id,
                  }),
               });
            },
            enabled: Boolean(isAnalyzing),
         },
      ),
   );

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            {!isAnalyzing && (
               <TalkingMascot message="View detailed information about this competitor and track their features!" />
            )}

            {isAnalyzing && competitor?.status ? (
               <CompetitorLoadingDisplay status={competitor.status} />
            ) : (
               <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                     <CompetitorStatsCard />
                     <CompetitorFeaturesCard features={competitor.features} />
                  </div>

                  <div className="col-span-1 gap-4 flex flex-col">
                     <CompetitorDetailsActions competitor={competitor} />
                     <CompetitorInfoCard
                        name={competitor.name}
                        websiteUrl={competitor.websiteUrl}
                        createdAt={competitor.createdAt}
                        updatedAt={competitor.updatedAt}
                     />
                  </div>
               </div>
            )}
         </main>

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />
      </>
   );
}
