import { useTRPC } from "@/integrations/clients";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
   CredenzaBody,
} from "@packages/ui/components/credenza";
import { useAppForm } from "@packages/ui/components/form";
import { Input } from "@packages/ui/components/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
export function GenerateBrandFilesCredenza({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const schema = z.object({
      websiteUrl: z.url("Please enter a valid URL"),
   });
   const agentId = useParams({
      from: "/_dashboard/agents/$agentId/",
      select: ({ agentId }) => agentId,
   });
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const generateBrandFilesMutation = useMutation(
      trpc.agentFile.generateBrandKnowledge.mutationOptions({
         onError: (error) => {
            console.error("Error generating brand files:", error);
            toast.error("An error occurred while generating brand files.");
            // Optionally, display an error message to the user here
         },
         onSuccess: async () => {
            toast.success("Brand files generation initiated.");
            await queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agentId }),
            });
            // Optionally, display a success message to the user here
         },
      }),
   );
   const form = useAppForm({
      defaultValues: { websiteUrl: "" },
      validators: {
         onBlur: schema,
      },
      onSubmit: async ({ value, formApi }) => {
         await generateBrandFilesMutation.mutateAsync({
            id: agentId,
            websiteUrl: value.websiteUrl,
         });
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
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Generate Brand Files from Website</CredenzaTitle>
            </CredenzaHeader>
            <form
               className="flex flex-col gap-4"
               onSubmit={(e) => handleSubmit(e)}
            >
               <CredenzaBody>
                  <form.AppField name="websiteUrl">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>Website url</field.FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Enter your website URL"
                              type="url"
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
                           Generate brand files
                        </Button>
                     )}
                  </form.Subscribe>
               </CredenzaFooter>
            </form>
         </CredenzaContent>
      </Credenza>
   );
}
