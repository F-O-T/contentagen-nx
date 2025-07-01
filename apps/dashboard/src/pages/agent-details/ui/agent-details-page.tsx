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

interface SelectedFile {
   file: File;
   id: string;
}

export function AgentDetailsPage() {
   const {
      agent,
      isLoading,
      uploadedFiles,
      selectedFiles,
      setSelectedFiles,
      isViewerOpen,
      setIsViewerOpen,
      viewingFileContent,
      setViewingFileContent,
      viewingFileName,
      setViewingFileName,
      isLoadingContent,
      setIsLoadingContent,
      fileInputRef,
      handleFileSelect,
      handleButtonClick,
      handleViewFile,
      handleDeleteFile,
      handleCloseViewer,
      canAddMore,
      remainingSlots,
      totalUploadedFiles,
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
      <main className="h-full w-full flex flex-col gap-6 p-6">
         <TalkingMascot message="Manage your agent’s configuration and knowledge base." />

         <div className=" w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-6 md:col-span-1">
                  <AgentStatsCard
                     totalDrafts={agent.totalDrafts ?? 0}
                     totalPublished={agent.totalPublished ?? 0}
                  />
                  <AgentDetailsKnowledgeBaseCard
                     uploadedFiles={uploadedFiles}
                     canAddMore={canAddMore}
                     remainingSlots={remainingSlots}
                     onDeleteFile={handleDeleteFile}
                     fileInputRef={fileInputRef}
                     onSelectClick={handleButtonClick}
                     onFileChange={handleFileSelect}
                     onViewFile={handleViewFile}
                     deletePending={false}
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
         </div>

         <FileViewerModal
            open={isViewerOpen}
            fileName={viewingFileName}
            fileContent={viewingFileContent}
            loading={isLoadingContent}
            onClose={handleCloseViewer}
         />
      </main>
   );
}
