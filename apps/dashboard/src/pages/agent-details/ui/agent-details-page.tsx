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
import { Suspense, useState } from "react";

import { Button } from "@packages/ui/components/button";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
} from "@packages/ui/components/dialog";

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

   // Dialog state
   const [showBrandDialog, setShowBrandDialog] = useState(false);

   return (
      <Suspense>
         <main className="space-y-4">
            <TalkingMascot message="Manage your agent’s configuration and knowledge base." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="col-span-1 space-y-4">
                  <AgentStatsCard
                     totalDrafts={agent?.totalDrafts ?? 0}
                     totalPublished={agent?.totalPublished ?? 0}
                  />
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
               <div className="col-span-1 md:col-span-2 ">
                  <AgentDetailsContentRequestsCard />
               </div>
               <div className="col-span-1 md:col-span-2">
                  <AgentDetailsKnowledgeChunksCard />
               </div>
               <div className="col-span-1 ">
                  <AgentDetailsKnowledgeBaseCard
                     uploadedFiles={uploadedFiles}
                     onViewFile={open}
                     agentId={agentId}
                  />
               </div>
               <div className="col-span-1 md:col-span-3">
                  <AgentDetailsPromptCard basePrompt={agent?.systemPrompt} />
               </div>
            </div>
            <FileViewerModal
               open={isOpen}
               fileName={fileName}
               fileContent={fileContent ?? ""}
               loading={isFileLoading}
               onClose={close}
            />
            <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Extract Brand Information</DialogTitle>
                  </DialogHeader>
                  {/* TODO: Add website URL input and extraction logic here */}
                  <DialogFooter>
                     <Button
                        variant="secondary"
                        onClick={() => setShowBrandDialog(false)}
                     >
                        Cancel
                     </Button>
                     <Button onClick={() => setShowBrandDialog(false)}>
                        Extract
                     </Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
         </main>
      </Suspense>
   );
}
