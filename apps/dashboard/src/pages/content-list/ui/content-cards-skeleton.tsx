import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";

export function ContentCardsSkeleton() {
   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {Array.from({ length: 8 }).map((_, index) => (
            <Card
               key={`skeleton-${index + 1}`}
               className="w-full animate-pulse"
            >
               <CardHeader>
                  <CardTitle>
                     <Skeleton className="h-4 w-full" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-8 w-full" />
                  </CardDescription>
                  <CardAction>
                     <Skeleton className="h-8 w-8" />
                  </CardAction>
               </CardHeader>
               <CardContent className="grid grid-cols-1 gap-4">
                  <Skeleton className="h-16 w-full" />
               </CardContent>
               <CardFooter className="flex items-center justify-between">
                  <Skeleton className="w-22 h-4 rounded-lg" />
                  <Skeleton className="w-22 h-4 rounded-lg" />
               </CardFooter>
            </Card>
         ))}
      </div>
   );
}
