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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@packages/ui/components/tabs";
import { Button } from "@packages/ui/components/button";
import { Card } from "@packages/ui/components/card";
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
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Suspense>
      <main className="space-y-4">
        <TalkingMascot
          message={
            activeTab === "general"
              ? "Manage your agent’s configuration and knowledge base."
              : activeTab === "content"
                ? "View and manage content requests for this agent."
                : activeTab === "knowledge"
                  ? "Review and edit the agent’s knowledge chunks."
                  : activeTab === "prompt"
                    ? "Edit or regenerate the agent’s system prompt."
                    : "Manage your agent’s configuration and knowledge base."
          }
        />{" "}
        <Tabs
          defaultValue={activeTab}
          className="w-full flex-1"
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content">Content Requests</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Chunks</TabsTrigger>
            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
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
                  agentId={agentId}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="content">
            <AgentDetailsContentRequestsCard />
          </TabsContent>
          <TabsContent value="knowledge">
            <AgentDetailsKnowledgeChunksCard />
          </TabsContent>
          <TabsContent value="prompt">
            <AgentDetailsPromptCard basePrompt={agent?.basePrompt ?? ""} />
          </TabsContent>
        </Tabs>
        {/* Toolbar Card BELOW Tabs */}
        <Card className="mb-4">
          <div className="flex items-center justify-between px-6 py-2">
            <div className="font-semibold text-lg">Agent Details</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit Agent
              </Button>
              <Button variant="destructive" size="sm">
                Delete Agent
              </Button>
              {activeTab === "prompt" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPromptDialog(true)}
                  >
                    Edit System Prompt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRegenerateDialog(true)}
                  >
                    Regenerate Prompt
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBrandDialog(true)}
              >
                Extract Brand Info
              </Button>
            </div>
          </div>
        </Card>{" "}
        <FileViewerModal
          open={isOpen}
          fileName={fileName}
          fileContent={fileContent}
          loading={isFileLoading}
          onClose={close}
        />
        {/* Edit System Prompt Dialog */}
        <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit System Prompt</DialogTitle>
            </DialogHeader>
            {/* TODO: Add prompt editing form here */}
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowPromptDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowPromptDialog(false)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Regenerate Prompt Dialog */}
        <Dialog
          open={showRegenerateDialog}
          onOpenChange={setShowRegenerateDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerate System Prompt</DialogTitle>
            </DialogHeader>
            <div>
              Are you sure you want to reset the system prompt to the default
              based on the persona config?
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowRegenerateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRegenerateDialog(false)}
              >
                Regenerate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Extract Brand Info Dialog */}
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
              <Button onClick={() => setShowBrandDialog(false)}>Extract</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </Suspense>
  );
}
