/**
 * Assistant Chat Sidebar
 *
 * Chat sidebar powered by assistant-ui for AI interactions.
 * Displays tool calls with visual feedback.
 * Toggle with Ctrl+B keyboard shortcut.
 */

import {
   ComposerPrimitive,
   MessagePrimitive,
   ThreadPrimitive,
} from "@assistant-ui/react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { ArrowDown, GripVertical, Loader2, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
   isEditorTool,
   isFrontmatterTool,
   isResearchTool,
   isSEOTool,
} from "@/features/content/lib/assistant-runtime-adapter";
import { EditorToolCard } from "./chat/tool-cards/editor-tool-card";
import { FrontmatterToolCard } from "./chat/tool-cards/frontmatter-tool-card";
import { ResearchToolCard } from "./chat/tool-cards/research-tool-card";
import { SeoToolCard } from "./chat/tool-cards/seo-tool-card";
import type { ToolStatus } from "./chat/tool-cards/tool-card-base";
import { setChatSidebarWidth, useChatSidebar } from "../hooks/use-editor-state";

// ============================================================================
// Types
// ============================================================================

interface AssistantChatSidebarProps {
   /**
    * Word count for stats display
    */
   wordCount?: number;

   /**
    * Reading time for stats display
    */
   readingTime?: number;

   /**
    * Additional CSS classes
    */
   className?: string;
}

// ============================================================================
// Tool Override Component
// ============================================================================

/**
 * Catches ALL tool calls via MessagePrimitive.Content's components.tools.Override.
 * Routes each call to the appropriate card component based on tool category.
 */
function ToolCallOverride({ toolName, args, result, status }: ToolCallMessagePartProps) {
   const toolStatus: ToolStatus =
      status.type === "complete" ? "complete"
      : status.type === "running" ? "running"
      : "error";
   const resolvedArgs = args as Record<string, unknown>;

   if (isEditorTool(toolName))
      return <EditorToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;
   if (isFrontmatterTool(toolName))
      return <FrontmatterToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;
   if (isResearchTool(toolName))
      return <ResearchToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;
   if (isSEOTool(toolName))
      return <SeoToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;

   return (
      <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
         <div className="font-medium text-sm mb-2">{toolName}</div>
         <pre className="text-xs text-muted-foreground p-2 rounded bg-muted overflow-x-auto">
            {JSON.stringify(args, null, 2)}
         </pre>
         {result !== undefined && (
            <pre className="mt-2 text-xs text-muted-foreground p-2 rounded bg-muted overflow-x-auto">
               {JSON.stringify(result, null, 2)}
            </pre>
         )}
      </div>
   );
}

// ============================================================================
// Message Components
// ============================================================================

/**
 * Custom user message component
 * Uses MessagePrimitive.Content to render all message parts
 */
function CustomUserMessage() {
   return (
      <MessagePrimitive.Root className="flex gap-2 px-3 py-2 flex-row-reverse">
         <div className="flex-shrink-0 size-6 rounded-full flex items-center justify-center text-xs bg-primary text-primary-foreground">
            <span className="text-[10px]">Eu</span>
         </div>
         <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
            <MessagePrimitive.Content />
         </div>
      </MessagePrimitive.Root>
   );
}

/**
 * Animated typing indicator (three dots)
 */
function TypingIndicator() {
   return (
      <div className="flex gap-1 items-center h-5">
         <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
         <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
         <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
      </div>
   );
}

/**
 * Custom assistant message component
 * Uses MessagePrimitive.Content to render text and tool calls.
 * Tool calls are routed via the ToolCallOverride component.
 */
