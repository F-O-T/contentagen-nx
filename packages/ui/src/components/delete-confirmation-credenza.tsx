import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaBody,
   CredenzaClose,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { AlertTriangleIcon } from "lucide-react";

interface DeleteConfirmationCredenzaProps {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   onCancel?: () => void;
   onDelete?: () => void;
   title?: string;
   description?: string;
   message?: string;
}

const DeleteConfirmationCredenza = ({
   open,
   onOpenChange,
   onCancel,
   onDelete,
   message,
}: DeleteConfirmationCredenzaProps) => {
   const handleCancel = () => {
      onCancel?.();
      onOpenChange?.(false);
   };

   const handleDelete = () => {
      onDelete?.();
      onOpenChange?.(false);
   };

   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Confirmation Needed</CredenzaTitle>
               <CredenzaDescription>
                  Are you sure you want to do this? This action cannot
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid gap-4 place-items-center text-center ">
               <AlertTriangleIcon className="h-12 w-12" />
               <Alert variant="destructive" className="font-semibold">
                  <AlertDescription>{message}</AlertDescription>
               </Alert>
            </CredenzaBody>
            <CredenzaFooter className="grid grid-cols-2 gap-2">
               <CredenzaClose asChild>
                  <Button variant="outline" onClick={handleCancel}>
                     Cancel
                  </Button>
               </CredenzaClose>
               <Button variant="destructive" onClick={handleDelete}>
                  Confirm
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
};

export { DeleteConfirmationCredenza };
