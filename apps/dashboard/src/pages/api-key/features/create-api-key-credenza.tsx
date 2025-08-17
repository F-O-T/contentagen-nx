import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { Key } from "lucide-react";
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
import { useAppForm } from "@packages/ui/components/form";
import { InfoItem } from "@packages/ui/components/info-item";
import { Input } from "@packages/ui/components/input";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
function ApiKeyAlertCredenza({
   apiKey,
   open,
   onOpenChange,
}: {
   apiKey: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const handleCopyApiKey = useCallback(() => {
      if (apiKey) {
         navigator.clipboard.writeText(apiKey);
         toast.success("API key copied to clipboard");
      }
      onOpenChange(false);
   }, [apiKey, onOpenChange]);
   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>This is your API key</CredenzaTitle>
               <CredenzaDescription>
                  Please copy and store this API key securely.
                  <br />
                  <strong>You will not be able to see it again.</strong>
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 pb-0">
               <InfoItem
                  icon={<Key />}
                  label="API Key"
                  value={apiKey}
                  key={"api-key"}
               />
            </CredenzaBody>
            <CredenzaFooter>
               <Button onClick={handleCopyApiKey}>Copy to clipboard</Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}

export function CreateApiKeyCredenza({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const [newApiKey, setNewApiKey] = useState<string>("");
   const [alertOpen, setAlertOpen] = useState(false);
   const trpc = useTRPC();
   const schema = z.object({
      name: z.string("Please enter a name").min(1, "Name is required"),
   });
   const queryClient = useQueryClient();
   const createApiKey = useCallback(
      async (values: z.infer<typeof schema>) => {
         await betterAuthClient.apiKey.create(
            {
               name: values.name,
            },
            {
               onSuccess: ({ data }) => {
                  toast.success(`API key created successfully`);
                  if (data?.key) setNewApiKey(data.key);
                  setAlertOpen(true);
                  queryClient.invalidateQueries({
                     queryKey: trpc.authHelpers.getApiKeys.queryKey(),
                  });
               },
               onError: (e) => {
                  console.error("Error creating API key:", e);
                  toast.error(`Failed to create API key`);
               },
            },
         );
      },
      [queryClient, trpc.authHelpers.getApiKeys.queryKey],
   );

   const form = useAppForm({
      defaultValues: { name: "" },
      validators: {
         onBlur: schema,
      },
      onSubmit: async ({ value, formApi }) => {
         await createApiKey(value);
         formApi.reset();
         onOpenChange(false);
      },
   });
   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   return (
      <>
         <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Create api key</CredenzaTitle>
               </CredenzaHeader>
               <form onSubmit={(e) => handleSubmit(e)}>
                  <CredenzaBody>
                     <form.AppField name="name">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Name</field.FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Enter a name for your API key"
                                 value={field.state.value}
                              />
                              <field.FieldMessage />
                           </field.FieldContainer>
                        )}
                     </form.AppField>
                  </CredenzaBody>
                  <CredenzaFooter>
                     <form.Subscribe>
                        {(formState) => (
                           <Button
                              className=" w-full shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                              disabled={
                                 !formState.canSubmit || formState.isSubmitting
                              }
                              type="submit"
                              variant="default"
                           >
                              Create API Key
                           </Button>
                        )}
                     </form.Subscribe>
                  </CredenzaFooter>
               </form>
            </CredenzaContent>
         </Credenza>
         <ApiKeyAlertCredenza
            apiKey={newApiKey}
            open={alertOpen}
            onOpenChange={(isOpen) => {
               setAlertOpen(isOpen);
               if (!isOpen) setNewApiKey("");
            }}
         />
      </>
   );
}
