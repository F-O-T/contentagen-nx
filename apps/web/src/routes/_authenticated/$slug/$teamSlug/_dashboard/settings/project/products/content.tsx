import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import {
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/content",
)({
   component: ContentProductPage,
});

// ============================================
// Default Share Status Section
// ============================================

function DefaultShareStatusSection({
   current,
}: {
   current: "private" | "shared" | undefined;
}) {
   const [shareStatus, setShareStatus] = useState<
      "private" | "shared" | undefined
   >(current);
   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateContentDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Status de compartilhamento atualizado com sucesso!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar status de compartilhamento");
         },
      }),
   );

   const hasChanged = shareStatus !== current;

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">
               Status de compartilhamento padrão
            </h2>
            <p className="text-sm text-muted-foreground">
               Define se novos conteúdos serão privados ou compartilhados com a
               equipe.
            </p>
         </div>
         <RadioGroup
            onValueChange={(value) =>
               setShareStatus(value as "private" | "shared")
            }
            value={shareStatus}
         >
            <div className="flex items-center space-x-2">
               <RadioGroupItem id="share-private" value="private" />
               <Label htmlFor="share-private">Privado</Label>
            </div>
            <div className="flex items-center space-x-2">
               <RadioGroupItem id="share-shared" value="shared" />
               <Label htmlFor="share-shared">Compartilhado</Label>
            </div>
         </RadioGroup>
         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={() =>
               saveMutation.mutate({ defaultShareStatus: shareStatus })
            }
            size="sm"
         >
            {saveMutation.isPending && (
               <Loader2 className="size-4 mr-2 animate-spin" />
            )}
            Salvar
         </Button>
      </section>
   );
}

// ============================================
// Auto Slug Section
// ============================================

function AutoSlugSection({ current }: { current: boolean | undefined }) {
   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateContentDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Configuração de slug atualizada com sucesso!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar configuração de slug");
         },
      }),
   );

   const handleToggle = (checked: boolean) => {
      saveMutation.mutate({ autoGenerateSlug: checked });
   };

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Geração automática de slug</h2>
            <p className="text-sm text-muted-foreground">
               Quando ativado, gera automaticamente o slug baseado no título do
               conteúdo.
            </p>
         </div>
         <div className="flex items-center space-x-2">
            <Switch
               checked={current ?? false}
               disabled={saveMutation.isPending}
               onCheckedChange={handleToggle}
            />
            <Label>Gerar slug automaticamente</Label>
         </div>
      </section>
   );
}

// ============================================
// Skeleton
// ============================================

function ContentProductSkeleton() {
   return (
      <div className="space-y-8">
         <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-80 mt-1" />
         </div>
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-2">
               <Skeleton className="h-5 w-24" />
               <Skeleton className="h-5 w-24" />
               <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
         </div>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function ContentProductErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Conteúdo</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configurações padrão para criação de conteúdo neste projeto.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações de conteúdo
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

function ContentProductContent() {
   const { data: settings } = useSuspenseQuery(
      orpc.productSettings.getSettings.queryOptions({ input: {} }),
   );

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Conteúdo</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configurações padrão para criação de conteúdo neste projeto.
            </p>
         </div>

         <DefaultShareStatusSection
            current={settings?.contentDefaults?.defaultShareStatus}
         />

         <Separator />

         <AutoSlugSection
            current={settings?.contentDefaults?.autoGenerateSlug}
         />
      </div>
   );
}

// ============================================
// Page
// ============================================

function ContentProductPage() {
   return (
      <ErrorBoundary FallbackComponent={ContentProductErrorFallback}>
         <Suspense fallback={<ContentProductSkeleton />}>
            <ContentProductContent />
         </Suspense>
      </ErrorBoundary>
   );
}
