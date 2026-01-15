import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from "@packages/ui/components/accordion";
import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import {
   AlertTriangle,
   BarChart3,
   FileText,
   Hash,
   List,
   RefreshCw,
   Target,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
   useReadabilityInfo,
   useSeoScore,
} from "../context/diagnostics-context";
import { analyzeContent } from "../lib/content-analysis";
import { ContentStatsDisplay } from "./content-stats-display";
import { KeywordAnalysisDisplay } from "./keyword-analysis-display";
import { SeoScoreDisplay } from "./seo-score-display";
import { TableOfContents } from "./table-of-contents";

type ContentMetadata = {
   title?: string;
   description?: string;
   slug?: string;
   keywords?: string[];
};

type MetadataPanelProps = {
   documentContent: string;
   contentMeta?: ContentMetadata;
   isActive: boolean;
   className?: string;
};

function MetadataPanelSkeleton() {
   return (
      <div className="p-4 space-y-4">
         {/* Score skeleton */}
         <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex-1 space-y-2">
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-3 w-48" />
            </div>
         </div>

         {/* Stats skeleton */}
         <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
         </div>

         {/* Accordion skeletons */}
         <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
         </div>
      </div>
   );
}

function BadPatternsDisplay({
   patterns,
}: {
   patterns: Array<{
      pattern: string;
      severity: "error" | "warning";
      locations: string[];
      suggestion: string;
   }>;
}) {
   if (patterns.length === 0) {
      return (
         <div className="text-center py-4 text-sm text-muted-foreground">
            Nenhum padrão problemático encontrado
         </div>
      );
   }

   const getPatternLabel = (pattern: string): string => {
      const labels: Record<string, string> = {
         word_count_mention: "Menção de contagem de palavras",
         meta_commentary: "Meta-comentário",
         engagement_begging: "Pedido de engajamento",
         endless_introduction: "Introdução muito longa",
         vague_instructions: "Instruções vagas",
         clickbait_markers: "Clickbait",
         filler_phrases: "Frases de preenchimento",
         over_formatting: "Formatação excessiva",
         wall_of_text: "Bloco de texto",
         keyword_stuffing: "Excesso de palavras-chave",
      };
      return labels[pattern] || pattern;
   };

   return (
      <div className="space-y-2">
         {patterns.map((p, index) => (
            <div
               className={cn(
                  "p-2 rounded-md text-xs",
                  p.severity === "error"
                     ? "bg-red-500/10 border border-red-500/30"
                     : "bg-yellow-500/10 border border-yellow-500/30",
               )}
               key={`pattern-${index + 1}`}
            >
               <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle
                     className={cn(
                        "size-3.5",
                        p.severity === "error"
                           ? "text-red-500"
                           : "text-yellow-500",
                     )}
                  />
                  {getPatternLabel(p.pattern)}
               </div>
               <p className="text-muted-foreground mt-1">{p.suggestion}</p>
               {p.locations.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic truncate">
                     {p.locations[0]}
                  </p>
               )}
            </div>
         ))}
      </div>
   );
}

