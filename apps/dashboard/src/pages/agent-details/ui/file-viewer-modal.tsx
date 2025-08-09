// FileViewerModal.tsx
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Button } from "@packages/ui/components/button";
import { FileText, Loader2 } from "lucide-react";
import { Markdown } from "@packages/ui/components/markdown";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
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
      <Credenza open={open} onOpenChange={onClose}>
         <CredenzaContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <CredenzaHeader>
               <CredenzaTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {fileName}
               </CredenzaTitle>
               <CredenzaDescription>
                  Markdown file content preview
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="flex-1 flex flex-col">
               {loading ? (
                  <div className="flex items-center justify-center h-32">
                     <Loader2 className="w-6 h-6 animate-spin" />
                     <span className="ml-2 text-muted-foreground">
                        Loading content...
                     </span>
                  </div>
               ) : (
                  <div className="h-90">
                     <ScrollArea className=" h-full">
                        <Markdown content={fileContent} />
                     </ScrollArea>
                  </div>
               )}
            </CredenzaBody>

            <CredenzaFooter>
               <Button variant="outline" onClick={onClose}>
                  Close
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}
