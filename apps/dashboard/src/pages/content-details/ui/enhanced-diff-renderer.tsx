import { Badge } from "@packages/ui/components/badge";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Plus, Minus, GitBranch } from "lucide-react";
import { cn } from "@packages/ui/lib/utils";

interface LineDiffItem {
   type: "add" | "remove" | "context" | "modify";
   lineNumber?: number;
   content: string;
   oldContent?: string; // For modified lines
   inlineChanges?: Array<{
      type: "add" | "remove" | "unchanged";
      text: string;
   }>; // Character-level changes within the line
}

interface EnhancedDiffRendererProps {
   lineDiff: LineDiffItem[];
   changedFields?: string[];
   className?: string;
}

export function EnhancedDiffRenderer({
   lineDiff,
   changedFields = [],
   className,
}: EnhancedDiffRendererProps) {
   if (!lineDiff || !Array.isArray(lineDiff) || lineDiff.length === 0) {
      return (
         <div className="text-muted-foreground text-sm p-4 text-center border rounded-md bg-muted/20">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No changes detected</p>
            <p className="text-xs mt-1">
               This version is identical to the previous version
            </p>
         </div>
      );
   }

   const getLineClassName = (type: string) => {
      switch (type) {
         case "add":
            return "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-800 dark:text-green-200";
         case "remove":
            return "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200";
         case "modify":
            return "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200";
         case "context":
         default:
            return "text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-colors";
      }
   };

   const getPrefix = (type: string) => {
      switch (type) {
         case "add":
            return (
               <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
            );
         case "remove":
            return <Minus className="h-3 w-3 text-red-600 dark:text-red-400" />;
         case "modify":
            return (
               <span className="h-3 w-3 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold">
                  ~
               </span>
            );
         case "context":
         default:
            return (
               <span className="w-3 h-3 flex items-center justify-center text-muted-foreground">
                  ·
               </span>
            );
      }
   };

   const renderInlineChanges = (
      inlineChanges: Array<{
         type: "add" | "remove" | "unchanged";
         text: string;
      }>,
   ) => {
      return inlineChanges.map((change, index) => {
         switch (change.type) {
            case "add":
               return (
                  <span
                     key={index}
                     className="bg-green-200 dark:bg-green-700 px-0.5 rounded-sm"
                  >
                     {change.text}
                  </span>
               );
            case "remove":
               return (
                  <span
                     key={index}
                     className="bg-red-200 dark:bg-red-700 px-0.5 rounded-sm line-through"
                  >
                     {change.text}
                  </span>
               );
            case "unchanged":
            default:
               return <span key={index}>{change.text}</span>;
         }
      });
   };

   const stats = {
      additions: lineDiff.filter((item) => item.type === "add").length,
      deletions: lineDiff.filter((item) => item.type === "remove").length,
      modifications: lineDiff.filter((item) => item.type === "modify").length,
      changes: lineDiff.filter((item) => item.type !== "context").length,
   };

   return (
      <div className={cn("space-y-4", className)}>
         {/* Header with stats */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               {changedFields.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                     <span className="text-sm font-medium text-muted-foreground">
                        Changed:
                     </span>
                     {changedFields.map((field) => (
                        <Badge
                           key={field}
                           variant="secondary"
                           className="text-xs"
                        >
                           {field}
                        </Badge>
                     ))}
                  </div>
               )}
            </div>

            {stats.changes > 0 && (
               <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                     <Plus className="h-3 w-3 text-green-600" />
                     <span className="text-green-600 font-medium">
                        {stats.additions}
                     </span>
                  </div>
                  <div className="flex items-center gap-1">
                     <Minus className="h-3 w-3 text-red-600" />
                     <span className="text-red-600 font-medium">
                        {stats.deletions}
                     </span>
                  </div>
                  {stats.modifications > 0 && (
                     <div className="flex items-center gap-1">
                        <span className="h-3 w-3 flex items-center justify-center text-yellow-600 font-bold text-xs">
                           ~
                        </span>
                        <span className="text-yellow-600 font-medium">
                           {stats.modifications}
                        </span>
                     </div>
                  )}
               </div>
            )}
         </div>

         {/* Diff Display */}
         <ScrollArea className="h-96 w-full border rounded-md bg-background">
            <div className="font-mono text-sm">
               {lineDiff.map((item, index) => {
                  const prevItem = lineDiff[index - 1];
                  const showSeparator =
                     prevItem &&
                     prevItem.type === "context" &&
                     item.type !== "context" &&
                     index > 0;

                  return (
                     <div key={index}>
                        {showSeparator && (
                           <div className="border-t border-muted-foreground/20 my-1" />
                        )}
                        <div
                           className={cn(
                              "flex items-start gap-2 px-3 py-1 hover:bg-muted/30 transition-colors",
                              getLineClassName(item.type),
                           )}
                        >
                           <div className="flex items-center gap-1 w-6 flex-shrink-0 pt-0.5">
                              {getPrefix(item.type)}
                           </div>
                           <div className="flex items-center gap-2 flex-shrink-0 w-12 text-xs text-muted-foreground pt-0.5">
                              {item.lineNumber && (
                                 <span className="font-mono select-none">
                                    {item.lineNumber
                                       .toString()
                                       .padStart(4, " ")}
                                 </span>
                              )}
                           </div>
                           <div className="flex-1 whitespace-pre-wrap break-words leading-relaxed">
                              {item.type === "modify" && item.inlineChanges ? (
                                 // Render character-level changes for modified lines
                                 <div>
                                    {renderInlineChanges(item.inlineChanges)}
                                 </div>
                              ) : (
                                 item.content || (
                                    <span className="text-muted-foreground italic">
                                       (empty line)
                                    </span>
                                 )
                              )}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </ScrollArea>
      </div>
   );
}
