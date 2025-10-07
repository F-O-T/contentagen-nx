import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { translate } from "@packages/localization";

interface BrandFeaturesCardProps {
   brandId: string;
}

export function BrandFeaturesCard({
   brandId,
}: BrandFeaturesCardProps) {
   const trpc = useTRPC();
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 8;

   const { data } = useSuspenseQuery(
      trpc.brand.getFeatures.queryOptions({
         brandId,
         page: currentPage,
         limit: itemsPerPage,
      }),
   );

   const { features, total, totalPages } = data;

   if (!features || features.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  {translate("pages.brand-details.features.title")}
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">
                     {translate(
                        "pages.brand-details.features.no-features",
                     )}
                  </p>
                  <p className="text-sm text-gray-400">
                     {translate(
                        "pages.brand-details.features.no-features-description",
                     )}
                  </p>
               </div>
            </CardContent>
         </Card>
      );
   }

   const handlePreviousPage = () => {
      setCurrentPage((prev) => Math.max(1, prev - 1));
   };

   const handleNextPage = () => {
      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               {translate("pages.brand-details.features.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.brand-details.features.description")}
            </CardDescription>
            <CardAction>
               <Badge variant={"outline"}>
                  {translate("pages.brand-details.features.total-badge", {
                     total,
                  })}
               </Badge>
            </CardAction>
         </CardHeader>
         <CardContent>
            <div className="space-y-3">
               {features.map((feature) => (
                  <Card key={feature.id} className="">
                     <CardHeader>
                        <CardTitle>{feature.featureName}</CardTitle>
                        <CardDescription>{feature.summary}</CardDescription>
                        <CardAction>
                           <Badge variant={"outline"}>
                              {feature.meta?.category}
                           </Badge>
                        </CardAction>
                     </CardHeader>
                     <CardFooter className="flex items-center gap-2">
                        <Badge variant={"outline"}>
                           {translate(
                              "pages.brand-details.features.confidence-badge",
                              {
                                 confidence: Math.round(
                                    Number(feature?.meta?.confidence) * 100,
                                 ),
                              },
                           )}
                        </Badge>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         </CardContent>
         {totalPages > 1 && (
            <CardFooter className="flex items-center justify-center gap-4">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
               >
                  <ChevronLeft className="h-4 w-4" />
                  {translate(
                     "pages.brand-details.features.pagination.previous",
                  )}
               </Button>
               <span className="text-sm text-muted-foreground ">
                  {translate(
                     "pages.brand-details.features.pagination.page-of",
                     { current: currentPage, total: totalPages },
                  )}
               </span>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
               >
                  {translate(
                     "pages.brand-details.features.pagination.next",
                  )}
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </CardFooter>
         )}
      </Card>
   );
}