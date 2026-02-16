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
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
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

   const renameMutation = useMutation({
      mutationFn: async () => {
         await authClient.organization.update({
            data: { name },
            organizationId,
         });
      },
      onSuccess: () => {
         toast.success("Organização renomeada com sucesso!");
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getActiveOrganization.queryOptions({})
               .queryKey,
         });
      },
      onError: () => {
         toast.error("Erro ao renomear organização");
      },
   });

   const hasChanged = name.trim() !== currentName && name.trim().length > 0;

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
               disabled={!hasChanged || renameMutation.isPending}
               onClick={() => renameMutation.mutate()}
               size="sm"
            >
               {renameMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
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
   organizationId,
   currentLogo,
   organizationName,
}: {
   organizationId: string;
   currentLogo: string | null;
   organizationName: string;
}) {
   const queryClient = useQueryClient();
   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

   const saveMutation = useMutation({
      mutationFn: async () => {
         await authClient.organization.update({
            data: { logo: fileUpload.filePreview || undefined },
            organizationId,
         });
      },
      onSuccess: () => {
         toast.success("Logo atualizado com sucesso!");
         fileUpload.clearFile();
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getActiveOrganization.queryOptions({})
               .queryKey,
         });
      },
      onError: () => {
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
               disabled={saveMutation.isPending}
               onClick={() => saveMutation.mutate()}
               size="sm"
            >
               {saveMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar logo
            </Button>
         )}
         {fileUpload.error && (
            <p className="text-sm text-destructive">{fileUpload.error}</p>
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
   const [copied, setCopied] = useState(false);

   const handleCopySlug = () => {
      navigator.clipboard.writeText(slug);
      setCopied(true);
      toast.success("Slug copiado!");
      setTimeout(() => setCopied(false), 2000);
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
