import type { Asset } from "@packages/database/schemas/assets";
import { useFeatureFlag } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Input } from "@packages/ui/components/input";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
   FileIcon,
   ImageIcon,
   Loader2,
   Search,
   Sparkles,
   Trash2,
   Upload,
   X,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/assets/",
)({
   component: AssetsPage,
});

// ============================================================
// Skeletons
// ============================================================

function AssetsPageSkeleton() {
   return (
      <main className="flex flex-col gap-6">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
         </div>
         <Skeleton className="h-10 w-full max-w-sm" />
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
               <Skeleton
                  className="aspect-square rounded-lg"
                  key={`asset-skeleton-${i + 1}`}
               />
            ))}
         </div>
      </main>
   );
}

// ============================================================
// Error Fallback
// ============================================================

function AssetsPageErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
         <p className="text-sm text-muted-foreground">
            Não foi possível carregar o banco de imagens
         </p>
         <Button onClick={resetErrorBoundary} variant="outline">
            Tentar novamente
         </Button>
      </div>
   );
}

// ============================================================
// Unenrolled UI (feature flag gate)
// ============================================================

function AssetBankUnenrolled() {
   const { params } = Route.useMatch();

   return (
      <main className="flex flex-col items-center justify-center py-24 gap-6 text-center">
         <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
            <Sparkles className="size-8 text-orange-500" />
         </div>
         <div className="flex flex-col gap-2 max-w-sm">
            <h1 className="text-2xl font-bold font-serif">
               Banco de Imagens — Alpha
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
               Esta funcionalidade está em fase Alpha. Ative-a nas{" "}
               <Link
                  className="underline underline-offset-4 text-foreground font-medium"
                  params={{
                     slug: params.slug,
                     teamSlug: params.teamSlug,
                  }}
                  to="/$slug/$teamSlug/settings/feature-previews"
               >
                  Prévias de Funcionalidades
               </Link>{" "}
               para começar a usá-la.
            </p>
         </div>
      </main>
   );
}

// ============================================================
// Asset card
// ============================================================

interface AssetCardProps {
   asset: Asset;
   onDelete: (id: string) => void;
   isDeleting: boolean;
}

function AssetCard({ asset, onDelete, isDeleting }: AssetCardProps) {
   const [hovered, setHovered] = useState(false);
   const isImage = asset.mimeType.startsWith("image/");

   return (
      <div
         className="relative aspect-square rounded-lg overflow-hidden border bg-muted group cursor-default"
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
      >
         {isImage ? (
            <img
               alt={asset.alt ?? asset.filename}
               className="w-full h-full object-cover"
               src={asset.publicUrl}
            />
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
               <FileIcon className="size-8 text-muted-foreground" />
               <span className="text-xs text-muted-foreground truncate w-full text-center">
                  {asset.filename}
               </span>
            </div>
         )}

         {/* Hover overlay */}
         {hovered && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-2">
               <p className="text-xs text-white font-medium truncate w-full text-center">
                  {asset.filename}
               </p>
               <Button
                  className="size-8 text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  disabled={isDeleting}
                  onClick={() => onDelete(asset.id)}
                  size="icon"
                  variant="destructive"
               >
                  {isDeleting ? (
                     <Loader2 className="size-4 animate-spin" />
                  ) : (
                     <Trash2 className="size-4" />
                  )}
               </Button>
            </div>
         )}
      </div>
   );
}

// ============================================================
// Upload Dropzone
// ============================================================

interface AssetDropzoneProps {
   teamId: string;
}

