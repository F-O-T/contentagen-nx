import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";

interface ExportContentDropdownProps {
   generatedContent?: {
      body: string;
   } | null;
   isExporting: boolean;
   onExport: (format: "html" | "markdown" | "mdx") => void;
}

export function ExportContentDropdown({
   generatedContent,
   isExporting,
   onExport,
}: ExportContentDropdownProps) {
   const handleCopyContent = () => {
      if (generatedContent?.body) {
         navigator.clipboard.writeText(generatedContent.body);
         toast.success("Content copied to clipboard");
      }
   };

   if (!generatedContent) {
      return null;
   }

   return (
      <div className="flex items-center gap-2">
         <Button
            size="sm"
            variant="outline"
            onClick={handleCopyContent}
         >
            <Copy className="h-4 w-4 mr-2" />
            Copy
         </Button>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button size="sm" variant="outline" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
               <DropdownMenuItem onClick={() => onExport("markdown")}>
                  Export as Markdown
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onExport("mdx")}>
                  Export as MDX
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onExport("html")}>
                  Export as HTML
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
