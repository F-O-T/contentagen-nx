import { toMajorUnitsString } from "@f-o-t/money";
import {
   getImageGenerationPrice,
   getImageGenerationPriceMinorUnits,
} from "@packages/events/ai";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Choicebox,
   ChoiceboxIndicator,
   ChoiceboxItem,
   ChoiceboxItemDescription,
   ChoiceboxItemHeader,
   ChoiceboxItemTitle,
} from "@packages/ui/components/choicebox";
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Search, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

type ModelId =
   | "sourceful/riverflow-v2-pro"
   | "sourceful/riverflow-v2-fast"
   | "bytedance-seed/seedream-4.5"
   | "black-forest-labs/flux.2-klein-4b"
   | "black-forest-labs/flux.2-pro"
   | "black-forest-labs/flux.2-flex"
   | "black-forest-labs/flux.2-max"
   | "google/gemini-2.5-flash-image"
   | "google/gemini-3-pro-image-preview"
   | "openai/gpt-5-image";

type ImageModel = {
   id: ModelId;
   name: string;
   description: string;
   tags: string[];
};

type ModelGroup = {
   label: string;
   provider: string;
   models: ImageModel[];
};

const IMAGE_MODEL_GROUPS: ModelGroup[] = [
   {
      label: "Sourceful Riverflow",
      provider: "Sourceful",
      models: [
         {
            id: "sourceful/riverflow-v2-pro",
            name: "Riverflow V2 Pro",
            description:
               "Melhor controle e renderização de texto. $0.15/img (1K/2K) · $0.33/img (4K).",
            tags: ["Alta qualidade", "Texto preciso", "4K"],
         },
         {
            id: "sourceful/riverflow-v2-fast",
            name: "Riverflow V2 Fast",
            description:
               "Variante mais rápida para produção e workflows com baixa latência. $0.02/img (1K) · $0.04/img (2K).",
            tags: ["Rápido", "Produção"],
         },
      ],
   },
   {
      label: "Black Forest Labs FLUX.2",
      provider: "Black Forest Labs",
      models: [
         {
            id: "black-forest-labs/flux.2-klein-4b",
            name: "FLUX.2 Klein 4B",
            description:
               "Modelo mais rápido e econômico da família FLUX.2. $0.014 por megapixel.",
            tags: ["Econômico", "Alto throughput"],
         },
         {
            id: "black-forest-labs/flux.2-pro",
            name: "FLUX.2 Pro",
            description:
               "Alta qualidade visual e confiabilidade para produção. $0.03 por MP de saída.",
            tags: ["Qualidade", "Produção"],
         },
         {
            id: "black-forest-labs/flux.2-flex",
            name: "FLUX.2 Flex",
            description:
               "Excelente em tipografia e detalhes finos, edição multi-referência. $0.06/MP.",
            tags: ["Tipografia", "Multi-referência"],
         },
         {
            id: "black-forest-labs/flux.2-max",
            name: "FLUX.2 Max",
            description:
               "Topo de linha em qualidade, compreensão de prompt e consistência de edição. $0.07/MP.",
            tags: ["Premium", "Máxima qualidade"],
         },
      ],
   },
   {
      label: "Google Gemini",
      provider: "Google",
      models: [
         {
            id: "google/gemini-2.5-flash-image",
            name: "Gemini 2.5 Flash Image",
            description:
               "Geração de imagens com entendimento contextual, edições e conversas multi-turno.",
            tags: ["Multimodal", "Multi-turno"],
         },
         {
            id: "google/gemini-3-pro-image-preview",
            name: "Gemini 3 Pro Image",
            description:
               "Síntese visual avançada com grounding, texto em imagem e identidade preservada.",
            tags: ["Premium", "Texto em imagem", "2K/4K"],
         },
      ],
   },
   {
      label: "ByteDance",
      provider: "ByteDance",
      models: [
         {
            id: "bytedance-seed/seedream-4.5",
            name: "Seedream 4.5",
            description:
               "Foco em precisão artística e renderização de texto. $0.04/imagem.",
            tags: ["Arte", "Econômico"],
         },
      ],
   },
   {
      label: "OpenAI",
      provider: "OpenAI",
      models: [
         {
            id: "openai/gpt-5-image",
            name: "GPT-5 Image",
            description:
               "GPT-5 com geração de imagens de ponta — raciocínio avançado, renderização de texto e edição detalhada.",
            tags: ["Premium", "Raciocínio avançado"],
         },
      ],
   },
];

