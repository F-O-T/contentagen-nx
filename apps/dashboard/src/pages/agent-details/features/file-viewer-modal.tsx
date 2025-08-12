import { Button } from "@packages/ui/components/button";
import { FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { useTRPC } from "@/integrations/clients";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";

export function FileViewerCredenza({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const trpc = useTRPC();
   const { agentId } = useParams({ from: "/_dashboard/agents/$agentId/" });
   const [isOpen, setIsOpen] = useState(false);
   const [fileName, setFileName] = useState("");

   const { data, isLoading } = useQuery({
      ...trpc.agentFile.getFileContent.queryOptions({
         agentId: agentId, // fallback to avoid undefined
         fileName,
      }),
      enabled: isOpen && fileName !== "",
   });

   const openFile = useCallback((fileName: string) => {
      setFileName(fileName);
      setIsOpen(true);
      // refetch will be triggered by useQuery's enabled
   }, []);

   const closeFile = useCallback(() => {
      setIsOpen(false);
      setFileName("");
   }, []);

   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
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
               {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                     <Loader2 className="w-6 h-6 animate-spin" />
                     <span className="ml-2 text-muted-foreground">
                        Loading content...
                     </span>
                  </div>
               ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                     <ReactMarkdown>{data?.content}</ReactMarkdown>
                  </div>
               )}
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
