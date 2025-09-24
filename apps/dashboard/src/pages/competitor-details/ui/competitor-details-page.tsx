import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { translate } from "@packages/localization";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CompetitorDetailsActions } from "./competitor-details-actions";
import { CompetitorStatsCard } from "./competitor-stats-card";
import { CompetitorInfoCard } from "./competitor-info-card";
import { CreateEditCompetitorDialog } from "../../competitor-list/features/create-edit-competitor-dialog";
import { CompetitorFileViewerModal } from "../features/competitor-file-viewer-modal";
import { CompetitorLogoUploadDialog } from "../features/competitor-logo-upload-dialog";
import { useState, useMemo } from "react";
import { CompetitorLoadingDisplay } from "./competitor-loading-display";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
import { CompetitorFeaturesCard } from "./competitor-features-card";
import { CompetitorDetailsKnowledgeBaseCard } from "./competitor-details-knowledge-base-card";

export function CompetitorDetailsPage() {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [showLogoUploadDialog, setShowLogoUploadDialog] = useState(false);
   const queryClient = useQueryClient();
   const fileViewer = CompetitorFileViewerModal();

   const { data: competitor } = useSuspenseQuery(
      trpc.competitor.get.queryOptions({ id }),
   );

   const { data: photo } = useSuspenseQuery(
      trpc.competitorFile.getLogo.queryOptions({ competitorId: id }),
   );
   // Calculate subscription enabled state using useMemo
   const isAnalyzingFeatures = useMemo(
      () =>
         competitor?.featuresStatus &&
         ["pending", "crawling", "analyzing"].includes(
            competitor.featuresStatus,
         ),
      [competitor?.featuresStatus],
   );

   const isAnalyzingAnalysis = useMemo(
      () =>
         competitor?.analysisStatus &&
         ["pending", "analyzing", "chunking"].includes(
            competitor.analysisStatus,
         ),
      [competitor?.analysisStatus],
   );

   useSubscription(
      trpc.competitor.onFeaturesStatusChanged.subscriptionOptions(
         {
            competitorId: id,
         },
         {
            async onData(data) {
               toast.success(
                  `Competitor features status updated to ${data.status}`,
               );
               await queryClient.invalidateQueries({
                  queryKey: trpc.competitor.get.queryKey({
                     id,
                  }),
               });
            },
            enabled: Boolean(isAnalyzingFeatures),
         },
      ),
   );

   useSubscription(
      trpc.competitor.onAnalysisStatusChanged.subscriptionOptions(
         {
            competitorId: id,
         },
         {
            async onData(data) {
               toast.success(
                  `Competitor analysis status updated to ${data.status}${data.message ? `: ${data.message}` : ""}`,
               );
               await queryClient.invalidateQueries({
                  queryKey: trpc.competitor.get.queryKey({
                     id,
                  }),
               });
            },
            enabled: Boolean(isAnalyzingAnalysis),
         },
      ),
   );

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            {!isAnalyzingAnalysis && (
               <TalkingMascot
                  message={translate("pages.competitor-details.mascot-message")}
               />
            )}

            {isAnalyzingAnalysis && competitor?.featuresStatus ? (
               <CompetitorLoadingDisplay status={competitor.featuresStatus} />
            ) : (
               <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                     <CompetitorStatsCard />

                     <CompetitorFeaturesCard competitorId={competitor.id} />
                  </div>

                  <div className="col-span-1 gap-4 flex flex-col">
                     <CompetitorDetailsActions
                        competitor={competitor}
                        onLogoUpload={() => setShowLogoUploadDialog(true)}
                     />

                     <CompetitorInfoCard competitor={competitor} />

                     <Card>
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                              {translate(
                                 "pages.competitor-details.section.title",
                              )}
                           </CardTitle>
                           <CardDescription>
                              {translate(
                                 "pages.competitor-details.section.description",
                              )}
                           </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Markdown content={competitor.summary ?? ""} />
                        </CardContent>
                     </Card>
                     <CompetitorDetailsKnowledgeBaseCard
                        competitor={competitor}
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
         <CompetitorLogoUploadDialog
            open={showLogoUploadDialog}
            onOpenChange={setShowLogoUploadDialog}
            currentLogo={photo?.data ?? ""}
         />
         <fileViewer.Modal />
      </>
   );
}
