import type { CompetitorSelect } from "@packages/database/schema";
import {
   Credenza,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Button } from "@packages/ui/components/button";
import { useAppForm } from "@packages/ui/components/form";
import { useTRPC } from "@/integrations/clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type FormEvent, useCallback } from "react";
import { Input } from "@packages/ui/components/input";
import { z } from "zod";
import { useRouter } from "@tanstack/react-router";
const createCompetitorSchema = z.object({
   websiteUrl: z.url("Please enter a valid URL"),
});

export type CreateCompetitorFormData = typeof createCompetitorSchema;

interface CreateEditCompetitorDialogProps {
   competitor?: CompetitorSelect;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function CreateEditCompetitorDialog({
   competitor,
   open,
   onOpenChange,
}: CreateEditCompetitorDialogProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const form = useAppForm({
      defaultValues: {
         name: competitor?.name || "",
         websiteUrl: competitor?.websiteUrl || "",
      },
      onSubmit: async ({ value, formApi }) => {
         if (competitor) {
            await updateCompetitorMutation.mutateAsync({
               id: competitor.id,
               data: value,
            });
         } else {
            await createCompetitorMutation.mutateAsync(value);
         }
         return formApi.reset();
      },
      validators: {
         onChange: createCompetitorSchema,
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
   const router = useRouter();
   const createCompetitorMutation = useMutation(
      trpc.competitor.create.mutationOptions({
         onSuccess: async (data) => {
            toast.success("Competitor created successfully!");
            await queryClient.invalidateQueries({
               queryKey: trpc.competitor.list.queryKey(),
            });
            router.navigate({
               to: "/competitors/$id",
               params: {
                  id: data.id,
               },
            });
            onOpenChange(false);
            form.reset();
         },
         onError: (error) => {
            toast.error(`Failed to create competitor: ${error.message}`);
         },
      }),
   );

   const updateCompetitorMutation = useMutation(
      trpc.competitor.update.mutationOptions({
         onSuccess: async () => {
            toast.success("Competitor updated successfully!");
            await queryClient.invalidateQueries({
               queryKey: trpc.competitor.list.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.competitor.get.queryKey(),
            });
            onOpenChange(false);
            form.reset();
         },
         onError: (error) => {
            toast.error(`Failed to update competitor: ${error.message}`);
         },
      }),
   );

   const isLoading =
      createCompetitorMutation.isPending || updateCompetitorMutation.isPending;

   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent className="sm:max-w-[425px]">
            <CredenzaHeader>
               <CredenzaTitle>
                  {competitor ? "Edit Competitor" : "Add New Competitor"}
               </CredenzaTitle>
               <CredenzaDescription>
                  {competitor
                     ? "Update the competitor information below."
                     : "Add a new competitor to track and analyze."}
               </CredenzaDescription>
            </CredenzaHeader>
            <form onSubmit={handleSubmit}>
               <div className="grid gap-4 py-4">
                  <form.AppField name="websiteUrl">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>Website URL *</field.FieldLabel>
                           <Input
                              placeholder="https://example.com"
                              value={field.state.value}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                           />
                           <field.FieldMessage />
                        </field.FieldContainer>
                     )}
                  </form.AppField>
               </div>
               <CredenzaFooter>
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => onOpenChange(false)}
                     disabled={isLoading}
                  >
                     Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                     {isLoading
                        ? "Saving..."
                        : competitor
                          ? "Update"
                          : "Create"}
                  </Button>
               </CredenzaFooter>
            </form>
         </CredenzaContent>
      </Credenza>
   );
}
