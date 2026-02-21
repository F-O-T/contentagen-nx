/**
 * Editor Statusline Component - Lualine-inspired
 *
 * Displays editor status information with clickable sections:
 * - Mode indicator (NORMAL, EDIT, SUGGEST, AI)
 * - Clickable diagnostics section (toggles diagnostics panel)
 * - Word count, reading time
 * - Clickable AI section (toggles chat sidebar)
 */

import {
   AlertCircle,
   ChevronDown,
   Loader2,
   MessageSquare,
   SlidersHorizontal,
   Target,
} from "lucide-react";
import {
   formatCharCount,
   formatReadingTime,
   formatWordCount,
} from "../diagnostics/plugin";
import { useDiagnosticsState } from "../stores/diagnostics-store";
import { useEditState } from "../stores/edit-store";
import { cn } from "../utils";

interface EditorStatuslineProps {
   /**
    * Whether to show word count
    */
   showWordCount?: boolean;

   /**
    * Whether to show character count
    */
   showCharCount?: boolean;

   /**
    * Whether to show reading time
    */
   showReadingTime?: boolean;

   /**
    * Whether to show AI status
    */
   showAIStatus?: boolean;

   /**
    * Whether to show spelling status
    */
   showSpellingStatus?: boolean;

   /**
    * Whether to show SEO audit toggle
    */
   showSeoAudit?: boolean;

   /**
    * Whether to show config toggle
    */
   showConfig?: boolean;

   /**
    * Click handler for diagnostics section
    */
   onDiagnosticsClick?: () => void;

   /**
    * Click handler for AI section
    */
   onAIClick?: () => void;

   /**
    * Click handler for SEO audit toggle
    */
   onSeoAuditClick?: () => void;

   /**
    * Click handler for config toggle
    */
   onConfigClick?: () => void;

   /**
    * Whether diagnostics panel is open
    */
   diagnosticsOpen?: boolean;

   /**
    * Whether chat sidebar is open
    */
   chatOpen?: boolean;

   /**
    * Whether SEO audit sidebar is open
    */
   seoAuditOpen?: boolean;

   /**
    * Whether config panel is open
    */
   configOpen?: boolean;

   /**
    * Additional CSS class
    */
   className?: string;
}

/**
 * Spelling/Diagnostics Indicator Component
 * Shows spelling error count with red icon - now clickable
 */
function DiagnosticsIndicator({
   count,
   isChecking,
   isOpen,
   onClick,
}: {
   count: number;
   isChecking: boolean;
   isOpen?: boolean;
   onClick?: () => void;
}): React.JSX.Element {
   if (isChecking) {
      return (
         <span
            className="flex items-center gap-1 text-muted-foreground"
            title="Verificando ortografia..."
         >
            <Loader2 className="size-3 animate-spin" />
            <span>Verificando...</span>
         </span>
      );
   }

   const content = (
      <>
         <ChevronDown
            className={cn(
               "size-3 transition-transform",
               isOpen && "rotate-180",
            )}
         />
         {count > 0 ? (
            <>
               <AlertCircle className="size-3" />
               <span>
                  {count} erro{count !== 1 ? "s" : ""}
               </span>
            </>
         ) : (
            <span>Sem erros</span>
         )}
      </>
   );

   if (onClick) {
      return (
         <button
            className={cn(
               "flex items-center gap-1 px-2 py-0.5 -my-0.5 rounded transition-colors",
               count > 0
                  ? "text-red-500 hover:bg-red-500/10"
                  : "text-muted-foreground hover:bg-muted",
               isOpen && "bg-muted/50",
            )}
            onClick={onClick}
            title={`${count} erro(s) de ortografia - Clique para ${isOpen ? "fechar" : "abrir"} painel`}
            type="button"
         >
            {content}
         </button>
      );
   }

   return (
      <span
         className={cn(
            "flex items-center gap-1",
            count > 0 ? "text-red-500" : "text-muted-foreground",
         )}
         title={`${count} erro(s) de ortografia`}
      >
         {content}
      </span>
   );
}

/**
 * AI Section Indicator - clickable to toggle chat
 */
function AIIndicator({
   status,
   statusColor,
   isOpen,
   onClick,
}: {
   status: string | null;
   statusColor: string;
   isOpen?: boolean;
   onClick?: () => void;
}): React.JSX.Element | null {
   const content = (
      <>
         <MessageSquare className="size-3" />
         <span>{status || "AI Chat"}</span>
         <ChevronDown
            className={cn(
               "size-3 transition-transform",
               isOpen && "rotate-180",
            )}
         />
      </>
   );

   if (onClick) {
      return (
         <button
            className={cn(
               "flex items-center gap-1.5 px-2 py-0.5 -my-0.5 rounded transition-colors",
               statusColor,
               "hover:bg-primary/10",
               isOpen && "bg-primary/10",
            )}
            onClick={onClick}
            title={`Clique para ${isOpen ? "fechar" : "abrir"} chat AI`}
            type="button"
         >
            {content}
         </button>
      );
   }

   if (!status) return null;

   return (
      <div className={cn("flex items-center gap-2", statusColor)}>
         <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
         <span>{status}</span>
      </div>
   );
}

