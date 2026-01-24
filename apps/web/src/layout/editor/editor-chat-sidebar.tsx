/**
 * Chat Sidebar estilo avante.nvim
 * Sidebar lateral para chat com IA
 * - Historico de mensagens
 * - Input de chat
 * - Redimensionavel
 * - Colapsavel
 */

import { Button } from "@packages/ui/components/button";

import { cn } from "@packages/ui/lib/utils";
import {
   GripVertical,
   Loader2,
   MessageSquare,
   PanelRightClose,
   Send,
   Sparkles,
   User,
} from "lucide-react";
import {
   type FormEvent,
   type KeyboardEvent,
   useCallback,
   useEffect,
   useRef,
   useState,
} from "react";
import {
   setChatSidebarWidth,
   toggleChatSidebar,
   useChatSidebar,
} from "./hooks/use-editor-state";

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
   id: string;
   role: "user" | "assistant";
   content: string;
}

type ChatMode = "writer";

interface EditorChatSidebarProps {
   onChatSend?: (
      message: string,
   ) => AsyncIterable<{ text: string; done: boolean }>;
   wordCount?: number;
   readingTime?: number;
   className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function EditorChatSidebar({
   onChatSend,
   wordCount = 0,
   readingTime = 0,
   className,
}: EditorChatSidebarProps) {
   const { open, width } = useChatSidebar();

   // Chat state
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [currentInput, setCurrentInput] = useState("");
   const [isStreaming, setIsStreaming] = useState(false);
   const [mode] = useState<ChatMode>("writer");

   const inputRef = useRef<HTMLTextAreaElement>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   // Resize state
   const [isResizing, setIsResizing] = useState(false);
   const resizeStartX = useRef(0);
   const resizeStartWidth = useRef(0);

   // Scroll to bottom when messages change
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   // Focus input when sidebar opens
   useEffect(() => {
      if (open && inputRef.current) {
         inputRef.current.focus();
      }
   }, [open]);

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

   // Chat functions
   const addMessage = useCallback(
      (role: ChatMessage["role"], content: string) => {
         const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role,
            content,
         };
         setMessages((prev) => [...prev, newMessage]);
         return newMessage.id;
      },
      [],
   );

   const appendToLastAssistant = useCallback((text: string) => {
      setMessages((prev) => {
         const lastIndex = prev.length - 1;
         if (lastIndex < 0 || prev[lastIndex]?.role !== "assistant")
            return prev;
         return [
            ...prev.slice(0, lastIndex),
            { ...prev[lastIndex], content: prev[lastIndex].content + text },
         ];
      });
   }, []);

   const handleSend = useCallback(async () => {
      const message = currentInput.trim();
      if (!message || !onChatSend) return;

      addMessage("user", message);
      setCurrentInput("");
      addMessage("assistant", "");
      setIsStreaming(true);

      try {
         for await (const chunk of onChatSend(message)) {
            if (chunk.text) {
               appendToLastAssistant(chunk.text);
            }
            if (chunk.done) {
               setIsStreaming(false);
            }
         }
      } catch (error) {
         console.error("[EditorChatSidebar] Chat send failed:", error);
         setIsStreaming(false);
      }
   }, [currentInput, onChatSend, addMessage, appendToLastAssistant]);

   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
         e.preventDefault();
         handleSend();
      }
   };

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      handleSend();
   };

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

         {/* Header */}
         <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-2">
               <MessageSquare className="size-4 text-primary" />
               <span className="text-sm font-medium">Chat IA</span>
            </div>

            <div className="flex items-center gap-1">
               {/* Close button */}
               <Button
                  className="size-7"
                  onClick={toggleChatSidebar}
                  size="icon"
                  variant="ghost"
               >
                  <PanelRightClose className="size-4" />
               </Button>
            </div>
         </div>

         {/* Messages */}
         <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Sparkles className="size-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Assistente de Escrita</p>
                  <p className="text-xs mt-1 opacity-75 max-w-[200px]">
                     {mode === "writer"
                        ? "Peca para editar, melhorar ou criar conteudo"
                        : "Peca para planejar a estrutura do seu conteudo"}
                  </p>
               </div>
            )}

            {messages.map((message) => (
               <div
                  className={cn(
                     "flex gap-2",
                     message.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                  key={message.id}
               >
                  <div
                     className={cn(
                        "flex-shrink-0 size-6 rounded-full flex items-center justify-center text-xs",
                        message.role === "user"
                           ? "bg-primary text-primary-foreground"
                           : "bg-muted",
                     )}
                  >
                     {message.role === "user" ? (
                        <User className="size-3" />
                     ) : (
                        <Sparkles className="size-3" />
                     )}
                  </div>
                  <div
                     className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        message.role === "user"
                           ? "bg-primary text-primary-foreground"
                           : "bg-muted",
                     )}
                  >
                     <div className="whitespace-pre-wrap">
                        {message.content}
                     </div>
                  </div>
               </div>
            ))}

            <div ref={messagesEndRef} />
         </div>

         {/* Stats bar */}
         <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
            <span>{wordCount} palavras</span>
            <span>~{readingTime} min leitura</span>
         </div>

         {/* Input */}
         <form className="p-2 border-t" onSubmit={handleSubmit}>
            <div className="flex gap-2">
               <textarea
                  className={cn(
                     "flex-1 px-3 py-2 text-sm rounded-lg resize-none",
                     "bg-muted border-none",
                     "focus:outline-none focus:ring-2 focus:ring-ring",
                     "min-h-[60px] max-h-[120px]",
                  )}
                  disabled={isStreaming}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                     mode === "writer"
                        ? "Como posso ajudar com seu conteudo?"
                        : "O que voce gostaria de planejar?"
                  }
                  ref={inputRef}
                  value={currentInput}
               />
               <button
                  className={cn(
                     "self-end px-3 py-2 rounded-lg",
                     "bg-primary text-primary-foreground",
                     "hover:bg-primary/90",
                     "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  disabled={!currentInput.trim() || isStreaming}
                  type="submit"
               >
                  {isStreaming ? (
                     <Loader2 className="size-4 animate-spin" />
                  ) : (
                     <Send className="size-4" />
                  )}
               </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
               Enter para enviar, Shift+Enter para quebra de linha
            </p>
         </form>
      </div>
   );
}