const ALL_PROVIDERS = IMAGE_MODEL_GROUPS.map((g) => g.provider);
const ALL_TAGS = [
   ...new Set(
      IMAGE_MODEL_GROUPS.flatMap((g) => g.models.flatMap((m) => m.tags)),
   ),
];

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/asset-bank",
)({
   component: AssetBankProductPage,
});

function AssetBankProductSkeleton() {
   return (
      <div className="space-y-8">
         <div className="space-y-2">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-80" />
         </div>
         <div className="space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-9 w-full" />
            <div className="flex gap-2">
               {["a", "b", "c", "d", "e"].map((k) => (
                  <Skeleton className="h-7 w-20 rounded-full" key={k} />
               ))}
            </div>
            <div className="flex flex-col gap-3 mt-4">
               {["s1", "s2", "s3", "s4"].map((k) => (
                  <Skeleton className="h-16 w-full rounded-xl" key={k} />
               ))}
            </div>
         </div>
      </div>
   );
}

function ModelFilterBar({
   search,
   onSearchChange,
   activeProviders,
   onProvidersChange,
   activeTags,
   onTagsChange,
   cheapestOnly,
   onCheapestOnlyChange,
}: {
   search: string;
   onSearchChange: (v: string) => void;
   activeProviders: string[];
   onProvidersChange: (v: string[]) => void;
   activeTags: string[];
   onTagsChange: (v: string[]) => void;
   cheapestOnly: boolean;
   onCheapestOnlyChange: (v: boolean) => void;
}) {
   const hasActiveFilters =
      search.length > 0 ||
      activeProviders.length > 0 ||
      activeTags.length > 0 ||
      cheapestOnly;

   return (
      <div className="space-y-3">
         {/* Search input */}
         <InputGroup>
            <InputGroupAddon align="inline-start">
               <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
               onChange={(e) => onSearchChange(e.target.value)}
               placeholder="Buscar modelos..."
               value={search}
            />
            {search.length > 0 && (
               <InputGroupAddon align="inline-end">
                  <button
                     aria-label="Limpar busca"
                     className="text-muted-foreground hover:text-foreground transition-colors"
                     onClick={() => onSearchChange("")}
                     type="button"
                  >
                     <X className="size-3.5" />
                  </button>
               </InputGroupAddon>
            )}
         </InputGroup>

         {/* Provider chips */}
         <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
               Provider
            </p>
            <ToggleGroup
               className="flex-wrap justify-start"
               onValueChange={onProvidersChange}
               spacing={2}
               type="multiple"
               value={activeProviders}
               variant="outline"
            >
               {ALL_PROVIDERS.map((p) => (
                  <ToggleGroupItem
                     aria-label={`Filtrar por ${p}`}
                     className="h-7 px-2.5 text-xs rounded-full data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                     key={p}
                     value={p}
                  >
                     {p}
                  </ToggleGroupItem>
               ))}
            </ToggleGroup>
         </div>

         {/* Tag chips */}
         <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
               Características
            </p>
            <ToggleGroup
               className="flex-wrap justify-start"
               onValueChange={onTagsChange}
               spacing={2}
               type="multiple"
               value={activeTags}
               variant="outline"
            >
               {ALL_TAGS.map((tag) => (
                  <ToggleGroupItem
                     aria-label={`Filtrar por ${tag}`}
                     className="h-7 px-2.5 text-xs rounded-full data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                     key={tag}
                     value={tag}
                  >
                     {tag}
                  </ToggleGroupItem>
               ))}
            </ToggleGroup>
         </div>

         {/* Cheapest filter chip */}
         <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
               Preço
            </p>
            <ToggleGroup
               className="flex-wrap justify-start"
               onValueChange={(vals: string[]) =>
                  onCheapestOnlyChange(vals.includes("cheapest"))
               }
               spacing={2}
               type="multiple"
               value={cheapestOnly ? ["cheapest"] : []}
               variant="outline"
            >
               <ToggleGroupItem
                  aria-label="Mostrar apenas os modelos mais baratos"
                  aria-pressed={cheapestOnly}
                  className="h-7 px-2.5 text-xs rounded-full data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                  value="cheapest"
               >
                  Mais barato
               </ToggleGroupItem>
            </ToggleGroup>
         </div>

         {/* Clear all filters */}
         {hasActiveFilters && (
            <button
               className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
               onClick={() => {
                  onSearchChange("");
                  onProvidersChange([]);
                  onTagsChange([]);
                  onCheapestOnlyChange(false);
               }}
               type="button"
            >
               Limpar filtros
            </button>
         )}
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

   // Filter state
   const [search, setSearch] = useState("");
   const [activeProviders, setActiveProviders] = useState<string[]>([]);
   const [activeTags, setActiveTags] = useState<string[]>([]);
   const [cheapestOnly, setCheapestOnly] = useState(false);

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

   const filteredGroups = useMemo(() => {
      const q = search.trim().toLowerCase();

      // Step 1: apply search + provider + tag filters
      const afterFilters = IMAGE_MODEL_GROUPS.map((group) => {
         if (
            activeProviders.length > 0 &&
            !activeProviders.includes(group.provider)
         ) {
            return { ...group, models: [] };
         }

         const filtered = group.models.filter((m) => {
            const matchesSearch =
               q.length === 0 ||
               m.name.toLowerCase().includes(q) ||
               m.description.toLowerCase().includes(q) ||
               m.tags.some((t) => t.toLowerCase().includes(q));

            const matchesTags =
               activeTags.length === 0 ||
               activeTags.every((tag) => m.tags.includes(tag));

            return matchesSearch && matchesTags;
         });

         return { ...group, models: filtered };
      }).filter((g) => g.models.length > 0);

      // Step 2: if cheapestOnly, further restrict to models at the minimum price
      // within the already-filtered set
      if (!cheapestOnly) return afterFilters;

      const allFilteredModels = afterFilters.flatMap((g) => g.models);
      if (allFilteredModels.length === 0) return afterFilters;

      const minPrice = Math.min(
         ...allFilteredModels.map((m) =>
            getImageGenerationPriceMinorUnits(m.id),
         ),
      );

      return afterFilters
         .map((group) => ({
            ...group,
            models: group.models.filter(
               (m) => getImageGenerationPriceMinorUnits(m.id) === minPrice,
            ),
         }))
         .filter((g) => g.models.length > 0);
   }, [search, activeProviders, activeTags, cheapestOnly]);

   const totalVisible = filteredGroups.reduce(
      (acc, g) => acc + g.models.length,
      0,
   );

   return (
      <section className="space-y-5">
         <div>
            <h2 className="text-base font-semibold tracking-tight">
               Modelo padrão de geração
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
               Modelo usado ao gerar imagens com IA no Banco de Imagens.
            </p>
         </div>

         <ModelFilterBar
            activeProviders={activeProviders}
            activeTags={activeTags}
            cheapestOnly={cheapestOnly}
            onCheapestOnlyChange={setCheapestOnly}
            onProvidersChange={setActiveProviders}
            onSearchChange={setSearch}
            onTagsChange={setActiveTags}
            search={search}
         />

         {totalVisible === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed">
               <p className="text-sm font-medium">Nenhum modelo encontrado</p>
               <p className="text-xs text-muted-foreground mt-1">
                  Tente ajustar os filtros ou a busca.
               </p>
            </div>
         ) : (
            <div className="space-y-6">
               {filteredGroups.map((group) => (
                  <div className="space-y-2" key={group.label}>
                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
                        {group.label}
                     </p>
                     <Choicebox onValueChange={setModel} value={model}>
                        {group.models.map((m) => {
                           const price = toMajorUnitsString(
                              getImageGenerationPrice(m.id),
                           );
                           return (
                              <ChoiceboxItem id={m.id} key={m.id} value={m.id}>
                                 <ChoiceboxIndicator id={m.id} />
                                 <ChoiceboxItemHeader>
                                    <ChoiceboxItemTitle>
                                       {m.name}
                                       <Badge
                                          className="text-xs px-1.5 py-0 h-4 font-normal"
                                          variant="secondary"
                                       >
                                          ~R${price}
                                       </Badge>
                                       {m.tags.map((tag) => (
                                          <Badge
                                             className="text-[10px] px-1.5 py-0 h-4 font-normal"
                                             key={tag}
                                             variant="outline"
                                          >
                                             {tag}
                                          </Badge>
                                       ))}
                                    </ChoiceboxItemTitle>
                                    <ChoiceboxItemDescription>
                                       {m.description}
                                    </ChoiceboxItemDescription>
                                 </ChoiceboxItemHeader>
                              </ChoiceboxItem>
                           );
                        })}
                     </Choicebox>
                  </div>
               ))}
            </div>
         )}

         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={() =>
               saveMutation.mutate({
                  imageGenerationModel: model as ModelId,
               })
            }
            size="sm"
         >
            {saveMutation.isPending ? (
               <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
               <Check className="size-4 mr-2" />
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
