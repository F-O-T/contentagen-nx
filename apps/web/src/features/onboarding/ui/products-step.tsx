import { Checkbox } from "@packages/ui/components/checkbox";
import { CodeBlock } from "@packages/ui/components/code-block";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { cn } from "@packages/ui/lib/utils";
import { Code, FileText, LayoutDashboard } from "lucide-react";
import {
   forwardRef,
   useCallback,
   useEffect,
   useImperativeHandle,
   useState,
} from "react";
import { toast } from "sonner";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import type { StepHandle, StepState } from "./step-handle";

type Product = "content" | "analytics";

interface ProductCardData {
   id: Product;
   title: string;
   description: string;
   icon: React.ComponentType<{ className?: string }>;
}

const products: ProductCardData[] = [
   {
      id: "content",
      title: "Criar e publicar conteúdo",
      description: "Crie, edite e publique conteúdo com ajuda de IA",
      icon: FileText,
   },
   {
      id: "analytics",
      title: "Acompanhar performance do conteúdo",
      description: "Analise métricas e crie dashboards personalizados",
      icon: LayoutDashboard,
   },
];

const installCommands: Record<string, string> = {
   npm: "npm install @contentta/sdk",
   pnpm: "pnpm add @contentta/sdk",
   bun: "bun add @contentta/sdk",
};

const usageSnippets: Record<Product, string> = {
   content: `import { Contentta } from '@contentta/sdk'

const client = new Contentta({
  apiKey: 'your-api-key'
})

// Crie e publique conteúdo
const page = await client.content.create({
  title: 'Meu primeiro post',
  body: '...'
})`,
   analytics: `import { Contentta } from '@contentta/sdk'

const client = new Contentta({
  apiKey: 'your-api-key'
})

// Acompanhe eventos
client.capture('page_view', {
  url: window.location.href
})`,
};

interface ProductsStepProps {
   organizationId: string;
   teamId: string;
   teamSlug: string;
   onComplete: (slug: string, teamSlug: string) => void;
   onStateChange: (state: StepState) => void;
   isPending?: boolean;
}

export const ProductsStep = forwardRef<StepHandle, ProductsStepProps>(
   function ProductsStep(
      {
         organizationId: _organizationId,
         teamId,
         teamSlug,
         onComplete,
         onStateChange,
         isPending: isPendingProp = false,
      },
      ref,
   ) {
      const [selected, setSelected] = useState<Product[]>([]);

      const toggleProduct = useCallback((productId: Product) => {
         setSelected((prev) =>
            prev.includes(productId)
               ? prev.filter((p) => p !== productId)
               : [...prev, productId],
         );
      }, []);

      const handleComplete = useCallback(async () => {
         try {
            const result = await orpc.onboarding.completeOnboarding.call({
               products: selected,
            });

            await authClient.organization.setActiveTeam({ teamId });

            toast.success("Onboarding concluído!");
            onComplete(result.slug, teamSlug);
            return true;
         } catch (error) {
            toast.error(
               error instanceof Error
                  ? error.message
                  : "Erro ao concluir onboarding.",
            );
            return false;
         }
      }, [selected, teamId, teamSlug, onComplete]);

      const isPending = isPendingProp;

      const canContinue = selected.length > 0;

      useImperativeHandle(
         ref,
         () => ({
            submit: handleComplete,
            canContinue,
            isPending,
         }),
         [handleComplete, canContinue, isPending],
      );

      useEffect(() => {
         onStateChange({ canContinue, isPending });
      }, [canContinue, isPending, onStateChange]);

      const hasSelection = selected.length > 0;

      return (
         <div className="space-y-6">
            <div className="space-y-2 text-center">
               <h2 className="font-serif text-2xl font-semibold">
                  O que você quer fazer?
               </h2>
               <p className="text-sm text-muted-foreground">
                  Selecione os produtos para começar. Você pode mudar depois.
               </p>
            </div>

            <div
               className={cn(
                  "grid gap-6 transition-all duration-300",
                  hasSelection ? "md:grid-cols-2" : "grid-cols-1",
               )}
            >
               {/* Left column: product cards */}
               <div className="space-y-3">
                  {products.map((product) => {
                     const isSelected = selected.includes(product.id);
                     const Icon = product.icon;

                     return (
                        // biome-ignore lint/a11y/useSemanticElements: div with block-level children cannot use button element
                        <div
                           className={cn(
                              "flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all",
                              isSelected
                                 ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                 : "border-border hover:border-muted-foreground/30",
                              isPending && "cursor-not-allowed opacity-50",
                           )}
                           key={product.id}
                           onClick={() =>
                              !isPending && toggleProduct(product.id)
                           }
                           onKeyDown={(e) => {
                              if (
                                 !isPending &&
                                 (e.key === "Enter" || e.key === " ")
                              ) {
                                 e.preventDefault();
                                 toggleProduct(product.id);
                              }
                           }}
                           role="button"
                           tabIndex={isPending ? -1 : 0}
                        >
                           <div
                              className={cn(
                                 "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                                 isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                              )}
                           >
                              <Icon className="size-4" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                 {product.title}
                              </p>
                              <p className="text-muted-foreground text-xs truncate">
                                 {product.description}
                              </p>
                           </div>
                           <Checkbox
                              checked={isSelected}
                              className="shrink-0 pointer-events-none"
                              tabIndex={-1}
                           />
                        </div>
                     );
                  })}
               </div>

               {/* Right column: code preview */}
               {hasSelection && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 md:animate-in md:fade-in md:slide-in-from-right-4">
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Code className="size-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                           Quick start
                        </span>
                     </div>

                     <Tabs defaultValue="npm">
                        <TabsList variant="line">
                           <TabsTrigger value="npm">npm</TabsTrigger>
                           <TabsTrigger value="pnpm">pnpm</TabsTrigger>
                           <TabsTrigger value="bun">bun</TabsTrigger>
                        </TabsList>
                        {Object.entries(installCommands).map(([pm, cmd]) => (
                           <TabsContent key={pm} value={pm}>
                              <CodeBlock code={cmd} language="bash" />
                           </TabsContent>
                        ))}
                     </Tabs>

                     {selected.map((product) => (
                        <CodeBlock
                           code={usageSnippets[product]}
                           key={product}
                           language="typescript"
                        />
                     ))}
                  </div>
               )}
            </div>
         </div>
      );
   },
);
