import { Suspense } from "react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useContentRequestDetails } from "../lib/use-content-request-details";
import { GeneratedContentDisplay } from "./generated-content-display";

export function ContentRequestDetailsPage() {
   const { data } = useContentRequestDetails();

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
