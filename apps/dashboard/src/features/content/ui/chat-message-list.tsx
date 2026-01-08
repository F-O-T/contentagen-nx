import { LogoIcon } from "@packages/ui/blocks/logo";
import { Play } from "lucide-react";
import { useEffect, useRef } from "react";
import type {
   ActivePlan,
   ChatMessage as ChatMessageType,
   PlanStep,
   StreamingStep,
   ToolCall,
} from "../context/chat-context";
import { ChatEditSuggestion } from "./chat-edit-suggestion";
import { ChatMessage } from "./chat-message";
import { ChatPlanMessage } from "./chat-plan-message";
import { ChatToolCallList } from "./chat-tool-call";

interface ChatMessageListProps {
   messages: ChatMessageType[];
   streamingContent: string;
   isStreaming: boolean;
   activeToolCalls?: ToolCall[];
   streamingSteps?: StreamingStep[];
   onAcceptEdit?: (
      suggestion: NonNullable<ChatMessageType["editSuggestion"]>,
   ) => void;
   onExecutePlan?: (
      approvedSteps: PlanStep[],
      executionPrompt: string,
      planContext: ActivePlan,
   ) => void;
}

/**
 * Execution separator - visual divider when plan execution starts
 */
function ExecutionSeparator({ message }: { message: ChatMessageType }) {
   return (
      <div className="py-4">
         <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
               <Play className="size-3.5 text-primary" />
               <span className="text-xs font-medium text-primary">
                  Executing Plan
               </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
         </div>
         {message.content && (
            <p className="text-center text-xs text-muted-foreground mt-2">
               {message.content}
            </p>
         )}
      </div>
   );
}

function ChatMessageItem({
   message,
   onAcceptEdit,
   onExecutePlan,
}: {
   message: ChatMessageType;
   onAcceptEdit?: (
      suggestion: NonNullable<ChatMessageType["editSuggestion"]>,
   ) => void;
   onExecutePlan?: (
      approvedSteps: PlanStep[],
      executionPrompt: string,
      planContext: ActivePlan,
   ) => void;
}) {
   if (message.type === "execution-separator") {
      return <ExecutionSeparator message={message} />;
   }
   if (message.type === "plan") {
      return (
         <ChatPlanMessage message={message} onExecutePlan={onExecutePlan} />
      );
   }
   if (message.type === "edit-suggestion") {
      return <ChatEditSuggestion message={message} onAccept={onAcceptEdit} />;
   }
   return (
      <>
         <ChatMessage message={message} />
         {/* Show tool calls below the message if present (from history) */}
         {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="py-2 ml-10">
               <ChatToolCallList toolCalls={message.toolCalls} />
            </div>
         )}
      </>
   );
}

export function ChatMessageList({
   messages,
   streamingContent,
   isStreaming,
   activeToolCalls,
   streamingSteps,
   onAcceptEdit,
   onExecutePlan,
}: ChatMessageListProps) {
   const scrollRef = useRef<HTMLDivElement>(null);
   const bottomRef = useRef<HTMLDivElement>(null);

   // Auto-scroll to bottom when new messages arrive or during streaming
   useEffect(() => {
      if (bottomRef.current) {
         bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
   }, []);

   if (messages.length === 0 && !isStreaming) {
      return (
         <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
               <LogoIcon className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
               Start a conversation
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-[200px]">
               Ask questions about your content, get suggestions, or discuss
               ideas.
            </p>
         </div>
      );
   }

   return (
      <div
         className="flex flex-col px-3 overflow-x-hidden min-h-full"
         ref={scrollRef}
      >
         {messages.map((message) => (
            <ChatMessageItem
               key={message.id}
               message={message}
               onAcceptEdit={onAcceptEdit}
               onExecutePlan={onExecutePlan}
            />
         ))}

         {/* Streaming steps - each step is a separate message with tool calls */}
         {isStreaming &&
            streamingSteps &&
            streamingSteps.map((step) => (
               <div key={step.id}>
                  {/* Step content as a message */}
                  {step.content && (
                     <ChatMessage
                        isStreaming={
                           !step.isComplete && step.toolCalls.length === 0
                        }
                        message={{
                           id: step.id,
                           role: "assistant",
                           content: step.content,
                           timestamp: Date.now(),
                        }}
                     />
                  )}
                  {/* Tool calls for this step */}
                  {step.toolCalls.length > 0 && (
                     <div className="py-2 ml-10">
                        <ChatToolCallList toolCalls={step.toolCalls} />
                     </div>
                  )}
               </div>
            ))}

         {/* Fallback: Legacy streaming message (when no steps yet) */}
         {isStreaming &&
            (!streamingSteps || streamingSteps.length === 0) &&
            streamingContent && (
               <ChatMessage
                  isStreaming
                  message={{
                     id: "streaming",
                     role: "assistant",
                     content: streamingContent,
                     timestamp: Date.now(),
                  }}
               />
            )}

         {/* Legacy: Active tool calls without steps */}
         {isStreaming &&
            (!streamingSteps || streamingSteps.length === 0) &&
            activeToolCalls &&
            activeToolCalls.length > 0 && (
               <div className="py-2">
                  <ChatToolCallList toolCalls={activeToolCalls} />
               </div>
            )}

         {/* Invisible element for auto-scroll */}
         <div ref={bottomRef} />
      </div>
   );
}
