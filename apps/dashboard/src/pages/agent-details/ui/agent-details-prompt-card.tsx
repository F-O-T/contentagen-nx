// apps/dashboard/src/pages/agent-details/ui/agent-details-prompt-card.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@packages/ui/components/card";

interface AgentDetailsPromptCardProps {
  basePrompt: string;
}

export function AgentDetailsPromptCard({ basePrompt }: AgentDetailsPromptCardProps) {
  const [draft, setDraft] = useState(basePrompt);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="flex justify-between items-start">
        <div>
          <CardTitle>Agent Base Prompt</CardTitle>
          <CardDescription>
            Core configuration and behavior instructions
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsModalOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setExpanded((v) => !v)}>
              See More
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`${expanded ? "" : "max-h-96 overflow-y-auto"} border rounded-lg p-4 bg-muted/30 transition-all`}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{draft || "No base prompt configured"}</ReactMarkdown>
          </div>
        </div>
      </CardContent>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Base Prompt</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded p-2"
            rows={10}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(false)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}