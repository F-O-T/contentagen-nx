import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { createToast } from "@/features/error-modal/lib/create-toast";
import { translate } from "@packages/localization";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import { useAppForm } from "@packages/ui/components/form";
import type { RouterOutput } from "@packages/api/client";
import { z } from "zod";
import type { FormEvent } from "react";

const brandSchema = z.object({
   name: z
      .string()
      .min(1, translate("common.form.field-required")),
   websiteUrl: z
      .string()
      .url(translate("pages.brand-details.form.invalid-url")),
   description: z.string().optional(),
   industry: z.string().optional(),
});

interface CreateEditBrandDialogProps {
   brand?: RouterOutput["brand"]["list"]["items"][number];
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function CreateEditBrandDialog({
   brand,
   open,
   onOpenChange,
}: CreateEditBrandDialogProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const isEditing = !!brand;

   const createBrand = useCallback(
      async (values: z.infer<typeof brandSchema>) => {
         await createMutation.mutateAsync(values);
      },
      [],
   );

   const updateBrand = useCallback(
      async (values: z.infer<typeof brandSchema>) => {
         if (!brand) return;
         await updateMutation.mutateAsync({
            id: brand.id,
            data: values,
         });
      },
      [brand],
   );

   const createMutation = useMutation(
      trpc.brand.create.mutationOptions({
         onSuccess: async () => {
            createToast({
               type: "success",
               message: translate(
                  "pages.brand-details.messages.brand-created",
               ),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.brand.getByOrganization.queryKey(),
            });
            onOpenChange(false);
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: translate("pages.brand-details.messages.create-error", {
                  error: error.message ?? "Unknown error",
               }),
            });
         },
      }),
   );

   const updateMutation = useMutation(
      trpc.brand.update.mutationOptions({
         onSuccess: async () => {
            createToast({
               type: "success",
               message: translate(
                  "pages.brand-details.messages.brand-updated",
               ),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.brand.getByOrganization.queryKey(),
            });
            onOpenChange(false);
         },
         onError: (error) => {
            createToast({
               type: "danger",
               message: translate("pages.brand-details.messages.update-error", {
                  error: error.message ?? "Unknown error",
               }),
            });
         },
      }),
   );

   const form = useAppForm({
      defaultValues: {
         name: brand?.name || "",
         websiteUrl: brand?.websiteUrl || "",
         description: brand?.description || "",
         industry: brand?.industry || "",
      },
      validators: {
         onBlur: brandSchema,
      },
      onSubmit: async ({ value, formApi }) => {
         if (isEditing) {
            await updateBrand(value);
         } else {
            await createBrand(value);
         }
         formApi.reset();
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
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
               <DialogTitle>
                  {isEditing
                     ? translate("pages.brand-details.edit-dialog.title")
                     : translate("pages.brand-details.create-dialog.title")}
               </DialogTitle>
               <DialogDescription>
                  {isEditing
                     ? translate(
                          "pages.brand-details.edit-dialog.description",
                       )
                     : translate(
                          "pages.brand-details.create-dialog.description",
                       )}
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
               <div className="grid gap-4 py-4">
                  <form.AppField name="name">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>
                              {translate("pages.brand-details.form.name")}
                           </field.FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.brand-details.form.name-placeholder",
                              )}
                              value={field.state.value}
                           />
                           <field.FieldMessage />
                        </field.FieldContainer>
                     )}
                  </form.AppField>
                  <form.AppField name="websiteUrl">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>
                              {translate("pages.brand-details.form.website")}
                           </field.FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.brand-details.form.website-placeholder",
                              )}
                              value={field.state.value}
                           />
                           <field.FieldMessage />
                        </field.FieldContainer>
                     )}
                  </form.AppField>
                  <form.AppField name="industry">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>
                              {translate("pages.brand-details.form.industry")}
                           </field.FieldLabel>
                           <Input
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.brand-details.form.industry-placeholder",
                              )}
                              value={field.state.value}
                           />
                           <field.FieldMessage />
                        </field.FieldContainer>
                     )}
                  </form.AppField>
                  <form.AppField name="description">
                     {(field) => (
                        <field.FieldContainer>
                           <field.FieldLabel>
                              {translate("pages.brand-details.form.description")}
                           </field.FieldLabel>
                           <Textarea
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "pages.brand-details.form.description-placeholder",
                              )}
                              value={field.state.value}
                              rows={3}
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
                  >
                     {translate("common.actions.cancel")}
                  </Button>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           type="submit"
                           disabled={!formState.canSubmit || formState.isSubmitting}
                        >
                           {formState.isSubmitting
                              ? translate("common.actions.saving")
                              : isEditing
                              ? translate("common.actions.save")
                              : translate("common.actions.create")}
                        </Button>
                     )}
                  </form.Subscribe>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}