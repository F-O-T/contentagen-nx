import type { CompetitorFeatureSelect } from "@packages/database/schema";
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

interface CompetitorFeaturesCardProps {
   features: CompetitorFeatureSelect[];
}

export function CompetitorFeaturesCard({
   features,
}: CompetitorFeaturesCardProps) {
   if (!features || features.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  Tracked Features
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No features tracked yet</p>
                  <p className="text-sm text-gray-400">
                     Features will be automatically extracted from competitor
                     data
                  </p>
               </div>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               Tracked Features
            </CardTitle>
            <CardDescription>
               All the features of your competitors that are being tracked
            </CardDescription>
            <CardAction>
               <Badge variant={"outline"}>{features.length}</Badge>
            </CardAction>
         </CardHeader>
         <CardContent>
            <div className="space-y-3">
               {features.map((feature) => {
                  return (
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
                              Confidence level in this feature:{" "}
                              {feature.meta?.confidence}
                           </Badge>
                        </CardFooter>
                     </Card>
                  );
               })}
            </div>
         </CardContent>
      </Card>
   );
}
