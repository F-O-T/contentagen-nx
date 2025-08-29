import { useState } from "react";
import { useTRPC } from "@/integrations/clients";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { FileText, Loader2 } from "lucide-react";
import { Markdown } from "@packages/ui/components/markdown";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";

export function FileViewerModal() {
   const trpc = useTRPC();
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const [isOpen, setIsOpen] = useState(false);
   const [fileName, setFileName] = useState("");

   const { data, isLoading } = useQuery({
      ...trpc.agentFile.getFileContent.queryOptions({
         agentId: agentId,
         fileName,
      }),
      enabled: isOpen && fileName !== "",
   });

   const open = (fileName: string) => {
      setFileName(fileName);
      setIsOpen(true);
   };

   const close = () => {
      setIsOpen(false);
      setFileName("");
   };

   return {
      isOpen,
      fileName,
      fileContent: data?.content,
      isLoading,
      open,
      close,
      Modal: () => (
         <Credenza open={isOpen} onOpenChange={close}>
            <CredenzaContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
               <CredenzaHeader>
                  <CredenzaTitle className="flex items-center gap-2">
                     <FileText className="w-5 h-5" />
                     {fileName}
                  </CredenzaTitle>
                  <CredenzaDescription>
                     View the content of the selected file.
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaBody className="flex-1 flex flex-col">
                  {isLoading ? (
                     <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="ml-2 text-muted-foreground">
                           Loading content...
                        </span>
                     </div>
                  ) : (
                     <div className="h-80">
                        <Markdown content={data?.content ?? ""} />
                     </div>
                  )}
               </CredenzaBody>
            </CredenzaContent>
         </Credenza>
      ),
   };
}
