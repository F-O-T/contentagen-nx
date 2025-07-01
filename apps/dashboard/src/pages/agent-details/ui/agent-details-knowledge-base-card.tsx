// apps/dashboard/src/pages/agent-details/ui/agent-details-knowledge-base-card.tsx

import React from "react";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Upload, FileText, MoreHorizontal } from "lucide-react";

type UploadedFile = {
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};



interface AgentDetailsKnowledgeBaseCardProps {
  uploadedFiles: UploadedFile[];
  canAddMore: boolean;
  remainingSlots: number;
  deletePending: boolean;
  onSelectClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewFile: (fileName: string, fileUrl: string) => void;
  onDeleteFile: (fileName: string) => void;
  fileInputRef: React.Ref<HTMLInputElement>;
}

export function AgentDetailsKnowledgeBaseCard({
  uploadedFiles,
  canAddMore,
  remainingSlots,
  deletePending,
  onSelectClick,
  onFileChange,
  onViewFile,
  onDeleteFile,
  fileInputRef,
}: AgentDetailsKnowledgeBaseCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Knowledge Base Files</CardTitle>
          <CardDescription>Files that inform your agent's responses</CardDescription>
        </div>
        <div className="flex items-center">
          <Badge variant="outline">{remainingSlots}/3</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {uploadedFiles.length > 0 ? (
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded{" "}
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onViewFile(file.fileName, file.fileUrl)}>
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDeleteFile(file.fileName)} disabled={deletePending}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No files uploaded yet</p>
            <p className="text-sm">
              Upload Markdown files to build your agent's knowledge base
            </p>
          </div>
        )}
      </CardContent>
      {/* Hidden file input for uploads */}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".md"
        multiple
        onChange={onFileChange}
        className="hidden"
      />
      <CardFooter>
        {canAddMore && (
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
            onClick={onSelectClick}
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}