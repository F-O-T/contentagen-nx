import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { translate } from "@packages/localization";
import { useTRPC } from "@/integrations/clients";
import {
   useSuspenseQuery,
   useQueryClient,
   useQuery,
} from "@tanstack/react-query";
import { BrandDetailsActions } from "./brand-details-actions";
import { BrandStatsCard } from "./brand-stats-card";
import { BrandInfoCard } from "./brand-info-card";
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
import { BrandFeaturesCard } from "./brand-features-card";
import { BrandDetailsKnowledgeBaseCard } from "./brand-details-knowledge-base-card";
import { PendingComponent } from "@/default/pending";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";

export function BrandDetailsPage() {
   const trpc = useTRPC();
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [showLogoUploadDialog, setShowLogoUploadDialog] = useState(false);
   const queryClient = useQueryClient();

   const { data: brand, error: brandError } = useQuery(
      trpc.brand.getByOrganization.queryOptions(),
   );

   // If no brand exists or there's an error, show create dialog
   const [showCreateDialog, setShowCreateDialog] = useState(false);

   // Only initialize file viewer when brand exists
   const fileViewer = brand
      ? BrandFileViewerModal({ brandId: brand.id })
      : null;

   // Only fetch logo if brand exists
   const { data: photo } = useQuery(
      trpc.brandFile.getLogo.queryOptions(
         { brandId: brand?.id || "" },
         {
            enabled: Boolean(brand),
         },
      ),
   );
   // Calculate subscription enabled state using useMemo

   const isGenerating = useMemo(
      () =>
         brand?.status &&
         ["pending", "analyzing", "chunking"].includes(
            brand.status, // updated from brand.analysisStatus to brand.status
         ),
      [brand?.status], // updated from brand?.analysisStatus to brand?.status
   );
   useIsomorphicLayoutEffect(() => {
      if (!brand && !brandError) {
         setShowCreateDialog(true);
      } else {
         setShowCreateDialog(false);
      }
   }, [brand, brandError]);
   useSubscription(
      trpc.brand.onStatusChange.subscriptionOptions(
         {
            brandId: brand?.id || "",
         },
         {
            async onData(data) {
               createToast({
                  type: "success",
                  message: translate(
                     "pages.brand-details.messages.features-status-updated",
                     { status: data.status },
                  ),
               });
               await queryClient.invalidateQueries({
                  queryKey: trpc.brand.getByOrganization.queryKey(),
               });
            },
            enabled: Boolean(brand && isGenerating),
         },
      ),
   );

   // If no brand exists, show create dialog
   if (!brand || brandError) {
      return (
         <>
            <main className="h-full w-full flex flex-col gap-4">
               <TalkingMascot
                  message={translate(
                     "pages.brand-details.no-brand.mascot-message",
                  )}
               />
               <Card>
                  <CardHeader>
                     <CardTitle>
                        {translate("pages.brand-details.no-brand.title")}
                     </CardTitle>
                     <CardDescription>
                        {translate("pages.brand-details.no-brand.description")}
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
         </>
      );
   }

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            {isGenerating ? (
               <PendingComponent message="Wait while we search your brand" />
            ) : (
               <>
                  <TalkingMascot
                     message={translate("pages.brand-details.mascot-message")}
                  />

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
                                 {translate(
                                    "pages.brand-details.section.title",
                                 )}
                              </CardTitle>
                              <CardDescription>
                                 {translate(
                                    "pages.brand-details.section.description",
                                 )}
                              </CardDescription>
                           </CardHeader>
                           <CardContent>
                              <Markdown content={brand.description ?? ""} />
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
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />
         <BrandLogoUploadDialog
            open={showLogoUploadDialog}
            onOpenChange={setShowLogoUploadDialog}
            currentLogo={photo?.data ?? ""}
            brandId={brand.id}
         />
         {fileViewer?.Modal && <fileViewer.Modal />}
      </>
   );
}

