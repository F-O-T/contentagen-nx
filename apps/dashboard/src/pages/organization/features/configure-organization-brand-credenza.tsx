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
import { Textarea } from "@packages/ui/components/textarea";
import { Label } from "@packages/ui/components/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Globe, FileText, FileBarChart } from "lucide-react";

interface ConfigureOrganizationBrandCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   organizationId: string;
   initialData: {
      websiteUrl: string;
      description: string;
      summary: string;
   };
}

const organizationBrandSchema = z.object({
   websiteUrl: z.url("Please enter a valid URL").optional().or(z.literal("")),
   description: z.string().max(500, "Description must be less than 500 characters").optional(),
   summary: z.string().max(1000, "Summary must be less than 1000 characters").optional(),
});

export function ConfigureOrganizationBrandCredenza({
   open,
   onOpenChange,
   organizationId,
   initialData,
}: ConfigureOrganizationBrandCredenzaProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();

   const updateOrganizationMutation = useMutation(
      trpc.organization.update.mutationOptions({
         onError: (error) => {
            console.error("Error updating organization brand:", error);
            toast.error("Failed to update brand configuration");
         },
         onSuccess: async () => {
            toast.success("Brand configuration updated successfully");
            await queryClient.invalidateQueries({
               queryKey: trpc.authHelpers.getDefaultOrganization.queryKey(),
            });
         },
      })
   );

   const generateBrandFilesMutation = useMutation(
      trpc.organizationBrandKnowledge.generateBrandKnowledge.mutationOptions({
         onError: (error) => {
            console.error("Error generating brand files:", error);
            toast.error("Failed to generate brand files");
         },
         onSuccess: async () => {
            toast.success("Brand files generation initiated");
            await queryClient.invalidateQueries({
               queryKey: trpc.authHelpers.getDefaultOrganization.queryKey(),
            });
         },
      })
   );

   const form = useAppForm({
      defaultValues: {
         websiteUrl: initialData.websiteUrl || "",
         description: initialData.description || "",
         summary: initialData.summary || "",
      },
      validators: {
         onBlur: organizationBrandSchema,
      },
      onSubmit: async ({ value }) => {
         // Update organization with brand configuration
         await updateOrganizationMutation.mutateAsync({
            id: organizationId,
            websiteUrl: value.websiteUrl || null,
            description: value.description || null,
            summary: value.summary || null,
         });

         // Generate brand files if website URL is provided
         if (value.websiteUrl) {
            await generateBrandFilesMutation.mutateAsync({
               organizationId,
               websiteUrl: value.websiteUrl,
            });
         }

         form.reset();
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
         <CredenzaContent className="sm:max-w-[600px]">
            <CredenzaHeader>
               <CredenzaTitle>Configure Organization Brand</CredenzaTitle>
            </CredenzaHeader>
            <form
               className="flex flex-col gap-6"
               onSubmit={(e) => handleSubmit(e)}
            >
               <CredenzaBody className="grid gap-6">
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span>Provide your organization's website URL to automatically extract brand information</span>
                     </div>
                     
                     <form.AppField name="websiteUrl">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Website URL</field.FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="https://your-company.com"
                                 type="url"
                                 value={field.state.value}
                              />
                              <field.FieldMessage />
                           </field.FieldContainer>
                        )}
                     </form.AppField>

                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>Optionally provide a custom description and summary</span>
                     </div>

                     <form.AppField name="description">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Description</field.FieldLabel>
                              <Textarea
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Brief description of your organization..."
                                 value={field.state.value}
                                 rows={3}
                              />
                              <field.FieldMessage />
                           </field.FieldContainer>
                        )}
                     </form.AppField>

                     <form.AppField name="summary">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Summary</field.FieldLabel>
                              <Textarea
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Detailed summary of your organization's mission, products, and services..."
                                 value={field.state.value}
                                 rows={4}
                              />
                              <field.FieldMessage />
                           </field.FieldContainer>
                        )}
                     </form.AppField>
                  </div>
               </CredenzaBody>
               <CredenzaFooter>
                  <form.Subscribe>
                     {(formState) => (
                        <div className="flex gap-2">
                           <Button
                              type="button"
                              variant="outline"
                              onClick={() => onOpenChange(false)}
                           >
                              Cancel
                           </Button>
                           <Button
                              className="flex-1 shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                              disabled={
                                 !formState.canSubmit || 
                                 formState.isSubmitting || 
                                 updateOrganizationMutation.isPending ||
                                 generateBrandFilesMutation.isPending
                              }
                              type="submit"
                              variant="default"
                           >
                              <FileBarChart className="w-4 h-4" />
                              {formState.isSubmitting || 
                               updateOrganizationMutation.isPending || 
                               generateBrandFilesMutation.isPending
                                 ? "Processing..."
                                 : "Save Configuration & Generate Brand Files"}
                           </Button>
                        </div>
                     )}
                  </form.Subscribe>
               </CredenzaFooter>
            </form>
         </CredenzaContent>
      </Credenza>
   );
}