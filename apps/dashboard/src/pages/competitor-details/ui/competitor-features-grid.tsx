import { useTRPC } from "@/integrations/clients";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import type { CompetitorFeatureSelect } from "@packages/database/schema";

interface CompetitorFeaturesGridProps {
   features?: CompetitorFeatureSelect[];
   total?: number;
   page?: number;
   totalPages?: number;
   onPageChange?: (page: number) => void;
}

function CompetitorFeatureCard({ feature }: { feature: CompetitorFeatureSelect }) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{feature.featureName}</CardTitle>
            <CardDescription className="line-clamp-3">{feature.summary}</CardDescription>
            <div className="flex gap-2 flex-wrap">
               <Badge variant="outline">{feature.meta?.category || "General"}</Badge>
               <Badge variant="secondary">
                  {Math.round(Number(feature?.meta?.confidence) * 100)}% confidence
               </Badge>
            </div>
         </CardHeader>
         <CardContent>
            <div className="text-xs text-muted-foreground">
               Extracted: {new Date(feature.extractedAt).toLocaleDateString()}
            </div>
         </CardContent>
      </Card>
   );
}

function FeaturesEmptyState() {
   return (
      <div className="col-span-full text-center py-12">
         <div className="text-muted-foreground">
            <p className="text-lg font-medium mb-2">No features found</p>
            <p className="text-sm">Features will be automatically extracted from competitor data</p>
         </div>
      </div>
   );
}

export function CompetitorFeaturesGrid({ 
   features = [], 
   total = 0, 
   page = 1, 
   totalPages = 1,
   onPageChange 
}: CompetitorFeaturesGridProps) {
   const handlePageChange = (newPage: number) => {
      if (onPageChange && newPage >= 1 && newPage <= totalPages) {
         onPageChange(newPage);
      }
   };

   return (
      <div className="space-y-4">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h3 className="text-lg font-semibold">Features ({total})</h3>
               <p className="text-sm text-muted-foreground">
                  Tracked features extracted from competitor analysis
               </p>
            </div>
         </div>

         {/* Features Grid */}
         {features.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {features.map((feature) => (
                  <CompetitorFeatureCard key={feature.id} feature={feature} />
               ))}
            </div>
         ) : (
            <FeaturesEmptyState />
         )}

         {/* Pagination */}
         {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
               <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
               >
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               
               <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
               </span>

               <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
               >
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </div>
         )}
      </div>
   );
}

export function CompetitorFeaturesPage() {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const [currentPage, setCurrentPage] = useState(1);
   const [sortBy, setSortBy] = useState<"extractedAt" | "featureName">("extractedAt");
   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

   const { data: featuresData, isLoading } = useQuery(
      trpc.competitor.getFeatures.queryOptions({
         competitorId: id,
         page: currentPage,
         limit: 12,
         sortBy,
         sortOrder,
      }),
   );

   const features = featuresData?.features || [];
   const total = featuresData?.total || 0;
   const totalPages = featuresData?.totalPages || 1;

   const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
      // Update URL to reflect page change
      const url = new URL(window.location.href);
      url.searchParams.set("featuresPage", newPage.toString());
      window.history.pushState({}, "", url.toString());
   };

   return (
      <CompetitorFeaturesGrid
         features={features}
         total={total}
         page={currentPage}
         totalPages={totalPages}
         onPageChange={handlePageChange}
      />
   );
}