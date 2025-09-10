import type { CompetitorFeatureSelect } from "@packages/database/schema";
import { Card, CardContent } from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { Calendar, TrendingUp, Hash } from "lucide-react";

interface CompetitorFeaturesListProps {
   features: CompetitorFeatureSelect[];
}

export function CompetitorFeaturesList({ features }: CompetitorFeaturesListProps) {
   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      }).format(date);
   };

   if (!features || features.length === 0) {
      return (
         <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No features tracked yet</p>
            <p className="text-sm text-gray-400">Features will be automatically extracted from competitor data</p>
         </div>
      );
   }

   return (
      <div className="space-y-3">
         {features.map((feature) => (
            <Card key={feature.id} className="p-4">
               <CardContent className="p-0">
                  <div className="space-y-2">
                     <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm leading-relaxed">
                           {feature.title}
                        </h4>
                        <div className="flex gap-1">
                           {feature.isNew && (
                              <Badge variant="default" className="text-xs">
                                 New
                              </Badge>
                           )}
                           {feature.isTrending && (
                              <Badge variant="secondary" className="text-xs">
                                 Trending
                              </Badge>
                           )}
                        </div>
                     </div>
                     
                     {feature.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                           {feature.description}
                        </p>
                     )}
                     
                     {feature.category && (
                        <div className="flex items-center gap-1">
                           <Hash className="h-3 w-3 text-gray-400" />
                           <Badge variant="outline" className="text-xs">
                              {feature.category}
                           </Badge>
                        </div>
                     )}
                     
                     <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           <span>Detected {formatDate(new Date(feature.extractedAt))}</span>
                        </div>
                        
                        {feature.confidenceScore && (
                           <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{Math.round(feature.confidenceScore * 100)}% confidence</span>
                           </div>
                        )}
                     </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
   );
}