import { useState } from "react";
import { useTRPC } from "@/integrations/clients";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

export default function useFileViewer() {
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

   const open = (fileName: string) => {
      setFileName(fileName);
      setIsOpen(true);
      // refetch will be triggered by useQuery's enabled
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
   };
}
