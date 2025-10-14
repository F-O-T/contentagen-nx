import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useTRPC } from "@/integrations/clients";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateEditBrandDialog } from "../features/create-edit-brand-dialog";
import { BrandFileViewerModal } from "../features/brand-file-viewer-modal";
import { BrandLogoUploadDialog } from "../features/brand-logo-upload-dialog";
import { useState, useMemo } from "react";
import { useSubscription } from "@trpc/tanstack-react-query";
import { createToast } from "@/features/error-modal/lib/create-toast";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
import { PendingComponent } from "@/default/pending";
import { BrandDetailsActions } from "./brand-details-actions";
import { BrandStatsCard } from "./brand-stats-card";
import { BrandInfoCard } from "./brand-info-card";
import { BrandFeaturesCard } from "./brand-features-card";
import { BrandDetailsKnowledgeBaseCard } from "./brand-details-knowledge-base-card";

export function BrandDetailsPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const {
      data: brand,
      error: brandError,
      isFetched,
   } = useQuery(trpc.brand.getByOrganization.queryOptions());
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const [showLogoUploadDialog, setShowLogoUploadDialog] = useState(false);
   const fileViewer = BrandFileViewerModal({ brandId: brand?.id || "" });

   const { data: photo } = useQuery(
      trpc.brandFile.getLogo.queryOptions(
         {
            brandId: brand?.id || "",
         },
         {
            enabled: !!brand?.id,
         },
      ),
   );

   useIsomorphicLayoutEffect(() => {
      if (isFetched && !brand?.id) {
         setShowCreateDialog(true);
      }
      return;
   }, [isFetched, brand]);

   const isGenerating = useMemo(
      () =>
         brand?.status &&
         ["pending", "analyzing", "chunking"].includes(brand.status),
      [brand?.status],
   );

   useSubscription(
      trpc.brand.onStatusChange.subscriptionOptions(
         {
            brandId: brand?.id || "",
         },
         {
            async onData(data) {
               createToast({
                  type: "success",
                  message: `Brand features status updated to: ${data.status}`,
               });
               await queryClient.invalidateQueries({
                  queryKey: trpc.brand.getByOrganization.queryKey(),
               });
            },
            enabled: Boolean(brand && isGenerating),
         },
      ),
   );

   if (!brand || brandError) {
      return (
         <main className="h-full w-full flex flex-col gap-4">
            <Card>
               <CardHeader>
                  <CardTitle>Create Your Brand</CardTitle>
                  <CardDescription>
                     Set up your brand to start generating content and managing
                     your brand assets.
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <CreateEditBrandDialog
                     open={showCreateDialog}
                     onOpenChange={setShowCreateDialog}
                  />
               </CardContent>
            </Card>
         </main>
      );
   }

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            {isGenerating ? (
               <PendingComponent message="Wait while we analyze your brand" />
            ) : (
               <>
                  <TalkingMascot message="Welcome to your brand dashboard! Here you can manage your brand information, view features, and track your brand analysis." />

                  <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                     <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                        <BrandStatsCard brand={brand} />

                        <BrandFeaturesCard brandId={brand.id} />
                     </div>

                     <div className="col-span-1 gap-4 flex flex-col">
                        <BrandDetailsActions
                           brand={brand}
                           onLogoUpload={() => setShowLogoUploadDialog(true)}
                        />

                        <BrandInfoCard brand={brand} />

                        <Card>
                           <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                 Brand Description
                              </CardTitle>
                              <CardDescription>
                                 This is how your brand describes itself and
                                 what makes it unique.
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <Markdown content={brand.summary ?? ""} />
                           </CardContent>
                        </Card>
                        <BrandDetailsKnowledgeBaseCard brand={brand} />
                     </div>
                  </div>
               </>
            )}
         </main>

         <CreateEditBrandDialog
            brand={brand}
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
         />
         <BrandLogoUploadDialog
            open={showLogoUploadDialog}
            onOpenChange={setShowLogoUploadDialog}
            currentLogo={photo?.data ?? ""}
            brandId={brand.id}
         />
         <fileViewer.Modal />
      </>
   );
}
