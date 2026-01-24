/**
 * Chat Sidebar Component
 *
 * Sidebar for AI chat interaction with the editor.
 * Integrates with the content context for tool execution.
 */

import {
   ChevronRight,
   Loader2,
   MessageSquare,
   Send,
   Sparkles,
   X,
} from "lucide-react";
import {
   type FormEvent,
   type KeyboardEvent,
   useCallback,
   useEffect,
   useRef,
} from "react";
import { useChatContext, useChatState } from "../../stores/chat-store";
import { cn } from "../../utils";

interface ChatSidebarProps {
   /**
    * Function to send a message and stream response
    */
   onSend?: (message: string) => AsyncIterable<{ text: string; done: boolean }>;

   /**
    * Whether the sidebar is open
    */
   isOpen?: boolean;

   /**
    * Callback when sidebar is closed
    */
   onClose?: () => void;

   /**
    * Additional CSS class
    */
   className?: string;

   /**
    * Width of the sidebar
    */
   width?: number | string;
}

/**
 * Chat Sidebar Component
 */
export function ChatSidebar({
   onSend,
   isOpen: controlledIsOpen,
   onClose,
   className,
   width = 400,
}: ChatSidebarProps): React.JSX.Element | null {
   const chatState = useChatState();
   const chat = useChatContext();
   const inputRef = useRef<HTMLTextAreaElement>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   // Use controlled or internal state
   const isOpen = controlledIsOpen ?? chatState.isOpen;

   // Scroll to bottom when messages change
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [chatState.messages]);

   // Focus input when opened
   useEffect(() => {
      if (isOpen && inputRef.current) {
         inputRef.current.focus();
      }
   }, [isOpen]);

   /**
    * Handle send message
    */
   const handleSend = useCallback(async () => {
      const message = chatState.currentInput.trim();
      if (!message || !onSend) return;

      // Add user message
      chat.addChatMessage("user", message);
      chat.clearChatInput();

      // Add empty assistant message for streaming
      chat.addChatMessage("assistant", "");
      chat.startChatStreaming();

      try {
         for await (const chunk of onSend(message)) {
            if (chunk.text) {
               chat.appendToLastAssistantMessage(chunk.text);
            }
            if (chunk.done) {
               chat.stopChatStreaming();
            }
         }
      } catch (error) {
         console.error("[ChatSidebar] Send failed:", error);
         chat.setChatError(
            error instanceof Error ? error : new Error("Send failed"),
         );
      }
   }, [chatState.currentInput, onSend, chat]);

   /**
    * Handle key press in input
    */
   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
         e.preventDefault();
         handleSend();
      }
   };

   /**
    * Handle form submit
    */
   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      handleSend();
   };

   /**
    * Handle close
    */
   const handleClose = () => {
      chat.closeChat();
      onClose?.();
   };

   if (!isOpen) {
      return null;
   }

   return (
      <div
         className={cn(
            "fixed top-0 right-0 h-full z-50",
            "bg-background border-l border-border shadow-xl",
            "flex flex-col",
            "animate-in slide-in-from-right",
            className,
         )}
         style={{ width }}
      >
         {/* Header */}
         <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-primary" />
               <span className="font-semibold">Assistente AI</span>
            </div>

            <button
               className="p-1.5 rounded hover:bg-accent"
               onClick={handleClose}
               type="button"
            >
               <X className="h-5 w-5" />
            </button>
         </div>

         {/* Messages */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatState.messages.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">
                     Inicie uma conversa com o assistente
                  </p>
                  <p className="text-xs mt-1 opacity-75">
                     Peça para editar, melhorar ou criar conteúdo
                  </p>
               </div>
            )}

            {chatState.messages.map((message) => (
               <ChatMessage key={message.id} message={message} />
            ))}

            <div ref={messagesEndRef} />
         </div>

         {/* Input */}
         <form className="p-4 border-t border-border" onSubmit={handleSubmit}>
            <div className="flex gap-2">
               <textarea
                  className={cn(
                     "flex-1 px-3 py-2 text-sm rounded-lg resize-none",
                     "bg-muted border-none",
                     "focus:outline-none focus:ring-2 focus:ring-ring",
                     "min-h-[80px] max-h-[200px]",
                  )}
                  disabled={chatState.isStreaming}
                  onChange={(e) => chat.setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  ref={inputRef}
                  value={chatState.currentInput}
               />

               <button
                  className={cn(
                     "self-end px-4 py-2 rounded-lg",
                     "bg-primary text-primary-foreground",
                     "hover:bg-primary/90",
                     "disabled:opacity-50 disabled:cursor-not-allowed",
                     "transition-colors",
                  )}
                  disabled={
                     !chatState.currentInput.trim() || chatState.isStreaming
                  }
                  type="submit"
               >
                  {chatState.isStreaming ? (
                     <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                     <Send className="h-5 w-5" />
                  )}
               </button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
               Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
         </form>
      </div>
   );
}

/**
 * Chat Message Component
 */
function ChatMessage({
   message,
}: {
   message: {
      id: string;
      role: string;
      content: string | Array<{ type: string; text?: string }>;
   };
}): React.JSX.Element {
   const isUser = message.role === "user";

   // Extract text content (handle both string and content parts array)
   const textContent =
      typeof message.content === "string"
         ? message.content
         : message.content
              .filter(
                 (part): part is { type: string; text: string } =>
                    part.type === "text" && typeof part.text === "string",
              )
              .map((part) => part.text)
              .join("");

   return (
      <div
         className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      >
         {/* Avatar */}
         <div
            className={cn(
               "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
               isUser ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
         >
            {isUser ? (
               <span className="text-xs font-medium">Eu</span>
            ) : (
               <Sparkles className="h-4 w-4" />
            )}
         </div>

         {/* Content */}
         <div
            className={cn(
               "flex-1 max-w-[80%] rounded-lg px-4 py-2",
               isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
            )}
         >
            <div className="text-sm whitespace-pre-wrap">{textContent}</div>
         </div>
      </div>
   );
}

/**
 * Chat Toggle Button
 */
export function ChatToggleButton({
   className,
}: {
   className?: string;
}): React.JSX.Element {
   const chat = useChatContext();

   return (
      <button
         className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "transition-colors",
            className,
         )}
         onClick={() => chat.toggleChat()}
         type="button"
      >
         <Sparkles className="h-4 w-4" />
         <span className="text-sm font-medium">Chat AI</span>
         <ChevronRight className="h-4 w-4" />
      </button>
   );
}

/**
 * Chat Keyboard Hints
 */
export function ChatKeyboardHints(): React.JSX.Element {
   return (
      <div className="text-xs text-muted-foreground space-y-1">
         <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+L</kbd>
            <span>Abrir chat</span>
         </div>
         <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd>
            <span>Fechar chat</span>
         </div>
      </div>
   );
}
