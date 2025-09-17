import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
   CardAction,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { FileText, MoreVertical } from "lucide-react";
import { useState, useMemo } from "react";
import { GenerateOrganizationBrandFilesCredenza } from "../features/generate-organization-brand-files-credenza";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";

export type UploadedFile = {
   fileName: string;
   fileUrl: string;
   uploadedAt: string;
};

function KnowledgeBaseEmptyState() {
   return (
      <div className="text-center py-8 text-muted-foreground">
         <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
         <p>No organization brand files yet</p>
         <p className="text-sm">
            Generate brand files from your website URL to add brand knowledge.
         </p>
      </div>
   );
}

export function OrganizationKnowledgeBaseCard({
   organizationId,
   uploadedFiles = [],
   brandKnowledgeStatus = "pending",
}: {
   organizationId: string;
   uploadedFiles?: UploadedFile[];
   brandKnowledgeStatus?: "pending" | "analyzing" | "chunking" | "completed" | "failed";
}) {
   const [showGenerateCredenza, setShowGenerateCredenza] = useState(false);
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const uploadedFiles = useMemo(
      () => uploadedFiles || [],
      [uploadedFiles],
   );

   const getStatusBadge = () => {
      switch (brandKnowledgeStatus) {
         case "completed":
            return <Badge className="font-semibold">100% indexed</Badge>;
         case "analyzing":
            return <Badge variant="secondary">Analyzing</Badge>;
         case "chunking":
            return <Badge variant="secondary">Processing</Badge>;
         case "failed":
            return <Badge variant="destructive">Failed</Badge>;
         default:
            return <Badge variant="outline">Not started</Badge>;
      }
   };

   return (
      <>
         <Card className="h-full">
            <CardHeader>
               <CardTitle>Organization Brand Knowledge</CardTitle>
               <CardDescription>
                  Files generated using your organization website url
               </CardDescription>
               <CardAction>
                  {getStatusBadge()}
               </CardAction>
            </CardHeader>
            <CardContent className="grid gap-2">
               {uploadedFiles.map((file, index) => (
                  <div
                     key={`file-${index + 1}`}
                     className="flex items-center justify-between p-4 border rounded-lg"
                  >
                     <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                           <p className="font-medium text-sm">
                              {file.fileName}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              Uploaded{" "}
                              {new Date(file.uploadedAt).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem
                              onClick={() => {
                                 // TODO: Implement file viewing for organization files
                                 toast.info("File viewing not implemented yet");
                              }}
                           >
                              View
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onClick={() => {
                                 // TODO: Implement file deletion for organization files
                                 toast.info("File deletion not implemented yet");
                              }}
                           >
                              Delete
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               ))}
               {uploadedFiles.length === 0 && <KnowledgeBaseEmptyState />}
            </CardContent>
            <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
               <span>
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} uploaded
               </span>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGenerateCredenza(true)}
               >
                  Generate Brand Files
               </Button>
            </CardFooter>
         </Card>
         <GenerateOrganizationBrandFilesCredenza
            open={showGenerateCredenza}
            onOpenChange={setShowGenerateCredenza}
            organizationId={organizationId}
         />
      </>
   );
}