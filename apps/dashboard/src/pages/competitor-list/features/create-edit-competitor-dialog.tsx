import type { CompetitorSelect } from "@packages/database/schema";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import { useAppForm } from "@packages/ui/components/form";
import { useTRPC } from "@/integrations/clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type FormEvent, useCallback } from "react";
import { Input } from "@packages/ui/components/input";

const createCompetitorSchema = {
   name: "",
   websiteUrl: "",
   changelogUrl: "",
};

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
         changelogUrl: competitor?.changelogUrl || "",
      },
      onSubmit: async ({ value }) => {
         const cleanedData = {
            ...value,
            changelogUrl: value.changelogUrl || undefined,
         };

         if (competitor) {
            await updateCompetitorMutation.mutateAsync({
               id: competitor.id,
               data: cleanedData,
            });
         } else {
            await createCompetitorMutation.mutateAsync(cleanedData);
         }
      },
      validators: {
         onChange: ({ value }) => {
            const errors: Record<string, string> = {};

            if (!value.name.trim()) {
               errors.name = "Name is required";
            } else if (value.name.length > 100) {
               errors.name = "Name is too long";
            }

            try {
               new URL(value.websiteUrl);
            } catch {
               errors.websiteUrl = "Please enter a valid URL";
            }

            if (value.changelogUrl && value.changelogUrl.trim()) {
               try {
                  new URL(value.changelogUrl);
               } catch {
                  errors.changelogUrl = "Please enter a valid URL";
               }
            }

            return Object.keys(errors).length ? errors : null;
         },
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

   const createCompetitorMutation = useMutation({
      mutationFn: trpc.competitor.create.mutate,
      onSuccess: () => {
         toast.success("Competitor created successfully!");
         queryClient.invalidateQueries({
            queryKey: trpc.competitor.list.queryKey(),
         });
         onOpenChange(false);
         form.reset();
      },
      onError: (error) => {
         toast.error(`Failed to create competitor: ${error.message}`);
      },
   });

   const updateCompetitorMutation = useMutation(
      trpc.competitor.update.mutationOptions({
         onSuccess: () => {
            toast.success("Competitor updated successfully!");
            queryClient.invalidateQueries({
               queryKey: trpc.competitor.list.queryKey(),
            });
            queryClient.invalidateQueries({
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
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>
                  {competitor ? "Edit Competitor" : "Add New Competitor"}
               </DialogTitle>
               <DialogDescription>
                  {competitor
                     ? "Update the competitor information below."
                     : "Add a new competitor to track and analyze."}
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
               <div className="grid gap-4 py-4">
                  <form.AppField name="name">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>Name *</field.FieldLabel>
                           <Input
                              placeholder="Competitor name"
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

                  <form.AppField name="changelogUrl">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>
                              Changelog URL (Optional)
                           </field.FieldLabel>
                           <Input
                              placeholder="https://example.com/changelog"
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
               <DialogFooter>
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
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
