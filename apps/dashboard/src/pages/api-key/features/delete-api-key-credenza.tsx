import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
   CredenzaBody,
   CredenzaDescription,
} from "@packages/ui/components/credenza";
import { AlertTriangle } from "lucide-react";
import { useCallback } from "react";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
export function DeleteApiKeyCredenza({
   open,
   onOpenChange,
   keyId,
}: {
   keyId: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const handleCancel = useCallback(() => {
      onOpenChange(false);
   }, [onOpenChange]);
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const handleDelete = useCallback(async () => {
      await betterAuthClient.apiKey.delete(
         {
            keyId,
         },
         {
            onSuccess: async () => {
               toast.success("API key deleted successfully");
               await queryClient.invalidateQueries({
                  queryKey: trpc.authHelpers.getApiKeys.queryKey(),
               });
               onOpenChange(false);
            },
            onError: (error) => {
               console.error("Failed to delete API key:", error);
               toast.error("Failed to delete API key. Please try again.");
            },
         },
      );
   }, [onOpenChange, keyId, queryClient, trpc.authHelpers.getApiKeys.queryKey]);

   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Delete API Key</CredenzaTitle>
               <CredenzaDescription>
                  Are you sure you want to delete this API key? This action
                  cannot be undone.
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 pb-0 flex flex-col items-center gap-4">
               <span className="text-destructive">
                  <AlertTriangle size={48} />
               </span>
               <div className="text-center text-sm text-destructive font-semibold">
                  This action is irreversible. The API key and its access will
                  be permanently deleted.
               </div>
            </CredenzaBody>
            <CredenzaFooter className="grid grid-cols-2 gap-2">
               <Button variant="secondary" onClick={handleCancel}>
                  Cancel
               </Button>
               <Button variant="destructive" onClick={handleDelete}>
                  Delete
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}
