import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { cn } from "@packages/ui/lib/utils";
import { BarChart3, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UpgradePrompt } from "@/features/upgrade/ui/upgrade-prompt";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";
import {
   type ActivePlan,
   type ContentMetadata,
   type PlanStep,
   setChatMode,
   setContentMetadata,
   useChatState,
} from "../context/chat-context";
import { useChatSession } from "../hooks/use-chat-session";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { ChatSelectionContext } from "./chat-selection-context";
import { MetadataPanel } from "./metadata-panel";

interface ChatSidebarProps {
   contentId: string;
   contentMeta?: ContentMetadata;
   className?: string;
   fullPage?: boolean;
   onAgentComplete?: () => void;
   onSkipPlan?: () => void;
}

export function ChatSidebar({
   contentId,
   contentMeta,
   className,
   fullPage = false,
   onAgentComplete,
   onSkipPlan,
}: ChatSidebarProps) {
   const [activeTab, setActiveTab] = useState<"chat" | "metadata">("chat");
   const { hasFeature } = useFeatureAccess();
   const hasChatFeature = hasFeature(Feature.CHAT);
   const hasPlanModeFeature = hasFeature(Feature.CHAT_PLAN_MODE);

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

   // Force writer mode for users without plan mode feature
   useEffect(() => {
      if (hasChatFeature && !hasPlanModeFeature && mode === "plan") {
         setChatMode("writer");
      }
   }, [hasChatFeature, hasPlanModeFeature, mode]);

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

   // If in full-page mode without feature, return null (user shouldn't reach this)
   if (!hasChatFeature && fullPage) {
      return null;
   }

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
                  <h1 className="text-xl font-semibold">
                     Planeje Seu Conteúdo
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Descreva o que você quer escrever e a IA ajudará a planejar
                  </p>
               </div>
            </div>
         )}

         {/* Full-page mode content (no tabs) */}
         {fullPage && (
            <>
               {/* Execution progress bar */}
               {executionState.isExecuting && (
                  <div className="px-3 py-2 border-b bg-primary/5">
                     <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-primary font-medium">
                           Executando plano...
                        </span>
                        <span className="text-muted-foreground">
                           {executionState.completedSteps}/
                           {executionState.totalSteps} etapas
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
               <div className="shrink-0 border-t p-6">
                  <ChatInput
                     disabled={!sessionId || isSessionLoading}
                     isLoading={isStreaming}
                     onCancel={cancelChat}
                     onSend={handleSend}
                     onSkipPlan={fullPage ? onSkipPlan : undefined}
                     placeholder={
                        isSessionLoading
                           ? "Carregando sessão de chat..."
                           : !sessionId
                             ? "Não foi possível carregar a sessão"
                             : mode === "plan"
                               ? "O que você gostaria de planejar?"
                               : "O que devo escrever ou editar?"
                     }
                  />
               </div>
            </>
         )}

         {/* Sidebar mode with tabs */}
         {!fullPage && (
            <Tabs
               className="flex flex-col h-full"
               onValueChange={(value) =>
                  setActiveTab(value as "chat" | "metadata")
               }
               value={activeTab}
            >
               {/* Tab header */}
               <div className="shrink-0 border-b">
                  <TabsList className="w-full h-10 rounded-none bg-transparent p-0">
                     <TabsTrigger
                        className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        value="chat"
                     >
                        <MessageSquare className="size-3.5 mr-1.5" />
                        Chat
                        {/* Compact mode indicator - only show for users with chat access */}
                        {hasChatFeature && (
                           <span
                              className={cn(
                                 "ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium",
                                 mode === "plan"
                                    ? "bg-blue-500/10 text-blue-600"
                                    : "bg-green-500/10 text-green-600",
                              )}
                           >
                              {mode === "plan" ? "Plan" : "Writer"}
                           </span>
                        )}
                     </TabsTrigger>
                     <TabsTrigger
                        className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        value="metadata"
                     >
                        <BarChart3 className="size-3.5 mr-1.5" />
                        Metadados
                     </TabsTrigger>
                  </TabsList>
               </div>

               {/* Chat tab content */}
               <TabsContent
                  className="flex-1 flex flex-col m-0 min-h-0 data-[state=inactive]:hidden"
                  value="chat"
               >
                  {/* Show upgrade prompt for FREE users */}
                  {!hasChatFeature ? (
                     <div className="flex-1 flex items-center justify-center p-4">
                        <UpgradePrompt
                           description="Use o chat para planejar e escrever conteúdo com ajuda da IA."
                           feature={Feature.CHAT}
                           title="Chat com IA"
                        />
                     </div>
                  ) : (
                     <>
                        {/* Execution progress bar */}
                        {executionState.isExecuting && (
                           <div className="px-3 py-2 border-b bg-primary/5">
                              <div className="flex items-center justify-between text-xs mb-1">
                                 <span className="text-primary font-medium">
                                    Executando plano...
                                 </span>
                                 <span className="text-muted-foreground">
                                    {executionState.completedSteps}/
                                    {executionState.totalSteps} etapas
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
                        <div className="shrink-0 border-t p-3">
                           <ChatInput
                              disabled={!sessionId || isSessionLoading}
                              isLoading={isStreaming}
                              onCancel={cancelChat}
                              onSend={handleSend}
                              placeholder={
                                 isSessionLoading
                                    ? "Carregando sessão de chat..."
                                    : !sessionId
                                      ? "Não foi possível carregar a sessão"
                                      : mode === "plan"
                                        ? "O que você gostaria de planejar?"
                                        : "O que devo escrever ou editar?"
                              }
                           />
                        </div>
                     </>
                  )}
               </TabsContent>

               {/* Metadata tab content */}
               <TabsContent
                  className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden"
                  value="metadata"
               >
                  <MetadataPanel
                     className="h-full"
                     contentMeta={contentMeta}
                     documentContent={documentContent}
                     isActive={activeTab === "metadata"}
                  />
               </TabsContent>
            </Tabs>
         )}
      </div>
   );
}
