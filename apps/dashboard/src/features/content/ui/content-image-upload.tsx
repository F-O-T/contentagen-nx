import { Button } from "@packages/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
   compressImage,
   getCompressedFileName,
} from "@/features/file-upload/lib/image-compression";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { useTRPC } from "@/integrations/clients";

type ContentImageUploadProps = {
   contentId: string;
   currentImageUrl?: string | null;
   onImageChange?: (storageKey: string | null) => void;
};

export function ContentImageUpload({
   contentId,
   currentImageUrl,
   onImageChange,
}: ContentImageUploadProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const fileInputRef = useRef<HTMLInputElement>(null);

   const fileUpload = useFileUpload({
      acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
      maxSize: 10 * 1024 * 1024, // 10MB
   });

   const { uploadToPresignedUrl, isUploading: isUploadingToS3 } =
      usePresignedUpload();

   const requestUploadUrlMutation = useMutation(
      trpc.content.requestImageUploadUrl.mutationOptions(),
   );

   const confirmUploadMutation = useMutation(
      trpc.content.confirmImageUpload.mutationOptions({
         onSuccess: () => {
            toast.success("Imagem atualizada com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.getById.queryKey({ id: contentId }),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: () => {
            toast.error("Erro ao enviar imagem");
         },
      }),
   );

   const cancelUploadMutation = useMutation(
      trpc.content.cancelImageUpload.mutationOptions(),
   );

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
         fileUpload.handleFileSelect(Array.from(files));
      }
   };

   const handleUpload = async () => {
      if (!fileUpload.selectedFile) return;

      fileUpload.setUploading(true);
      let storageKey: string | null = null;

      try {
         // Compress the image to 1200x630 for header/og image
         const compressed = await compressImage(fileUpload.selectedFile, {
            format: "webp",
            maxHeight: 630,
            maxWidth: 1200,
            quality: 0.85,
         });

         const compressedFileName = getCompressedFileName(
            fileUpload.selectedFile.name,
            "webp",
         );

         // Request presigned URL
         const { presignedUrl, storageKey: key } =
            await requestUploadUrlMutation.mutateAsync({
               contentId,
               contentType: "image/webp",
               fileName: compressedFileName,
               fileSize: compressed.size,
            });

         storageKey = key;

         // Upload to S3
         await uploadToPresignedUrl(presignedUrl, compressed, "image/webp");

         // Confirm upload
         await confirmUploadMutation.mutateAsync({
            contentId,
            storageKey: key,
         });

         onImageChange?.(key);
         fileUpload.clearFile();
      } catch (error) {
         console.error("Content image upload error:", error);
         if (storageKey) {
            await cancelUploadMutation.mutateAsync({ storageKey });
         }
         toast.error("Erro ao enviar imagem");
      } finally {
         fileUpload.setUploading(false);
      }
   };

   const handleRemoveImage = async () => {
      try {
         await confirmUploadMutation.mutateAsync({ contentId, storageKey: "" });
         onImageChange?.(null);
      } catch (error) {
         console.error("Error removing image:", error);
         toast.error("Erro ao remover imagem");
      }
   };

   const isUploading =
      fileUpload.isUploading ||
      isUploadingToS3 ||
      requestUploadUrlMutation.isPending ||
      confirmUploadMutation.isPending;

   const previewUrl = fileUpload.filePreview || currentImageUrl;

   return (
      <div className="space-y-3">
         {previewUrl ? (
            <div className="relative group">
               <img
                  alt="Uploaded content preview"
                  className="w-full aspect-[1200/630] object-cover rounded-lg border"
                  src={previewUrl}
               />
               <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                     disabled={isUploading}
                     onClick={() => fileInputRef.current?.click()}
                     size="sm"
                     variant="secondary"
                  >
                     <ImagePlus className="size-4 mr-1" />
                     {"Alterar"}
                  </Button>
                  <Button
                     disabled={isUploading}
                     onClick={handleRemoveImage}
                     size="sm"
                     variant="destructive"
                  >
                     <Trash2 className="size-4 mr-1" />
                     {"Remover"}
                  </Button>
               </div>
            </div>
         ) : (
            <button
               className="w-full aspect-[1200/630] flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
               disabled={isUploading}
               onClick={() => fileInputRef.current?.click()}
               type="button"
            >
               {isUploading ? (
                  <Loader2 className="size-8 text-muted-foreground animate-spin" />
               ) : (
                  <ImagePlus className="size-8 text-muted-foreground" />
               )}
               <span className="text-sm text-muted-foreground">
                  {"Clique para adicionar imagem de capa"}
               </span>
               <span className="text-xs text-muted-foreground/70">
                  {"1200x630 recomendado"}
               </span>
            </button>
         )}

         <input
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
         />

         {fileUpload.selectedFile && (
            <div className="flex items-center justify-between gap-2 p-2 bg-accent/50 rounded-lg">
               <p className="text-sm text-muted-foreground truncate flex-1">
                  {fileUpload.selectedFile.name}
               </p>
               <Button disabled={isUploading} onClick={handleUpload} size="sm">
                  {isUploading ? (
                     <Loader2 className="size-4 animate-spin mr-1" />
                  ) : (
                     <Upload className="size-4 mr-1" />
                  )}
                  {"Enviar"}
               </Button>
            </div>
         )}
      </div>
   );
}
