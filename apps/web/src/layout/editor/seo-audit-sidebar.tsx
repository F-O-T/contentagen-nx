/**
 * SEO Audit Sidebar
 *
 * Real-time SEO and content analysis powered by content-analysis worker.
 */

import type {
   ContentAnalysisResult,
   KeywordAnalysisItem,
   TopKeyword,
} from "@f-o-t/content-analysis/types";
import type { ContentMeta } from "@packages/database/schemas/content";
import { getDiagnosticsClient } from "@packages/editor/diagnostics/client";
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from "@packages/ui/components/accordion";
import { Badge } from "@packages/ui/components/badge";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { cn } from "@packages/ui/lib/utils";
import {
   AlertCircle,
   AlertTriangle,
   BarChart3,
   CheckCircle2,
   FileText,
   GripVertical,
   Hash,
   Info,
   List,
   Target,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
   setSeoAuditSidebarWidth,
   useSeoAuditSidebar,
} from "./hooks/use-editor-state";

interface SeoAuditSidebarProps {
   content: string;
   meta?: ContentMeta | null;
   className?: string;
}

export function SeoAuditSidebar({
   content,
   meta,
   className,
}: SeoAuditSidebarProps) {
   const { open, width } = useSeoAuditSidebar();
   const [analysis, setAnalysis] = useState<ContentAnalysisResult | null>(null);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [isResizing, setIsResizing] = useState(false);
   const resizeStartX = useRef(0);
   const resizeStartWidth = useRef(0);

   const handleResizeStart = useCallback(
      (e: React.MouseEvent) => {
         e.preventDefault();
         setIsResizing(true);
         resizeStartX.current = e.clientX;
         resizeStartWidth.current = width;
      },
      [width],
   );

   useEffect(() => {
      if (!isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
         const delta = resizeStartX.current - e.clientX;
         setSeoAuditSidebarWidth(resizeStartWidth.current + delta);
      };

      const handleMouseUp = () => {
         setIsResizing(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
         document.removeEventListener("mousemove", handleMouseMove);
         document.removeEventListener("mouseup", handleMouseUp);
      };
   }, [isResizing]);

   useEffect(() => {
      if (!open) return;

      setIsAnalyzing(true);

      const client = getDiagnosticsClient();
      client.runSeoAuditDebounced(
         {
            content,
            title: meta?.title,
            description: meta?.description,
            targetKeywords: meta?.keywords || [],
         },
         (result: unknown) => {
            setAnalysis(result as ContentAnalysisResult);
            setIsAnalyzing(false);
         },
      );
   }, [content, meta?.title, meta?.description, meta?.keywords, open]);

   if (!open) return null;

   return (
      <div
         className={cn(
            "flex flex-col h-full border-l bg-background relative",
            className,
         )}
         style={{ width }}
      >
         <button
            className={cn(
               "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors flex items-center justify-center",
               isResizing && "bg-primary/30",
            )}
            onMouseDown={handleResizeStart}
            type="button"
         >
            <GripVertical className="size-3 text-muted-foreground/50 absolute" />
         </button>

         <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
               <Target className="size-4" />
               <span className="font-medium">Auditoria SEO</span>
            </div>
            {isAnalyzing && (
               <span className="text-xs text-muted-foreground">
                  Analisando...
               </span>
            )}
         </div>

         {!analysis ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-6 text-center">
               <FileText className="size-8 mb-2 opacity-60" />
               <p className="text-sm">Escreva para ver a auditoria SEO.</p>
               <p className="text-xs mt-1">
                  Atualiza automaticamente conforme o conteudo muda.
               </p>
            </div>
         ) : (
            <ScrollArea className="flex-1">
               <div className="p-4 space-y-4">
                  <SeoScoreCard analysis={analysis} />

                  <Accordion
                     className="w-full"
                     defaultValue={["keywords", "toc", "stats"]}
                     type="multiple"
                  >
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
                                 recommendations={
                                    analysis.keywords.recommendations
                                 }
                                 topKeywords={analysis.keywords.topKeywords}
                              />
                           ) : (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                 Defina palavras-chave no metadata para analise.
                              </div>
                           )}
                        </AccordionContent>
                     </AccordionItem>

                     <AccordionItem value="toc">
                        <AccordionTrigger className="text-sm py-3">
                           <div className="flex items-center gap-2">
                              <List className="size-4 text-muted-foreground" />
                              Sumario
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <TableOfContents content={content} />
                        </AccordionContent>
                     </AccordionItem>

                     <AccordionItem value="stats">
                        <AccordionTrigger className="text-sm py-3">
                           <div className="flex items-center gap-2">
                              <BarChart3 className="size-4 text-muted-foreground" />
                              Estatisticas
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <ContentStatsDisplay analysis={analysis} />
                        </AccordionContent>
                     </AccordionItem>

                     <AccordionItem value="patterns">
                        <AccordionTrigger className="text-sm py-3">
                           <div className="flex items-center gap-2">
                              <Target className="size-4 text-muted-foreground" />
                              Padroes Problematicos
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
         )}
      </div>
   );
}

