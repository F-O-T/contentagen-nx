// FileViewerModal.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import { FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FileViewerModalProps {
  open: boolean;
  fileName: string;
  fileContent: string;
  loading: boolean;
  onClose: () => void;
}

export function FileViewerModal({
  open,
  fileName,
  fileContent,
  loading,
  onClose,
}: FileViewerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {fileName}
          </DialogTitle>
          <DialogDescription>
            Markdown file content preview
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg p-4 bg-card">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-muted-foreground">
                Loading content...
              </span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{fileContent}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}