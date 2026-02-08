import { Button } from "@packages/ui/components/button";
import { Spinner } from "@packages/ui/components/spinner";
import { cn } from "@packages/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { ClipboardList, FileText, LayoutDashboard } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

type Product = "content" | "forms" | "analytics";

interface ProductCard {
   id: Product;
   title: string;
   description: string;
   icon: React.ComponentType<{ className?: string }>;
}

const products: ProductCard[] = [
   {
      id: "content",
      title: "Criar e publicar conteudo",
      description: "Crie, edite e publique conteudo com ajuda de IA",
      icon: FileText,
   },
   {
      id: "forms",
      title: "Coletar leads com formularios",
      description: "Crie formularios e colete respostas no seu site",
      icon: ClipboardList,
   },
   {
      id: "analytics",
      title: "Acompanhar performance do conteudo",
      description: "Analise metricas e crie dashboards personalizados",
      icon: LayoutDashboard,
   },
];

interface ProductSelectionStepProps {
   onNext: () => void;
   onSkipToEnd: () => void;
}

export function ProductSelectionStep({
   onNext,
   onSkipToEnd,
}: ProductSelectionStepProps) {
   const [selected, setSelected] = useState<Product[]>(["content"]);

   const mutation = useMutation(
      orpc.onboarding.selectProducts.mutationOptions({
         onSuccess: () => {
            const needsSdk =
               selected.includes("forms") || selected.includes("analytics");
            if (needsSdk) {
               onNext();
            } else {
               onSkipToEnd();
            }
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao salvar produtos.");
         },
      }),
   );

   const toggleProduct = useCallback((productId: Product) => {
      setSelected((prev) => {
         if (prev.includes(productId)) {
            // Don't allow deselecting if it's the last one
            if (prev.length === 1) return prev;
            return prev.filter((p) => p !== productId);
         }
         return [...prev, productId];
      });
   }, []);

   const handleContinue = useCallback(() => {
      mutation.mutate({ products: selected });
   }, [mutation, selected]);

   return (
      <div className="space-y-6">
         <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl font-semibold">
               O que voce quer fazer?
            </h2>
            <p className="text-sm text-muted-foreground">
               Selecione os produtos que deseja usar. Voce pode mudar depois.
            </p>
         </div>

         <div className="space-y-3">
            {products.map((product) => {
               const isSelected = selected.includes(product.id);
               const Icon = product.icon;

               return (
                  <button
                     className={cn(
                        "flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                        isSelected
                           ? "border-primary bg-primary/5"
                           : "border-border hover:border-muted-foreground/30",
                     )}
                     key={product.id}
                     onClick={() => toggleProduct(product.id)}
                     type="button"
                  >
                     <div
                        className={cn(
                           "flex size-10 shrink-0 items-center justify-center rounded-lg",
                           isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                        )}
                     >
                        <Icon className="size-5" />
                     </div>
                     <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{product.title}</p>
                        <p className="text-muted-foreground text-xs">
                           {product.description}
                        </p>
                     </div>
                     <div
                        className={cn(
                           "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                           isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30",
                        )}
                     >
                        {isSelected && (
                           <svg
                              className="size-3 text-primary-foreground"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                           >
                              <title>Selecionado</title>
                              <path
                                 d="M5 13l4 4L19 7"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                              />
                           </svg>
                        )}
                     </div>
                  </button>
               );
            })}
         </div>

         <Button
            className="h-11 w-full"
            disabled={selected.length === 0 || mutation.isPending}
            onClick={handleContinue}
         >
            {mutation.isPending ? <Spinner className="size-4" /> : "Continuar"}
         </Button>
      </div>
   );
}
