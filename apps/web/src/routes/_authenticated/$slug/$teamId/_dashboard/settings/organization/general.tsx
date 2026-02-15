import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   Building2,
   Copy,
   Hash,
   ImageIcon,
   Pencil,
   Users,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/organization/general",
)({
   component: OrganizationGeneralPage,
});

// ============================================
// Skeleton
// ============================================

function OrganizationGeneralSkeleton() {
   return (
      <div className="space-y-6">
         <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-64 mt-1" />
         </div>

         <div className="space-y-3">
            <div>
               <Skeleton className="h-6 w-56" />
               <Skeleton className="h-4 w-72 mt-1" />
            </div>
            <div className="space-y-1">
               <Skeleton className="h-16 w-full rounded-lg" />
               <Skeleton className="h-16 w-full rounded-lg" />
               <Skeleton className="h-16 w-full rounded-lg" />
            </div>
         </div>

         <div className="space-y-3">
            <div>
               <Skeleton className="h-6 w-32" />
               <Skeleton className="h-4 w-48 mt-1" />
            </div>
            <div className="flex items-center gap-4">
               <Skeleton className="size-14 rounded-full" />
               <div>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32 mt-1" />
               </div>
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
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
            <Button variant="outline" onClick={resetErrorBoundary}>
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Main Content Component
// ============================================

function OrganizationGeneralContent() {
   const { data: activeOrganization } = useSuspenseQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   if (!activeOrganization) {
      throw new Error("No active organization found");
   }

   const memberCount = activeOrganization.members?.length ?? 0;

   const handleCopySlug = () => {
      navigator.clipboard.writeText(activeOrganization.slug);
      toast.success("Slug copiado para a área de transferência!");
   };

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Geral</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as informações da sua organização.
            </p>
         </div>

         <TooltipProvider>
            <section className="space-y-3">
               <div>
                  <h2 className="text-lg font-medium">Informações da Organização</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Gerencie o nome, logo e slug da organização
                  </p>
               </div>
               <ItemGroup>
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Building2 className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Nome da organização</ItemTitle>
                        <ItemDescription className="truncate">
                           {activeOrganization.name}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost">
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Editar nome</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Hash className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Slug</ItemTitle>
                        <ItemDescription className="truncate font-mono">
                           {activeOrganization.slug}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 onClick={handleCopySlug}
                                 size="icon"
                                 variant="ghost"
                              >
                                 <Copy className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Copiar slug</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <ImageIcon className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Logo</ItemTitle>
                        <ItemDescription>
                           {activeOrganization.logo
                              ? "Logo configurado"
                              : "Nenhum logo definido"}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost">
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Editar logo</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>
               </ItemGroup>
            </section>

            <section className="space-y-3">
               <div>
                  <h2 className="text-lg font-medium">Resumo</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Visão geral da organização
                  </p>
               </div>
               <div className="flex items-center gap-4">
                  <Avatar className="size-14">
                     <AvatarImage
                        alt={activeOrganization.name}
                        src={activeOrganization.logo || undefined}
                     />
                     <AvatarFallback className="text-lg">
                        <Building2 className="size-6" />
                     </AvatarFallback>
                  </Avatar>
                  <div>
                     <h3 className="font-semibold">{activeOrganization.name}</h3>
                     <p className="text-sm text-muted-foreground font-mono">
                        {activeOrganization.slug}
                     </p>
                  </div>
               </div>

               <ItemGroup>
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Users className="size-4" />
                     </ItemMedia>
                     <ItemContent>
                        <ItemTitle>Membros</ItemTitle>
                        <ItemDescription>
                           {memberCount}{" "}
                           {memberCount === 1
                              ? "membro"
                              : "membros"}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               </ItemGroup>
            </section>
         </TooltipProvider>
      </div>
   );
}

// ============================================
// Page Component
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
