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
// Removed Credenza imports since edit will be inline
import { Input } from "@packages/ui/components/input";
import type { ContentSelect } from "@packages/database/schemas/content";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";
import { useAppForm } from "@packages/ui/components/form";
import { z } from "zod";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaBody,
   CredenzaFooter,
} from "@packages/ui/components/credenza";
import { EditContentBody } from "../features/edit-content-body";
import { UploadContentImage } from "./upload-content-image";

export function GeneratedContentDisplay({
   content,
}: {
   content: ContentSelect;
}) {
   // New state for edit credenza
   // State for inline body editor
   const [editingBody, setEditingBody] = useState(false);

   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const addImageMutation = useMutation(
      trpc.content.addImageUrl.mutationOptions({
         onError: (error) => {
            console.error("Error adding image URL:", error);
            toast.error("Failed to add image URL. Please try again.");
         },
         onSuccess: async () => {
            toast.success("Image URL added successfully!");
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.get.queryKey({ id: content.id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.getRelatedSlugs.queryKey({
                  slug: content.meta?.slug,
                  agentId: content.agentId,
               }),
            });
         },
      }),
   );
   const [addImageUrlOpen, setAddImageUrlOpen] = useState(false);
   const [uploadImageOpen, setUploadImageOpen] = useState(false);

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
   const regenerateContentMutation = useMutation(
      trpc.content.regenerate.mutationOptions({
         onError: (error) => {
            console.error("Error triggering regeneration:", error);
            toast.error("Failed to trigger regeneration. Please try again.");
         },
         onSuccess: async () => {
            toast.success("Content regeneration triggered!");
            await queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.content.get.queryKey({ id: content.id }),
            });
         },
      }),
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
                  trpc.content.listAllContent.queryKey(),
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
                           onClick={async () => {
                              try {
                                 await regenerateContentMutation.mutateAsync({
                                    id: content.id,
                                 });
                                 toast.success(
                                    "Content regeneration triggered!",
                                 );
                                 queryClient.invalidateQueries({
                                    queryKey: [
                                       trpc.content.listAllContent.queryKey(),
                                       trpc.content.get.queryKey({
                                          id: content.id,
                                       }),
                                    ],
                                 });
                              } catch (error) {
                                 console.error(
                                    "Error triggering regeneration:",
                                    error,
                                 );
                                 toast.error("Failed to trigger regeneration.");
                              }
                           }}
                        >
                           Regenerate Content
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() => setUploadImageOpen(true)}
                        >
                           Upload Image
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingBody(true)}>
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
               {editingBody ? (
                  <EditContentBody
                     content={content}
                     setEditing={setEditingBody}
                  />
               ) : (
                  <Markdown content={content?.body} />
               )}
            </CardContent>
         </Card>
         <UploadContentImage
            content={content}
            open={uploadImageOpen}
            onOpenChange={setUploadImageOpen}
         />
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
      </>
   );
}
