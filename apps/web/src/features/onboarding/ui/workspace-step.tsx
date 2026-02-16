import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { Camera } from "lucide-react";
import {
   type ChangeEvent,
   type FormEvent,
   forwardRef,
   useCallback,
   useEffect,
   useImperativeHandle,
   useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
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
      const [isPending, setIsPending] = useState(false);

      const fileUpload = useFileUpload({
         maxSize: MAX_FILE_SIZE,
         acceptedTypes: ACCEPTED_TYPES,
         typeErrorMessage: "Formato inválido. Use PNG, JPG, GIF ou WebP.",
         sizeErrorMessage: "Arquivo muito grande. Máximo 5MB.",
      });

      const presignedUpload = usePresignedUpload();

      const form = useForm({
         defaultValues: {
            workspaceName: "",
         },
         onSubmit: async ({ value }) => {
            try {
               setIsPending(true);
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

               // Upload logo if selected
               if (fileUpload.selectedFile) {
                  try {
                     const fileExtension = fileUpload.selectedFile.name.split(".").pop() ?? "png";

                     // Get presigned URL
                     const uploadData = await orpc.organization.generateLogoUploadUrl({
                        fileExtension,
                        contentType: fileUpload.selectedFile.type,
                     });

                     // Upload to MinIO
                     await presignedUpload.uploadToPresignedUrl(
                        uploadData.presignedUrl,
                        fileUpload.selectedFile,
                        fileUpload.selectedFile.type,
                     );

                     // Update organization with logo URL
                     await authClient.organization.update({
                        organizationId: orgId,
                        data: { logo: uploadData.publicUrl },
                     });
                  } catch (uploadError) {
                     console.error("Logo upload failed:", uploadError);
                     toast.error("Workspace criado, mas falha ao fazer upload do logo.");
                  }
               }

               toast.success("Workspace criado com sucesso!");
               onNext({ id: orgId, slug: orgSlug });
            } catch (error) {
               toast.error(
                  error instanceof Error
                     ? error.message
                     : "Erro ao criar workspace.",
               );
            } finally {
               setIsPending(false);
            }
         },
         validators: { onBlur: workspaceSchema },
      });

      const handleFileChange = useCallback(
         (e: ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;

            fileUpload.handleFileSelect(Array.from(files));
         },
         [fileUpload],
      );

      useImperativeHandle(
         ref,
         () => ({
            submit: async () => {
               await form.handleSubmit();
               return true;
            },
            canContinue: true,
            isPending: isPending || fileUpload.isUploading || presignedUpload.isUploading,
         }),
         [form, isPending, fileUpload.isUploading, presignedUpload.isUploading],
      );

      useEffect(() => {
         const isProcessing = isPending || fileUpload.isUploading || presignedUpload.isUploading;
         onStateChange({ canContinue: true, isPending: isProcessing });
      }, [isPending, fileUpload.isUploading, presignedUpload.isUploading, onStateChange]);

      const handleSubmit = useCallback(
         (e: FormEvent) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
         },
         [form],
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
               {/* Circular logo upload */}
               <div className="flex flex-col items-center gap-2">
                  <label
                     className={cn(
                        "relative flex size-16 items-center justify-center rounded-full border-2 border-dashed transition-colors overflow-hidden cursor-pointer",
                        fileUpload.filePreview
                           ? "border-primary"
                           : "border-muted-foreground/30 hover:border-muted-foreground/50",
                        (isPending || fileUpload.isUploading || presignedUpload.isUploading) && "opacity-50 cursor-not-allowed",
                     )}
                  >
                     {fileUpload.filePreview ? (
                        <img
                           alt="Logo preview"
                           className="size-full object-cover"
                           src={fileUpload.filePreview}
                        />
                     ) : (
                        <Camera className="size-5 text-muted-foreground" />
                     )}
                     <input
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="hidden"
                        disabled={isPending || fileUpload.isUploading || presignedUpload.isUploading}
                        onChange={handleFileChange}
                        type="file"
                     />
                  </label>
                  <span className="text-xs text-muted-foreground">
                     Logo (opcional)
                  </span>
                  {fileUpload.error && (
                     <p className="text-xs text-destructive">{fileUpload.error}</p>
                  )}
                  {presignedUpload.error && (
                     <p className="text-xs text-destructive">{presignedUpload.error}</p>
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