function SeoScoreCard({ analysis }: { analysis: ContentAnalysisResult }) {
   const errorCount = analysis.seo.issues.filter(
      (issue) => issue.severity === "error",
   ).length;
   const warningCount = analysis.seo.issues.filter(
      (issue) => issue.severity === "warning",
   ).length;
   const infoCount = analysis.seo.issues.filter(
      (issue) => issue.severity === "info",
   ).length;
   const score = Math.round(analysis.seo.score);

   const scoreLabel =
      score >= 80
         ? "Excelente"
         : score >= 70
           ? "Bom"
           : score >= 50
             ? "Regular"
             : "Precisa Melhorar";
   const scoreTone =
      score >= 70
         ? "text-green-500"
         : score >= 50
           ? "text-yellow-500"
           : "text-red-500";

   return (
      <div className="space-y-4">
         <div className="flex items-center gap-4">
            <div
               className={cn(
                  "size-20 rounded-full flex items-center justify-center border",
                  scoreTone,
               )}
            >
               <span className="text-2xl font-bold">{score}</span>
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">SEO Score</span>
                  <Badge className="text-xs" variant="secondary">
                     {scoreLabel}
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
                  {analysis.seo.issues.length === 0 && (
                     <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="size-3" />
                        Sem problemas
                     </span>
                  )}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-md bg-muted/50">
               <p className="text-lg font-semibold">
                  {analysis.seo.metrics.wordCount}
               </p>
               <p className="text-[10px] text-muted-foreground">Palavras</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
               <p className="text-lg font-semibold">
                  {analysis.seo.metrics.headingCount}
               </p>
               <p className="text-[10px] text-muted-foreground">Headings</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
               <p className="text-lg font-semibold">
                  {analysis.seo.metrics.imageCount}
               </p>
               <p className="text-[10px] text-muted-foreground">Imagens</p>
            </div>
         </div>

         {analysis.seo.issues.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Problemas Encontrados
               </p>
               <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {analysis.seo.issues.map((issue, index) => (
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

         {analysis.seo.recommendations.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recomendacoes
               </p>
               <div className="space-y-1">
                  {analysis.seo.recommendations.map((rec, index) => (
                     <div
                        className="flex items-start gap-2 text-xs"
                        key={`rec-${index + 1}`}
                     >
                        <Target className="size-3 text-primary shrink-0 mt-0.5" />
                        <span>{rec}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}
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

function KeywordAnalysisDisplay({
   analysis,
   overallScore,
   topKeywords,
   recommendations,
   metrics,
}: {
   analysis: KeywordAnalysisItem[];
   overallScore: number;
   topKeywords: TopKeyword[];
   recommendations: string[];
   metrics: {
      totalWordCount: number;
      uniqueWordCount: number;
      avgKeywordDensity: number;
   };
}) {
   if (analysis.length === 0) {
      return (
         <div className="text-center py-4">
            <Hash className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
               Nenhuma palavra-chave definida
            </p>
            <p className="text-xs text-muted-foreground mt-1">
               Adicione palavras-chave no metadata para análise.
            </p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
               <p className="text-xs text-muted-foreground">
                  Score de Palavras-chave
               </p>
               <p className="text-2xl font-bold">{overallScore}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
               <p>{metrics.totalWordCount} palavras</p>
               <p>{metrics.avgKeywordDensity.toFixed(2)}% densidade media</p>
            </div>
         </div>

         <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
               Palavras-chave Alvo
            </p>
            <div className="space-y-2">
               {analysis.map((keyword) => (
                  <KeywordItem key={keyword.keyword} keyword={keyword} />
               ))}
            </div>
         </div>

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

         {recommendations.length > 0 && (
            <div className="space-y-2">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sugestoes
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

function KeywordItem({ keyword }: { keyword: KeywordAnalysisItem }) {
   const statusTone =
      keyword.status === "optimal"
         ? "bg-green-500/10 text-green-600 border-green-500/30"
         : keyword.status === "low"
           ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
           : keyword.status === "high"
             ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
             : "bg-red-500/10 text-red-600 border-red-500/30";

   const statusLabel =
      keyword.status === "optimal"
         ? "Otimo"
         : keyword.status === "low"
           ? "Baixo"
           : keyword.status === "high"
             ? "Alto"
             : "Ausente";

   return (
      <div className="p-3 rounded-lg border bg-card">
         <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <span className="font-medium text-sm">{keyword.keyword}</span>
               <Badge
                  className={cn("text-[10px]", statusTone)}
                  variant="outline"
               >
                  {statusLabel}
               </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
               {keyword.count}x ({keyword.density}%)
            </span>
         </div>

         {keyword.locations.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
               {keyword.locations.slice(0, 5).map((loc, idx) => (
                  <Badge
                     className="text-[10px] bg-muted/50"
                     key={`loc-${idx + 1}`}
                     variant="secondary"
                  >
                     {loc.type}
                     {loc.index !== undefined && ` #${loc.index + 1}`}
                  </Badge>
               ))}
               {keyword.locations.length > 5 && (
                  <span className="text-[10px] text-muted-foreground">
                     +{keyword.locations.length - 5} mais
                  </span>
               )}
            </div>
         )}

         {keyword.suggestion && (
            <p className="text-[11px] text-muted-foreground mt-2 italic">
               {keyword.suggestion}
            </p>
         )}
      </div>
   );
}

function ContentStatsDisplay({
   analysis,
}: {
   analysis: ContentAnalysisResult;
}) {
   const readTime = Math.max(
      1,
      Math.ceil(analysis.seo.metrics.wordCount / 200),
   );

   return (
      <div className="space-y-4">
         <div className="grid grid-cols-2 gap-2">
            <StatItem
               icon={<FileText className="size-4" />}
               label="Palavras"
               value={analysis.seo.metrics.wordCount.toLocaleString()}
            />
            <StatItem
               icon={<BarChart3 className="size-4" />}
               label="Tempo de Leitura"
               value={`${readTime} min`}
            />
            <StatItem
               icon={<BarChart3 className="size-4" />}
               label="Headings"
               value={analysis.seo.metrics.headingCount}
            />
            <StatItem
               icon={<BarChart3 className="size-4" />}
               label="Paragrafos"
               value={analysis.seo.metrics.paragraphCount}
            />
            <StatItem
               icon={<BarChart3 className="size-4" />}
               label="Imagens"
               value={analysis.seo.metrics.imageCount}
            />
            <StatItem
               icon={<BarChart3 className="size-4" />}
               label="Links"
               value={analysis.seo.metrics.linkCount}
            />
         </div>

         <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
               Legibilidade
            </p>
            <div className="p-3 rounded-lg bg-muted/50">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <BarChart3 className="size-4 text-muted-foreground" />
                     <span className="text-sm font-medium">Flesch-Kincaid</span>
                  </div>
                  <Badge className="text-xs" variant="secondary">
                     {Math.round(analysis.readability.fleschKincaidReadingEase)}
                  </Badge>
               </div>
               <p className="text-xs text-muted-foreground">
                  {analysis.readability.readabilityLevel}
               </p>
               <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div>
                     <span className="text-muted-foreground">Sentencas: </span>
                     <span className="font-medium">
                        {analysis.readability.metrics.sentenceCount}
                     </span>
                  </div>
                  <div>
                     <span className="text-muted-foreground">
                        Media/sentenca:{" "}
                     </span>
                     <span className="font-medium">
                        {analysis.readability.metrics.avgWordsPerSentence}{" "}
                        palavras
                     </span>
                  </div>
                  <div>
                     <span className="text-muted-foreground">Complexas: </span>
                     <span className="font-medium">
                        {analysis.readability.metrics.complexWordCount} (
                        {analysis.readability.metrics.complexWordPercentage}%)
                     </span>
                  </div>
                  <div>
                     <span className="text-muted-foreground">
                        Silabas/palavra:{" "}
                     </span>
                     <span className="font-medium">
                        {analysis.readability.metrics.avgSyllablesPerWord}
                     </span>
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
               Verificacoes Rapidas
            </p>
            <div className="space-y-1.5">
               <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                     <BarChart3 className="size-3.5 text-muted-foreground" />
                     Quick Answer no inicio
                  </span>
                  <Badge
                     className={cn(
                        "text-[10px]",
                        analysis.seo.metrics.hasQuickAnswer
                           ? "bg-green-500/10 text-green-600"
                           : "bg-muted",
                     )}
                     variant={
                        analysis.seo.metrics.hasQuickAnswer
                           ? "default"
                           : "secondary"
                     }
                  >
                     {analysis.seo.metrics.hasQuickAnswer ? "Sim" : "Nao"}
                  </Badge>
               </div>
               <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                     <FileText className="size-3.5 text-muted-foreground" />
                     Keyword no 1o paragrafo
                  </span>
                  <Badge
                     className={cn(
                        "text-[10px]",
                        analysis.seo.metrics.keywordInFirstParagraph
                           ? "bg-green-500/10 text-green-600"
                           : "bg-muted",
                     )}
                     variant={
                        analysis.seo.metrics.keywordInFirstParagraph
                           ? "default"
                           : "secondary"
                     }
                  >
                     {analysis.seo.metrics.keywordInFirstParagraph
                        ? "Sim"
                        : "Nao"}
                  </Badge>
               </div>
            </div>
         </div>
      </div>
   );
}

function StatItem({
   icon,
   label,
   value,
}: {
   icon: React.ReactNode;
   label: string;
   value: string | number;
}) {
   return (
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
         <div className="text-muted-foreground">{icon}</div>
         <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
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
            Nenhum padrao problemático encontrado
         </div>
      );
   }

   return (
      <div className="space-y-2">
         {patterns.map((pattern, index) => (
            <div
               className={cn(
                  "p-2 rounded-md text-xs",
                  pattern.severity === "error"
                     ? "bg-red-500/10 border border-red-500/30"
                     : "bg-yellow-500/10 border border-yellow-500/30",
               )}
               key={`pattern-${index + 1}`}
            >
               <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle
                     className={cn(
                        "size-3.5",
                        pattern.severity === "error"
                           ? "text-red-500"
                           : "text-yellow-500",
                     )}
                  />
                  {pattern.pattern}
               </div>
               <p className="text-muted-foreground mt-1">
                  {pattern.suggestion}
               </p>
               {pattern.locations.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic truncate">
                     {pattern.locations[0]}
                  </p>
               )}
            </div>
         ))}
      </div>
   );
}

function TableOfContents({ content }: { content: string }) {
   const headings = content
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.replace(/^##\s+/, ""));

   if (headings.length === 0) {
      return (
         <div className="text-center py-4 text-sm text-muted-foreground">
            Nenhum heading encontrado
         </div>
      );
   }

   return (
      <div className="space-y-1 text-sm">
         {headings.map((heading, index) => (
            <div className="text-muted-foreground" key={`heading-${index + 1}`}>
               {heading}
            </div>
         ))}
      </div>
   );
}
