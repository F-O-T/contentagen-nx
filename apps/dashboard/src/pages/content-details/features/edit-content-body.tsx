import { useTRPC } from "@/integrations/clients";
import type { ContentSelect } from "@packages/database/schema";
import { Button } from "@packages/ui/components/button";
import { useAppForm } from "@packages/ui/components/form";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Check, X } from "lucide-react";
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
      trpc.content.editBody.mutationOptions({
         onError: (error) => {
            console.error("Error editing content body:", error);
            toast.error("Failed to edit content body. Please try again.");
         },
         onSuccess: () => {
            toast.success("Content body edited successfully!");
            queryClient.invalidateQueries({
               queryKey: [
                  trpc.content.listAllContent.queryKey(),
                  trpc.content.get.queryKey({ id: content.id }),
               ],
            });
         },
      }),
   );

   const editForm = useAppForm({
      defaultValues: { body: content?.body ?? "" },
      validators: {
         onBlur: z.object({ body: z.string().min(1, "Body is required") }),
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
                     aria-label="Save"
                  >
                     <span className="sr-only">Save</span>
                     <Check size={20} />
                  </Button>
                  <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     aria-label="Cancel"
                     onClick={() => setEditing(false)}
                  >
                     <span className="sr-only">Cancel</span>
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
                     placeholder="Edit your content..."
                     error={field.state.meta.errors.length > 0}
                  />
                  <field.FieldMessage />
               </field.FieldContainer>
            )}
         </editForm.AppField>
      </form>
   );
}
