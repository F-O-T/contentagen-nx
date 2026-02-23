import { toMajorUnitsString } from "@f-o-t/money";
import type { Asset } from "@packages/database/schemas/assets";
import { getImageGenerationPrice } from "@packages/events/ai";
import { useFeatureFlag } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import {
   useMutation,
   useQuery,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";
import {
   ChevronDown,
   Download,
   Eye,
   FileIcon,
   ImageIcon,
   Loader2,
   Pencil,
   Search,
   Sparkles,
   Trash2,
   Upload,
   X,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { client, orpc } from "@/integrations/orpc/client";

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
   onRename: (asset: Asset) => void;
   onView: (asset: Asset) => void;
   isDeleting: boolean;
}

function AssetCard({
   asset,
   onDelete,
   onRename,
   onView,
   isDeleting,
}: AssetCardProps) {
   const isImage = asset.mimeType.startsWith("image/");

   return (
      <div className="flex flex-col rounded-lg overflow-hidden border bg-muted">
         <div className="aspect-square overflow-hidden">
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
         </div>
         <TooltipProvider>
            <div className="flex items-center justify-center gap-1 border-t bg-background/80 px-1 py-1.5">
               {isImage && (
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           className="size-8 shrink-0"
                           onClick={() => onView(asset)}
                           size="icon"
                           variant="ghost"
                        >
                           <Eye className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Visualizar</TooltipContent>
                  </Tooltip>
               )}
               {isImage && (
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           asChild
                           className="size-8 shrink-0"
                           size="icon"
                           variant="ghost"
                        >
                           <a download={asset.filename} href={asset.publicUrl}>
                              <Download className="size-4" />
                           </a>
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Baixar</TooltipContent>
                  </Tooltip>
               )}
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8 shrink-0"
                        onClick={() => onRename(asset)}
                        size="icon"
                        variant="ghost"
                     >
                        <Pencil className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Renomear</TooltipContent>
               </Tooltip>
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className="size-8 shrink-0 text-destructive hover:text-destructive"
                        disabled={isDeleting}
                        onClick={() => onDelete(asset.id)}
                        size="icon"
                        variant="ghost"
                     >
                        {isDeleting ? (
                           <Loader2 className="size-4 animate-spin" />
                        ) : (
                           <Trash2 className="size-4" />
                        )}
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
               </Tooltip>
            </div>
         </TooltipProvider>
      </div>
   );
}

// ============================================================
// Upload Dropzone
// ============================================================

interface AssetDropzoneProps {
   teamId: string;
   onUploadComplete?: () => void;
}

function AssetDropzone({ teamId, onUploadComplete }: AssetDropzoneProps) {
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
                  : `${files.length} imagens enviadas com sucesso!`,
            );

            queryClient.invalidateQueries({
               queryKey: orpc.assets.list.queryOptions({
                  input: { teamId },
               }).queryKey,
            });
            onUploadComplete?.();
         } catch {
            toast.error("Falha ao enviar o arquivo. Tente novamente.");
         } finally {
            setIsUploading(false);
         }
      },
      [
         teamId,
         generateUploadUrlMutation,
         completeUploadMutation,
         queryClient,
         onUploadComplete,
      ],
   );

   const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
         "image/*": [],
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
               PNG, JPG, GIF, WebP, SVG — até 50MB cada
            </p>
         </div>
      </div>
   );
}

function AssetUploadCredenzaContent({
   teamId,
   onClose,
}: {
   teamId: string;
   onClose: () => void;
}) {
   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Upload de imagem</CredenzaTitle>
            <CredenzaDescription>
               Envie imagens de até 50MB (PNG, JPG, GIF, WebP, SVG).
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            <AssetDropzone onUploadComplete={onClose} teamId={teamId} />
         </CredenzaBody>
      </>
   );
}

function AssetViewContent({ asset }: { asset: Asset }) {
   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Visualizar arquivo</CredenzaTitle>
            <CredenzaDescription>{asset.filename}</CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            <div className="flex flex-col items-center gap-2">
               <img
                  alt={asset.alt ?? asset.filename}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                  src={asset.publicUrl}
               />
            </div>
         </CredenzaBody>
      </>
   );
}

