import {
   PLATFORM_ADDONS,
   PlanName,
   STRIPE_PLANS,
} from "@packages/stripe/constants";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import {
   type FeatureStage,
   FeatureStageBadge,
} from "@packages/ui/components/feature-stage-badge";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
   BarChart3,
   Calendar,
   Check,
   ChevronRight,
   CreditCard,
   Crown,
   ExternalLink,
   FileInput,
   Globe,
   HardDrive,
   HelpCircle,
   Network,
   Package,
   Receipt,
   Search,
   Sparkles,
   Webhook,
   Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useEarlyAccess } from "@/hooks/use-early-access";
import { orpc } from "@/integrations/orpc/client";

// ============================================
// Types
// ============================================

interface CategorySummary {
   category: string;
   eventCount: number;
   monthToDateCost: number;
   projectedCost: number;
}

interface EventUsage {
   eventName: string;
   eventCount: number;
   monthToDateCost: number;
   displayName: string;
   description: string | null;
   pricePerEvent: number | null;
   freeTierLimit: number;
}

// ============================================
// Constants
// ============================================

const CATEGORY_CONFIG: Record<
   string,
   { label: string; description: string; icon: ReactNode }
> = {
   content: {
      label: "Conteudo e Analytics",
      description:
         "Visualizacoes de pagina, engajamento e profundidade de scroll",
      icon: <BarChart3 className="size-5" />,
   },
   ai: {
      label: "Inteligencia Artificial",
      description: "Completamentos IA, mensagens de chat e acoes de agentes",
      icon: <Sparkles className="size-5" />,
   },
   form: {
      label: "Formularios e Conversoes",
      description: "Envios de formularios e rastreamento de conversoes",
      icon: <FileInput className="size-5" />,
   },
   seo: {
      label: "SEO e Otimizacao",
      description: "Analise SEO e recomendacoes de otimizacao",
      icon: <Search className="size-5" />,
   },
   experiment: {
      label: "Experimentos",
      description: "Testes A/B e experimentos de conteudo",
      icon: <Globe className="size-5" />,
   },
   cluster: {
      label: "Clusters de Conteudo",
      description: "Posts pillar, posts satelite e embeds de changelog",
      icon: <Network className="size-5" />,
   },
   webhook: {
      label: "Webhooks",
      description: "Entregas de webhook e notificacoes externas",
      icon: <Webhook className="size-5" />,
   },
};

// ---------------------------------------------------------------------------
// Early Access Gating
// ---------------------------------------------------------------------------

// Event-based categories gated by early access flag.
// To add a new gated category: add one entry here (flag key + fallback stage).
// The category must also exist in CATEGORY_CONFIG above.
const EARLY_ACCESS_CATEGORY_GATES: Record<
   string,
   { flag: string; fallbackStage: FeatureStage }
> = {
   content: { flag: "content", fallbackStage: "alpha" },
   form: { flag: "forms-beta", fallbackStage: "beta" },
   experiment: { flag: "experiments", fallbackStage: "alpha" },
   cluster: { flag: "content-clusters", fallbackStage: "alpha" },
};

// Volume-based (non-event) early access features.
// To add a new one: add one entry here — it shows up automatically when enrolled.
const VOLUME_FEATURE_CONFIG: Record<
   string,
   {
      label: string;
      description: string;
      icon: ReactNode;
      priceLabel: string;
      unit: string;
      fallbackStage: FeatureStage;
   }
> = {
   // Asset storage: Railway cost $0.15/GB — charged at R$ 1,50/GB/mês.
   "asset-bank": {
      label: "Banco de Imagens",
      description: "Armazenamento de imagens e mídia",
      icon: <HardDrive className="size-5" />,
      priceLabel: "R$ 1,50",
      unit: "GB/mês",
      fallbackStage: "alpha",
   },
};

// ============================================
// Helpers
// ============================================

function formatCurrency(value: number): string {
   return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
   });
}

