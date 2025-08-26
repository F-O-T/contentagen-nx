import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentDetailsKnowledgeBaseCard } from "./agent-details-knowledge-base-card";
import { AgentPersonaCard } from "./agent-persona-card";
import { FileViewerModal } from "./file-viewer-modal";
import { AgentStatsCard } from "./agent-stats-card";
import useAgentDetails from "../lib/use-agent-details";
import useFileViewer from "../lib/use-file-viewer";
import { Suspense, useMemo } from "react";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { useQueryClient } from "@tanstack/react-query";

export function AgentDetailsPage() {
   const {
      isOpen,
      fileName,
      fileContent,
      isLoading: isFileLoading,
      open,
      close,
   } = useFileViewer();
   const { agent, uploadedFiles, agentId } = useAgentDetails();

   // --- Brand Knowledge Status Subscription ---
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const isRunning = useMemo(
      () =>
         agent &&
         ["pending", "crawling", "analyzing", "chunking"].includes(
            agent.brandKnowledgeStatus,
         ),
      [agent],
   );

   useSubscription(
      trpc.agent.onBrandKnowledgeStatusChanged.subscriptionOptions(
         { agentId },
         {
            async onData(data) {
               if (data.status === "failed") {
                  toast.error(data.message || "Brand knowledge job failed");
                  return;
               }
               if (data.status === "completed") {
                  toast.success(
                     data.message || "Brand knowledge job completed",
                  );
                  return;
               }

               toast.info(data.message || `Status: ${data.status}`);
               await queryClient.invalidateQueries({
                  queryKey: trpc.agent.get.queryKey({ id: agentId }),
               });
            },
            enabled: isRunning,
         },
      ),
   );

   return (
      <Suspense>
         <main className="space-y-4">
            <TalkingMascot message="Manage your agent’s configuration and knowledge base." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="col-span-1 md:col-span-2 space-y-4">
                  <AgentStatsCard />
                  <AgentPersonaCard
                     name={agent?.personaConfig.metadata.name}
                     description={agent?.personaConfig.metadata.description}
                     contentType={agent?.personaConfig.purpose ?? ""}
                     voiceTone={agent?.personaConfig.voice?.communication ?? ""}
                     targetAudience={agent?.personaConfig.audience?.base ?? ""}
                     formattingStyle={
                        agent?.personaConfig.formatting?.style ?? ""
                     }
                     language={agent?.personaConfig.language?.primary ?? ""}
                     brandIntegration={
                        agent?.personaConfig.brand?.integrationStyle ?? ""
                     }
                  />
               </div>
               <div className="col-span-1 ">
                  <AgentDetailsKnowledgeBaseCard
                     uploadedFiles={uploadedFiles}
                     onViewFile={open}
                     agentId={agentId}
                  />
               </div>
            </div>
            <FileViewerModal
               open={isOpen}
               fileName={fileName}
               fileContent={fileContent ?? ""}
               loading={isFileLoading}
               onClose={close}
            />
         </main>
      </Suspense>
   );
}
