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
import { useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

export function GenerateOrganizationBrandFilesCredenza({
   open,
   onOpenChange,
   organizationId,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   organizationId: string;
}) {
   const schema = z.object({
      websiteUrl: z.url("Please enter a valid URL"),
   });

   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const generateBrandFilesMutation = useMutation(
      trpc.organizationBrandKnowledge.generateBrandKnowledge.mutationOptions({
         onError: (error) => {
            console.error("Error generating organization brand files:", error);
            toast.error("An error occurred while generating brand files.");
         },
         onSuccess: async () => {
            toast.success("Organization brand files generation initiated.");
            await queryClient.invalidateQueries({
               queryKey: trpc.authHelpers.getDefaultOrganization.queryKey(),
            });
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
            organizationId,
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
               <CredenzaTitle>
                  Generate Organization Brand Files from Website
               </CredenzaTitle>
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
                              placeholder="Enter your organization website URL"
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
                           Generate organization brand files
                        </Button>
                     )}
                  </form.Subscribe>
               </CredenzaFooter>
            </form>
         </CredenzaContent>
      </Credenza>
   );
}