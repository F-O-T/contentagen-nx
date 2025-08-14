import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Button } from "@packages/ui/components/button";
import { MoreVertical } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaBody,
   CredenzaFooter,
} from "@packages/ui/components/credenza";
import { Input } from "@packages/ui/components/input";
import type { ContentSelect } from "@packages/database/schemas/content";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { useAppForm } from "@packages/ui/components/form";
import { z } from "zod";
import { TiptapEditor } from "@packages/ui/components/tiptap-editor";

export function GeneratedContentDisplay({
   content,
}: {
   content: ContentSelect;
}) {
   // New state for edit credenza
   const [editBodyOpen, setEditBodyOpen] = useState(false);

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
                  trpc.content.list.queryKey(),
                  trpc.content.get.queryKey({ id: content.id }),
               ],
            });
         },
      }),
   );
   // TanStack form for editing body
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
         toast.success("Content body updated!");
         setEditBodyOpen(false);
         queryClient.invalidateQueries({
            queryKey: [
               trpc.content.list.queryKey(),
               trpc.content.get.queryKey({ id: content.id }),
            ],
         });
         formApi.reset();
      },
   });
   const addImageMutation = useMutation(
      trpc.content.addImageUrl.mutationOptions({
         onError: (error) => {
            console.error("Error adding image URL:", error);
            toast.error("Failed to add image URL. Please try again.");
         },
         onSuccess: () => {
            toast.success("Image URL added successfully!");
            queryClient.invalidateQueries({
               queryKey: [
                  trpc.content.list.queryKey(),
                  trpc.content.get.queryKey({ id: content.id }),
               ],
            });
         },
      }),
   );
   const [addImageUrlOpen, setAddImageUrlOpen] = useState(false);

   // TanStack Form with zod validation
   const schema = z.object({
      imageUrl: z.url("Please enter a valid URL"),
   });

   const form = useAppForm({
      defaultValues: { imageUrl: "" },
      validators: {
         onBlur: schema,
      },
      onSubmit: async ({ value, formApi }) => {
         await addImageMutation.mutateAsync({
            id: content.id,
            imageUrl: value.imageUrl,
         });
         setAddImageUrlOpen(false);
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
   const approveContentMutation = useMutation(
      trpc.content.approve.mutationOptions({
         onError: (error) => {
            console.error("Error approving content:", error);
            toast.error("Failed to approve content. Please try again.");
         },
         onSuccess: () => {
            toast.success("Content approved successfully!");
            queryClient.invalidateQueries({
               queryKey: [
                  trpc.content.list.queryKey(),
                  trpc.content.get.queryKey({ id: content.id }),
               ],
            });
         },
      }),
   );
   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Generated Content</CardTitle>
               <CardDescription>
                  Your AI-generated content with export and edit options
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label="Open menu"
                           variant="ghost"
                           size="icon"
                        >
                           <MoreVertical />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent>
                        <DropdownMenuItem
                           onClick={() => setAddImageUrlOpen(true)}
                        >
                           Add Image URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditBodyOpen(true)}>
                           Edit Content Body
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={async () =>
                              await approveContentMutation.mutateAsync({
                                 id: content.id,
                              })
                           }
                        >
                           Approve Content
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
               <Markdown content={content?.body} />
            </CardContent>
         </Card>
         <Credenza open={addImageUrlOpen} onOpenChange={setAddImageUrlOpen}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Add Image URL</CredenzaTitle>
               </CredenzaHeader>
               <form onSubmit={handleSubmit}>
                  <CredenzaBody>
                     <form.AppField name="imageUrl">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Image URL</field.FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 type="url"
                                 placeholder="https://example.com/image.jpg"
                                 value={field.state.value}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 onBlur={field.handleBlur}
                                 required
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
                              type="submit"
                              variant="default"
                              disabled={
                                 !formState.canSubmit || formState.isSubmitting
                              }
                           >
                              Add
                           </Button>
                        )}
                     </form.Subscribe>
                  </CredenzaFooter>
               </form>
            </CredenzaContent>
         </Credenza>
         <Credenza open={editBodyOpen} onOpenChange={setEditBodyOpen}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Edit your content</CredenzaTitle>
               </CredenzaHeader>
               <form
                  onSubmit={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     editForm.handleSubmit();
                  }}
               >
                  <CredenzaBody>
                     <editForm.AppField name="body">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Content</field.FieldLabel>
                              <TiptapEditor
                                 className="max-h-96 overflow-y-scroll"
                                 value={field.state.value}
                                 onChange={field.handleChange}
                                 onBlur={field.handleBlur}
                                 placeholder="Edit your content..."
                                 minHeight="300px"
                                 error={field.state.meta.errors.length > 0}
                              />
                              <field.FieldMessage />
                           </field.FieldContainer>
                        )}
                     </editForm.AppField>
                  </CredenzaBody>
                  <CredenzaFooter>
                     <editForm.Subscribe>
                        {(formState) => (
                           <Button
                              type="submit"
                              variant="default"
                              disabled={
                                 !formState.canSubmit || formState.isSubmitting
                              }
                           >
                              Save
                           </Button>
                        )}
                     </editForm.Subscribe>
                  </CredenzaFooter>
               </form>
            </CredenzaContent>
         </Credenza>
      </>
   );
}