function getBillingPeriodDates(): { start: Date; end: Date } {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
   return { start, end };
}

function formatPeriodDate(d: Date): string {
   return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
   });
}

function getDaysRemaining(): number {
   const now = new Date();
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
   return Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
   );
}

// ============================================
// Current Bill Header
// ============================================

function CurrentBillHeader({ monthToDate }: { monthToDate: number }) {
   return (
      <div>
         <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">
               Total do mes
            </span>
            <TooltipProvider>
               <Tooltip>
                  <TooltipTrigger>
                     <HelpCircle className="size-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                     <p>
                        Total acumulado baseado no uso de eventos neste periodo
                        de cobranca.
                     </p>
                  </TooltipContent>
               </Tooltip>
            </TooltipProvider>
         </div>
         <p className="text-4xl font-bold tracking-tight tabular-nums">
            {formatCurrency(monthToDate)}
         </p>
      </div>
   );
}

// ============================================
// Plan Banner
// ============================================

function PlanBanner({
   planName,
   planDisplayName,
}: {
   planName: string;
   planDisplayName: string;
}) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const isPro = planName === PlanName.PRO;
   const isFree = planName === PlanName.FREE;
   const PlanIcon = isPro ? Crown : Zap;

   return (
      <div className="rounded-lg bg-card border p-5 flex items-start justify-between gap-4">
         <div className="space-y-1.5">
            <div className="flex items-center gap-2">
               <PlanIcon className="size-5 text-primary" />
               <p className="font-semibold text-lg">Plano {planDisplayName}</p>
            </div>
            {isFree ? (
               <p className="text-sm text-muted-foreground">
                  Voce esta no plano gratuito. Faca upgrade para ter mais
                  creditos e recursos.
               </p>
            ) : (
               <p className="text-sm text-muted-foreground">
                  Seu plano inclui creditos mensais de IA e plataforma. Uso
                  acima dos creditos e cobrado por evento.
               </p>
            )}
         </div>
         {isFree && (
            <Button asChild size="sm" variant="default">
               <Link params={{ slug, teamSlug }} to="/$slug/$teamSlug/plans">
                  Ver planos
               </Link>
            </Button>
         )}
      </div>
   );
}

// ============================================
// Billing Period + Payment Link
// ============================================

function BillingPeriodSection() {
   const { start, end } = getBillingPeriodDates();
   const daysRemaining = getDaysRemaining();

   return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>
               Periodo de cobranca:{" "}
               <span className="font-medium text-foreground">
                  {formatPeriodDate(start)}
               </span>{" "}
               a{" "}
               <span className="font-medium text-foreground">
                  {formatPeriodDate(end)}
               </span>{" "}
               ({daysRemaining}{" "}
               {daysRemaining === 1 ? "dia restante" : "dias restantes"})
            </span>
         </div>
      </div>
   );
}

// ============================================
// Product Card (PostHog-style)
// ============================================

function OverviewProductCardSkeleton() {
   return (
      <div className="space-y-3 pt-4">
         <Skeleton className="h-6 w-full" />
         <Skeleton className="h-6 w-full" />
         <Skeleton className="h-6 w-full" />
      </div>
   );
}