function AssetRenameContent({
   asset,
   onClose,
   onSuccess,
}: {
   asset: Asset;
   onClose: () => void;
   onSuccess: () => void;
}) {
   const [filename, setFilename] = useState(asset.filename);

   const updateMutation = useMutation(
      orpc.assets.update.mutationOptions({
         onSuccess: () => {
            toast.success("Arquivo renomeado.");
            onClose();
            onSuccess();
         },
         onError: () => toast.error("Falha ao renomear. Tente novamente."),
      }),
   );

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = filename.trim();
      if (!trimmed) return;
      const lastDot = asset.filename.lastIndexOf(".");
      const ext = lastDot >= 0 ? asset.filename.slice(lastDot) : "";
      const base = trimmed;
      const finalFilename = base + ext;
      if (finalFilename === asset.filename) {
         onClose();
         return;
      }
      updateMutation.mutate({ id: asset.id, filename: finalFilename });
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Renomear arquivo</CredenzaTitle>
            <CredenzaDescription>
               Altere o nome do arquivo selecionado.
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
               <Input
                  disabled={updateMutation.isPending}
                  onChange={(e) => setFilename(e.target.value)}
                  value={filename}
               />
               <CredenzaFooter>
                  <Button
                     disabled={!filename.trim() || updateMutation.isPending}
                     type="submit"
                  >
                     {updateMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                     ) : (
                        "Salvar"
                     )}
                  </Button>
               </CredenzaFooter>
            </form>
         </CredenzaBody>
      </>
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
   const { closeCredenza, openCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();
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

   const executeDelete = useCallback(
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

   const handleDelete = useCallback(
      (id: string) => {
         openAlertDialog({
            title: "Excluir arquivo?",
            description:
               "Esta ação não pode ser desfeita. O arquivo será removido permanentemente.",
            actionLabel: "Excluir",
            cancelLabel: "Cancelar",
            variant: "destructive",
            onAction: async () => {
               await executeDelete(id);
            },
         });
      },
      [openAlertDialog, executeDelete],
   );

   const invalidateList = useCallback(() => {
      queryClient.invalidateQueries({
         queryKey: orpc.assets.list.queryOptions({ input: { teamId } })
            .queryKey,
      });
   }, [queryClient, teamId]);

   const handleView = useCallback(
      (asset: Asset) => {
         openCredenza({
            className: "max-w-[90vw] max-h-[90vh] p-2",
            children: <AssetViewContent asset={asset} />,
         });
      },
      [openCredenza],
   );

   const handleRename = useCallback(
      (asset: Asset) => {
         openCredenza({
            className: "sm:max-w-md",
            children: (
               <AssetRenameContent
                  asset={asset}
                  onClose={closeCredenza}
                  onSuccess={invalidateList}
               />
            ),
         });
      },
      [openCredenza, closeCredenza, invalidateList],
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
               onRename={handleRename}
               onView={handleView}
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

const IMAGE_MODEL_NAMES: Record<string, string> = {
   // Sourceful Riverflow
   "sourceful/riverflow-v2-pro": "Riverflow V2 Pro",
   "sourceful/riverflow-v2-fast": "Riverflow V2 Fast",
   // Black Forest Labs FLUX.2
   "black-forest-labs/flux.2-klein-4b": "FLUX.2 Klein 4B",
   "black-forest-labs/flux.2-pro": "FLUX.2 Pro",
   "black-forest-labs/flux.2-flex": "FLUX.2 Flex",
   "black-forest-labs/flux.2-max": "FLUX.2 Max",
   // Google Gemini
   "google/gemini-2.5-flash-image": "Gemini 2.5 Flash Image",
   "google/gemini-3-pro-image-preview": "Gemini 3 Pro Image",
   // ByteDance
   "bytedance-seed/seedream-4.5": "Seedream 4.5",
   // OpenAI
   "openai/gpt-5-image": "GPT-5 Image",
};

const ASPECT_OPTIONS = [
   { value: "1:1" as const, label: "1:1" },
   { value: "16:9" as const, label: "16:9" },
   { value: "9:16" as const, label: "9:16" },
   { value: "3:2" as const, label: "3:2" },
] as const;

function GenerateImageCredenzaContent({
   teamId,
   onClose,
}: {
   teamId: string;
   onClose: () => void;
}) {
   const queryClient = useQueryClient();
   const [prompt, setPrompt] = useState("");
   const [aspectRatio, setAspectRatio] = useState<
      "1:1" | "16:9" | "9:16" | "3:2"
   >("1:1");
   const [phase, setPhase] = useState<"idle" | "generating" | "done">("idle");
   const [generatedAsset, setGeneratedAsset] = useState<{
      id: string;
      publicUrl: string;
      filename: string;
      size: number;
      width: number | null;
      height: number | null;
   } | null>(null);
   const [elapsed, setElapsed] = useState(0);
   const abortControllerRef = useRef<AbortController | null>(null);

   const { data: settings } = useQuery(
      orpc.productSettings.getSettings.queryOptions({ input: {} }),
   );
   const modelId =
      settings?.aiDefaults?.imageGenerationModel ??
      "sourceful/riverflow-v2-pro";
   const modelPrice = toMajorUnitsString(getImageGenerationPrice(modelId));
   const modelName = IMAGE_MODEL_NAMES[modelId] ?? modelId;
   const isSeedream = modelId.includes("seedream");

   useEffect(() => {
      if (phase !== "generating") return;
      const id = setInterval(() => setElapsed((s) => s + 1), 1000);
      return () => clearInterval(id);
   }, [phase]);

   const generateMutation = useMutation({
      ...orpc.assets.generateImage.mutationOptions({
         onSuccess: (asset) => {
            setGeneratedAsset({
               id: asset.id,
               publicUrl: asset.publicUrl,
               filename: asset.filename,
               size: asset.size,
               width: asset.width ?? null,
               height: asset.height ?? null,
            });
            setPhase("done");
         },
         onError: (err) => {
            if (err.name === "AbortError") return;
            toast.error(err.message ?? "Falha ao gerar imagem.");
            setPhase("idle");
         },
      }),
      mutationFn: async ({
         prompt,
         teamId,
         aspectRatio,
         signal,
      }: {
         prompt: string;
         teamId: string;
         aspectRatio: "1:1" | "16:9" | "9:16" | "3:2";
         signal: AbortSignal;
      }) =>
         client.assets.generateImage(
            { prompt, teamId, aspectRatio },
            { signal },
         ),
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!prompt.trim()) return;
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      setElapsed(0);
      setPhase("generating");
      setGeneratedAsset(null);
      generateMutation.mutate({
         prompt: prompt.trim(),
         teamId,
         aspectRatio,
         signal: abortControllerRef.current.signal,
      });
   };

   const handleSaveAndClose = useCallback(() => {
      queryClient.invalidateQueries({
         queryKey: orpc.assets.list.queryOptions({ input: { teamId } })
            .queryKey,
      });
      toast.success("Imagem salva no banco.");
      onClose();
   }, [queryClient, teamId, onClose]);

   const handleGenerateAgain = useCallback(() => {
      setPhase("idle");
      setGeneratedAsset(null);
      setElapsed(0);
   }, []);

   const handleCancel = useCallback(() => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setPhase("idle");
      setGeneratedAsset(null);
   }, []);

   const isGenerating = phase === "generating" && generateMutation.isPending;

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle className="flex items-center gap-2">
               <Sparkles className="size-4 text-purple-500" />
               Gerar Imagem com IA
            </CredenzaTitle>
            <CredenzaDescription>
               {phase === "done" && generatedAsset
                  ? `Gerado em ${elapsed}s`
                  : `${modelName} · ~R$${modelPrice} por imagem`}
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            {phase === "generating" && (
               <div className="flex flex-col gap-4">
                  <Skeleton className="aspect-square w-full max-w-sm mx-auto rounded-lg animate-pulse" />
                  <p className="text-center text-sm text-muted-foreground">
                     Gerando... {elapsed}s
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                     <div className="h-full w-full animate-pulse rounded-full bg-primary/50" />
                  </div>
                  <div className="flex justify-end">
                     <Button
                        onClick={handleCancel}
                        size="sm"
                        type="button"
                        variant="ghost"
                     >
                        Cancelar
                     </Button>
                  </div>
               </div>
            )}
            {phase === "done" && generatedAsset && (
               <div className="flex flex-col gap-4">
                  <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-muted">
                     <img
                        alt={generatedAsset.filename}
                        className="object-contain w-full h-full"
                        src={generatedAsset.publicUrl}
                     />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                     {generatedAsset.filename}
                     {generatedAsset.width != null &&
                     generatedAsset.height != null
                        ? ` · ${generatedAsset.width}×${generatedAsset.height}`
                        : ""}{" "}
                     · {(generatedAsset.size / 1024).toFixed(0)} KB
                  </p>
                  <CredenzaFooter className="flex gap-2 justify-end">
                     <Button
                        onClick={handleGenerateAgain}
                        type="button"
                        variant="outline"
                     >
                        Gerar novamente
                     </Button>
                     <Button onClick={handleSaveAndClose} type="button">
                        Salvar no banco
                     </Button>
                  </CredenzaFooter>
               </div>
            )}
            {phase === "idle" && (
               <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                     <Textarea
                        autoFocus
                        disabled={isGenerating}
                        maxLength={1000}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Descreva a imagem que você quer gerar..."
                        rows={4}
                        value={prompt}
                     />
                     <p className="text-right text-xs text-muted-foreground">
                        {prompt.length}/1000
                     </p>
                  </div>
                  {!isSeedream && (
                     <div className="space-y-2">
                        <Label>Proporção</Label>
                        <RadioGroup
                           className="flex gap-4"
                           onValueChange={(v) =>
                              setAspectRatio(
                                 v as "1:1" | "16:9" | "9:16" | "3:2",
                              )
                           }
                           value={aspectRatio}
                        >
                           {ASPECT_OPTIONS.map((opt) => (
                              <div
                                 className="flex items-center gap-2"
                                 key={opt.value}
                              >
                                 <RadioGroupItem
                                    id={`aspect-${opt.value}`}
                                    value={opt.value}
                                 />
                                 <Label
                                    className="font-normal cursor-pointer"
                                    htmlFor={`aspect-${opt.value}`}
                                 >
                                    {opt.label}
                                 </Label>
                              </div>
                           ))}
                        </RadioGroup>
                     </div>
                  )}
                  <CredenzaFooter>
                     <Button
                        disabled={!prompt.trim() || isGenerating}
                        type="submit"
                     >
                        {isGenerating ? (
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
                  </CredenzaFooter>
               </form>
            )}
         </CredenzaBody>
      </>
   );
}

// ============================================================
// Main content component (behind feature flag)
// ============================================================

function AssetBankContent() {
   const { currentTeam } = Route.useRouteContext();
   const teamId = currentTeam.id;
   const { closeCredenza, openCredenza } = useCredenza();
   const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
   const [page, setPage] = useState(0);
   const [total, setTotal] = useState(0);

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
         <PageHeader
            actions={
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button className="shrink-0">
                        Adicionar imagem
                        <ChevronDown className="size-4 ml-2" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem
                        onClick={() =>
                           openCredenza({
                              className: "sm:max-w-md",
                              children: (
                                 <AssetUploadCredenzaContent
                                    onClose={closeCredenza}
                                    teamId={teamId}
                                 />
                              ),
                           })
                        }
                     >
                        <Upload className="size-4 mr-2" />
                        Upload de imagem
                     </DropdownMenuItem>
                     {aiImageEnabled && (
                        <DropdownMenuItem
                           onClick={() =>
                              openCredenza({
                                 className: "sm:max-w-md",
                                 children: (
                                    <GenerateImageCredenzaContent
                                       onClose={closeCredenza}
                                       teamId={teamId}
                                    />
                                 ),
                              })
                           }
                        >
                           <Sparkles className="size-4 mr-2 text-purple-500" />
                           Gerar com IA
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            }
            description="Gerencie e envie imagens do seu projeto"
            title="Banco de Imagens"
         />

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
