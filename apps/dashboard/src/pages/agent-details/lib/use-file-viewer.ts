// React hook for viewing files, using TRPC API and toast for errors.

import { useState } from "react";
import { toast } from "sonner";

export default function useFileViewer() {
   const [isOpen, setIsOpen] = useState(false);
   const [fileName, setFileName] = useState("");
   const [fileContent, setFileContent] = useState("");
   const [isLoading, setIsLoading] = useState(false);

   const open = async (fileName: string, fileUrl: string) => {
      setIsLoading(true);
      setFileName(fileName);
      setIsOpen(true);

      try {
         // TODO: Replace with actual TRPC endpoint for file viewing
         // For now, we'll show a placeholder message
         setFileContent("File viewing is temporarily unavailable. Feature being migrated to TRPC.");
         console.log("Would view file:", fileName, "from URL:", fileUrl);
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
