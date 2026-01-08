import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { ListChecks, Pencil, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import {
   type ActivePlan,
   type ContentMetadata,
   type PlanStep,
   setContentMetadata,
   startNewPlan,
   useChatState,
} from "../context/chat-context";
import { useChatSession } from "../hooks/use-chat-session";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { ChatModeSelect } from "./chat-mode-select";
import { ChatSelectionContext } from "./chat-selection-context";

interface ChatSidebarProps {
   contentId: string;
   contentMeta?: ContentMetadata;
   className?: string;
   fullPage?: boolean;
   onAgentComplete?: () => void;
}

export function ChatSidebar({
   contentId,
   contentMeta,
   className,
   fullPage = false,
   onAgentComplete,
}: ChatSidebarProps) {
   const {
      selectionContext,
      documentContent,
      activeToolCalls,
      mode,
      executionState,
   } = useChatState();

   // Track last metadata to prevent unnecessary updates
   const lastMetaRef = useRef<string | null>(null);

   const {
      messages,
      currentStreamingMessage,
      streamingSteps,
      isStreaming,
      isSessionLoading,
      sendMessage,
      cancelChat,
      sessionId,
   } = useChatSession(contentId, { onAgentComplete });

   // Update content metadata when prop changes (using stable comparison)
   useEffect(() => {
      if (contentMeta) {
         const metaKey = JSON.stringify(contentMeta);
         if (metaKey !== lastMetaRef.current) {
            lastMetaRef.current = metaKey;
            setContentMetadata(contentMeta);
         }
      }
   }, [contentMeta]);

   const handleSend = (content: string) => {
      // Pass document content with the message
      sendMessage(content, documentContent);
   };

   const handleExecutePlan = (
      _approvedSteps: PlanStep[],
      executionPrompt: string,
      planContext: ActivePlan,
   ) => {
      // Send the execution prompt to the agent in writer mode with plan context
      sendMessage(executionPrompt, documentContent, planContext);
   };

   const handleNewPlan = () => {
      startNewPlan();
   };

   return (
      <div
         className={cn(
            "flex h-full flex-col bg-background overflow-hidden",
            fullPage ? "w-full max-w-3xl mx-auto" : "w-4/12 shrink-0 border-l",
            className,
         )}
      >
         {/* Header for full-page mode */}
         {fullPage && (
            <div className="flex items-center justify-center py-6 border-b">
               <div className="text-center">
                  <h1 className="text-xl font-semibold">Plan Your Content</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Describe what you want to write and the AI will help you
                     plan it
                  </p>
               </div>
            </div>
         )}

         {/* Header for sidebar mode - shows mode indicator and actions */}
         {!fullPage && (
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
               <div className="flex items-center gap-2">
                  {/* Mode indicator */}
                  <div
                     className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                        mode === "plan"
                           ? "bg-blue-500/10 text-blue-600"
                           : "bg-green-500/10 text-green-600",
                     )}
                  >
                     {mode === "plan" ? (
                        <>
                           <ListChecks className="size-3.5" />
                           <span>Plan Mode</span>
                        </>
                     ) : (
                        <>
                           <Pencil className="size-3.5" />
                           <span>Writer Mode</span>
                        </>
                     )}
                  </div>
                  <ChatModeSelect />
               </div>

               {/* New Plan button - shows in writer mode */}
               {mode === "writer" && (
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           className="h-7 text-xs gap-1.5"
                           disabled={isStreaming}
                           onClick={handleNewPlan}
                           size="sm"
                           variant="ghost"
                        >
                           <RotateCcw className="size-3.5" />
                           New Plan
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">
                        <p>Start a new content plan</p>
                     </TooltipContent>
                  </Tooltip>
               )}
            </div>
         )}

         {/* Execution progress bar */}
         {executionState.isExecuting && (
            <div className="px-3 py-2 border-b bg-primary/5">
               <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-primary font-medium">
                     Executing plan...
                  </span>
                  <span className="text-muted-foreground">
                     {executionState.completedSteps}/{executionState.totalSteps}{" "}
                     steps
                  </span>
               </div>
               <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <div
                     className="h-full bg-primary rounded-full transition-all duration-300"
                     style={{
                        width: `${
                           executionState.totalSteps > 0
                              ? (
                                   executionState.completedSteps /
                                      executionState.totalSteps
                                ) * 100
                              : 0
                        }%`,
                     }}
                  />
               </div>
            </div>
         )}

         {/* Messages */}
         <ScrollArea className="flex-1 min-h-0">
            <ChatMessageList
               activeToolCalls={activeToolCalls}
               isStreaming={isStreaming}
               messages={messages}
               onExecutePlan={handleExecutePlan}
               streamingContent={currentStreamingMessage}
               streamingSteps={streamingSteps}
            />
         </ScrollArea>

         {/* Selection Context */}
         {selectionContext && (
            <ChatSelectionContext context={selectionContext} />
         )}

         {/* Input Area */}
         <div className={cn("shrink-0 border-t", fullPage ? "p-6" : "p-3")}>
            <ChatInput
               disabled={!sessionId || isSessionLoading}
               isLoading={isStreaming}
               onCancel={cancelChat}
               onSend={handleSend}
               placeholder={
                  isSessionLoading
                     ? "Loading chat session..."
                     : !sessionId
                       ? "Unable to load chat session"
                       : mode === "plan"
                         ? "What would you like to plan?"
                         : "What should I write or edit?"
               }
            />
         </div>
      </div>
   );
}