function OverviewProductSubItems({ category }: { category: string }) {
   const { data: events, isLoading } = useQuery(
      orpc.billing.getCategoryUsage.queryOptions({
         input: {
            category: category as
               | "content"
               | "ai"
               | "form"
               | "seo"
               | "experiment"
               | "webhook"
               | "cluster"
               | "system",
         },
      }),
   );

   if (isLoading) {
      return <OverviewProductCardSkeleton />;
   }

   if (!events || events.length === 0) {
      return (
         <p className="text-sm text-muted-foreground py-3">
            Nenhum evento registrado nesta categoria
         </p>
      );
   }

   return (
      <div className="space-y-3 pt-4">
         {events.map((event: EventUsage) => {
            const hasLimit = event.freeTierLimit > 0;
            const percentage = hasLimit
               ? Math.min((event.eventCount / event.freeTierLimit) * 100, 100)
               : undefined;

            return (
               <div className="space-y-1.5" key={event.eventName}>
                  <div className="flex items-center justify-between text-sm">
                     <span>{event.displayName}</span>
                     <div className="flex items-center gap-4">
                        <span className="tabular-nums text-muted-foreground">
                           {event.eventCount.toLocaleString("pt-BR")}
                           {hasLimit && (
                              <span>
                                 {" "}
                                 / {event.freeTierLimit.toLocaleString("pt-BR")}
                              </span>
                           )}
                        </span>
                        <span className="tabular-nums font-medium w-20 text-right">
                           {formatCurrency(event.monthToDateCost)}
                        </span>
                     </div>
                  </div>
                  {percentage !== undefined && (
                     <Progress className="h-1" value={percentage} />
                  )}
               </div>
            );
         })}
      </div>
   );
}

function OverviewProductCard({
   category,
   stage,
   enrolled = true,
}: {
   category: CategorySummary;
   stage?: FeatureStage;
   enrolled?: boolean;
}) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const config = CATEGORY_CONFIG[category.category];
   if (!config) return null;

   return (
      <Card className={!enrolled ? "opacity-70" : ""}>
         <Collapsible>
            <CardHeader className="pb-3">
               <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                     <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                        {config.icon}
                     </div>
                     <div className="min-w-0">
                        <CardTitle className="text-base">
                           {config.label}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                           {config.description}
                        </CardDescription>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     {stage && <FeatureStageBadge stage={stage} />}
                     {!enrolled && (
                        <Button asChild size="sm" variant="outline">
                           <Link
                              params={{ slug, teamSlug }}
                              to="/$slug/$teamSlug/settings/feature-previews"
                           >
                              Ativar
                           </Link>
                        </Button>
                     )}
                  </div>
               </div>
            </CardHeader>

            {enrolled && (
               <CardContent className="space-y-4">
                  {/* Usage bar + stats row */}
                  <div className="flex items-center gap-4">
                     <CollapsibleTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <ChevronRight className="size-4 transition-transform [[data-state=open]_&]:rotate-90" />
                     </CollapsibleTrigger>

                     <div className="flex-1 flex items-center gap-6">
                        {/* Current usage */}
                        <div className="text-sm">
                           <span className="text-muted-foreground">Atual</span>
                           <p className="font-medium tabular-nums">
                              {category.eventCount.toLocaleString("pt-BR")}
                           </p>
                        </div>

                        {/* Progress bar area */}
                        <div className="flex-1">
                           <Progress
                              className="h-2"
                              value={
                                 category.projectedCost > 0
                                    ? Math.min(
                                         (category.monthToDateCost /
                                            category.projectedCost) *
                                            100,
                                         100,
                                      )
                                    : 0
                              }
                           />
                        </div>

                        {/* Costs */}
                        <div className="flex items-center gap-6 shrink-0">
                           <div className="text-right">
                              <span className="text-lg font-semibold tabular-nums">
                                 {formatCurrency(category.monthToDateCost)}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                 No mes
                              </p>
                           </div>
                           <div className="text-right">
                              <span className="text-lg font-semibold tabular-nums">
                                 {formatCurrency(category.projectedCost)}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                 Projetado
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Expandable sub-items */}
                  <CollapsibleContent>
                     <div className="border-t">
                        <ErrorBoundary
                           fallback={
                              <p className="text-sm text-destructive py-3">
                                 Erro ao carregar detalhes
                              </p>
                           }
                        >
                           <Suspense fallback={<OverviewProductCardSkeleton />}>
                              <OverviewProductSubItems
                                 category={category.category}
                              />
                           </Suspense>
                        </ErrorBoundary>
                     </div>
                  </CollapsibleContent>
               </CardContent>
            )}
         </Collapsible>
      </Card>
   );
}

