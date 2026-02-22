import {
   AUTOCOMPLETE_MODELS,
   type AutocompleteModelId,
   CONTENT_MODELS,
   type ContentModelId,
   EDIT_MODELS,
   type EditModelId,
} from "@packages/agents/models";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Slider } from "@packages/ui/components/slider";
import { Switch } from "@packages/ui/components/switch";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   ChevronDown,
   Cpu,
   Database,
   Globe,
   Loader2,
   Search,
   Settings,
   ShieldCheck,
   Zap,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/ai-agents",
)({
   component: ProductsAiAgentsPage,
});

// Authoritative domains by category
const AUTHORITATIVE_DOMAINS = {
   statistics: [
      "statista.com",
      "pewresearch.org",
      "census.gov",
      "worldbank.org",
      "who.int",
      "cdc.gov",
   ],
   studies: [
      "nih.gov",
      "ncbi.nlm.nih.gov",
      "nature.com",
      "sciencedirect.com",
      "jstor.org",
      "pubmed.gov",
   ],
   quotes: [
      "forbes.com",
      "hbr.org",
      "bloomberg.com",
      "reuters.com",
      "nytimes.com",
      "wsj.com",
      "economist.com",
   ],
   examples: [
      "github.com",
      "stackoverflow.com",
      "medium.com",
      "dev.to",
      "freecodecamp.org",
   ],
   tlds: [".gov", ".edu", ".org"],
};

// ============================================
// Default Language Section
// ============================================