function CustomAssistantMessage() {
   return (
      <MessagePrimitive.Root className="flex gap-2 px-3 py-2">
         <div className="flex-shrink-0 size-6 rounded-full flex items-center justify-center text-xs bg-muted">
            <Sparkles className="size-3" />
         </div>
         <div className="max-w-[85%] space-y-2">
            {/* Show generation status if this is the last message and thread is running */}
            <MessagePrimitive.If last>
               <ThreadPrimitive.If running>
                  <MessagePrimitive.If hasContent={false}>
                     <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" />
                        <span>Gerando resposta...</span>
                     </div>
                  </MessagePrimitive.If>
               </ThreadPrimitive.If>
            </MessagePrimitive.If>

            {/* Message content */}
            <MessagePrimitive.If last>
               <ThreadPrimitive.If running>
                  <MessagePrimitive.If hasContent={false}>
                     <div className="rounded-lg px-3 py-2 text-sm bg-muted ring-2 ring-primary/20 animate-pulse">
                        <TypingIndicator />
                     </div>
                  </MessagePrimitive.If>
                  <MessagePrimitive.If hasContent>
                     <div className="rounded-lg px-3 py-2 text-sm bg-muted ring-2 ring-primary/20 animate-pulse transition-all">
                        <MessagePrimitive.Content
                           components={{ tools: { Override: ToolCallOverride } }}
                        />
                     </div>
                  </MessagePrimitive.If>
               </ThreadPrimitive.If>
            </MessagePrimitive.If>

            {/* Show normal content when not generating or not last message */}
            <MessagePrimitive.If last={false}>
               <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                  <MessagePrimitive.Content
                     components={{ tools: { Override: ToolCallOverride } }}
                  />
               </div>
            </MessagePrimitive.If>
            <MessagePrimitive.If last>
               <ThreadPrimitive.If running={false}>
                  <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                     <MessagePrimitive.Content
                        components={{ tools: { Override: ToolCallOverride } }}
                     />
                  </div>
               </ThreadPrimitive.If>
            </MessagePrimitive.If>
         </div>
      </MessagePrimitive.Root>
   );
}

// ============================================================================
// Main Component
// ============================================================================

export function AssistantChatSidebar({
   wordCount = 0,
   readingTime = 0,
   className,
}: AssistantChatSidebarProps) {
   const { open, width } = useChatSidebar();

   // Resize state
   const [isResizing, setIsResizing] = useState(false);
   const resizeStartX = useRef(0);
   const resizeStartWidth = useRef(0);

   // Handle resize
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
         setChatSidebarWidth(resizeStartWidth.current + delta);
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

   if (!open) return null;

   return (
      <div
         className={cn(
            "flex flex-col h-full border-l bg-background relative",
            className,
         )}
         style={{ width }}
      >
         {/* Resize handle */}
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

         {/* Thread with messages */}
         <ThreadPrimitive.Root className="flex-1 flex flex-col min-h-0">
            <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
               <ThreadPrimitive.Empty>
                  <EmptyState />
               </ThreadPrimitive.Empty>

               <ThreadPrimitive.Messages
                  components={{
                     UserMessage: CustomUserMessage,
                     AssistantMessage: CustomAssistantMessage,
                  }}
               />
            </ThreadPrimitive.Viewport>

            {/* Scroll to bottom button */}
            <ThreadPrimitive.ScrollToBottom asChild>
               <Button
                  className="absolute bottom-24 right-4 rounded-full size-8 shadow-md"
                  size="icon"
                  variant="outline"
               >
                  <ArrowDown className="size-4" />
               </Button>
            </ThreadPrimitive.ScrollToBottom>
         </ThreadPrimitive.Root>

         {/* Stats bar */}
         <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
            <span>{wordCount} palavras</span>
            <span>~{readingTime} min leitura</span>
         </div>

         {/* Status indicator above composer */}
         <ThreadPrimitive.If running>
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50">
               <Loader2 className="size-3 animate-spin" />
               <span>Assistente está gerando...</span>
            </div>
         </ThreadPrimitive.If>

         {/* Composer */}
         <ComposerPrimitive.Root className="p-2 border-t">
            <div className="flex gap-2">
               <ComposerPrimitive.Input
                  className={cn(
                     "flex-1 px-3 py-2 text-sm rounded-lg resize-none",
                     "bg-muted border-none",
                     "focus:outline-none focus:ring-2 focus:ring-ring",
                     "min-h-[60px] max-h-[120px]",
                     "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  placeholder="Como posso ajudar com seu conteudo?"
               />
               <ComposerPrimitive.Send asChild>
                  <Button className="self-end h-10 w-10" size="icon">
                     <ThreadPrimitive.If running>
                        <Loader2 className="size-4 animate-spin" />
                     </ThreadPrimitive.If>
                     <ThreadPrimitive.If running={false}>
                        <Send className="size-4" />
                     </ThreadPrimitive.If>
                  </Button>
               </ComposerPrimitive.Send>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
               Enter para enviar, Shift+Enter para quebra de linha
            </p>
         </ComposerPrimitive.Root>
      </div>
   );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Empty state when no messages
 */
function EmptyState() {
   return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
         <Sparkles className="size-8 mb-2 opacity-50" />
         <p className="text-sm font-medium">Assistente de Escrita</p>
         <p className="text-xs mt-1 opacity-75 max-w-[200px]">
            Peca para editar, melhorar ou criar conteudo. Voce vera as
            ferramentas sendo executadas em tempo real.
         </p>
      </div>
   );
}
