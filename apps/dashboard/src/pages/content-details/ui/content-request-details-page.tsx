import { Suspense, useState } from "react";

import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";

import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";
import { useContentExport } from "../lib/use-content-export";
import { useContentRequestDetails } from "../lib/use-content-request-details";
import { GeneratedContentDisplay } from "./generated-content-display";
import { ContentStatsCard, RequestDetailsCard } from "./request-details-cards";

export function ContentRequestDetailsPage() {
   const { data } = useContentRequestDetails();

   const [alertOpen, setAlertOpen] = useState(false);

   // Delete mutation

   // Approve content request mutation

   // Reject content request mutation

   return (
      <Suspense fallback={<div>Loading...</div>}>
         <main className="h-full w-full flex flex-col gap-6">
            <TalkingMascot message="Here's your content request details! You can review, edit, and manage your generated content. Use the export options to get your content in different formats." />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Request Details */}

               {/* Generated Content */}
               <div className="lg:col-span-2">
                  <GeneratedContentDisplay
                     generatedContent={{
                        body: data.body,
                     }}
                     isExporting={false}
                     isGenerating={data.status === "generating"}
                  />
               </div>
            </div>
         </main>
      </Suspense>
   );
}
