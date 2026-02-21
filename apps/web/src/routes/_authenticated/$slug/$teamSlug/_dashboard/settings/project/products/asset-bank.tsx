import { toMajorUnitsString } from "@f-o-t/money";
import { getImageGenerationPrice } from "@packages/events/pricing";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import {
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

const IMAGE_MODELS = [
   {
      id: "sourceful/riverflow-v2-pro",
      name: "Riverflow V2 Pro",
      description:
         "Melhor controle e renderização de texto. $0.15/imagem (1K/2K) · $0.33/imagem (4K).",
      price: getImageGenerationPrice("sourceful/riverflow-v2-pro"),
   },
   {
      id: "bytedance-seed/seedream-4.5",
      name: "Seedream 4.5",
      description:
         "Modelo ByteDance com foco em precisão artística e texto. $0.04/imagem.",
      price: getImageGenerationPrice("bytedance-seed/seedream-4.5"),
   },
] as const;

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/asset-bank",
)({
   component: AssetBankProductPage,
});

function AssetBankProductSkeleton() {
   return (
      <div className="space-y-6">
         <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
         </div>
         <Skeleton className="h-32 w-full" />
      </div>
   );
}

function ImageGenerationModelSection({
   current,
}: {
   current: string | undefined;
}) {
   const defaultModel = current ?? "sourceful/riverflow-v2-pro";
   const [model, setModel] = useState<string>(defaultModel);
   const queryClient = useQueryClient();

   useEffect(() => {
      if (current != null) setModel(current);
   }, [current]);

   const saveMutation = useMutation(
      orpc.productSettings.updateAiDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Modelo de geração de imagem atualizado.");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar modelo");
         },
      }),
   );

   const hasChanged = model !== defaultModel;

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Modelo padrão de geração</h2>
            <p className="text-sm text-muted-foreground">
               Modelo usado ao gerar imagens com IA no Banco de Imagens.
            </p>
         </div>
         <RadioGroup
            onValueChange={setModel}
            value={model}
            className="flex flex-col gap-4"
         >
            {IMAGE_MODELS.map((m) => (
               <div
                  className="flex items-start gap-3 rounded-lg border p-4"
                  key={m.id}
               >
                  <RadioGroupItem id={m.id} value={m.id} className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                     <Label
                        htmlFor={m.id}
                        className="flex cursor-pointer items-center gap-2 font-medium"
                     >
                        {m.name}
                        <Badge variant="secondary" className="font-normal">
                           ~R${toMajorUnitsString(m.price)}
                        </Badge>
                     </Label>
                     <p className="text-sm text-muted-foreground">
                        {m.description}
                     </p>
                  </div>
               </div>
            ))}
         </RadioGroup>
         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={() =>
               saveMutation.mutate({
                  imageGenerationModel: model as
                     | "sourceful/riverflow-v2-pro"
                     | "bytedance-seed/seedream-4.5",
               })
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

function AssetBankErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Banco de Imagens
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configurações do Banco de Imagens deste projeto.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

function AssetBankProductContent() {
   const { data: settings } = useSuspenseQuery(
      orpc.productSettings.getSettings.queryOptions({ input: {} }),
   );

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Banco de Imagens
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configurações do Banco de Imagens e geração de imagens com IA.
            </p>
         </div>

         <ImageGenerationModelSection
            current={settings?.aiDefaults?.imageGenerationModel}
         />
      </div>
   );
}

function AssetBankProductPage() {
   return (
      <ErrorBoundary FallbackComponent={AssetBankErrorFallback}>
         <Suspense fallback={<AssetBankProductSkeleton />}>
            <AssetBankProductContent />
         </Suspense>
      </ErrorBoundary>
   );
}
