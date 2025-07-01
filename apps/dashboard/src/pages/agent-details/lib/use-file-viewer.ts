// React hook for viewing files, using eden API and toast for errors.

import { useState } from "react";
import { toast } from "sonner";
import { useRouteContext } from "@tanstack/react-router";

export default function useFileViewer() {
   const { eden } = useRouteContext({ from: "/_dashboard/agents/$agentId/" });

   const [isOpen, setIsOpen] = useState(false);
   const [fileName, setFileName] = useState("");
   const [fileContent, setFileContent] = useState("");
   const [isLoading, setIsLoading] = useState(false);

   const open = async (fileName: string, fileUrl: string) => {
      setIsLoading(true);
      setFileName(fileName);
      setIsOpen(true);

      try {
         const urlFileName = fileUrl.split("/").pop() || fileName;
         const response = await eden.api.v1
            .files({ filename: urlFileName })
            .get();
         if (response.error) throw new Error("Failed to fetch file content");
         setFileContent(response.data as unknown as string);
      } catch (error) {
         console.error("Error loading file content:", error);
         toast.error("Failed to load file content");
         setFileContent("Failed to load file content. Please try again.");
      } finally {
         setIsLoading(false);
      }
   };

   const close = () => {
      setIsOpen(false);
      setFileContent("");
      setFileName("");
      setIsLoading(false);
   };

   return {
      isOpen,
      fileName,
      fileContent,
      isLoading,
      open,
      close,
   };
}

