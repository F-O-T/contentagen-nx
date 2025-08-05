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
import { useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useCallback, type FormEvent } from "react";
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
   const trpc = useTRPC();
   const generateBrandFilesMutation = useMutation(
      trpc.agentFile.generateBrandKnowledge.mutationOptions(),
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
            <form onSubmit={(e) => handleSubmit(e)}>
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
