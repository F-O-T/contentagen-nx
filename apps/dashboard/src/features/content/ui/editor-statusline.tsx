import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import {
   BookOpen,
   FileText,
   Loader2,
   Search,
   SpellCheck,
   Type,
} from "lucide-react";
import {
   useCursorPosition,
   useGrammarCount,
   useIsChecking,
   useReadabilityInfo,
   useSeoScore,
   useSpellingCount,
   useWordCount,
} from "@/features/content/context/diagnostics-context";

type EditorStatuslineProps = {
   className?: string;
};

/**
 * Neovim lualine-style statusline for the content editor.
 * Displays diagnostics, cursor position, word count, and version history.
 */
export function EditorStatusline({ className }: EditorStatuslineProps) {
   return (
      <TooltipProvider delayDuration={300}>
         <div
            className={cn(
               "flex items-center h-7 bg-muted/50 border-t text-xs font-mono select-none",
               className,
            )}
         >
            {/* Left section: Mode indicator + Diagnostics */}
            <div className="flex items-center">
               {/* Mode indicator (lualine section A) */}
               <ModeIndicator />

               {/* Diagnostics section (lualine section B) */}
               <div className="flex items-center gap-1 px-2 border-r border-border/50 bg-muted/30">
                  <SpellingIndicator />
                  <GrammarIndicator />
                  <CheckingIndicator />
               </div>
            </div>

            {/* Center section: SEO + Readability (lualine section C) */}
            <div className="flex-1 flex items-center justify-center gap-3 px-2">
               <SeoIndicator />
               <ReadabilityIndicator />
            </div>

            {/* Right section: Word count + Cursor (lualine sections X, Y) */}
            <div className="flex items-center">
               {/* Word count (section X) */}
               <div className="px-2 border-l border-border/50 bg-muted/30">
                  <WordCountIndicator />
               </div>

               {/* Cursor position (section Y) */}
               <div className="px-2 border-l border-border/50 bg-muted/30">
                  <CursorIndicator />
               </div>
            </div>
         </div>
      </TooltipProvider>
   );
}

function ModeIndicator() {
   // For now, always show EDIT mode
   // This can be expanded to show VISUAL, INSERT, etc.
   return (
      <div className="px-3 py-1 bg-primary text-primary-foreground font-bold uppercase text-[10px] tracking-wider">
         Edit
      </div>
   );
}

function SpellingIndicator() {
   const count = useSpellingCount();

   if (count === 0) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <span className="flex items-center gap-1 text-muted-foreground">
                  <SpellCheck className="size-3.5" />
                  <span>0</span>
               </span>
            </TooltipTrigger>
            <TooltipContent>Nenhum erro de ortografia</TooltipContent>
         </Tooltip>
      );
   }

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <span className="flex items-center gap-1 text-red-500">
               <SpellCheck className="size-3.5" />
               <span>{count}</span>
            </span>
         </TooltipTrigger>
         <TooltipContent>
            {count} erro{count > 1 ? "s" : ""} de ortografia
         </TooltipContent>
      </Tooltip>
   );
}

function GrammarIndicator() {
   const count = useGrammarCount();

   if (count === 0) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <span className="flex items-center gap-1 text-muted-foreground">
                  <Type className="size-3.5" />
                  <span>0</span>
               </span>
            </TooltipTrigger>
            <TooltipContent>Nenhum erro gramatical</TooltipContent>
         </Tooltip>
      );
   }

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <span className="flex items-center gap-1 text-yellow-500">
               <Type className="size-3.5" />
               <span>{count}</span>
            </span>
         </TooltipTrigger>
         <TooltipContent>
            {count} erro{count > 1 ? "s" : ""} gramatical{count > 1 ? "is" : ""}
         </TooltipContent>
      </Tooltip>
   );
}

function CheckingIndicator() {
   const isChecking = useIsChecking();

   if (!isChecking) return null;

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <span className="flex items-center text-muted-foreground">
               <Loader2 className="size-3.5 animate-spin" />
            </span>
         </TooltipTrigger>
         <TooltipContent>Verificando...</TooltipContent>
      </Tooltip>
   );
}

function SeoIndicator() {
   const score = useSeoScore();

   if (score === null) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <span className="flex items-center gap-1 text-muted-foreground">
                  <Search className="size-3.5" />
                  <span>SEO: --</span>
               </span>
            </TooltipTrigger>
            <TooltipContent>SEO não analisado</TooltipContent>
         </Tooltip>
      );
   }

   const color =
      score >= 80
         ? "text-green-500"
         : score >= 50
           ? "text-yellow-500"
           : "text-red-500";

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <span className={cn("flex items-center gap-1", color)}>
               <Search className="size-3.5" />
               <span>SEO: {score}</span>
            </span>
         </TooltipTrigger>
         <TooltipContent>
            Score SEO: {score}/100
            {score >= 80
               ? " (Excelente)"
               : score >= 50
                 ? " (Bom)"
                 : " (Precisa melhorar)"}
         </TooltipContent>
      </Tooltip>
   );
}

function ReadabilityIndicator() {
   const { score, level } = useReadabilityInfo();

   if (score === null) {
      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <span className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  <span>Legibilidade: --</span>
               </span>
            </TooltipTrigger>
            <TooltipContent>Legibilidade não analisada</TooltipContent>
         </Tooltip>
      );
   }

   const color =
      score >= 60
         ? "text-green-500"
         : score >= 30
           ? "text-yellow-500"
           : "text-red-500";

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <span className={cn("flex items-center gap-1", color)}>
               <BookOpen className="size-3.5" />
               <span>
                  Legibilidade: {score} {level ? `(${level})` : ""}
               </span>
            </span>
         </TooltipTrigger>
         <TooltipContent>
            Índice Flesch-Kincaid: {score}
            {level && ` - Nível: ${level}`}
         </TooltipContent>
      </Tooltip>
   );
}

function WordCountIndicator() {
   const wordCount = useWordCount();

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <span className="flex items-center gap-1 text-muted-foreground">
               <FileText className="size-3.5" />
               <span>{wordCount.toLocaleString("pt-BR")} palavras</span>
            </span>
         </TooltipTrigger>
         <TooltipContent>Contagem de palavras</TooltipContent>
      </Tooltip>
   );
}

function CursorIndicator() {
   const { line, column } = useCursorPosition();

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <span className="text-muted-foreground tabular-nums">
               Ln {line}, Col {column}
            </span>
         </TooltipTrigger>
         <TooltipContent>Posição do cursor</TooltipContent>
      </Tooltip>
   );
}
