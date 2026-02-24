import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import { getInitials } from "@packages/utils/text";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { orpc } from "@/integrations/orpc/client";

interface WriterPhotoUploadProps {
   writerId: string;
   currentPhotoUrl: string | null;
   writerName: string;
}

export function WriterPhotoUpload({
   writerId,
   currentPhotoUrl,
   writerName,
}: WriterPhotoUploadProps) {
   const fileInputRef = useRef<HTMLInputElement>(null);
   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });
   const presignedUpload = usePresignedUpload();
   const queryClient = useQueryClient();
   const [isSaving, startSaveTransition] = useTransition();
   const [isRemoving, startRemoveTransition] = useTransition();

   const isSaveLoading = isSaving || presignedUpload.isUploading;
   const isRemoveLoading = isRemoving;

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : null;
      fileUpload.handleFileSelect(files, () => {});
      // Reset input so the same file can be re-selected if cancelled
      e.target.value = "";
   };

   const handleSave = () => {
      if (!fileUpload.selectedFile) return;
      const file = fileUpload.selectedFile;

      presignedUpload.reset();
      startSaveTransition(async () => {
         try {
            const fileExtension = file.name.split(".").pop() ?? "jpg";

            const uploadData = await orpc.writer.generatePhotoUploadUrl.call({
               writerId,
               fileExtension,
            });

            await presignedUpload.uploadToPresignedUrl(
               uploadData.presignedUrl,
               file,
               file.type,
            );

            await orpc.writer.update.call({
               id: writerId,
               profilePhotoUrl: uploadData.publicUrl,
            });

            await queryClient.invalidateQueries(
               orpc.writer.getById.queryOptions({ input: { id: writerId } }),
            );

            toast.success("Foto atualizada");
            fileUpload.clearFile();
         } catch {
            toast.error("Erro ao fazer upload da foto");
         }
      });
   };

   const handleRemove = () => {
      startRemoveTransition(async () => {
         try {
            await orpc.writer.update.call({
               id: writerId,
               profilePhotoUrl: null,
            });

            await queryClient.invalidateQueries(
               orpc.writer.getById.queryOptions({ input: { id: writerId } }),
            );

            toast.success("Foto removida");
         } catch {
            toast.error("Erro ao remover foto");
         }
      });
   };

   const handleCancel = () => {
      presignedUpload.reset();
      fileUpload.clearFile();
   };

   const avatarSrc = fileUpload.filePreview || currentPhotoUrl || undefined;
   const hasSelectedFile = !!fileUpload.selectedFile;

   return (
      <div className="flex items-center gap-4">
         <Avatar className="size-16 rounded-lg">
            <AvatarImage alt={writerName} src={avatarSrc} />
            <AvatarFallback className="rounded-lg text-sm font-medium">
               {getInitials(writerName)}
            </AvatarFallback>
         </Avatar>

         <div className="flex flex-col gap-2">
            {hasSelectedFile ? (
               <div className="flex items-center gap-2">
                  <Button
                     disabled={isSaveLoading}
                     onClick={handleSave}
                     size="sm"
                  >
                     {isSaveLoading && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     Salvar foto
                  </Button>
                  <Button
                     disabled={isSaveLoading}
                     onClick={handleCancel}
                     size="sm"
                     variant="outline"
                  >
                     <X className="size-4 mr-2" />
                     Cancelar
                  </Button>
               </div>
            ) : (
               <div className="flex items-center gap-2">
                  <Button
                     disabled={isRemoveLoading}
                     onClick={() => fileInputRef.current?.click()}
                     size="sm"
                     variant="outline"
                  >
                     <Upload className="size-4 mr-2" />
                     {currentPhotoUrl ? "Trocar foto" : "Enviar foto"}
                  </Button>
                  {currentPhotoUrl && (
                     <Button
                        disabled={isRemoveLoading}
                        onClick={handleRemove}
                        size="sm"
                        variant="ghost"
                     >
                        {isRemoveLoading && (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        Remover
                     </Button>
                  )}
               </div>
            )}
         </div>

         <input
            accept="image/*"
            aria-label="Selecionar foto do escritor"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
         />
      </div>
   );
}
