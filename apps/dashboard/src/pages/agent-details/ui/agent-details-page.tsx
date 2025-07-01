import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Loader2 } from "lucide-react";
import { AgentDetailsKnowledgeBaseCard } from "./agent-details-knowledge-base-card";
import { AgentDetailsPromptCard } from "./agent-details-prompt-card";
import { AgentPersonaCard } from "./agent-persona-card";
import { FileViewerModal } from "./file-viewer-modal";
import { AgentStatsCard } from "./agent-stats-card";
import useAgentDetails from "../lib/use-agent-details";
import useFileViewer from "../lib/use-file-viewer";

export function AgentDetailsPage() {
   const {
      isOpen,
      fileName,
      fileContent,
      isLoading: isFileLoading,
      open,
      close,
   } = useFileViewer();
   const {
      agent,
      isLoading,
      uploadedFiles,
   } = useAgentDetails();

   if (isLoading) {
      return (
         <main className="h-full w-full flex flex-col gap-6 p-6">
            <div className="flex items-center justify-center h-64">
               <Loader2 className="w-8 h-8 animate-spin" />
            </div>
         </main>
      );
   }

   if (!agent) {
      return (
         <main className="h-full w-full flex flex-col gap-6 p-6">
            <Alert variant="destructive">
               <AlertTitle>Agent not found</AlertTitle>
               <AlertDescription>
                  The requested agent could not be found.
               </AlertDescription>
            </Alert>
         </main>
      );
   }

   return (
      <main className="h-full w-full flex flex-col gap-4 ">
         <TalkingMascot message="Manage your agent’s configuration and knowledge base." />

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4 md:col-span-1">
               <AgentStatsCard
                  totalDrafts={agent.totalDrafts ?? 0}
                  totalPublished={agent.totalPublished ?? 0}
               />
               <AgentDetailsKnowledgeBaseCard
                  uploadedFiles={uploadedFiles}
                  onViewFile={open}
               />
               <AgentPersonaCard
                  name={agent.name}
                  description={agent.description ?? ""}
                  contentType={agent.contentType ?? ""}
                  voiceTone={agent.voiceTone ?? ""}
                  targetAudience={agent.targetAudience ?? ""}
                  formattingStyle={agent.formattingStyle ?? ""}
               />
            </div>
            <div className="md:col-span-2">
               <AgentDetailsPromptCard basePrompt={agent.basePrompt ?? ""} />
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
   );
}
