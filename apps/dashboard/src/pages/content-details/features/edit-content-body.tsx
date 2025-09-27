import { useTRPC } from "@/integrations/clients";
import type { ContentSelect } from "@packages/database/schema";
import { Button } from "@packages/ui/components/button";
import { useAppForm } from "@packages/ui/components/form";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Check, X } from "lucide-react";
import { translate } from "@packages/localization";
export function EditContentBody({
   content,
   setEditing,
}: {
   content: ContentSelect;
   setEditing: (editing: boolean) => void;
}) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const editBodyMutation = useMutation(
      trpc.content.versions.editBodyAndCreateNewVersion.mutationOptions({
         onError: (error) => {
            console.error("Error editing content body:", error);
            toast.error(translate("pages.content-details.edit.error"));
         },
         onSuccess: async () => {
            toast.success(translate("pages.content-details.edit.success"));
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.get.queryKey({ id: content.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.versions.getVersions.queryKey({
                  contentId: content.id,
               }),
            });
         },
      }),
   );

   const editForm = useAppForm({
      defaultValues: { body: content?.body ?? "" },
      validators: {
         onBlur: z.object({
            body: z
               .string()
               .min(
                  1,
                  translate(
                     "pages.content-details.edit.validation.body-required",
                  ),
               ),
         }),
      },
      onSubmit: async ({ value, formApi }) => {
         await editBodyMutation.mutateAsync({
            id: content.id,
            body: value.body,
         });
         formApi.reset();
         await queryClient.invalidateQueries({
            queryKey: trpc.content.get.queryKey({ id: content.id }),
         });
         await queryClient.invalidateQueries({
            queryKey: trpc.content.listAllContent.queryKey(),
         });
         await queryClient.invalidateQueries({
            queryKey: trpc.content.versions.getVersions.queryKey({
               contentId: content.id,
            }),
         });
         setEditing(false);
      },
   });

   return (
      <form
         onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editForm.handleSubmit();
         }}
         className="flex flex-col items-end gap-4"
      >
         <editForm.Subscribe>
            {(formState) => (
               <div className="flex items-center gap-2">
                  <Button
                     type="submit"
                     variant="ghost"
                     size="icon"
                     disabled={!formState.canSubmit || formState.isSubmitting}
                     aria-label={translate("pages.content-details.edit.save")}
                  >
                     <span className="sr-only">
                        {translate("pages.content-details.edit.save")}
                     </span>
                     <Check size={20} />
                  </Button>
                  <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     aria-label={translate("pages.content-details.edit.cancel")}
                     onClick={() => setEditing(false)}
                  >
                     <span className="sr-only">
                        {translate("pages.content-details.edit.cancel")}
                     </span>
                     <X size={20} />
                  </Button>
               </div>
            )}
         </editForm.Subscribe>

         <editForm.AppField name="body">
            {(field) => (
               <field.FieldContainer>
                  <TiptapEditor
                     value={field.state.value}
                     onChange={field.handleChange}
                     onBlur={field.handleBlur}
                     placeholder={translate(
                        "pages.content-details.edit.placeholder",
                     )}
                     error={field.state.meta.errors.length > 0}
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </editForm.AppField>
      </form>
   );
}
