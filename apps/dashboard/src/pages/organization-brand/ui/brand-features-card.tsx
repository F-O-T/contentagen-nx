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

interface BrandFeaturesCardProps {
   brandId: string;
}

export function BrandFeaturesCard({ brandId }: BrandFeaturesCardProps) {
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
                  Brand Features
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No features found</p>
                  <p className="text-sm text-gray-400">
                     Brand features will appear here once analysis is complete.
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
               Brand Features
            </CardTitle>
            <CardDescription>
               Key features and characteristics discovered about your brand.
            </CardDescription>
            <CardAction>
               <Badge variant={"outline"}>{`${total} features`}</Badge>
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
                           {`${Math.round(Number(feature?.meta?.confidence) * 100)}% confidence`}
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
                  Previous
               </Button>
               <span className="text-sm text-muted-foreground ">
                  {`Page ${currentPage} of ${totalPages}`}
               </span>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
               >
                  Next
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </CardFooter>
         )}
      </Card>
   );
}
