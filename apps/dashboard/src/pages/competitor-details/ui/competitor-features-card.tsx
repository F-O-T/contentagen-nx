import type { CompetitorFeatureSelect } from "@packages/database/schema";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import {
   Calendar,
   TrendingUp,
   Hash,
   ExternalLink,
   Settings,
} from "lucide-react";

interface CompetitorFeaturesCardProps {
   features: CompetitorFeatureSelect[];
}

interface FeatureMeta {
   confidence?: number;
   category?: string;
   tags?: string[];
   isNew?: boolean;
   isTrending?: boolean;
}

export function CompetitorFeaturesCard({
   features,
}: CompetitorFeaturesCardProps) {
   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      }).format(date);
   };

   const getMeta = (feature: CompetitorFeatureSelect): FeatureMeta => {
      return (feature.meta as FeatureMeta) || {};
   };

   if (!features || features.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
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
                  const meta = getMeta(feature);
                  return (
                     <div
                        key={feature.id}
                        className="border rounded-lg p-3 bg-gray-50/50"
                     >
                        <div className="space-y-2">
                           <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm leading-relaxed">
                                 {feature.featureName}
                              </h4>
                              <div className="flex gap-1">
                                 {meta.isNew && (
                                    <Badge
                                       variant="default"
                                       className="text-xs"
                                    >
                                       New
                                    </Badge>
                                 )}
                                 {meta.isTrending && (
                                    <Badge
                                       variant="secondary"
                                       className="text-xs"
                                    >
                                       Trending
                                    </Badge>
                                 )}
                              </div>
                           </div>

                           {feature.summary && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                 {feature.summary}
                              </p>
                           )}

                           {meta.category && (
                              <div className="flex items-center gap-1">
                                 <Hash className="h-3 w-3 text-gray-400" />
                                 <Badge variant="outline" className="text-xs">
                                    {meta.category}
                                 </Badge>
                              </div>
                           )}

                           {feature.sourceUrl && (
                              <div className="flex items-center gap-1">
                                 <ExternalLink className="h-3 w-3 text-gray-400" />
                                 <a
                                    href={feature.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                 >
                                    View source
                                 </a>
                              </div>
                           )}

                           <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                 <Calendar className="h-3 w-3" />
                                 <span>
                                    Detected{" "}
                                    {formatDate(new Date(feature.extractedAt))}
                                 </span>
                              </div>

                              {meta.confidence && (
                                 <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>
                                       {Math.round(meta.confidence * 100)}%
                                       confidence
                                    </span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </CardContent>
      </Card>
   );
}