function AssetDropzone({ teamId }: AssetDropzoneProps) {
   const queryClient = useQueryClient();
   const [isUploading, setIsUploading] = useState(false);

   const generateUploadUrlMutation = useMutation(
      orpc.assets.generateUploadUrl.mutationOptions(),
   );
   const completeUploadMutation = useMutation(
      orpc.assets.completeUpload.mutationOptions(),
   );

   const handleUpload = useCallback(
      async (files: File[]) => {
         if (files.length === 0) return;
         setIsUploading(true);

         try {
            for (const file of files) {
               const { presignedUrl, fileKey, publicUrl } =
                  await generateUploadUrlMutation.mutateAsync({
                     teamId,
                     filename: file.name,
                     mimeType: file.type,
                     size: file.size,
                  });

               await fetch(presignedUrl, {
                  body: file,
                  headers: { "Content-Type": file.type },
                  method: "PUT",
               });

               // Get image dimensions if it's an image
               let width: number | undefined;
               let height: number | undefined;
               if (file.type.startsWith("image/")) {
                  try {
                     const dims = await getImageDimensions(file);
                     width = dims.width;
                     height = dims.height;
                  } catch {
                     // ignore
                  }
               }

               await completeUploadMutation.mutateAsync({
                  teamId,
                  fileKey,
                  publicUrl,
                  filename: file.name,
                  mimeType: file.type,
                  size: file.size,
                  width,
                  height,
               });
            }

            toast.success(
               files.length === 1
                  ? "Imagem enviada com sucesso!"
                  : `${files.length} arquivos enviados com sucesso!`,
            );

            queryClient.invalidateQueries({
               queryKey: orpc.assets.list.queryOptions({
                  input: { teamId },
               }).queryKey,
            });
         } catch {
            toast.error("Falha ao enviar o arquivo. Tente novamente.");
         } finally {
            setIsUploading(false);
         }
      },
      [teamId, generateUploadUrlMutation, completeUploadMutation, queryClient],
   );

   const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
         "image/*": [],
         "application/pdf": [],
         "video/*": [],
      },
      disabled: isUploading,
      maxSize: 50 * 1024 * 1024, // 50MB
      onDrop: handleUpload,
   });

   return (
      <div
         {...getRootProps()}
         className={`
            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/60"}
            ${isUploading ? "opacity-60 cursor-not-allowed" : ""}
         `}
      >
         <input {...getInputProps()} />
         {isUploading ? (
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
         ) : (
            <Upload
               className={`size-8 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
            />
         )}
         <div className="text-center">
            <p className="text-sm font-medium">
               {isDragActive
                  ? "Solte os arquivos aqui"
                  : isUploading
                    ? "Enviando..."
                    : "Arraste arquivos ou clique para enviar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
               Imagens, vídeos e PDFs — até 50MB cada
            </p>
         </div>
      </div>
   );
}

// ============================================================
// Assets grid (suspense boundary)
// ============================================================

const PAGE_SIZE = 24;

interface AssetsGridProps {
   teamId: string;
   search: string;
   page: number;
   onTotalChange: (total: number) => void;
}

function AssetsGrid({ teamId, search, page, onTotalChange }: AssetsGridProps) {
   const queryClient = useQueryClient();
   const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

   const { data } = useSuspenseQuery(
      orpc.assets.list.queryOptions({
         input: {
            teamId,
            search: search || undefined,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
         },
      }),
   );

   // biome-ignore lint/correctness/useExhaustiveDependencies: onTotalChange is stable (setTotal from useState)
   useEffect(() => {
      onTotalChange(data.total ?? 0);
   }, [data.total]);

   const removeMutation = useMutation(
      orpc.assets.remove.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.assets.list.queryOptions({
                  input: { teamId },
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Falha ao excluir o arquivo. Tente novamente.");
         },
      }),
   );

   const handleDelete = useCallback(
      async (id: string) => {
         setDeletingIds((prev) => new Set(prev).add(id));
         try {
            await removeMutation.mutateAsync({ id });
            toast.success("Arquivo excluído com sucesso!");
         } finally {
            setDeletingIds((prev) => {
               const next = new Set(prev);
               next.delete(id);
               return next;
            });
         }
      },
      [removeMutation],
   );

   const assets: Asset[] = data.assets ?? [];

   if (assets.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ImageIcon className="size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
               {search
                  ? "Nenhum arquivo encontrado para sua busca."
                  : "Nenhum arquivo enviado ainda."}
            </p>
         </div>
      );
   }

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
         {assets.map((asset) => (
            <AssetCard
               asset={asset}
               isDeleting={deletingIds.has(asset.id)}
               key={asset.id}
               onDelete={handleDelete}
            />
         ))}
      </div>
   );
}

// ============================================================
// Grid skeleton (for inner suspense)
// ============================================================

function AssetsGridSkeleton() {
   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
         {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
               className="aspect-square rounded-lg"
               key={`grid-skeleton-${i + 1}`}
            />
         ))}
      </div>
   );
}

// ============================================================
// Generate Image Dialog
// ============================================================

interface GenerateImageDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   teamId: string;
}

function GenerateImageDialog({ open, onOpenChange, teamId }: GenerateImageDialogProps) {
   const queryClient = useQueryClient();
   const [prompt, setPrompt] = useState("");

   const generateMutation = useMutation(
      orpc.assets.generateImage.mutationOptions({
         onSuccess: () => {
            toast.success("Imagem gerada com sucesso!");
            queryClient.invalidateQueries({
               queryKey: orpc.assets.list.queryOptions({ input: { teamId } }).queryKey,
            });
            setPrompt("");
            onOpenChange(false);
         },
         onError: (err) => {
            toast.error(err.message ?? "Falha ao gerar imagem.");
         },
      }),
   );

   useEffect(() => {
      if (!open) setPrompt("");
   }, [open]);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!prompt.trim()) return;
      generateMutation.mutate({ prompt: prompt.trim(), teamId });
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-purple-500" />
                  Gerar Imagem com IA
               </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <Textarea
                  autoFocus
                  disabled={generateMutation.isPending}
                  maxLength={1000}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva a imagem que você quer gerar..."
                  rows={4}
                  value={prompt}
               />
               <DialogFooter>
                  <Button
                     disabled={!prompt.trim() || generateMutation.isPending}
                     type="submit"
                  >
                     {generateMutation.isPending ? (
                        <>
                           <Loader2 className="size-4 mr-2 animate-spin" />
                           Gerando...
                        </>
                     ) : (
                        <>
                           <Sparkles className="size-4 mr-2" />
                           Gerar
                        </>
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}

// ============================================================
// Main content component (behind feature flag)
// ============================================================

function AssetBankContent() {
   const { currentTeam } = Route.useRouteContext();
   const teamId = currentTeam.id;
   const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
   const [page, setPage] = useState(0);
   const [total, setTotal] = useState(0);
   const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

   const { enabled: aiImageEnabled } = useFeatureFlag("ai-image-generation");

   const hasNextPage = (page + 1) * PAGE_SIZE < total;

   const handleSearchChange = (value: string) => {
      setSearch(value);
      setPage(0);
   };

   const handleClearSearch = () => {
      setSearch("");
      setPage(0);
   };

   return (
      <main className="flex flex-col gap-6">
         {/* Header */}
         <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
               <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
                  Banco de Imagens
               </h1>
               <p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
                  Gerencie e envie imagens, vídeos e arquivos do seu projeto
               </p>
            </div>
            {aiImageEnabled && (
               <Button
                  className="shrink-0"
                  onClick={() => setGenerateDialogOpen(true)}
                  variant="outline"
               >
                  <Sparkles className="size-4 mr-2 text-purple-500" />
                  Gerar com IA
               </Button>
            )}
         </div>

         {aiImageEnabled && (
            <GenerateImageDialog
               open={generateDialogOpen}
               onOpenChange={setGenerateDialogOpen}
               teamId={teamId}
            />
         )}

         {/* Upload dropzone */}
         <AssetDropzone teamId={teamId} />

         {/* Search */}
         <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
               className="pl-9 pr-8"
               onChange={(e) => handleSearchChange(e.target.value)}
               placeholder="Buscar arquivos..."
               value={search}
            />
            {search && (
               <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={handleClearSearch}
                  type="button"
               >
                  <X className="size-4" />
               </button>
            )}
         </div>

         {/* Assets grid */}
         <ErrorBoundary FallbackComponent={AssetsPageErrorFallback}>
            <Suspense fallback={<AssetsGridSkeleton />}>
               <AssetsGrid
                  onTotalChange={setTotal}
                  page={page}
                  search={debouncedSearch}
                  teamId={teamId}
               />
            </Suspense>
         </ErrorBoundary>

         {/* Pagination */}
         <div className="flex items-center justify-center gap-2">
            <Button
               disabled={page === 0}
               onClick={() => setPage((p) => Math.max(0, p - 1))}
               variant="outline"
            >
               Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
               Página {page + 1} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </span>
            <Button
               disabled={!hasNextPage}
               onClick={() => setPage((p) => p + 1)}
               variant="outline"
            >
               Próxima
            </Button>
         </div>
      </main>
   );
}

// ============================================================
// Page component (with feature flag gate + suspense)
// ============================================================

function AssetsPageContent() {
   const { enabled: assetBankEnabled, loaded: flagLoaded } =
      useFeatureFlag("asset-bank");

   if (flagLoaded && !assetBankEnabled) {
      return <AssetBankUnenrolled />;
   }

   return <AssetBankContent />;
}

function AssetsPage() {
   return (
      <ErrorBoundary FallbackComponent={AssetsPageErrorFallback}>
         <Suspense fallback={<AssetsPageSkeleton />}>
            <AssetsPageContent />
         </Suspense>
      </ErrorBoundary>
   );
}

// ============================================================
// Utilities
// ============================================================

function getImageDimensions(
   file: File,
): Promise<{ width: number; height: number }> {
   return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
         URL.revokeObjectURL(url);
         resolve({ height: img.naturalHeight, width: img.naturalWidth });
      };
      img.onerror = (err) => {
         URL.revokeObjectURL(url);
         reject(err);
      };
      img.src = url;
   });
}
