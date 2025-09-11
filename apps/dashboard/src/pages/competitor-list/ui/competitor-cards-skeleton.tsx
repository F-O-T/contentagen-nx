import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";

export function CompetitorCardsSkeleton() {
   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
               <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                     <CardTitle className="text-lg">
                        <Skeleton className="h-6 w-32" />
                     </CardTitle>
                     <div className="flex gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="pt-0">
                  <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-40" />
                     </div>
                     <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                     </div>
                     <Skeleton className="h-6 w-20" />
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
   );
}
