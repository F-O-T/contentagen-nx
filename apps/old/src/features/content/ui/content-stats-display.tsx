import { Badge } from "@packages/ui/components/badge";
import { cn } from "@packages/ui/lib/utils";
import {
   BookOpen,
   Clock,
   FileText,
   Heading2,
   Image,
   Link2,
   ListOrdered,
   MessageSquare,
} from "lucide-react";

type ContentStatsDisplayProps = {
   seoMetrics: {
      wordCount: number;
      headingCount: number;
      paragraphCount: number;
      linkCount: number;
      imageCount: number;
      hasQuickAnswer: boolean;
      keywordInFirstParagraph: boolean;
   };
   readabilityMetrics: {
      sentenceCount: number;
      wordCount: number;
      avgWordsPerSentence: number;
      avgSyllablesPerWord: number;
      complexWordCount: number;
      complexWordPercentage: number;
   };
   readabilityScore: number;
   readabilityLevel: string;
   className?: string;
};

type StatItemProps = {
   icon: React.ReactNode;
   label: string;
   value: string | number;
   subtext?: string;
};

function StatItem({ icon, label, value, subtext }: StatItemProps) {
   return (
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
         <div className="text-muted-foreground">{icon}</div>
         <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            {subtext && (
               <p className="text-[9px] text-muted-foreground">{subtext}</p>
            )}
         </div>
      </div>
   );
}

export function ContentStatsDisplay({
   seoMetrics,
   readabilityMetrics,
   readabilityScore,
   readabilityLevel,
   className,
}: ContentStatsDisplayProps) {
   // Calculate read time (average 200 words per minute)
   const readTime = Math.max(1, Math.ceil(seoMetrics.wordCount / 200));

   return (
      <div className={cn("space-y-4", className)}>
         {/* Main stats grid */}
         <div className="grid grid-cols-2 gap-2">
            <StatItem
               icon={<FileText className="size-4" />}
               label="Palavras"
               value={seoMetrics.wordCount.toLocaleString()}
            />
            <StatItem
               icon={<Clock className="size-4" />}
               label="Tempo de Leitura"
               value={`${readTime} min`}
            />
            <StatItem
               icon={<Heading2 className="size-4" />}
               label="Headings"
               value={seoMetrics.headingCount}
            />
            <StatItem
               icon={<ListOrdered className="size-4" />}
               label="Parágrafos"
               value={seoMetrics.paragraphCount}
            />
            <StatItem
               icon={<Image className="size-4" />}
               label="Imagens"
               value={seoMetrics.imageCount}
            />
            <StatItem
               icon={<Link2 className="size-4" />}
               label="Links"
               value={seoMetrics.linkCount}
            />
         </div>

         {/* Readability section */}
         <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
               Legibilidade
            </p>
            <div className="p-3 rounded-lg bg-muted/50">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <BookOpen className="size-4 text-muted-foreground" />
                     <span className="text-sm font-medium">Flesch-Kincaid</span>
                  </div>
                  <Badge className="text-xs" variant="secondary">
                     {readabilityScore}
                  </Badge>
               </div>
               <p className="text-xs text-muted-foreground">
                  {readabilityLevel}
               </p>
               <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div>
                     <span className="text-muted-foreground">Sentenças: </span>
                     <span className="font-medium">
                        {readabilityMetrics.sentenceCount}
                     </span>
                  </div>
                  <div>
                     <span className="text-muted-foreground">
                        Média/sentença:{" "}
                     </span>
                     <span className="font-medium">
                        {readabilityMetrics.avgWordsPerSentence} palavras
                     </span>
                  </div>
                  <div>
                     <span className="text-muted-foreground">Complexas: </span>
                     <span className="font-medium">
                        {readabilityMetrics.complexWordCount} (
                        {readabilityMetrics.complexWordPercentage}%)
                     </span>
                  </div>
                  <div>
                     <span className="text-muted-foreground">
                        Sílabas/palavra:{" "}
                     </span>
                     <span className="font-medium">
                        {readabilityMetrics.avgSyllablesPerWord}
                     </span>
                  </div>
               </div>
            </div>
         </div>

         {/* Quick checks */}
         <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
               Verificações Rápidas
            </p>
            <div className="space-y-1.5">
               <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                     <MessageSquare className="size-3.5 text-muted-foreground" />
                     Quick Answer no início
                  </span>
                  <Badge
                     className={cn(
                        "text-[10px]",
                        seoMetrics.hasQuickAnswer
                           ? "bg-green-500/10 text-green-600"
                           : "bg-muted",
                     )}
                     variant={
                        seoMetrics.hasQuickAnswer ? "default" : "secondary"
                     }
                  >
                     {seoMetrics.hasQuickAnswer ? "Sim" : "Não"}
                  </Badge>
               </div>
               <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                     <FileText className="size-3.5 text-muted-foreground" />
                     Keyword no 1º parágrafo
                  </span>
                  <Badge
                     className={cn(
                        "text-[10px]",
                        seoMetrics.keywordInFirstParagraph
                           ? "bg-green-500/10 text-green-600"
                           : "bg-muted",
                     )}
                     variant={
                        seoMetrics.keywordInFirstParagraph
                           ? "default"
                           : "secondary"
                     }
                  >
                     {seoMetrics.keywordInFirstParagraph ? "Sim" : "Não"}
                  </Badge>
               </div>
            </div>
         </div>
      </div>
   );
}
