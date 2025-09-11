import type { CompetitorSelect } from "@packages/database/schema";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import {
   ExternalLink,
   Share2,
   AlertTriangle,
   RefreshCw,
   Archive,
   FileText,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";

interface CompetitorDetailsActionsProps {
   competitor: CompetitorSelect;
}

interface FeatureMeta {
   confidence?: number;
   category?: string;
   tags?: string[];
   isNew?: boolean;
   isTrending?: boolean;
}

export function CompetitorDetailsActions({
   competitor,
}: CompetitorDetailsActionsProps) {
   const navigate = useNavigate();
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const analyzeMutation = useMutation(
      trpc.competitor.analyze.mutationOptions({
         onSuccess: () => {
            toast.success("Competitor analysis started!");
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.get.queryKey({ id: competitor.id }),
            });
         },
         onError: (error) => {
            toast.error(
               `Error starting analysis: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
   );

   const getMeta = (feature: any): FeatureMeta => {
      return (feature.meta as FeatureMeta) || {};
   };

   const handleAnalyze = () => {
      analyzeMutation.mutate({ id: competitor.id });
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
            <div className="space-y-2">
               <h4 className="text-sm font-medium text-gray-700">
                  External Links
               </h4>
               <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                  target="_blank"
                  rel="noopener noreferrer"
               >
                  <a href={competitor.websiteUrl}>
                     <ExternalLink className="h-4 w-4 mr-2" />
                     Visit Website
                  </a>
               </Button>

               {competitor.changelogUrl && (
                  <Button
                     variant="outline"
                     size="sm"
                     className="w-full justify-start"
                     asChild
                     target="_blank"
                     rel="noopener noreferrer"
                  >
                     <a href={competitor.changelogUrl}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Changelog
                     </a>
                  </Button>
               )}
            </div>

            <div className="space-y-2">
               <h4 className="text-sm font-medium text-gray-700">Analysis</h4>
               <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
               >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {analyzeMutation.isPending ? "Analyzing..." : "Refresh Analysis"}
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  disabled
               >
                  <Share2 className="h-4 w-4 mr-2" />
                  Export Report
               </Button>
            </div>

            <div className="space-y-2">
               <h4 className="text-sm font-medium text-gray-700">Management</h4>
               <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: "/competitors" })}
               >
                  <Archive className="h-4 w-4 mr-2" />
                  Back to List
               </Button>
            </div>

            {competitor.features && competitor.features.length > 0 && (
               <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-sm font-medium text-gray-700">
                        Feature Stats
                     </h4>
                     <Badge variant="secondary" className="text-xs">
                        {competitor.features.length}
                     </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                     <div className="flex justify-between">
                        <span>New features:</span>
                        <span>
                           {competitor.features.filter((f) => getMeta(f).isNew).length}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span>Trending:</span>
                        <span>
                           {competitor.features.filter((f) => getMeta(f).isTrending).length}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span>Avg confidence:</span>
                        <span>
                           {Math.round(
                              competitor.features.reduce((acc, f) => {
                                 const confidence = getMeta(f).confidence || 0;
                                 return acc + confidence;
                              }, 0) / competitor.features.length * 100
                           )}%
                        </span>
                     </div>
                  </div>
               </div>
            )}
         </CardContent>
      </Card>
   );
}
