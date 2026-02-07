import { CardContent } from "@packages/ui/components/card";
import { Card } from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
   BarChart3,
   FileInput,
   Globe,
   Search,
   Sparkles,
   Webhook,
} from "lucide-react";
import type { ReactNode } from "react";
import { orpc } from "@/integrations/orpc/client";
import { ProductCard } from "@/features/billing/ui/product-card";
import { SubProduct } from "@/features/billing/ui/sub-product";

// ============================================
// Category display configuration (pt-BR)
// ============================================

const CATEGORY_CONFIG: Record<
   string,
   { label: string; description: string; icon: ReactNode }
> = {
   content: {
      label: "Conteudo e Analytics",
      description:
         "Visualizacoes de pagina, engajamento e profundidade de scroll",
      icon: <BarChart3 className="size-8 text-blue-500" />,
   },
   ai: {
      label: "Inteligencia Artificial",
      description: "Completamentos IA, mensagens de chat e acoes de agentes",
      icon: <Sparkles className="size-8 text-violet-500" />,
   },
   form: {
      label: "Formularios e Conversoes",
      description: "Envios de formularios e rastreamento de conversoes",
      icon: <FileInput className="size-8 text-amber-500" />,
   },
   seo: {
      label: "SEO e Otimizacao",
      description: "Analise SEO e recomendacoes de otimizacao",
      icon: <Search className="size-8 text-emerald-500" />,
   },
   experiment: {
      label: "Experimentos",
      description: "Testes A/B e experimentos de conteudo",
      icon: <Globe className="size-8 text-rose-500" />,
   },
   webhook: {
      label: "Webhooks",
      description: "Entregas de webhook e notificacoes externas",
      icon: <Webhook className="size-8 text-cyan-500" />,
   },
};

// ============================================
// Types
// ============================================

interface CategorySummary {
   category: string;
   eventCount: number;
   monthToDateCost: number;
   projectedCost: number;
}

// ============================================
// CategoryProductCard Component
// ============================================

function CategoryProductCard({ category }: { category: CategorySummary }) {
   const config = CATEGORY_CONFIG[category.category];

   const { data: events, isLoading } = useQuery(
      orpc.billing.getCategoryUsage.queryOptions({
         input: {
            category: category.category as
               | "content"
               | "ai"
               | "form"
               | "seo"
               | "experiment"
               | "webhook"
               | "system",
         },
      }),
   );

   const totalFreeLimit =
      events?.reduce((sum, e) => sum + e.freeTierLimit, 0) ?? 0;

   return (
      <ProductCard
         currentUsage={category.eventCount}
         description={config?.description}
         expandable={!!events && events.length > 0}
         freeLimit={totalFreeLimit > 0 ? totalFreeLimit : undefined}
         icon={config?.icon}
         monthToDate={category.monthToDateCost}
         name={config?.label ?? category.category}
         projected={category.projectedCost}
      >
         {isLoading ? (
            <div className="space-y-3">
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-8 w-full" />
            </div>
         ) : (
            events?.map((event) => (
               <SubProduct
                  cost={event.monthToDateCost}
                  current={event.eventCount}
                  key={event.eventName}
                  limit={
                     event.freeTierLimit > 0 ? event.freeTierLimit : undefined
                  }
                  name={event.displayName}
               />
            ))
         )}
      </ProductCard>
   );
}

// ============================================
// BillingUsage Component
// ============================================

export function BillingUsage() {
   const { data } = useSuspenseQuery(
      orpc.billing.getCurrentUsage.queryOptions({}),
   );

   const sortedCategories = [...data.byCategory].sort(
      (a, b) => b.monthToDateCost - a.monthToDateCost,
   );

   return (
      <div className="space-y-6">
         <p className="text-sm text-muted-foreground">
            Acompanhe o uso de cada produto. Limites do plano gratuito sao
            resetados mensalmente.
         </p>

         {sortedCategories.map((cat) => (
            <CategoryProductCard category={cat} key={cat.category} />
         ))}

         {sortedCategories.length === 0 && (
            <Card>
               <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum uso registrado neste periodo
               </CardContent>
            </Card>
         )}
      </div>
   );
}