export function MetadataPanel({
   documentContent,
   contentMeta,
   isActive,
   className,
}: MetadataPanelProps) {
   const [isPending, startTransition] = useTransition();
   const [_analysisKey, setAnalysisKey] = useState(0);

   // Read SEO score from shared diagnostics context (synced with statusline)
   const diagnosticsSeoScore = useSeoScore();
   const diagnosticsReadability = useReadabilityInfo();

   // Client-side analysis using useMemo
   const analysis = useMemo(() => {
      if (!isActive || documentContent.length === 0) {
         return null;
      }
      return analyzeContent({
         content: documentContent,
         title: contentMeta?.title,
         description: contentMeta?.description,
         targetKeywords: contentMeta?.keywords || [],
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [
      isActive,
      documentContent,
      contentMeta?.title,
      contentMeta?.description,
      contentMeta?.keywords,
   ]);

   const handleRefresh = () => {
      startTransition(() => {
         setAnalysisKey((prev) => prev + 1);
      });
   };

   if (!isActive) {
      return null;
   }

   if (isPending) {
      return <MetadataPanelSkeleton />;
   }

   if (!analysis) {
      return (
         <div className={cn("p-4 text-center", className)}>
            <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
               Adicione conteúdo para análise
            </p>
         </div>
      );
   }

   return (
      <ScrollArea className={cn("h-full", className)}>
         <div className="p-4 space-y-4">
            {/* Refresh button */}
            <div className="flex justify-end">
               <Button
                  className="h-7 text-xs"
                  disabled={isPending}
                  onClick={handleRefresh}
                  size="sm"
                  variant="ghost"
               >
                  <RefreshCw
                     className={cn(
                        "size-3.5 mr-1.5",
                        isPending && "animate-spin",
                     )}
                  />
                  {isPending ? "Analisando..." : "Atualizar"}
               </Button>
            </div>

            {/* SEO Score - always visible, uses diagnostics context score for sync with statusline */}
            <SeoScoreDisplay
               issues={analysis.seo.issues}
               metrics={analysis.seo.metrics}
               recommendations={analysis.seo.recommendations}
               score={diagnosticsSeoScore ?? analysis.seo.score}
            />

            {/* Accordion sections */}
            <Accordion
               className="w-full"
               defaultValue={["keywords", "toc"]}
               type="multiple"
            >
               {/* Keywords */}
               <AccordionItem value="keywords">
                  <AccordionTrigger className="text-sm py-3">
                     <div className="flex items-center gap-2">
                        <Hash className="size-4 text-muted-foreground" />
                        Palavras-chave
                        {analysis.keywords && (
                           <span className="text-xs text-muted-foreground">
                              ({analysis.keywords.overallScore}/100)
                           </span>
                        )}
                     </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     {analysis.keywords ? (
                        <KeywordAnalysisDisplay
                           analysis={analysis.keywords.analysis}
                           metrics={analysis.keywords.metrics}
                           overallScore={analysis.keywords.overallScore}
                           recommendations={analysis.keywords.recommendations}
                           topKeywords={analysis.keywords.topKeywords}
                        />
                     ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                           Defina palavras-chave no metadata para análise
                        </div>
                     )}
                  </AccordionContent>
               </AccordionItem>

               {/* Table of Contents */}
               <AccordionItem value="toc">
                  <AccordionTrigger className="text-sm py-3">
                     <div className="flex items-center gap-2">
                        <List className="size-4 text-muted-foreground" />
                        Sumário
                     </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     <TableOfContents content={documentContent} />
                  </AccordionContent>
               </AccordionItem>

               {/* Content Stats */}
               <AccordionItem value="stats">
                  <AccordionTrigger className="text-sm py-3">
                     <div className="flex items-center gap-2">
                        <BarChart3 className="size-4 text-muted-foreground" />
                        Estatísticas
                     </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     <ContentStatsDisplay
                        readabilityLevel={
                           diagnosticsReadability.level ??
                           analysis.readability.readabilityLevel
                        }
                        readabilityMetrics={analysis.readability.metrics}
                        readabilityScore={
                           diagnosticsReadability.score ??
                           analysis.readability.fleschKincaidReadingEase
                        }
                        seoMetrics={analysis.seo.metrics}
                     />
                  </AccordionContent>
               </AccordionItem>

               {/* Bad Patterns */}
               <AccordionItem value="patterns">
                  <AccordionTrigger className="text-sm py-3">
                     <div className="flex items-center gap-2">
                        <Target className="size-4 text-muted-foreground" />
                        Padrões Problemáticos
                        {analysis.badPatterns.hasIssues && (
                           <span className="text-xs text-yellow-600">
                              ({analysis.badPatterns.issueCount})
                           </span>
                        )}
                     </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     <BadPatternsDisplay
                        patterns={analysis.badPatterns.patterns}
                     />
                  </AccordionContent>
               </AccordionItem>
            </Accordion>
         </div>
      </ScrollArea>
   );
}
