import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaBody,
   CredenzaFooter,
} from "@packages/ui/components/credenza";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { User, Calendar, FileText, GitCompare } from "lucide-react";

interface VersionDetailsCredenzaProps {
   version: any;
   isOpen: boolean;
   onClose: () => void;
}

export function VersionDetailsCredenza({
   version,
   isOpen,
   onClose,
}: VersionDetailsCredenzaProps) {
   if (!version) return null;

   const formatDate = (date: string) => {
      return new Date(date).toLocaleString();
   };

   const renderDiff = (diff: any[]) => {
      if (!diff || !Array.isArray(diff)) {
         return <p className="text-muted-foreground">No diff available</p>;
      }

      return (
         <div className="space-y-1 font-mono text-sm">
            {diff.map((change, index) => {
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
                  case 0: // unchanged
                  default:
                     className = "text-muted-foreground";
                     prefix = "  ";
                     break;
               }

               return (
                  <div key={index} className={className}>
                     {prefix}
                     {text}
                  </div>
               );
            })}
         </div>
      );
   };

   return (
      <Credenza open={isOpen} onOpenChange={onClose}>
         <CredenzaContent className="max-w-4xl max-h-[90vh]">
            <CredenzaHeader>
               <CredenzaTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Version {version.version} Details
               </CredenzaTitle>
            </CredenzaHeader>

            <CredenzaBody>
               <div className="space-y-6">
                  {/* Version Info */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline">v{version.version}</Badge>
                           <span className="text-sm text-muted-foreground">
                              Version Number
                           </span>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <User className="h-4 w-4" />
                           <span className="text-sm">{version.userId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4" />
                           <span className="text-sm">
                              {formatDate(version.createdAt)}
                           </span>
                        </div>
                     </div>
                  </div>

                  <Separator />

                  {/* Content Preview */}
                  <div className="space-y-2">
                     <h3 className="text-lg font-semibold">Content</h3>
                     <ScrollArea className="h-48 w-full border rounded-md p-4">
                        <div className="whitespace-pre-wrap text-sm">
                           {version.body || "No content available"}
                        </div>
                     </ScrollArea>
                  </div>

                  {/* Diff Section */}
                  {version.diff && (
                     <>
                        <Separator />
                        <div className="space-y-2">
                           <h3 className="text-lg font-semibold flex items-center gap-2">
                              <GitCompare className="h-5 w-5" />
                              Changes from Previous Version
                           </h3>
                           <ScrollArea className="h-64 w-full border rounded-md p-4 bg-muted/20">
                              {renderDiff(version.diff)}
                           </ScrollArea>
                        </div>
                     </>
                  )}

                  {/* Metadata */}
                  {version.meta && (
                     <>
                        <Separator />
                        <div className="space-y-2">
                           <h3 className="text-lg font-semibold">Metadata</h3>
                           <div className="grid grid-cols-2 gap-4 text-sm">
                              {version.meta.title && (
                                 <div>
                                    <span className="font-medium">Title:</span>{" "}
                                    {version.meta.title}
                                 </div>
                              )}
                              {version.meta.description && (
                                 <div>
                                    <span className="font-medium">
                                       Description:
                                    </span>{" "}
                                    {version.meta.description}
                                 </div>
                              )}
                              {version.meta.keywords &&
                                 version.meta.keywords.length > 0 && (
                                    <div className="col-span-2">
                                       <span className="font-medium">
                                          Keywords:
                                       </span>{" "}
                                       {version.meta.keywords.join(", ")}
                                    </div>
                                 )}
                           </div>
                        </div>
                     </>
                  )}
               </div>
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