function DefaultLanguageSection({
   current,
}: {
   current: "pt-BR" | "en-US" | "es" | undefined;
}) {
   const [language, setLanguage] = useState<"pt-BR" | "en-US" | "es" | "">(
      current ?? "",
   );
   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateAiDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Idioma atualizado!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar idioma");
         },
      }),
   );

   const hasChanged = language !== current;

   const getLanguageLabel = (lang: "pt-BR" | "en-US" | "es") => {
      switch (lang) {
         case "pt-BR":
            return "🇧🇷 Português (Brasil)";
         case "en-US":
            return "🇺🇸 English (US)";
         case "es":
            return "🇪🇸 Español";
      }
   };

   return (
      <section className="space-y-3">
         <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-muted">
               <Globe className="size-5" />
            </div>
            <div className="flex-1">
               <h2 className="text-lg font-medium">Idioma padrão</h2>
               <p className="text-sm text-muted-foreground">
                  Idioma usado pelos agentes IA para gerar conteúdo.
               </p>
            </div>
         </div>
         <Select
            onValueChange={(value) =>
               setLanguage(value as "pt-BR" | "en-US" | "es")
            }
            value={language}
         >
            <SelectTrigger>
               <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="pt-BR">
                  {getLanguageLabel("pt-BR")}
               </SelectItem>
               <SelectItem value="en-US">
                  {getLanguageLabel("en-US")}
               </SelectItem>
               <SelectItem value="es">{getLanguageLabel("es")}</SelectItem>
            </SelectContent>
         </Select>
         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={() =>
               saveMutation.mutate({ defaultLanguage: language || undefined })
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
// Model Selection Section
// ============================================

function ModelSelectionSection({
   currentContentModel,
   currentAutocompleteModel,
   currentEditModel,
   currentContentTemperature,
   currentAutocompleteTemperature,
   currentEditTemperature,
   currentContentMaxTokens,
}: {
   currentContentModel: string | undefined;
   currentAutocompleteModel: string | undefined;
   currentEditModel: string | undefined;
   currentContentTemperature: number | undefined;
   currentAutocompleteTemperature: number | undefined;
   currentEditTemperature: number | undefined;
   currentContentMaxTokens: number | undefined;
}) {
   const initialContentTemp = currentContentTemperature ?? 0.7;
   const initialAutocompleteTemp = currentAutocompleteTemperature ?? 0.2;
   const initialEditTemp = currentEditTemperature ?? 0.4;

   const [contentModel, setContentModel] = useState<string>(
      currentContentModel ?? "",
   );
   const [autocompleteModel, setAutocompleteModel] = useState<string>(
      currentAutocompleteModel ?? "",
   );
   const [editModel, setEditModel] = useState<string>(currentEditModel ?? "");
   const [contentTemp, setContentTemp] = useState(initialContentTemp);
   const [autocompleteTemp, setAutocompleteTemp] = useState(
      initialAutocompleteTemp,
   );
   const [editTemp, setEditTemp] = useState(initialEditTemp);
   const [contentMaxTokens, setContentMaxTokens] = useState<number | undefined>(
      currentContentMaxTokens,
   );
   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateAiDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Modelos atualizados!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar modelos");
         },
      }),
   );

   const hasChanged =
      (contentModel || undefined) !== currentContentModel ||
      (autocompleteModel || undefined) !== currentAutocompleteModel ||
      (editModel || undefined) !== currentEditModel ||
      contentTemp !== initialContentTemp ||
      autocompleteTemp !== initialAutocompleteTemp ||
      editTemp !== initialEditTemp ||
      contentMaxTokens !== currentContentMaxTokens;

   const contentDescription =
      contentModel && contentModel in CONTENT_MODELS
         ? CONTENT_MODELS[contentModel as ContentModelId].description
         : "Selecione um modelo para geração de conteúdo.";
   const autocompleteDescription =
      autocompleteModel && autocompleteModel in AUTOCOMPLETE_MODELS
         ? AUTOCOMPLETE_MODELS[autocompleteModel as AutocompleteModelId]
              .description
         : "Selecione um modelo para autocomplete.";
   const editDescription =
      editModel && editModel in EDIT_MODELS
         ? EDIT_MODELS[editModel as EditModelId].description
         : "Selecione um modelo para edição de conteúdo.";

   return (
      <section className="space-y-3">
         <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-muted">
               <Cpu className="size-5" />
            </div>
            <div className="flex-1">
               <h2 className="text-lg font-medium">Modelos de IA</h2>
               <p className="text-sm text-muted-foreground">
                  Modelos usados para criação e edição de conteúdo.
               </p>
            </div>
         </div>
         <div className="space-y-6 pl-[52px]">
            <div className="space-y-4">
               <h3 className="text-sm font-medium">Conteúdo</h3>
               <div className="space-y-2">
                  <Label>Modelo de criação de conteúdo</Label>
                  <Select
                     onValueChange={(value) => setContentModel(value)}
                     value={contentModel}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                     </SelectTrigger>
                     <SelectContent>
                        {Object.entries(CONTENT_MODELS).map(
                           ([modelId, model]) => (
                              <SelectItem key={modelId} value={modelId}>
                                 {model.label}
                              </SelectItem>
                           ),
                        )}
                     </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                     {contentDescription}
                  </p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <Label>Temperatura</Label>
                     <span className="text-sm text-muted-foreground tabular-nums">
                        {contentTemp.toFixed(2)}
                     </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                     Baixa = consistente · Alta = criativo
                  </p>
                  <Slider
                     max={2}
                     min={0}
                     onValueChange={([value]) => {
                        if (value !== undefined) setContentTemp(value);
                     }}
                     step={0.05}
                     value={[contentTemp]}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Máx. tokens de saída</Label>
                  <p className="text-xs text-muted-foreground">
                     Comprimento máximo da resposta gerada
                  </p>
                  <Input
                     max={32768}
                     min={512}
                     onChange={(e) => {
                        const val = Number.parseInt(e.target.value, 10);
                        setContentMaxTokens(
                           Number.isNaN(val) ? undefined : val,
                        );
                     }}
                     placeholder="Padrão do modelo"
                     type="number"
                     value={contentMaxTokens ?? ""}
                  />
               </div>
            </div>

            <Separator />

            <div className="space-y-4">
               <h3 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="size-4" />
                  Autocomplete
               </h3>
               <div className="space-y-2">
                  <Label>Modelo de autocomplete</Label>
                  <Select
                     onValueChange={(value) => setAutocompleteModel(value)}
                     value={autocompleteModel}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                     </SelectTrigger>
                     <SelectContent>
                        {Object.entries(AUTOCOMPLETE_MODELS).map(
                           ([modelId, model]) => (
                              <SelectItem key={modelId} value={modelId}>
                                 {model.label}
                              </SelectItem>
                           ),
                        )}
                     </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                     {autocompleteDescription}
                  </p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <Label>Temperatura</Label>
                     <span className="text-sm text-muted-foreground tabular-nums">
                        {autocompleteTemp.toFixed(2)}
                     </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                     Baixa = consistente · Alta = criativo
                  </p>
                  <Slider
                     max={2}
                     min={0}
                     onValueChange={([value]) => {
                        if (value !== undefined) setAutocompleteTemp(value);
                     }}
                     step={0.05}
                     value={[autocompleteTemp]}
                  />
               </div>
            </div>

            <Separator />

            <div className="space-y-4">
               <h3 className="text-sm font-medium">Edição</h3>
               <div className="space-y-2">
                  <Label>Modelo de edição</Label>
                  <Select
                     onValueChange={(value) => setEditModel(value)}
                     value={editModel}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                     </SelectTrigger>
                     <SelectContent>
                        {Object.entries(EDIT_MODELS).map(([modelId, model]) => (
                           <SelectItem key={modelId} value={modelId}>
                              {model.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                     {editDescription}
                  </p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <Label>Temperatura</Label>
                     <span className="text-sm text-muted-foreground tabular-nums">
                        {editTemp.toFixed(2)}
                     </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                     Baixa = consistente · Alta = criativo
                  </p>
                  <Slider
                     max={2}
                     min={0}
                     onValueChange={([value]) => {
                        if (value !== undefined) setEditTemp(value);
                     }}
                     step={0.05}
                     value={[editTemp]}
                  />
               </div>
            </div>
         </div>
         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={() =>
               saveMutation.mutate({
                  contentModel:
                     contentModel && contentModel in CONTENT_MODELS
                        ? (contentModel as ContentModelId)
                        : undefined,
                  autocompleteModel:
                     autocompleteModel &&
                     autocompleteModel in AUTOCOMPLETE_MODELS
                        ? (autocompleteModel as AutocompleteModelId)
                        : undefined,
                  editModel:
                     editModel && editModel in EDIT_MODELS
                        ? (editModel as EditModelId)
                        : undefined,
                  contentTemperature: contentTemp,
                  autocompleteTemperature: autocompleteTemp,
                  editTemperature: editTemp,
                  contentMaxTokens,
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

// ============================================
// Web Search Config Section (Perplexity-style)
// ============================================

function WebSearchConfigSection({
   currentSearchDepth,
   currentSearchMaxResults,
   currentIncludeSearchAnswer,
   currentSearchTimeRange,
   currentPreferredSearchProvider,
   currentRequireAuthoritativeSources,
   currentMinCredibility,
}: {
   currentSearchDepth: "basic" | "advanced" | undefined;
   currentSearchMaxResults: number | undefined;
   currentIncludeSearchAnswer: boolean | undefined;
   currentSearchTimeRange:
      | "day"
      | "week"
      | "month"
      | "year"
      | "all"
      | undefined;
   currentPreferredSearchProvider: "tavily" | "exa" | "firecrawl" | undefined;
   currentRequireAuthoritativeSources: boolean | undefined;
   currentMinCredibility: "high" | "medium" | "low" | undefined;
}) {
   const [searchDepth, setSearchDepth] = useState<
      "basic" | "advanced" | undefined
   >(currentSearchDepth);
   const [searchMaxResults, setSearchMaxResults] = useState<number | undefined>(
      currentSearchMaxResults ?? 5,
   );
   const [includeSearchAnswer, setIncludeSearchAnswer] = useState<
      boolean | undefined
   >(currentIncludeSearchAnswer);
   const [searchTimeRange, setSearchTimeRange] = useState<
      "day" | "week" | "month" | "year" | "all" | undefined
   >(currentSearchTimeRange);
   const [preferredSearchProvider, setPreferredSearchProvider] = useState<
      "tavily" | "exa" | "firecrawl" | undefined
   >(currentPreferredSearchProvider);
   const [requireAuthoritativeSources, setRequireAuthoritativeSources] =
      useState<boolean | undefined>(currentRequireAuthoritativeSources);
   const [minCredibility, setMinCredibility] = useState<
      "high" | "medium" | "low" | undefined
   >(currentMinCredibility);
   const [isDomainsOpen, setIsDomainsOpen] = useState(false);

   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateAiDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Busca web configurada!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao configurar busca web");
         },
      }),
   );

   const hasChanged =
      searchDepth !== currentSearchDepth ||
      searchMaxResults !== currentSearchMaxResults ||
      includeSearchAnswer !== currentIncludeSearchAnswer ||
      searchTimeRange !== currentSearchTimeRange ||
      preferredSearchProvider !== currentPreferredSearchProvider ||
      requireAuthoritativeSources !== currentRequireAuthoritativeSources ||
      minCredibility !== currentMinCredibility;

   const handleSave = () => {
      saveMutation.mutate({
         searchDepth,
         searchMaxResults,
         includeSearchAnswer,
         searchTimeRange,
         preferredSearchProvider,
         requireAuthoritativeSources,
         minCredibility,
      });
   };

   return (
      <section className="space-y-4">
         <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-muted">
               <Search className="size-5" />
            </div>
            <div className="flex-1">
               <h2 className="text-lg font-medium">
                  Configuração de busca web
               </h2>
               <p className="text-sm text-muted-foreground">
                  Controle como os agentes pesquisam informações na web.
               </p>
            </div>
         </div>

         <div className="space-y-4 pl-[52px]">
            {/* Search Depth */}
            <div className="space-y-2">
               <Label>Profundidade de busca padrão</Label>
               <p className="text-sm text-muted-foreground">
                  Basic: rápido 2-3s | Advanced: profundo 5-10s
               </p>
               <Select
                  onValueChange={(value) =>
                     setSearchDepth(value as "basic" | "advanced")
                  }
                  value={searchDepth}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Selecione a profundidade" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="basic">
                        <div className="flex items-center gap-2">
                           <Badge variant="default">Rápido</Badge>
                           Basic
                        </div>
                     </SelectItem>
                     <SelectItem value="advanced">
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary">Profundo</Badge>
                           Advanced
                        </div>
                     </SelectItem>
                  </SelectContent>
               </Select>
            </div>

            {/* Max Results */}
            <div className="space-y-2">
               <Label>Máximo de resultados por busca</Label>
               <p className="text-sm text-muted-foreground">
                  Mais fontes = melhor síntese (1-20)
               </p>
               <Input
                  max={20}
                  min={1}
                  onChange={(e) => {
                     const val = Number.parseInt(e.target.value, 10);
                     if (!Number.isNaN(val)) setSearchMaxResults(val);
                  }}
                  type="number"
                  value={searchMaxResults}
               />
            </div>

            {/* Include Answer */}
            <div className="space-y-2">
               <div className="flex items-center space-x-2">
                  <Switch
                     checked={includeSearchAnswer ?? false}
                     onCheckedChange={setIncludeSearchAnswer}
                  />
                  <Label>Incluir resposta sintetizada</Label>
               </div>
               <p className="text-sm text-muted-foreground">
                  Agente sintetiza resposta de múltiplas fontes
               </p>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
               <Label>Filtro de atualidade</Label>
               <p className="text-sm text-muted-foreground">
                  Priorizar resultados recentes
               </p>
               <Select
                  onValueChange={(value) =>
                     setSearchTimeRange(
                        value as "day" | "week" | "month" | "year" | "all",
                     )
                  }
                  value={searchTimeRange}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="day">Último dia</SelectItem>
                     <SelectItem value="week">Última semana</SelectItem>
                     <SelectItem value="month">Último mês</SelectItem>
                     <SelectItem value="year">Último ano</SelectItem>
                     <SelectItem value="all">Sem filtro</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            {/* Preferred Provider */}
            <div className="space-y-2">
               <Label>Provedor preferencial</Label>
               <p className="text-sm text-muted-foreground">
                  Provedor preferencial com auto-fallback
               </p>
               <Select
                  onValueChange={(value) =>
                     setPreferredSearchProvider(
                        value === "none"
                           ? undefined
                           : (value as "tavily" | "exa" | "firecrawl"),
                     )
                  }
                  value={preferredSearchProvider ?? "none"}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">Auto-seleção</SelectItem>
                     <SelectItem value="tavily">Tavily</SelectItem>
                     <SelectItem value="exa">Exa</SelectItem>
                     <SelectItem value="firecrawl">Firecrawl</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            {/* Authoritative Sources */}
            <div className="space-y-2">
               <div className="flex items-center space-x-2">
                  <Switch
                     checked={requireAuthoritativeSources ?? false}
                     onCheckedChange={setRequireAuthoritativeSources}
                  />
                  <Label className="flex items-center gap-2">
                     <ShieldCheck className="size-4" />
                     Exigir fontes autorizadas
                  </Label>
               </div>
               <p className="text-sm text-muted-foreground">
                  Apenas .gov/.edu/.org + domínios verificados
               </p>
               <Collapsible
                  onOpenChange={setIsDomainsOpen}
                  open={isDomainsOpen}
               >
                  <CollapsibleTrigger asChild>
                     <Button
                        className="flex items-center gap-1"
                        size="sm"
                        variant="ghost"
                     >
                        <ChevronDown
                           className={`size-4 transition-transform ${isDomainsOpen ? "rotate-180" : ""}`}
                        />
                        Ver domínios autorizados
                     </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                     <div className="rounded-lg border p-3 text-xs space-y-2">
                        <div>
                           <p className="font-medium">Estatísticas:</p>
                           <p className="text-muted-foreground">
                              {AUTHORITATIVE_DOMAINS.statistics.join(", ")}
                           </p>
                        </div>
                        <div>
                           <p className="font-medium">Estudos:</p>
                           <p className="text-muted-foreground">
                              {AUTHORITATIVE_DOMAINS.studies.join(", ")}
                           </p>
                        </div>
                        <div>
                           <p className="font-medium">Citações:</p>
                           <p className="text-muted-foreground">
                              {AUTHORITATIVE_DOMAINS.quotes.join(", ")}
                           </p>
                        </div>
                        <div>
                           <p className="font-medium">Exemplos:</p>
                           <p className="text-muted-foreground">
                              {AUTHORITATIVE_DOMAINS.examples.join(", ")}
                           </p>
                        </div>
                        <div>
                           <p className="font-medium">TLDs autorizados:</p>
                           <p className="text-muted-foreground">
                              {AUTHORITATIVE_DOMAINS.tlds.join(", ")}
                           </p>
                        </div>
                     </div>
                  </CollapsibleContent>
               </Collapsible>
            </div>

            {/* Min Credibility */}
            <div className="space-y-2">
               <Label>Nível mínimo de credibilidade</Label>
               <p className="text-sm text-muted-foreground">
                  Nível mínimo de credibilidade para fatos
               </p>
               <Select
                  onValueChange={(value) =>
                     setMinCredibility(value as "high" | "medium" | "low")
                  }
                  value={minCredibility}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="high">Alto</SelectItem>
                     <SelectItem value="medium">Médio</SelectItem>
                     <SelectItem value="low">Baixo</SelectItem>
                  </SelectContent>
               </Select>
            </div>
         </div>

         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={handleSave}
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
// RAG Config Section
// ============================================

function RagConfigSection({
   currentRagEnabled,
   currentRagMaxResults,
   currentRagMinScore,
}: {
   currentRagEnabled: boolean | undefined;
   currentRagMaxResults: number | undefined;
   currentRagMinScore: number | undefined;
}) {
   const [ragEnabled, setRagEnabled] = useState<boolean | undefined>(
      currentRagEnabled,
   );
   const [ragMaxResults, setRagMaxResults] = useState<number | undefined>(
      currentRagMaxResults ?? 10,
   );
   const [ragMinScore, setRagMinScore] = useState<number | undefined>(
      currentRagMinScore ?? 0.5,
   );

   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateAiDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Configuração RAG atualizada!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar configuração RAG");
         },
      }),
   );

   const hasChanged =
      ragEnabled !== currentRagEnabled ||
      ragMaxResults !== currentRagMaxResults ||
      ragMinScore !== currentRagMinScore;

   return (
      <section className="space-y-4">
         <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-muted">
               <Database className="size-5" />
            </div>
            <div className="flex-1">
               <h2 className="text-lg font-medium">Configuração RAG</h2>
               <p className="text-sm text-muted-foreground">
                  Recuperação de informações do banco de dados de conteúdo.
               </p>
            </div>
         </div>

         <div className="space-y-4 pl-[52px]">
            <div className="space-y-2">
               <div className="flex items-center space-x-2">
                  <Switch
                     checked={ragEnabled ?? false}
                     onCheckedChange={setRagEnabled}
                  />
                  <Label>Ativar RAG</Label>
               </div>
               <p className="text-sm text-muted-foreground">
                  Usar conteúdo existente como contexto para novos conteúdos
               </p>
            </div>

            {ragEnabled && (
               <>
                  <div className="space-y-2">
                     <Label>Máximo de resultados</Label>
                     <p className="text-sm text-muted-foreground">
                        Número de documentos recuperados (1-50)
                     </p>
                     <Input
                        max={50}
                        min={1}
                        onChange={(e) => {
                           const val = Number.parseInt(e.target.value, 10);
                           if (!Number.isNaN(val)) setRagMaxResults(val);
                        }}
                        type="number"
                        value={ragMaxResults}
                     />
                  </div>

                  <div className="space-y-2">
                     <Label>Score mínimo</Label>
                     <p className="text-sm text-muted-foreground">
                        Similaridade mínima para incluir documento (0.0-1.0)
                     </p>
                     <Input
                        max={1}
                        min={0}
                        onChange={(e) => {
                           const val = Number.parseFloat(e.target.value);
                           if (!Number.isNaN(val)) setRagMinScore(val);
                        }}
                        step={0.1}
                        type="number"
                        value={ragMinScore}
                     />
                  </div>
               </>
            )}
         </div>

         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={() =>
               saveMutation.mutate({
                  ragEnabled,
                  ragMaxResults,
                  ragMinScore,
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

// ============================================
// Limits Section
// ============================================

function LimitsSection({
   currentMaxChatTokens,
   currentMaxReasoningSteps,
}: {
   currentMaxChatTokens: number | undefined;
   currentMaxReasoningSteps: number | undefined;
}) {
   const [maxChatTokens, setMaxChatTokens] = useState<number | undefined>(
      currentMaxChatTokens ?? 4096,
   );
   const [maxReasoningSteps, setMaxReasoningSteps] = useState<
      number | undefined
   >(currentMaxReasoningSteps ?? 10);

   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateAiDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Limites atualizados!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar limites");
         },
      }),
   );

   const hasChanged =
      maxChatTokens !== currentMaxChatTokens ||
      maxReasoningSteps !== currentMaxReasoningSteps;

   return (
      <section className="space-y-4">
         <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-muted">
               <Settings className="size-5" />
            </div>
            <div className="flex-1">
               <h2 className="text-lg font-medium">Limites</h2>
               <p className="text-sm text-muted-foreground">
                  Controle de custos e recursos dos agentes IA.
               </p>
            </div>
         </div>

         <div className="space-y-4 pl-[52px]">
            <div className="space-y-2">
               <Label>Limite de tokens por chat</Label>
               <p className="text-sm text-muted-foreground">
                  Limite de tokens por interação de chat (100-10000)
               </p>
               <Input
                  max={10000}
                  min={100}
                  onChange={(e) => {
                     const val = Number.parseInt(e.target.value, 10);
                     if (!Number.isNaN(val)) setMaxChatTokens(val);
                  }}
                  type="number"
                  value={maxChatTokens}
               />
            </div>

            <div className="space-y-2">
               <Label>Passos máximos de raciocínio</Label>
               <p className="text-sm text-muted-foreground">
                  Passos máximos de raciocínio do agente (1-20)
               </p>
               <Input
                  max={20}
                  min={1}
                  onChange={(e) => {
                     const val = Number.parseInt(e.target.value, 10);
                     if (!Number.isNaN(val)) setMaxReasoningSteps(val);
                  }}
                  type="number"
                  value={maxReasoningSteps}
               />
            </div>
         </div>

         <Button
            disabled={!hasChanged || saveMutation.isPending}
            onClick={() =>
               saveMutation.mutate({
                  maxChatTokens,
                  maxReasoningSteps,
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

// ============================================
// Skeleton
// ============================================

function AiAgentsSkeleton() {
   return (
      <div className="space-y-8">
         <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-80 mt-1" />
         </div>
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-20" />
         </div>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function AiAgentsErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Agentes IA</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as configurações padrão dos agentes IA.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações dos agentes IA
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

function AiAgentsContent() {
   const { data: settings } = useSuspenseQuery(
      orpc.productSettings.getSettings.queryOptions({ input: {} }),
   );

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Agentes IA</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as configurações padrão dos agentes IA.
            </p>
         </div>

         <DefaultLanguageSection
            current={settings?.aiDefaults?.defaultLanguage}
         />

         <Separator />

         <ModelSelectionSection
            currentAutocompleteModel={settings?.aiDefaults?.autocompleteModel}
            currentAutocompleteTemperature={
               settings?.aiDefaults?.autocompleteTemperature
            }
            currentContentMaxTokens={settings?.aiDefaults?.contentMaxTokens}
            currentContentModel={settings?.aiDefaults?.contentModel}
            currentContentTemperature={settings?.aiDefaults?.contentTemperature}
            currentEditModel={settings?.aiDefaults?.editModel}
            currentEditTemperature={settings?.aiDefaults?.editTemperature}
         />

         <Separator />

         <WebSearchConfigSection
            currentIncludeSearchAnswer={
               settings?.aiDefaults?.includeSearchAnswer
            }
            currentMinCredibility={settings?.aiDefaults?.minCredibility}
            currentPreferredSearchProvider={
               settings?.aiDefaults?.preferredSearchProvider ?? undefined
            }
            currentRequireAuthoritativeSources={
               settings?.aiDefaults?.requireAuthoritativeSources
            }
            currentSearchDepth={settings?.aiDefaults?.searchDepth}
            currentSearchMaxResults={settings?.aiDefaults?.searchMaxResults}
            currentSearchTimeRange={settings?.aiDefaults?.searchTimeRange}
         />

         <Separator />

         <RagConfigSection
            currentRagEnabled={settings?.aiDefaults?.ragEnabled}
            currentRagMaxResults={settings?.aiDefaults?.ragMaxResults}
            currentRagMinScore={settings?.aiDefaults?.ragMinScore}
         />

         <Separator />

         <LimitsSection
            currentMaxChatTokens={settings?.aiDefaults?.maxChatTokens}
            currentMaxReasoningSteps={settings?.aiDefaults?.maxReasoningSteps}
         />
      </div>
   );
}

// ============================================
// Page
// ============================================

function ProductsAiAgentsPage() {
   return (
      <ErrorBoundary FallbackComponent={AiAgentsErrorFallback}>
         <Suspense fallback={<AiAgentsSkeleton />}>
            <AiAgentsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
