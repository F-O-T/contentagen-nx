import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Building2, Camera } from "lucide-react";
import {
   type FormEvent,
   forwardRef,
   useCallback,
   useEffect,
   useImperativeHandle,
   useTransition,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import type { StepHandle, StepState } from "./step-handle";

const workspaceSchema = z.object({
   workspaceName: z
      .string()
      .min(2, "O nome do workspace deve ter no mínimo 2 caracteres."),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

interface WorkspaceStepProps {
   onNext: (org: { id: string; slug: string }) => void;
   onStateChange: (state: StepState) => void;
   onSlugChange?: (slug: string | null) => void;
}

export const WorkspaceStep = forwardRef<StepHandle, WorkspaceStepProps>(
   function WorkspaceStep({ onNext, onStateChange, onSlugChange }, ref) {
      const [isPending, startTransition] = useTransition();

      const fileUpload = useFileUpload({
         maxSize: MAX_FILE_SIZE,
         acceptedTypes: ACCEPTED_TYPES,
         typeErrorMessage: "Formato inválido. Use PNG, JPG, GIF ou WebP.",
         sizeErrorMessage: "Arquivo muito grande. Máximo 5MB.",
      });

      const presignedUpload = usePresignedUpload();

      const saveMutation = useMutation({
         mutationFn: async () => {
            console.log("[Logo Upload] Starting mutation...");

            if (!fileUpload.selectedFile) {
               throw new Error("No file selected");
            }

            // Get file extension and content type
            const fileExtension =
               fileUpload.selectedFile.name.split(".").pop() ?? "png";
            const contentType = fileUpload.selectedFile.type;

            console.log("[Logo Upload] File details:", {
               name: fileUpload.selectedFile.name,
               size: fileUpload.selectedFile.size,
               type: contentType,
               extension: fileExtension,
            });

            // Generate presigned URL for MinIO upload
            console.log("[Logo Upload] Requesting presigned URL...");
            const uploadData =
               await orpc.organization.generateLogoUploadUrl.call({
                  fileExtension,
                  contentType,
               });
            console.log("[Logo Upload] Got presigned URL:", {
               presignedUrl: `${uploadData.presignedUrl.substring(0, 100)}...`,
               publicUrl: uploadData.publicUrl,
            });

            // Upload file to MinIO
            console.log("[Logo Upload] Uploading to MinIO...");
            await presignedUpload.uploadToPresignedUrl(
               uploadData.presignedUrl,
               fileUpload.selectedFile,
               contentType,
            );
            console.log("[Logo Upload] MinIO upload complete");

            // Update organization with logo path
            console.log(
               "[Logo Upload] Updating organization with logo URL:",
               uploadData.publicUrl,
            );
            await orpc.organization.updateLogo.call({
               logoUrl: uploadData.publicUrl,
            });
            console.log("[Logo Upload] Organization updated successfully");
         },
         onError: (error) => {
            console.error("[Logo Upload] Failed:", {
               error,
               message:
                  error instanceof Error ? error.message : "Unknown error",
               stack: error instanceof Error ? error.stack : undefined,
            });
            toast.error("Workspace criado, mas falha ao fazer upload do logo.");
         },
      });

      const form = useForm({
         defaultValues: {
            workspaceName: "",
         },
         onSubmit: async ({ value }) => {
            try {
               const slug = createSlug(value.workspaceName);

               const result = await authClient.organization.create({
                  name: value.workspaceName,
                  slug,
               });

               if (!result.data?.id) {
                  throw new Error("Failed to create organization");
               }

               const orgId = result.data.id;
               const orgSlug = result.data.slug ?? slug;

               await authClient.organization.setActive({
                  organizationId: orgId,
               });

               if (fileUpload.selectedFile) {
                  await saveMutation.mutateAsync();
               }

               toast.success("Workspace criado com sucesso!");
               onNext({ id: orgId, slug: orgSlug });
            } catch (error) {
               toast.error(
                  error instanceof Error
                     ? error.message
                     : "Erro ao criar workspace.",
               );
            }
         },
         validators: { onBlur: workspaceSchema },
      });

      useImperativeHandle(
         ref,
         () => ({
            submit: async () => {
               await form.handleSubmit();
               return true;
            },
            canContinue: true,
            isPending: isPending || saveMutation.isPending,
         }),
         [form, isPending, saveMutation.isPending],
      );

      useEffect(() => {
         const isProcessing = isPending || saveMutation.isPending;
         onStateChange({ canContinue: true, isPending: isProcessing });
      }, [isPending, saveMutation.isPending, onStateChange]);

      const handleSubmit = useCallback(
         (e: FormEvent) => {
            e.preventDefault();
            e.stopPropagation();
            startTransition(async () => {
               await form.handleSubmit();
            });
         },
         [form, startTransition],
      );

      return (
         <div className="space-y-6">
            <div className="space-y-2 text-center">
               <h2 className="font-serif text-2xl font-semibold">
                  Crie seu workspace
               </h2>
               <p className="text-sm text-muted-foreground">
                  Seu workspace organiza projetos, conteúdo e equipe.
               </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
               {/* Logo upload */}
               <div className="flex flex-col items-center gap-3">
                  {fileUpload.filePreview && (
                     <Avatar className="size-20 rounded-lg">
                        <AvatarImage
                           alt="Logo preview"
                           src={fileUpload.filePreview}
                        />
                        <AvatarFallback className="rounded-lg">
                           <Building2 className="size-8" />
                        </AvatarFallback>
                     </Avatar>
                  )}
                  <Dropzone
                     accept={{
                        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                     }}
                     className="h-20 w-full max-w-md"
                     maxFiles={1}
                     maxSize={5 * 1024 * 1024}
                     onDrop={(files) =>
                        fileUpload.handleFileSelect(files, () => {})
                     }
                  >
                     <DropzoneEmptyState>
                        <div className="flex flex-col items-center gap-1">
                           <Camera className="size-5 text-muted-foreground" />
                           <p className="text-xs text-muted-foreground">
                              Clique ou arraste para enviar o logo (opcional)
                           </p>
                        </div>
                     </DropzoneEmptyState>
                     <DropzoneContent>
                        <p className="text-xs text-muted-foreground">
                           Logo selecionado
                        </p>
                     </DropzoneContent>
                  </Dropzone>
                  {fileUpload.error && (
                     <p className="text-xs text-destructive">
                        {fileUpload.error}
                     </p>
                  )}
               </div>

               <FieldGroup>
                  <form.Field name="workspaceName">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Nome do Workspace
                              </FieldLabel>
                              <Input
                                 aria-invalid={isInvalid}
                                 autoComplete="organization"
                                 autoFocus
                                 disabled={isPending}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    const slug =
                                       e.target.value.length >= 2
                                          ? createSlug(e.target.value)
                                          : null;
                                    onSlugChange?.(slug);
                                 }}
                                 placeholder="Ex: Minha Empresa"
                                 value={field.state.value}
                              />
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>
               </FieldGroup>
            </form>
         </div>
      );
   },
);
