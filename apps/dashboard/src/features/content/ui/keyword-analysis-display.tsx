import { Badge } from "@packages/ui/components/badge";
import { cn } from "@packages/ui/lib/utils";
import {
   AlertCircle,
   CheckCircle2,
   Hash,
   MapPin,
   TrendingDown,
   TrendingUp,
} from "lucide-react";

type KeywordLocation = {
   type: "title" | "heading" | "paragraph" | "first100words" | "last100words";
   index?: number;
};

type KeywordAnalysis = {
   keyword: string;
   count: number;
   density: number;
   locations: KeywordLocation[];
   status: "optimal" | "low" | "high" | "missing";
   suggestion?: string;
};

type TopKeyword = {
   keyword: string;
   count: number;
   density: number;
};

type KeywordAnalysisDisplayProps = {
   analysis: KeywordAnalysis[];
   overallScore: number;
   topKeywords: TopKeyword[];
   recommendations: string[];
   metrics: {
      totalWordCount: number;
      uniqueWordCount: number;
      avgKeywordDensity: number;
   };
   className?: string;
};

function getStatusColor(status: KeywordAnalysis["status"]): string {
   switch (status) {
      case "optimal":
         return "bg-green-500/10 text-green-600 border-green-500/30";
      case "low":
         return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "high":
         return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "missing":
         return "bg-red-500/10 text-red-600 border-red-500/30";
   }
}

function getStatusLabel(status: KeywordAnalysis["status"]): string {
   switch (status) {
      case "optimal":
         return "Ótimo";
      case "low":
         return "Baixo";
      case "high":
         return "Alto";
      case "missing":
         return "Ausente";
   }
}

function getStatusIcon(status: KeywordAnalysis["status"]) {
   switch (status) {
      case "optimal":
         return <CheckCircle2 className="size-3.5" />;
      case "low":
         return <TrendingDown className="size-3.5" />;
      case "high":
         return <TrendingUp className="size-3.5" />;
      case "missing":
         return <AlertCircle className="size-3.5" />;
   }
}

function getLocationLabel(type: KeywordLocation["type"]): string {
   switch (type) {
      case "title":
         return "Título";
      case "heading":
         return "Heading";
      case "paragraph":
         return "Parágrafo";
      case "first100words":
         return "Início";
      case "last100words":
         return "Final";
   }
}

export function KeywordAnalysisDisplay({
   analysis,
   overallScore,
   topKeywords,
   recommendations,
   metrics,
   className,
}: KeywordAnalysisDisplayProps) {
   // Check if there are any target keywords analyzed
   if (analysis.length === 0) {
      return (
         <div className={cn("text-center py-4", className)}>
            <Hash className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
               Nenhuma palavra-chave definida
            </p>
            <p className="text-xs text-muted-foreground mt-1">
               Adicione palavras-chave no metadata para análise
            </p>
         </div>
      );
   }

   return (
      <div className={cn("space-y-4", className)}>
         {/* Overall score */}
         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
               <p className="text-xs text-muted-foreground">
                  Score de Palavras-chave
               </p>
               <p className="text-2xl font-bold">{overallScore}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
               <p>{metrics.totalWordCount} palavras</p>
               <p>{metrics.avgKeywordDensity.toFixed(2)}% densidade média</p>
            </div>
         </div>

         {/* Target keywords analysis */}
         <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
               Palavras-chave Alvo
            </p>
            <div className="space-y-2">
               {analysis.map((kw) => (
                  <div
                     className="p-3 rounded-lg border bg-card"
                     key={kw.keyword}
                  >
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                           <span className="font-medium text-sm">
                              {kw.keyword}
                           </span>
                           <Badge
                              className={cn(
                                 "text-[10px]",
                                 getStatusColor(kw.status),
                              )}
                              variant="outline"
                           >
                              {getStatusIcon(kw.status)}
                              <span className="ml-1">
                                 {getStatusLabel(kw.status)}
                              </span>
                           </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                           {kw.count}x ({kw.density}%)
                        </span>
                     </div>

                     {/* Locations */}
                     {kw.locations.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                           <MapPin className="size-3 text-muted-foreground" />
                           {kw.locations.slice(0, 5).map((loc, idx) => (
                              <Badge
                                 className="text-[10px] bg-muted/50"
                                 key={`loc-${idx + 1}`}
                                 variant="secondary"
                              >
                                 {getLocationLabel(loc.type)}
                                 {loc.index !== undefined &&
                                    ` #${loc.index + 1}`}
                              </Badge>
                           ))}
                           {kw.locations.length > 5 && (
                              <span className="text-[10px] text-muted-foreground">
                                 +{kw.locations.length - 5} mais
                              </span>
                           )}
                        </div>
                     )}

                     {/* Suggestion */}
                     {kw.suggestion && (
                        <p className="text-[11px] text-muted-foreground mt-2 italic">
                           {kw.suggestion}
                        </p>
                     )}
                  </div>
               ))}
            </div>
         </div>

         {/* Top keywords discovered */}
         {topKeywords.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Palavras Mais Frequentes
               </p>
               <div className="flex flex-wrap gap-1.5">
                  {topKeywords.slice(0, 8).map((kw) => (
                     <Badge
                        className="text-xs"
                        key={kw.keyword}
                        variant="secondary"
                     >
                        {kw.keyword}
                        <span className="ml-1 text-muted-foreground">
                           {kw.count}
                        </span>
                     </Badge>
                  ))}
               </div>
            </div>
         )}

         {/* Recommendations */}
         {recommendations.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sugestões
               </p>
               <ul className="space-y-1 text-xs text-muted-foreground">
                  {recommendations.map((rec, index) => (
                     <li
                        className="flex items-start gap-2"
                        key={`rec-${index + 1}`}
                     >
                        <span className="text-primary">•</span>
                        {rec}
                     </li>
                  ))}
               </ul>
            </div>
         )}
      </div>
   );
}
