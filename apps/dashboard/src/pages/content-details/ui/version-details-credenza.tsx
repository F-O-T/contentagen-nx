import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaBody,
   CredenzaFooter,
   CredenzaDescription,
} from "@packages/ui/components/credenza";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { FileText, GitCompare, Minus, Plus } from "lucide-react";
import { EnhancedDiffRenderer } from "./enhanced-diff-renderer";
import type { RouterOutput } from "@packages/api/client";

interface VersionDetailsCredenzaProps {
   version: RouterOutput["content"]["versions"]["getVersions"][number];
   isOpen: boolean;
   onClose: () => void;
}

export function VersionDetailsCredenza({
   version,
   isOpen,
   onClose,
}: VersionDetailsCredenzaProps) {
   if (!version) return null;

   const stats = {
      additions: version.meta?.lineDiff?.filter((item) => item.type === "add")
         .length,
      deletions: version.meta?.lineDiff?.filter(
         (item) => item.type === "remove",
      ).length,
      modifications: version.meta?.lineDiff?.filter(
         (item) => item.type === "modify",
      ).length,
      changes:
         version.meta?.lineDiff?.filter((item) => item.type !== "context")
            .length || 0,
   };
   return (
      <Credenza open={isOpen} onOpenChange={onClose}>
         <CredenzaContent className="">
            <CredenzaHeader>
               <CredenzaTitle className="">
                  Changes from the previous version
               </CredenzaTitle>
               <CredenzaDescription>
                  The whole set of changes made in this version
               </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody>
               <div className="space-y-2">
                  {version.version === 1 ? (
                     <div className="text-muted-foreground text-sm p-4 text-center border rounded-md bg-blue-50 dark:bg-blue-900/20">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Initial version of this content</p>
                        <p className="text-xs mt-1">
                           This is the first version, so there are no changes to
                           display
                        </p>
                     </div>
                  ) : version.meta &&
                    (version.meta.lineDiff || version.meta.diff) ? (
                     version.meta.lineDiff ? (
                        <EnhancedDiffRenderer
                           lineDiff={version.meta.lineDiff}
                           changedFields={version.meta.changedFields}
                        />
                     ) : version.meta.diff ? (
                        <ScrollArea className="h-64 w-full border rounded-md p-4 bg-muted/20">
                           <div className="font-mono text-sm">
                              {version.meta.diff.map(
                                 (change, index: number) => {
                                    const [operation, text] = change;
                                    let className = "";
                                    let prefix = "";

                                    switch (operation) {
                                       case -1: // deleted
                                          className =
                                             "bg-red-50 text-red-800 border-l-4 border-red-500 pl-2";
                                          prefix = "- ";
                                          break;
                                       case 1: // inserted
                                          className =
                                             "bg-green-50 text-green-800 border-l-4 border-green-500 pl-2";
                                          prefix = "+ ";
                                          break;
                                       default:
                                          className = "text-muted-foreground";
                                          prefix = "  ";
                                          break;
                                    }

                                    return (
                                       <div
                                          key={`changes-${index + 1}`}
                                          className={className}
                                       >
                                          {prefix}
                                          {text}
                                       </div>
                                    );
                                 },
                              )}
                           </div>
                        </ScrollArea>
                     ) : null
                  ) : (
                     <div className="text-muted-foreground text-sm p-4 text-center border rounded-md bg-muted/20">
                        <GitCompare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No changes detected</p>
                        <p className="text-xs mt-1">
                           This version is identical to the previous version
                        </p>
                     </div>
                  )}
               </div>
            </CredenzaBody>
            <CredenzaFooter className="flex items-center gap-4 text-xs text-muted-foreground">
               <div className="flex items-center gap-2">
                  <Plus className="h-3 w-3 text-green-600" />
                  <span>Added lines</span>
               </div>
               <div className="flex items-center gap-2">
                  <Minus className="h-3 w-3 text-red-600" />
                  <span>Removed lines</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="h-3 w-3 flex items-center justify-center text-yellow-600 font-bold">
                     ~
                  </span>
                  <span>Modified lines</span>
               </div>
               <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  <span>Context lines</span>
               </div>
               <div className="text-xs text-muted-foreground ml-auto">
                  {stats.changes} change{stats.changes !== 1 ? "s" : ""} across{" "}
                  {version?.meta?.lineDiff?.length} line
                  {version.meta?.lineDiff?.length !== 1 ? "s" : ""}
               </div>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}