// ============================================
// Volume Feature Card (non-event, e.g. storage)
// ============================================

function StorageUsageContent() {
   const { data, isLoading } = useQuery(
      orpc.billing.getStorageUsage.queryOptions({}),
   );

   if (isLoading) {
      return <OverviewProductCardSkeleton />;
   }

   const currentGB = (data?.currentBytes ?? 0) / 1_073_741_824;

   return (
      <div className="space-y-3 pt-4">
         <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Armazenamento atual</span>
            <span className="tabular-nums font-medium">
               {currentGB.toFixed(3)} GB
            </span>
         </div>
         <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Custo no mês</span>
            <span className="tabular-nums font-medium">
               {formatCurrency(data?.monthToDateCost ?? 0)}
            </span>
         </div>
         <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Projetado</span>
            <span className="tabular-nums font-medium">
               {formatCurrency(data?.projectedCost ?? 0)}
            </span>
         </div>
      </div>
   );
}

function VolumeFeatureCard({
   config,
   stage,
   enrolled = true,
}: {
   config: (typeof VOLUME_FEATURE_CONFIG)[string];
   stage: FeatureStage;
   enrolled?: boolean;
}) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   return (
      <Card className={!enrolled ? "opacity-70" : ""}>
         <Collapsible>
            <CardHeader className="pb-3">
               <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                     <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                        {config.icon}
                     </div>
                     <div className="min-w-0">
                        <CardTitle className="text-base">
                           {config.label}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                           {config.description}
                        </CardDescription>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     <FeatureStageBadge stage={stage} />
                     {!enrolled && (
                        <Button asChild size="sm" variant="outline">
                           <Link
                              params={{ slug, teamSlug }}
                              to="/$slug/$teamSlug/settings/feature-previews"
                           >
                              Ativar
                           </Link>
                        </Button>
                     )}
                  </div>
               </div>
            </CardHeader>
            {enrolled && (
               <CardContent>
                  <div className="flex items-center gap-4">
                     <CollapsibleTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <ChevronRight className="size-4 transition-transform [[data-state=open]_&]:rotate-90" />
                     </CollapsibleTrigger>
                     <div className="flex-1 flex items-center gap-6">
                        <div className="flex-1" />
                        <div className="text-right shrink-0">
                           <span className="text-lg font-semibold tabular-nums">
                              {config.priceLabel}
                           </span>
                           <p className="text-xs text-muted-foreground">
                              por {config.unit}
                           </p>
                        </div>
                     </div>
                  </div>
                  <CollapsibleContent>
                     <div className="border-t">
                        <ErrorBoundary
                           fallback={
                              <p className="text-sm text-destructive py-3">
                                 Erro ao carregar detalhes
                              </p>
                           }
                        >
                           <Suspense fallback={<OverviewProductCardSkeleton />}>
                              <StorageUsageContent />
                           </Suspense>
                        </ErrorBoundary>
                     </div>
                  </CollapsibleContent>
               </CardContent>
            )}
         </Collapsible>
      </Card>
   );
}

// ============================================
// Addon Card
// ============================================

function AddonCard({
   addon,
   currentPlan,
}: {
   addon: (typeof PLATFORM_ADDONS)[number];
   currentPlan: string;
}) {
   const isAvailable = addon.availableFor.includes(currentPlan as PlanName);

   return (
      <Card className={!isAvailable ? "opacity-60" : ""}>
         <CardHeader>
            <div className="flex items-start justify-between gap-4">
               <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                     <Package className="size-5" />
                  </div>
                  <div className="min-w-0">
                     <CardTitle className="text-base">
                        Addon {addon.displayName}
                     </CardTitle>
                     <CardDescription className="text-xs mt-0.5">
                        {addon.description}
                     </CardDescription>
                  </div>
               </div>
               <div className="text-right shrink-0">
                  <p className="text-lg font-semibold">
                     {addon.price}
                     <span className="text-sm font-normal text-muted-foreground">
                        {addon.perUnit}
                     </span>
                  </p>
               </div>
            </div>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
               {addon.features.map((feature) => (
                  <div className="flex items-center gap-2" key={feature}>
                     <Check className="size-3.5 text-primary shrink-0" />
                     <span className="text-sm text-muted-foreground">
                        {feature}
                     </span>
                  </div>
               ))}
            </div>
            {!isAvailable && (
               <p className="text-xs text-muted-foreground">
                  Disponível para planos:{" "}
                  {addon.availableFor
                     .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                     .join(", ")}
               </p>
            )}
            <Button
               disabled={!isAvailable}
               size="sm"
               variant={isAvailable ? "default" : "outline"}
            >
               {isAvailable ? "Conhecer addon" : "Indisponível no seu plano"}
            </Button>
         </CardContent>
      </Card>
   );
}

