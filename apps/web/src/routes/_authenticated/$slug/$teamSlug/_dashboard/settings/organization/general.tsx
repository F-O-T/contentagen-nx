import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import {
   Building2,
   Calendar,
   Check,
   Copy,
   CreditCard,
   Hash,
   Loader2,
   Users,
} from "lucide-react";
import { Suspense, useState, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/general",
)({
   component: OrganizationGeneralPage,
});

function formatDate(date: Date | string | null): string {
   if (!date) return "-";
   const d = new Date(date);
   return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
   });
}

// ============================================
// Display Name Section
// ============================================

function DisplayNameSection({
   organizationId,
   currentName,
}: {
   organizationId: string;
   currentName: string;
}) {
   const [name, setName] = useState(currentName);
   const queryClient = useQueryClient();
   const [isPending, startTransition] = useTransition();

   const hasChanged = name.trim() !== currentName && name.trim().length > 0;

   function handleRename() {
      if (!hasChanged) return;
      startTransition(async () => {
         const { error } = await authClient.organization.update({
            data: { name },
            organizationId,
         });
         if (error) {
            toast.error("Erro ao renomear organização");
            return;
         }
         toast.success("Organização renomeada com sucesso!");
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getActiveOrganization.queryOptions({})
               .queryKey,
         });
      });
   }

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Nome de exibição</h2>
            <p className="text-sm text-muted-foreground">
               O nome público da sua organização. Visível para todos os membros.
            </p>
         </div>
         <div className="max-w-md space-y-3">
            <Input
               onChange={(e) => setName(e.target.value)}
               placeholder="Nome da organização"
               value={name}
            />
            <Button
               disabled={!hasChanged || isPending}
               onClick={handleRename}
               size="sm"
            >
               {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
               Renomear organização
            </Button>
         </div>
      </section>
   );
}

// ============================================
// Logo Section
// ============================================

