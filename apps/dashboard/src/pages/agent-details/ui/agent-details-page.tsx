import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentDetailsKnowledgeBaseCard } from "./agent-details-knowledge-base-card";
import { AgentPersonaCard } from "./agent-persona-card";
import { FileViewerModal } from "./file-viewer-modal";
import { AgentStatsCard } from "./agent-stats-card";
import useAgentDetails from "../lib/use-agent-details";
import useFileViewer from "../lib/use-file-viewer";
import { Suspense } from "react";

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
