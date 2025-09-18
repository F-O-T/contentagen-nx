import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import { Globe, FileText, Settings } from "lucide-react";
import { ConfigureOrganizationBrandCredenza } from "../features/configure-organization-brand-credenza";
import { OrganizationKnowledgeBaseCard } from "./organization-knowledge-base-card";

export function OrganizationBrandConfigurationCard({
   organizationId,
   websiteUrl,
   description,
   summary,
   brandKnowledgeStatus = "pending",
   uploadedFiles = [],
   open,
   onOpenChange,
}: {
   organizationId: string;
   websiteUrl?: string | null;
   description?: string | null;
   summary?: string | null;
   brandKnowledgeStatus?: "pending" | "analyzing" | "chunking" | "completed" | "failed";
   uploadedFiles?: Array<{ fileName: string; fileUrl: string; uploadedAt: string }>;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}) {
   const getStatusBadge = () => {
      switch (brandKnowledgeStatus) {
         case "completed":
            return <Badge className="font-semibold">Configured</Badge>;
         case "analyzing":
            return <Badge variant="secondary">Analyzing</Badge>;
         case "chunking":
            return <Badge variant="secondary">Processing</Badge>;
         case "failed":
            return <Badge variant="destructive">Failed</Badge>;
         default:
            return <Badge variant="outline">Not configured</Badge>;
      }
   };

   return (
      <>
         <Card className="h-full">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Brand Configuration
               </CardTitle>
               <CardDescription>
                  Configure your organization's brand information and generate brand knowledge
               </CardDescription>
               <div className="flex items-center justify-between">
                  {getStatusBadge()}
               </div>
            </CardHeader>
            <CardContent className="grid gap-4">
               {websiteUrl && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                     <Globe className="w-4 h-4 text-muted-foreground" />
                     <div className="flex-1">
                        <p className="text-sm font-medium">Website</p>
                        <p className="text-xs text-muted-foreground truncate">
                           {websiteUrl}
                        </p>
                     </div>
                  </div>
               )}
               
               {description && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                     <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                     <div className="flex-1">
                        <p className="text-sm font-medium">Description</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                           {description}
                        </p>
                     </div>
                  </div>
               )}

               {!websiteUrl && !description && (
                  <div className="text-center py-8 text-muted-foreground">
                     <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                     <p>No brand configuration yet</p>
                     <p className="text-sm">
                        Configure your brand information to get started
                     </p>
                  </div>
               )}
            </CardContent>
            <div className="px-6 pb-6">
               <Button 
                  onClick={() => onOpenChange?.(true)}
                  className="w-full"
                  variant="outline"
               >
                  Configure Brand
               </Button>
            </div>
         </Card>

         <OrganizationKnowledgeBaseCard 
            organizationId={organizationId}
            uploadedFiles={uploadedFiles}
            brandKnowledgeStatus={brandKnowledgeStatus}
         />

         <ConfigureOrganizationBrandCredenza
            open={open || false}
            onOpenChange={onOpenChange || (() => {})}
            organizationId={organizationId}
            initialData={{
               websiteUrl: websiteUrl || "",
               description: description || "",
               summary: summary || "",
            }}
         />
      </>
   );
}