// ============================================
// Invoices Section (compact)
// ============================================

function InvoicesPreviewSkeleton() {
   return (
      <div className="space-y-2">
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-10 w-full" />
      </div>
   );
}

function InvoicesPreviewContent() {
   const { data: invoices } = useSuspenseQuery(
      orpc.billing.getInvoices.queryOptions({ limit: 5 }),
   );

   if (!invoices || invoices.length === 0) {
      return (
         <Empty className="border-none py-4">
            <EmptyHeader>
               <EmptyMedia variant="icon">
                  <Receipt className="size-5" />
               </EmptyMedia>
               <EmptyTitle className="text-sm">
                  Nenhuma fatura encontrada
               </EmptyTitle>
               <EmptyDescription className="text-xs">
                  Suas faturas aparecerão aqui apos o primeiro pagamento
               </EmptyDescription>
            </EmptyHeader>
         </Empty>
      );
   }

   return (
      <div className="space-y-1">
         {invoices.map((invoice) => {
            const date =
               typeof invoice.created === "number"
                  ? new Date(invoice.created * 1000)
                  : new Date(invoice.created);
            const formattedDate = date.toLocaleDateString("pt-BR", {
               day: "2-digit",
               month: "2-digit",
               year: "numeric",
            });
            const amount = new Intl.NumberFormat("pt-BR", {
               currency: invoice.currency.toUpperCase(),
               style: "currency",
            }).format(invoice.amountPaid / 100);

            const statusLabel =
               invoice.status === "paid"
                  ? "Pago"
                  : invoice.status === "open"
                    ? "Aberto"
                    : (invoice.status ?? "—");

            return (
               <div
                  className="flex items-center justify-between py-2 px-1 text-sm hover:bg-muted/50 rounded-md transition-colors"
                  key={invoice.id}
               >
                  <div className="flex items-center gap-3 min-w-0">
                     <span className="text-muted-foreground tabular-nums">
                        {formattedDate}
                     </span>
                     <span className="truncate font-medium">
                        {invoice.number || `#${invoice.id.slice(0, 8)}`}
                     </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                     <Badge
                        className={
                           invoice.status === "paid"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : ""
                        }
                        variant={
                           invoice.status === "paid" ? "secondary" : "outline"
                        }
                     >
                        {statusLabel}
                     </Badge>
                     <span className="font-medium tabular-nums">{amount}</span>
                     {invoice.invoicePdf && (
                        <a
                           className="text-muted-foreground hover:text-foreground transition-colors"
                           href={invoice.invoicePdf}
                           rel="noopener noreferrer"
                           target="_blank"
                        >
                           <ExternalLink className="size-3.5" />
                        </a>
                     )}
                  </div>
               </div>
            );
         })}
      </div>
   );
}

// ============================================
// BillingOverview (main export)
// ============================================