function LogoSection({
   organizationId: _organizationId,
   currentLogo,
   organizationName,
}: {
   organizationId: string;
   currentLogo: string | null;
   organizationName: string;
}) {
   // DEBUG: Check what's available in orpc.organization
   console.log("[DEBUG] orpc keys:", Object.keys(orpc));
   console.log("[DEBUG] orpc.organization:", orpc.organization);
   console.log(
      "[DEBUG] orpc.organization keys:",
      Object.keys(orpc.organization),
   );
   console.log(
      "[DEBUG] orpc.organization.generateLogoUploadUrl:",
      orpc.organization.generateLogoUploadUrl,
   );
   console.log("[DEBUG] Type:", typeof orpc.organization.generateLogoUploadUrl);

   const queryClient = useQueryClient();
   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
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
         const uploadData = await orpc.organization.generateLogoUploadUrl.call({
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
      onSuccess: () => {
         toast.success("Logo atualizado com sucesso!");
         fileUpload.clearFile();
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getActiveOrganization.queryOptions({})
               .queryKey,
         });
      },
      onError: (error) => {
         console.error("[Logo Upload] Failed:", {
            error,
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
         });
         toast.error("Erro ao atualizar logo");
      },
   });

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Logo</h2>
            <p className="text-sm text-muted-foreground">
               A imagem da sua organização. Recomendamos 192x192 px ou maior.
            </p>
         </div>
         <div className="flex items-start gap-4">
            <Avatar className="size-16 rounded-lg">
               <AvatarImage
                  alt={organizationName}
                  src={fileUpload.filePreview || currentLogo || undefined}
               />
               <AvatarFallback className="rounded-lg">
                  <Building2 className="size-6" />
               </AvatarFallback>
            </Avatar>
            <div className="flex-1 max-w-xs">
               <Dropzone
                  accept={{
                     "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                  }}
                  className="h-20"
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  onDrop={(files) =>
                     fileUpload.handleFileSelect(files, () => {})
                  }
               >
                  <DropzoneEmptyState>
                     <p className="text-xs text-muted-foreground">
                        Clique ou arraste para enviar
                     </p>
                  </DropzoneEmptyState>
                  <DropzoneContent>
                     <p className="text-xs text-muted-foreground">
                        Imagem selecionada
                     </p>
                  </DropzoneContent>
               </Dropzone>
            </div>
         </div>
         {fileUpload.filePreview && (
            <Button
               disabled={saveMutation.isPending || presignedUpload.isUploading}
               onClick={() => saveMutation.mutate()}
               size="sm"
            >
               {(saveMutation.isPending || presignedUpload.isUploading) && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar logo
            </Button>
         )}
         {fileUpload.error && (
            <p className="text-sm text-destructive">{fileUpload.error}</p>
         )}
         {presignedUpload.error && (
            <p className="text-sm text-destructive">{presignedUpload.error}</p>
         )}
      </section>
   );
}

// ============================================
// Organization Details Section
// ============================================

function OrganizationDetailsSection({
   slug,
   memberCount,
   createdAt,
   plan,
}: {
   slug: string;
   memberCount: number;
   createdAt: Date | string | null;
   plan: string | null;
}) {
   const [lastCopied, copy] = useCopyToClipboard();
   const copied = lastCopied === slug;

   const handleCopySlug = () => {
      copy(slug);
      toast.success("Slug copiado!");
   };

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Detalhes da organização</h2>
            <p className="text-sm text-muted-foreground">
               Informações gerais sobre sua organização.
            </p>
         </div>
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Hash className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Slug</ItemTitle>
                  <ItemDescription>
                     <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                        {slug}
                     </code>
                  </ItemDescription>
               </ItemContent>
               <Button
                  className="size-7"
                  onClick={handleCopySlug}
                  size="icon"
                  variant="ghost"
               >
                  {copied ? (
                     <Check className="size-3.5" />
                  ) : (
                     <Copy className="size-3.5" />
                  )}
               </Button>
            </Item>

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Users className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Membros</ItemTitle>
                  <ItemDescription>
                     {memberCount} {memberCount === 1 ? "membro" : "membros"}
                  </ItemDescription>
               </ItemContent>
            </Item>

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Calendar className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Criada em</ItemTitle>
                  <ItemDescription>{formatDate(createdAt)}</ItemDescription>
               </ItemContent>
            </Item>

            {plan && (
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <CreditCard className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Plano</ItemTitle>
                     <ItemDescription className="capitalize">
                        {plan}
                     </ItemDescription>
                  </ItemContent>
               </Item>
            )}
         </div>
      </section>
   );
}

// ============================================
// Skeleton
// ============================================

function OrganizationGeneralSkeleton() {
   return (
      <div className="space-y-8">
         <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-64 mt-1" />
         </div>
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-8 w-48" />
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-4">
               <Skeleton className="size-16 rounded-lg" />
               <Skeleton className="h-20 w-64" />
            </div>
         </div>
         <Skeleton className="h-px w-full" />
         <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
         </div>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function OrganizationGeneralErrorFallback({
   resetErrorBoundary,
}: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Geral</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as informações da sua organização.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações da organização
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Main Content
// ============================================

function OrganizationGeneralContent() {
   const { data: activeOrganization } = useSuspenseQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   if (!activeOrganization) {
      throw new Error("No active organization found");
   }

   const memberCount = activeOrganization.members?.length ?? 0;

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Geral</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as informações da sua organização.
            </p>
         </div>

         <DisplayNameSection
            currentName={activeOrganization.name}
            organizationId={activeOrganization.id}
         />

         <Separator />

         <LogoSection
            currentLogo={activeOrganization.logo ?? null}
            organizationId={activeOrganization.id}
            organizationName={activeOrganization.name}
         />

         <Separator />

         <OrganizationDetailsSection
            createdAt={activeOrganization.createdAt}
            memberCount={memberCount}
            plan={activeOrganization.activeSubscription?.plan ?? "free"}
            slug={activeOrganization.slug}
         />
      </div>
   );
}

// ============================================
// Page
// ============================================

function OrganizationGeneralPage() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationGeneralErrorFallback}>
         <Suspense fallback={<OrganizationGeneralSkeleton />}>
            <OrganizationGeneralContent />
         </Suspense>
      </ErrorBoundary>
   );
}
