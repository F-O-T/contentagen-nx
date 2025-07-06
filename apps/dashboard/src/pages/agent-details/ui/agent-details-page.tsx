import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { AgentDetailsKnowledgeBaseCard } from "./agent-details-knowledge-base-card";
import { AgentDetailsPromptCard } from "./agent-details-prompt-card";
import { AgentPersonaCard } from "./agent-persona-card";
import { FileViewerModal } from "./file-viewer-modal";
import { AgentStatsCard } from "./agent-stats-card";
import useAgentDetails from "../lib/use-agent-details";
import useFileViewer from "../lib/use-file-viewer";
import { AgentDetailsKnowledgeChunksCard } from "./agent-details-knowledge-chunks-card";
import { AgentDetailsContentRequestsCard } from "./agent-details-content-requests-card";
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
   const { agent, uploadedFiles } = useAgentDetails();

   return (
      <Suspense>
         <main className="space-y-4">
            <TalkingMascot message="Manage your agent’s configuration and knowledge base." />
            <div className="grid grid-cols-5 gap-4">
               <div className="col-span-5">
                  <AgentDetailsContentRequestsCard />
               </div>
               <div className="col-span-5 md:col-span-2 space-y-4 ">
                  <AgentStatsCard
                     totalDrafts={agent?.totalDrafts ?? 0}
                     totalPublished={agent?.totalPublished ?? 0}
                  />
                  <AgentPersonaCard
                     name={agent?.name ?? ""}
                     description={agent?.description ?? ""}
                     contentType={agent?.contentType ?? ""}
                     voiceTone={agent?.voiceTone ?? ""}
                     targetAudience={agent?.targetAudience ?? ""}
                     formattingStyle={agent?.formattingStyle ?? ""}
                     language={agent?.language ?? ""}
                     brandIntegration={agent?.brandIntegration ?? ""}
                  />
                  <AgentDetailsKnowledgeBaseCard
                     uploadedFiles={uploadedFiles}
                     onViewFile={open}
                  />
                  <AgentDetailsKnowledgeChunksCard />
               </div>

               <div className="col-span-5 md:col-span-3">
                  <AgentDetailsPromptCard
                     basePrompt={agent?.basePrompt ?? ""}
                  />
               </div>
            </div>

            <FileViewerModal
               open={isOpen}
               fileName={fileName}
               fileContent={fileContent}
               loading={isFileLoading}
               onClose={close}
            />
         </main>
      </Suspense>
   );
}