export function BillingOverview() {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const { data } = useSuspenseQuery(
      orpc.billing.getCurrentUsage.queryOptions({}),
   );
   const { activeSubscription } = useActiveOrganization();
   const { features, isEnrolled } = useEarlyAccess();

   const planName = activeSubscription
      ? (activeSubscription.plan as string).toLowerCase()
      : PlanName.FREE;

   const plan = STRIPE_PLANS.find((p) => p.name.toLowerCase() === planName);

   // Derive stage from PostHog feature config, fall back to local config.
   function resolveStage(
      flagKey: string,
      fallback: FeatureStage,
   ): FeatureStage {
      const posthogStage = features.find((f) => f.flagKey === flagKey)?.stage as
         | FeatureStage
         | undefined;
      return posthogStage ?? fallback;
   }

   // Show all categories — gated ones appear with an enroll CTA when not enrolled.
   const visibleCategories = Object.keys(CATEGORY_CONFIG);

   // Merge API data with known categories — always show all visible cards.
   const categoryDataMap = new Map(data.byCategory.map((c) => [c.category, c]));

   const allCategories: CategorySummary[] = visibleCategories.map((cat) => {
      const existing = categoryDataMap.get(cat);
      return (
         existing ?? {
            category: cat,
            eventCount: 0,
            monthToDateCost: 0,
            projectedCost: 0,
         }
      );
   });

   const sortedCategories = allCategories.sort(
      (a, b) => b.monthToDateCost - a.monthToDateCost,
   );

   // Volume-based features: always show, enrolled state passed to card.
   const allVolumeFeatures = Object.entries(VOLUME_FEATURE_CONFIG);

   return (
      <div className="space-y-6">
         {/* Top section: bill total + plan banner */}
         <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <CurrentBillHeader monthToDate={data.monthToDate} />
            <div className="lg:max-w-md flex-1">
               <PlanBanner
                  planDisplayName={plan?.displayName ?? "Free"}
                  planName={planName}
               />
            </div>
         </div>

         {/* Billing period */}
         <BillingPeriodSection />

         {/* Manage card link */}
         <Button asChild size="sm" variant="outline">
            <Link params={{ slug, teamSlug }} to="/$slug/$teamSlug/plans">
               <CreditCard className="size-4 mr-1.5" />
               Gerenciar plano e faturas
               <ExternalLink className="size-3 ml-1" />
            </Link>
         </Button>

         <div>
            <h2 className="text-lg font-semibold mb-4">Addons</h2>
            <div className="space-y-4">
               {PLATFORM_ADDONS.map((addon) => (
                  <AddonCard
                     addon={addon}
                     currentPlan={planName}
                     key={addon.name}
                  />
               ))}
            </div>
         </div>

         {/* Products section */}
         <div>
            <h2 className="text-lg font-semibold mb-4">Produtos</h2>
            <div className="space-y-4">
               {sortedCategories.map((cat) => {
                  const gate = EARLY_ACCESS_CATEGORY_GATES[cat.category];
                  const stage = gate
                     ? resolveStage(gate.flag, gate.fallbackStage)
                     : undefined;
                  const enrolled = gate ? isEnrolled(gate.flag) : true;
                  return (
                     <OverviewProductCard
                        category={cat}
                        enrolled={enrolled}
                        key={cat.category}
                        stage={stage}
                     />
                  );
               })}
               {allVolumeFeatures.map(([flagKey, config]) => (
                  <VolumeFeatureCard
                     config={config}
                     enrolled={isEnrolled(flagKey)}
                     key={flagKey}
                     stage={resolveStage(flagKey, config.fallbackStage)}
                  />
               ))}
            </div>
         </div>

         {/* Recent invoices */}
         <Card>
            <CardHeader>
               <CardTitle className="text-base">Faturas recentes</CardTitle>
               <CardDescription>Ultimas cobranças e pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
               <ErrorBoundary
                  fallback={
                     <p className="text-sm text-destructive">
                        Erro ao carregar faturas
                     </p>
                  }
               >
                  <Suspense fallback={<InvoicesPreviewSkeleton />}>
                     <InvoicesPreviewContent />
                  </Suspense>
               </ErrorBoundary>
            </CardContent>
         </Card>
      </div>
   );
}
