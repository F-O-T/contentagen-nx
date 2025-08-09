import { betterAuthClient } from "@/integrations/clients";
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
export function CreateApiKeyCredenza({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const [newApiKey, setNewApiKey] = useState<string>("");
   const [alertOpen, setAlertOpen] = useState(false);
   const schema = z.object({
      name: z.string("Please enter a name"),
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
                  queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
               },
               onError: (e) => {
                  console.error("Error creating API key:", e);
                  toast.error(`Failed to create API key`);
               },
            },
         );
      },
      [queryClient],
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

   const handleCopyApiKey = useCallback(() => {
      if (newApiKey) {
         navigator.clipboard.writeText(newApiKey);
      }
      setAlertOpen(false);
      setNewApiKey("");
   }, [newApiKey]);

   return (
      <>
         <Credenza open={open} onOpenChange={onOpenChange}>
            <form onSubmit={(e) => handleSubmit(e)}>
               <CredenzaContent>
                  <CredenzaHeader>
                     <CredenzaTitle>Create api key</CredenzaTitle>
                  </CredenzaHeader>
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
               </CredenzaContent>
            </form>
         </Credenza>
         <Credenza
            open={alertOpen}
            onOpenChange={(isOpen) => {
               setAlertOpen(isOpen);
               if (!isOpen) setNewApiKey("");
            }}
         >
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
                     value={newApiKey}
                     key={"api-key"}
                  />
               </CredenzaBody>
               <CredenzaFooter>
                  <Button onClick={handleCopyApiKey}>Copy to clipboard</Button>
               </CredenzaFooter>
            </CredenzaContent>
         </Credenza>
      </>
   );
}
