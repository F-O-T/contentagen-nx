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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
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
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  return (
    <Suspense>
      <main className="space-y-4">
        <TalkingMascot message="Manage your agent’s configuration and knowledge base." />{" "}
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
            <AgentDetailsContentRequestsCard />
            <AgentDetailsKnowledgeChunksCard />
            <AgentDetailsPromptCard basePrompt={agent?.basePrompt ?? ""} />
          </div>
        </div>{" "}
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
