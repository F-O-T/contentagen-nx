import { Badge } from "@packages/ui/components/badge";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Plus, Minus, FileText } from "lucide-react";

interface LineDiffItem {
   type: "add" | "remove" | "context";
   lineNumber?: number;
   content: string;
}

interface EnhancedDiffRendererProps {
   lineDiff: LineDiffItem[];
   changedFields?: string[];
}

export function EnhancedDiffRenderer({
   lineDiff,
   changedFields = [],
}: EnhancedDiffRendererProps) {
   if (!lineDiff || !Array.isArray(lineDiff) || lineDiff.length === 0) {
      return (
         <div className="text-muted-foreground text-sm p-4">
            No diff available
         </div>
      );
   }

   const getLineClassName = (type: string) => {
      switch (type) {
         case "add":
            return "bg-green-50 border-l-4 border-green-500 text-green-800";
         case "remove":
            return "bg-red-50 border-l-4 border-red-500 text-red-800";
         case "context":
         default:
            return "text-muted-foreground bg-muted/20";
      }
   };

   const getPrefix = (type: string) => {
      switch (type) {
         case "add":
            return <Plus className="h-3 w-3 text-green-600" />;
         case "remove":
            return <Minus className="h-3 w-3 text-red-600" />;
         case "context":
         default:
            return <span className="w-3" />;
      }
   };

   return (
      <div className="space-y-4">
         {/* Changed Fields Summary */}
         {changedFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
               <span className="text-sm font-medium text-muted-foreground">
                  Changed fields:
               </span>
               {changedFields.map((field) => (
                  <Badge key={field} variant="secondary" className="text-xs">
                     {field}
                  </Badge>
               ))}
            </div>
         )}

         {/* Diff Display */}
         <ScrollArea className="h-96 w-full border rounded-md">
            <div className="font-mono text-sm">
               {lineDiff.map((item, index) => (
                  <div
                     key={index}
                     className={`flex items-center gap-2 px-3 py-1 ${getLineClassName(item.type)}`}
                  >
                     <div className="flex items-center gap-1 w-8 flex-shrink-0">
                        {getPrefix(item.type)}
                     </div>
                     <div className="flex items-center gap-2 flex-shrink-0 w-12 text-xs text-muted-foreground">
                        {item.lineNumber && (
                           <span className="font-mono">
                              {item.lineNumber.toString().padStart(4, " ")}
                           </span>
                        )}
                     </div>
                     <div className="flex-1 whitespace-pre-wrap break-words">
                        {item.content || "\n"}
                     </div>
                  </div>
               ))}
            </div>
         </ScrollArea>

         {/* Legend */}
         <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
               <Plus className="h-3 w-3 text-green-600" />
               <span>Added lines</span>
            </div>
            <div className="flex items-center gap-1">
               <Minus className="h-3 w-3 text-red-600" />
               <span>Removed lines</span>
            </div>
            <div className="flex items-center gap-1">
               <FileText className="h-3 w-3" />
               <span>Context lines</span>
            </div>
         </div>
      </div>
   );
}
