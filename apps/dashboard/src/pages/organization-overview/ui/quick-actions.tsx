import { useState } from "react";
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipTrigger,
   TooltipContent,
} from "@packages/ui/components/tooltip";
import { Edit, Upload, Trash2 } from "lucide-react";
import { DeleteOrganizationFeature } from "../features/delete-organization";
import { EditOrganizationFeature } from "../features/edit-organization";
import { UploadOrganizationLogoFeature } from "../features/upload-organization-logo";

export function QuickActions() {
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

   const handleDelete = () => {
      setDeleteDialogOpen(true);
   };

   const handleEdit = () => {
      setEditDialogOpen(true);
   };

   const handleUpload = () => {
      setUploadDialogOpen(true);
   };

   const actions = [
      {
         icon: Edit,
         label: "Edit Organization",
         onClick: handleEdit,
         Component: EditOrganizationFeature,
      },
      {
         icon: Upload,
         label: "Upload Organization Logo",
         onClick: handleUpload,
         Component: UploadOrganizationLogoFeature,
      },
      {
         icon: Trash2,
         label: "Delete Organization",
         onClick: handleDelete,
         Component: DeleteOrganizationFeature,
      },
   ];

   return (
      <>
         <div className="w-full flex items-center justify-center gap-4">
            {actions.map((action, index) => (
               <Tooltip key={`org-action-${index + 1}`}>
                  <TooltipTrigger asChild>
                     <Button
                        size="icon"
                        variant="outline"
                        onClick={action.onClick}
                     >
                        <action.icon />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>{action.label}</TooltipContent>
               </Tooltip>
            ))}
         </div>

         {/* Feature Components */}
         <DeleteOrganizationFeature
            onDelete={() => setDeleteDialogOpen(false)}
         />
         <EditOrganizationFeature
            onEdit={() => setEditDialogOpen(false)}
         />
         <UploadOrganizationLogoFeature
            onUpload={() => setUploadDialogOpen(false)}
         />
      </>
   );
}