/**
 * Editor Statusline Component
 */
export function EditorStatusline({
   showWordCount = true,
   showCharCount = true,
   showReadingTime = true,
   showAIStatus = true,
   showSpellingStatus = true,
   showSeoAudit = true,
   showConfig = true,
   onDiagnosticsClick,
   onAIClick,
   onSeoAuditClick,
   onConfigClick,
   diagnosticsOpen,
   chatOpen,
   seoAuditOpen,
   configOpen,
   className,
}: EditorStatuslineProps): React.JSX.Element {
   const diagnostics = useDiagnosticsState();
   const editState = useEditState();

   // Determine AI status
   let aiStatus: string | null = null;
   let aiStatusColor = "text-muted-foreground";

   if (editState.phase === "prompting") {
      aiStatus = "Aguardando instrução...";
      aiStatusColor = "text-yellow-500";
   } else if (editState.phase === "streaming") {
      aiStatus = "Editando...";
      aiStatusColor = "text-blue-500";
   } else if (editState.phase === "complete") {
      aiStatus = "Ctrl+Enter para aceitar";
      aiStatusColor = "text-green-500";
   }

   return (
      <div
         className={cn(
            "flex items-center justify-between px-4 py-1.5 text-xs font-medium",
            "bg-muted border-t-2 border-primary/20",
            "text-foreground",
            "shrink-0", // Prevent shrinking
            className,
         )}
      >
         {/* Left side - Diagnostics and statistics */}
         <div className="flex items-center gap-4">
            {/* Diagnostics indicator - clickable */}
            {showSpellingStatus && (
               <DiagnosticsIndicator
                  count={diagnostics.spellingErrors.length}
                  isChecking={diagnostics.isCheckingSpelling}
                  isOpen={diagnosticsOpen}
                  onClick={onDiagnosticsClick}
               />
            )}

            {showWordCount && (
               <span title="Contagem de palavras">
                  {formatWordCount(diagnostics.wordCount)}
               </span>
            )}

            {showCharCount && (
               <span title="Contagem de caracteres">
                  {formatCharCount(diagnostics.charCount)}
               </span>
            )}

            {showReadingTime && (
               <span title="Tempo de leitura estimado">
                  {formatReadingTime(diagnostics.readingTimeMinutes)} de leitura
               </span>
            )}

            {diagnostics.isCalculating && (
               <span className="text-muted-foreground/50">Calculando...</span>
            )}
         </div>

         {/* Right side - Tools */}
         <div className="flex items-center gap-2">
            {showSeoAudit && (
               <button
                  className={cn(
                     "flex items-center gap-1.5 px-2 py-0.5 -my-0.5 rounded transition-colors",
                     "text-muted-foreground hover:bg-muted",
                     seoAuditOpen && "bg-muted/50 text-foreground",
                  )}
                  onClick={onSeoAuditClick}
                  title={`Clique para ${seoAuditOpen ? "fechar" : "abrir"} auditoria SEO`}
                  type="button"
               >
                  <Target className="size-3" />
                  <span>SEO</span>
                  <ChevronDown
                     className={cn(
                        "size-3 transition-transform",
                        seoAuditOpen && "rotate-180",
                     )}
                  />
               </button>
            )}

            {showConfig && (
               <button
                  className={cn(
                     "flex items-center gap-1.5 px-2 py-0.5 -my-0.5 rounded transition-colors",
                     "text-muted-foreground hover:bg-muted",
                     configOpen && "bg-muted/50 text-foreground",
                  )}
                  onClick={onConfigClick}
                  title={`Clique para ${configOpen ? "fechar" : "abrir"} configuracoes`}
                  type="button"
               >
                  <SlidersHorizontal className="size-3" />
                  <span>Config</span>
               </button>
            )}

            {showAIStatus && (
               <AIIndicator
                  isOpen={chatOpen}
                  onClick={onAIClick}
                  status={aiStatus}
                  statusColor={aiStatusColor}
               />
            )}
         </div>
      </div>
   );
}

/**
 * Compact statusline for minimal UI
 */
export function EditorStatuslineCompact({
   className,
}: {
   className?: string;
}): React.JSX.Element {
   const diagnostics = useDiagnosticsState();

   return (
      <div
         className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            className,
         )}
      >
         <span>{diagnostics.wordCount} palavras</span>
         <span className="text-muted-foreground/50">•</span>
         <span>{formatReadingTime(diagnostics.readingTimeMinutes)}</span>
      </div>
   );
}
