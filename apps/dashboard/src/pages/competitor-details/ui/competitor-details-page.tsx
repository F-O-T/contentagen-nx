import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { ExternalLink, Edit, Globe, Calendar, FileText, Settings } from "lucide-react";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { CompetitorFeaturesList } from "./competitor-features-list";
import { CompetitorDetailsActions } from "./competitor-details-actions";
import { CreateEditCompetitorDialog } from "../competitor-list/features/create-edit-competitor-dialog";
import { useState } from "react";

export function CompetitorDetailsPage() {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const [showEditDialog, setShowEditDialog] = useState(false);

   const { data: competitor } = useSuspenseQuery(
      trpc.competitor.get.queryOptions({ id }),
   );

   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
      }).format(date);
   };

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4 p-4">
            <TalkingMascot message="View detailed information about this competitor and track their features!" />
            
            <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
               {/* Main Information */}
               <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                  <Card>
                     <CardHeader>
                        <div className="flex items-start justify-between">
                           <CardTitle className="text-2xl">{competitor.name}</CardTitle>
                           <div className="flex gap-2">
                              <Button
                                 variant="outline"
                                 size="sm"
                                 asChild
                                 target="_blank"
                                 rel="noopener noreferrer"
                              >
                                 <a href={competitor.websiteUrl}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Website
                                 </a>
                              </Button>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => setShowEditDialog(true)}
                              >
                                 <Edit className="h-4 w-4 mr-2" />
                                 Edit
                              </Button>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                           <Globe className="h-4 w-4" />
                           <a 
                              href={competitor.websiteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                           >
                              {competitor.websiteUrl}
                           </a>
                        </div>
                        
                        {competitor.changelogUrl && (
                           <div className="flex items-center gap-2 text-sm text-blue-600">
                              <FileText className="h-4 w-4" />
                              <a 
                                 href={competitor.changelogUrl} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="hover:text-blue-800 hover:underline"
                              >
                                 View Changelog
                              </a>
                           </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Calendar className="h-4 w-4" />
                           <span>Added on {formatDate(new Date(competitor.createdAt))}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Calendar className="h-4 w-4" />
                           <span>Last updated {formatDate(new Date(competitor.updatedAt))}</span>
                        </div>

                        {competitor.features && competitor.features.length > 0 && (
                           <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                 {competitor.features.length} features tracked
                              </Badge>
                           </div>
                        )}
                     </CardContent>
                  </Card>

                  {/* Features Section */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Settings className="h-5 w-5" />
                           Tracked Features
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <CompetitorFeaturesList features={competitor.features} />
                     </CardContent>
                  </Card>
               </div>

               {/* Actions Sidebar */}
               <div className="col-span-1 flex flex-col gap-4">
                  <CompetitorDetailsActions competitor={competitor} />
               </div>
            </div>
         </main>

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />
      </>
   );
}