import { Badge } from "@packages/ui/components/badge";
import { cn } from "@packages/ui/lib/utils";
import {
   AlertCircle,
   AlertTriangle,
   CheckCircle2,
   Info,
   TrendingUp,
} from "lucide-react";

type SeoIssue = {
   type: string;
   severity: "error" | "warning" | "info";
   message: string;
   suggestion: string;
};

type SeoMetrics = {
   wordCount: number;
   headingCount: number;
   paragraphCount: number;
   linkCount: number;
   imageCount: number;
   hasQuickAnswer: boolean;
   keywordInFirstParagraph: boolean;
   keywordDensity?: Record<string, number>;
};

type SeoScoreDisplayProps = {
   score: number;
   issues: SeoIssue[];
   recommendations: string[];
   metrics: SeoMetrics;
   className?: string;
};

function getScoreColor(score: number): string {
   if (score >= 70) return "text-green-500";
   if (score >= 50) return "text-yellow-500";
   return "text-red-500";
}

function getScoreBgColor(score: number): string {
   if (score >= 70) return "bg-green-500/10";
   if (score >= 50) return "bg-yellow-500/10";
   return "bg-red-500/10";
}

function getScoreRingColor(score: number): string {
   if (score >= 70) return "stroke-green-500";
   if (score >= 50) return "stroke-yellow-500";
   return "stroke-red-500";
}

function getScoreLabel(score: number): string {
   if (score >= 80) return "Excelente";
   if (score >= 70) return "Bom";
   if (score >= 50) return "Regular";
   return "Precisa Melhorar";
}

function CircularProgress({
   score,
   size = 100,
}: {
   score: number;
   size?: number;
}) {
   const strokeWidth = 8;
   const radius = (size - strokeWidth) / 2;
   const circumference = radius * 2 * Math.PI;
   const offset = circumference - (score / 100) * circumference;

   return (
      <div className="relative inline-flex items-center justify-center">
         <svg className="-rotate-90" height={size} width={size}>
            {/* Background circle */}
            <circle
               className="stroke-muted"
               cx={size / 2}
               cy={size / 2}
               fill="none"
               r={radius}
               strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
               className={cn(
                  "transition-all duration-500",
                  getScoreRingColor(score),
               )}
               cx={size / 2}
               cy={size / 2}
               fill="none"
               r={radius}
               strokeDasharray={circumference}
               strokeDashoffset={offset}
               strokeLinecap="round"
               strokeWidth={strokeWidth}
            />
         </svg>
         <div className="absolute flex flex-col items-center">
            <span className={cn("text-2xl font-bold", getScoreColor(score))}>
               {score}
            </span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
         </div>
      </div>
   );
}

function SeverityIcon({
   severity,
}: {
   severity: "error" | "warning" | "info";
}) {
   switch (severity) {
      case "error":
         return <AlertCircle className="size-3.5 text-red-500 shrink-0" />;
      case "warning":
         return <AlertTriangle className="size-3.5 text-yellow-500 shrink-0" />;
      case "info":
         return <Info className="size-3.5 text-blue-500 shrink-0" />;
   }
}

export function SeoScoreDisplay({
   score,
   issues,
   recommendations,
   metrics,
   className,
}: SeoScoreDisplayProps) {
   const errorCount = issues.filter((i) => i.severity === "error").length;
   const warningCount = issues.filter((i) => i.severity === "warning").length;
   const infoCount = issues.filter((i) => i.severity === "info").length;

   return (
      <div className={cn("space-y-4", className)}>
         {/* Score header */}
         <div className="flex items-center gap-4">
            <CircularProgress score={score} size={80} />
            <div className="flex-1">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">SEO Score</span>
                  <Badge
                     className={cn("text-xs", getScoreBgColor(score))}
                     variant="secondary"
                  >
                     {getScoreLabel(score)}
                  </Badge>
               </div>
               <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {errorCount > 0 && (
                     <span className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="size-3" />
                        {errorCount} erros
                     </span>
                  )}
                  {warningCount > 0 && (
                     <span className="flex items-center gap-1 text-yellow-500">
                        <AlertTriangle className="size-3" />
                        {warningCount} avisos
                     </span>
                  )}
                  {infoCount > 0 && (
                     <span className="flex items-center gap-1 text-blue-500">
                        <Info className="size-3" />
                        {infoCount} dicas
                     </span>
                  )}
                  {issues.length === 0 && (
                     <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="size-3" />
                        Sem problemas
                     </span>
                  )}
               </div>
            </div>
         </div>

         {/* Quick metrics */}
         <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-md bg-muted/50">
               <p className="text-lg font-semibold">{metrics.wordCount}</p>
               <p className="text-[10px] text-muted-foreground">Palavras</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
               <p className="text-lg font-semibold">{metrics.headingCount}</p>
               <p className="text-[10px] text-muted-foreground">Headings</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
               <p className="text-lg font-semibold">{metrics.imageCount}</p>
               <p className="text-[10px] text-muted-foreground">Imagens</p>
            </div>
         </div>

         {/* Issues list */}
         {issues.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Problemas Encontrados
               </p>
               <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {issues.map((issue, index) => (
                     <div
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/30 text-xs"
                        key={`issue-${index + 1}`}
                     >
                        <SeverityIcon severity={issue.severity} />
                        <div className="flex-1 min-w-0">
                           <p className="font-medium">{issue.message}</p>
                           <p className="text-muted-foreground text-[11px] mt-0.5">
                              {issue.suggestion}
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Recommendations */}
         {recommendations.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recomendações
               </p>
               <div className="space-y-1">
                  {recommendations.map((rec, index) => (
                     <div
                        className="flex items-start gap-2 text-xs"
                        key={`rec-${index + 1}`}
                     >
                        <TrendingUp className="size-3 text-primary shrink-0 mt-0.5" />
                        <span>{rec}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
}
