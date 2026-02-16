/**
 * SEO Tool Card
 *
 * Visualizes SEO analysis and keyword optimization results
 */

import type { LucideIcon } from "lucide-react";
import { BarChart3, Target } from "lucide-react";
import { ToolCardBase, type ToolStatus } from "./tool-card-base";

// =============================================================================
// Types
// =============================================================================

export interface SeoToolCardProps {
   /**
    * Tool name (e.g., "analyzeSEO", "optimizeKeywords")
    */
   toolName: string;

   /**
    * Tool arguments
    */
   args: Record<string, unknown>;

   /**
    * Tool result
    */
   result?: unknown;

   /**
    * Current status
    */
   status: ToolStatus;
}

interface SeoAnalysisResult {
   score?: number;
   issues?: string[];
   recommendations?: string[];
   keywordDensity?: Record<string, number>;
}

// =============================================================================
// Tool Icon Mapping
// =============================================================================

const TOOL_ICONS: Record<string, LucideIcon> = {
   analyzeSEO: BarChart3,
   optimizeKeywords: Target,
};

const TOOL_TITLES: Record<string, string> = {
   analyzeSEO: "Análise SEO",
   optimizeKeywords: "Otimizar Palavras-chave",
};

// =============================================================================
// Main Component
// =============================================================================

export function SeoToolCard({
   toolName,
   args,
   result,
   status,
}: SeoToolCardProps) {
   const icon = TOOL_ICONS[toolName] || BarChart3;
   const title = TOOL_TITLES[toolName] || toolName;

   return (
      <ToolCardBase
         args={args}
         icon={icon}
         result={result}
         resultRenderer={(result) => {
            if (!result || typeof result !== "object") {
               return (
                  <div className="p-2 rounded bg-muted text-xs font-mono overflow-x-auto">
                     <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
               );
            }

            const analysis = result as SeoAnalysisResult;

            return (
               <div className="space-y-3 text-xs">
                  {/* SEO Score */}
                  {analysis.score !== undefined && (
                     <div>
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-muted-foreground">
                              Pontuação SEO
                           </span>
                           <span className="font-bold text-sm">
                              {analysis.score}/100
                           </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                           <div
                              className={`h-full transition-all ${
                                 analysis.score >= 80
                                    ? "bg-green-500"
                                    : analysis.score >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                              }`}
                              style={{ width: `${analysis.score}%` }}
                           />
                        </div>
                     </div>
                  )}

                  {/* Issues */}
                  {analysis.issues && analysis.issues.length > 0 && (
                     <div>
                        <div className="font-medium text-muted-foreground mb-1">
                           Problemas encontrados:
                        </div>
                        <ul className="space-y-1">
                           {analysis.issues.slice(0, 3).map((issue, i) => (
                              <li
                                 className="flex items-start gap-1.5"
                                 // biome-ignore lint/suspicious/noArrayIndexKey: Static analysis data
                                 key={i}
                              >
                                 <span className="text-red-500 mt-0.5">•</span>
                                 <span className="text-muted-foreground">
                                    {issue}
                                 </span>
                              </li>
                           ))}
                        </ul>
                        {analysis.issues.length > 3 && (
                           <div className="text-muted-foreground mt-1">
                              +{analysis.issues.length - 3} mais problemas
                           </div>
                        )}
                     </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations &&
                     analysis.recommendations.length > 0 && (
                        <div>
                           <div className="font-medium text-muted-foreground mb-1">
                              Recomendações:
                           </div>
                           <ul className="space-y-1">
                              {analysis.recommendations
                                 .slice(0, 3)
                                 .map((rec, i) => (
                                    <li
                                       className="flex items-start gap-1.5"
                                       // biome-ignore lint/suspicious/noArrayIndexKey: Static analysis data
                                       key={i}
                                    >
                                       <span className="text-blue-500 mt-0.5">
                                          •
                                       </span>
                                       <span className="text-muted-foreground">
                                          {rec}
                                       </span>
                                    </li>
                                 ))}
                           </ul>
                           {analysis.recommendations.length > 3 && (
                              <div className="text-muted-foreground mt-1">
                                 +{analysis.recommendations.length - 3} mais
                                 recomendações
                              </div>
                           )}
                        </div>
                     )}

                  {/* Keyword Density */}
                  {analysis.keywordDensity &&
                     Object.keys(analysis.keywordDensity).length > 0 && (
                        <div>
                           <div className="font-medium text-muted-foreground mb-1">
                              Densidade de palavras-chave:
                           </div>
                           <div className="space-y-1">
                              {Object.entries(analysis.keywordDensity)
                                 .slice(0, 5)
                                 .map(([keyword, density]) => (
                                    <div
                                       className="flex items-center justify-between"
                                       key={keyword}
                                    >
                                       <span className="text-muted-foreground">
                                          {keyword}
                                       </span>
                                       <span className="font-medium">
                                          {(Number(density) * 100).toFixed(1)}%
                                       </span>
                                    </div>
                                 ))}
                           </div>
                        </div>
                     )}
               </div>
            );
         }}
         status={status}
         title={title}
      />
   );
}
