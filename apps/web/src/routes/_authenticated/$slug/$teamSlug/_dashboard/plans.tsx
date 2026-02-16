import { PlanName, STRIPE_PLANS } from "@packages/stripe/constants";
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from "@packages/ui/components/accordion";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
   Check,
   Clock,
   CreditCard,
   Crown,
   Headphones,
   RefreshCcw,
   Shield,
   Sparkles,
   User,
   X,
   Zap,
} from "lucide-react";
import { Suspense, useState, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { authClient } from "@/integrations/better-auth/auth-client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/plans",
)({
   component: PlansPage,
});

interface Plan {
   name: string;
   displayName: string;
   price: string;
   annualPrice?: string | null;
   description: string;
   features: string[];
   icon: React.ReactNode;
   highlighted?: boolean;
   hasFreeTrial?: boolean;
   trialDays?: number;
}

type PlanComparisonValue = string | boolean;

interface PlanComparisonRow {
   label: string;
   description?: string;
   values: Record<PlanName, PlanComparisonValue>;
}

interface Subscription {
   id: string;
   plan: string;
   status: string;
   periodStart: Date | string | null;
   periodEnd: Date | string | null;
   trialStart: Date | string | null;
   trialEnd: Date | string | null;
   cancelAtPeriodEnd: boolean;
   seats: number | null;
   referenceId: string;
}

function getDaysRemaining(date: Date | string | null): number | null {
   if (!date) return null;
   const d = new Date(date);
   const now = new Date();
   const diff = d.getTime() - now.getTime();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const getIconForPlan = (planName: string) => {
   switch (planName) {
      case PlanName.FREE:
         return <User className="size-6" />;
      case PlanName.LITE:
         return <Zap className="size-6" />;
      case PlanName.PRO:
         return <Crown className="size-6" />;
      default:
         return <User className="size-6" />;
   }
};

const getTrialDaysForPlan = (_planName: string) => {
   return 0;
};

const plans: Plan[] = STRIPE_PLANS.map((plan) => {
   const trialDays = getTrialDaysForPlan(plan.name);
   return {
      ...plan,
      icon: getIconForPlan(plan.name),
      hasFreeTrial: trialDays > 0,
      trialDays,
   };
});

const planHighlights: Record<PlanName, string[]> = {
   [PlanName.FREE]: [
      "Todos os recursos incluídos",
      "1 usuário",
      "R$ 2,50 em créditos de IA/mês",
   ],
   [PlanName.LITE]: [
      "Todos os recursos incluídos",
      "3 usuários",
      "R$ 25 em créditos de IA/mês",
   ],
   [PlanName.PRO]: [
      "Membros ilimitados",
      "R$ 50 em créditos de IA/mês",
      "Acesso à API",
   ],
};

const comparisonRows: PlanComparisonRow[] = [
   {
      label: "Recursos completos",
      description: "Todas as ferramentas da plataforma",
      values: {
         [PlanName.FREE]: true,
         [PlanName.LITE]: true,
         [PlanName.PRO]: true,
      },
   },
   {
      label: "Usuários",
      values: {
         [PlanName.FREE]: "1 usuário",
         [PlanName.LITE]: "3 usuários",
         [PlanName.PRO]: "Ilimitado",
      },
   },
   {
      label: "Créditos de IA/mês",
      values: {
         [PlanName.FREE]: "R$ 2,50",
         [PlanName.LITE]: "R$ 25",
         [PlanName.PRO]: "R$ 50",
      },
   },
   {
      label: "Créditos de plataforma/mês",
      values: {
         [PlanName.FREE]: "R$ 2,50",
         [PlanName.LITE]: "R$ 25",
         [PlanName.PRO]: "R$ 50",
      },
   },
   {
      label: "Suporte por email",
      values: {
         [PlanName.FREE]: true,
         [PlanName.LITE]: true,
         [PlanName.PRO]: true,
      },
   },
   {
      label: "Suporte prioritário",
      values: {
         [PlanName.FREE]: false,
         [PlanName.LITE]: true,
         [PlanName.PRO]: true,
      },
   },
   {
      label: "Acesso à API",
      values: {
         [PlanName.FREE]: false,
         [PlanName.LITE]: false,
         [PlanName.PRO]: true,
      },
   },
   {
      label: "Teste grátis",
      values: {
         [PlanName.FREE]: false,
         [PlanName.LITE]: false,
         [PlanName.PRO]: "14 dias",
      },
   },
   {
      label: "Cobrança anual com desconto",
      values: {
         [PlanName.FREE]: false,
         [PlanName.LITE]: "17%",
         [PlanName.PRO]: "17%",
      },
   },
   {
      label: "Cancelamento fácil",
      values: {
         [PlanName.FREE]: true,
         [PlanName.LITE]: true,
         [PlanName.PRO]: true,
      },
   },
   {
      label: "Atualizações contínuas",
      values: {
         [PlanName.FREE]: true,
         [PlanName.LITE]: true,
         [PlanName.PRO]: true,
      },
   },
];

// Animation variants
const containerVariants: Variants = {
   hidden: { opacity: 0 },
   show: {
      opacity: 1,
      transition: {
         staggerChildren: 0.08,
         delayChildren: 0.15,
      },
   },
};

const cardVariants: Variants = {
   hidden: { opacity: 0, y: 40 },
   show: {
      opacity: 1,
      y: 0,
   },
};

// Trust badges data
const trustBadges = [
   { icon: Shield, text: "SSL Seguro" },
   { icon: CreditCard, text: "Stripe Checkout" },
   { icon: RefreshCcw, text: "Cancelamento fácil" },
   { icon: Headphones, text: "Suporte técnico" },
];

// FAQ data
const faqItems = [
   {
      question: "Todos os recursos estão disponíveis em todos os planos?",
      answer:
         "Sim! Todos os recursos estão disponíveis em todos os planos, incluindo o Free. A diferença entre os planos é a quantidade de créditos que você recebe por mês. Quando seus créditos acabam, você pode fazer upgrade para continuar usando.",
   },
   {
      question: "O que são créditos?",
      answer:
         "Créditos são usados para medir o uso da plataforma. Cada ação (como usar a IA, publicar conteúdo, ou análises de SEO) consome uma pequena quantidade de créditos. Os créditos são renovados todo mês automaticamente.",
   },
   {
      question: "O que acontece quando meus créditos acabam?",
      answer:
         "Quando seus créditos de IA ou plataforma se esgotam, as ações que consomem créditos ficam bloqueadas até o próximo mês. Você pode fazer upgrade do seu plano a qualquer momento para desbloquear imediatamente.",
   },
   {
      question: "Posso mudar de plano a qualquer momento?",
      answer:
         "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Ao fazer upgrade, seus novos créditos ficam disponíveis imediatamente. No downgrade, as mudanças entram em vigor no próximo ciclo de cobrança.",
   },
   {
      question: "Como funciona o pagamento?",
      answer:
         "Aceitamos os principais cartões de crédito (Visa, Mastercard, American Express) e processamos todos os pagamentos de forma segura através do Stripe. Sua assinatura será renovada automaticamente no final de cada período.",
   },
];

function PlansPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Falha ao carregar os planos. Tente novamente.",
      errorTitle: "Erro ao carregar planos",
      retryText: "Tentar novamente",
   })(props);
}

function PlansPageSkeleton() {
   return (
      <main className="flex flex-col gap-8 py-8">
         <div className="text-center space-y-4">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
         </div>
         <Skeleton className="h-12 w-64 mx-auto rounded-full" />
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto w-full px-4">
            {Array.from({ length: 3 }).map((_, i) => (
               <Skeleton
                  className="h-[500px] rounded-2xl"
                  key={`plan-skeleton-${i + 1}`}
               />
            ))}
         </div>
      </main>
   );
}

// Hero Section Component
function HeroSection() {
   return (
      <motion.div
         animate={{ opacity: 1, y: 0 }}
         className="text-center space-y-5 py-10"
         initial={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.6, ease: "easeOut" }}
      >
         <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight font-serif"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
         >
            Planos claros para crescer com conteúdo
         </motion.h1>
         <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
         >
            Todos os recursos em todos os planos. O que muda é o volume de
            créditos e o nível de suporte para o seu ritmo de produção.
         </motion.p>
      </motion.div>
   );
}

// Animated Billing Toggle Component
function BillingToggle({
   isAnnual,
   onToggle,
}: {
   isAnnual: boolean;
   onToggle: (annual: boolean) => void;
}) {
   return (
      <motion.div
         animate={{ opacity: 1, y: 0 }}
         className="flex justify-center mb-10"
         initial={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.6, delay: 0.3 }}
      >
         <div className="relative bg-card/80 border border-muted p-1.5 rounded-full flex items-center shadow-sm">
            {/* Sliding indicator */}
            <motion.div
               animate={{ x: isAnnual ? "100%" : "0%" }}
               className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-background rounded-full shadow"
               initial={false}
               layoutId="billing-toggle"
               transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
               }}
            />

            <button
               className={`relative z-10 px-6 py-2.5 text-sm font-medium rounded-full transition-colors ${
                  !isAnnual ? "text-foreground" : "text-muted-foreground"
               }`}
               onClick={() => onToggle(false)}
               type="button"
            >
               Mensal
            </button>
            <button
               className={`relative z-10 px-6 py-2.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                  isAnnual ? "text-foreground" : "text-muted-foreground"
               }`}
               onClick={() => onToggle(true)}
               type="button"
            >
               Anual
               <Badge
                  className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10"
                  variant="outline"
               >
                  -17%
               </Badge>
            </button>
         </div>
      </motion.div>
   );
}

// Animated Price Component
function AnimatedPrice({
   price,
   period,
   isAnnual,
}: {
   price: string;
   period: string;
   isAnnual: boolean;
}) {
   return (
      <div className="text-center mb-6">
         <AnimatePresence mode="wait">
            <motion.span
               animate={{ opacity: 1, y: 0 }}
               className="text-4xl font-semibold inline-block tabular-nums"
               exit={{ opacity: 0, y: -10 }}
               initial={{ opacity: 0, y: 10 }}
               key={`${price}-${isAnnual}`}
               transition={{ duration: 0.2 }}
            >
               {price}
            </motion.span>
         </AnimatePresence>
         <span className="text-muted-foreground">{period}</span>
         {isAnnual && price !== "R$ 0" && (
            <motion.p
               animate={{ opacity: 1 }}
               className="text-xs text-green-600 mt-1"
               initial={{ opacity: 0 }}
               transition={{ delay: 0.2 }}
            >
               Economize 2 meses
            </motion.p>
         )}
      </div>
   );
}

// Enhanced Plan Card Component
function PlanCard({
   plan,
   isAnnual,
   subscription,
   onSelect,
   isLoading,
}: {
   plan: Plan;
   isAnnual: boolean;
   subscription?: Subscription | null;
   onSelect: (planName: string) => void;
   isLoading: boolean;
}) {
   const isFreePlan = plan.name === PlanName.FREE;
   const isCurrentPlan = isFreePlan
      ? !subscription || subscription?.plan?.toLowerCase() === "free"
      : subscription?.plan?.toLowerCase() === plan.name.toLowerCase();
   const isTrialing = subscription?.status === "trialing";
   const trialDaysRemaining =
      isTrialing && isCurrentPlan
         ? getDaysRemaining(subscription?.trialEnd ?? null)
         : null;
   const price = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
   const period = isFreePlan ? "" : isAnnual ? "/ano" : "/mês";
   const isHighlighted = plan.highlighted;
   const highlights =
      planHighlights[plan.name as PlanName] ?? plan.features.slice(0, 3);

   const getButtonText = () => {
      if (isCurrentPlan) {
         if (isTrialing && trialDaysRemaining) {
            return `${trialDaysRemaining} dias restantes`;
         }
         return "Plano atual";
      }
      if (isLoading) return "Processando...";
      if (isFreePlan) return "Plano atual";
      if (isTrialing) return "Fazer upgrade";
      if (plan.hasFreeTrial && !subscription)
         return `Testar ${plan.trialDays} dias grátis`;
      return "Assinar";
   };

   return (
      <motion.div
         className={`relative flex flex-col rounded-3xl border p-8 bg-card/90 transition-all ${
            isHighlighted
               ? "border-primary/50 shadow-[0_24px_60px_rgba(18,18,18,0.12)] lg:scale-[1.02]"
               : "border-muted shadow-[0_16px_40px_rgba(18,18,18,0.08)]"
         } ${isCurrentPlan ? "border-green-500/60" : ""}`}
         data-plan={plan.name.toLowerCase()}
         transition={{ type: "spring", stiffness: 200, damping: 20 }}
         variants={cardVariants}
         whileHover={{ y: -6 }}
      >
         {isHighlighted && !isCurrentPlan && (
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-xl -z-10" />
         )}

         {/* Badges */}
         {isHighlighted && !isCurrentPlan && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
               <motion.span
                  animate={{ scale: 1 }}
                  className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"
                  initial={{ scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
               >
                  <Sparkles className="size-3.5" />
                  Mais completo
               </motion.span>
            </div>
         )}
         {isCurrentPlan && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
               <motion.span
                  animate={{ scale: 1 }}
                  className="bg-green-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"
                  initial={{ scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
               >
                  {isTrialing ? (
                     <Clock className="size-3.5" />
                  ) : (
                     <Check className="size-3.5" />
                  )}
                  {isTrialing ? "Em teste" : "Plano atual"}
               </motion.span>
            </div>
         )}

         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div
                  className={`p-3 rounded-2xl ${
                     isHighlighted
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
               >
                  {plan.icon}
               </div>
               <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <h3 className="text-xl font-semibold tracking-tight">
                     {plan.displayName}
                  </h3>
               </div>
            </div>
            {isHighlighted && !isCurrentPlan && (
               <Badge variant="secondary">Recomendado</Badge>
            )}
         </div>

         <p className="text-sm text-muted-foreground mt-4">
            {plan.description}
         </p>

         {/* Price */}
         <AnimatedPrice isAnnual={isAnnual} period={period} price={price} />

         {/* Trial Badge */}
         {plan.hasFreeTrial && plan.trialDays && !subscription && (
            <div className="flex justify-center mb-4">
               <Badge className="gap-1" variant="secondary">
                  <Clock className="size-3" />
                  {plan.trialDays} dias grátis
               </Badge>
            </div>
         )}

         {/* Highlights */}
         <div className="space-y-3 flex-1">
            {highlights.map((feature) => (
               <div className="flex items-center gap-3" key={feature}>
                  <div className="flex-shrink-0 size-5 rounded-full bg-green-500/10 flex items-center justify-center">
                     <Check className="size-3 text-green-500" />
                  </div>
                  <span className="text-sm">{feature}</span>
               </div>
            ))}
         </div>

         <motion.div
            className="mt-8"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
         >
            <Button
               className={`w-full h-12 text-base font-medium ${
                  isHighlighted && !isCurrentPlan
                     ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                     : ""
               }`}
               disabled={isCurrentPlan || isLoading || isFreePlan}
               onClick={() => onSelect(plan.name)}
               variant={isHighlighted ? "default" : "outline"}
            >
               {getButtonText()}
            </Button>
         </motion.div>
      </motion.div>
   );
}

function ComparisonTable({ isAnnual }: { isAnnual: boolean }) {
   const planOrder = [PlanName.FREE, PlanName.LITE, PlanName.PRO];

   const getPriceLabel = (plan: Plan) =>
      isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;

   return (
      <div className="overflow-x-auto border rounded-3xl bg-card/90">
         <Table className="min-w-[720px]">
            <TableHeader>
               <TableRow className="bg-muted/40">
                  <TableHead className="text-left w-[260px] font-medium">
                     Comparar recursos
                  </TableHead>
                  {planOrder.map((planName) => {
                     const plan = plans.find((p) => p.name === planName);
                     if (!plan) return null;
                     const period =
                        plan.name === PlanName.FREE
                           ? ""
                           : isAnnual
                             ? "/ano"
                             : "/mês";
                     return (
                        <TableHead className="text-center" key={plan.name}>
                           <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">
                                 {plan.displayName}
                              </div>
                              <div className="text-lg font-semibold">
                                 {getPriceLabel(plan)}
                                 <span className="text-xs text-muted-foreground">
                                    {period}
                                 </span>
                              </div>
                           </div>
                        </TableHead>
                     );
                  })}
               </TableRow>
            </TableHeader>
            <TableBody>
               {comparisonRows.map((row, index) => (
                  <TableRow
                     className={
                        index % 2 === 0 ? "bg-background" : "bg-muted/30"
                     }
                     key={row.label}
                  >
                     <TableCell className="text-sm">
                        <div className="space-y-1">
                           <div className="font-medium text-foreground">
                              {row.label}
                           </div>
                           {row.description && (
                              <div className="text-xs text-muted-foreground">
                                 {row.description}
                              </div>
                           )}
                        </div>
                     </TableCell>
                     {planOrder.map((planName) => {
                        const value = row.values[planName];
                        return (
                           <TableCell className="text-center" key={planName}>
                              {typeof value === "boolean" ? (
                                 value ? (
                                    <Check className="size-4 text-green-600 inline" />
                                 ) : (
                                    <X className="size-4 text-muted-foreground inline" />
                                 )
                              ) : (
                                 <span className="text-sm font-medium">
                                    {value}
                                 </span>
                              )}
                           </TableCell>
                        );
                     })}
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
   );
}

// Trust Badges Component
function TrustBadges() {
   return (
      <motion.div
         animate={{ opacity: 1, y: 0 }}
         className="flex flex-wrap justify-center gap-8 py-12"
         initial={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.6, delay: 0.4 }}
      >
         {trustBadges.map((badge, index) => (
            <motion.div
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-2 text-muted-foreground"
               initial={{ opacity: 0, y: 10 }}
               key={badge.text}
               transition={{ delay: 0.5 + index * 0.1 }}
            >
               <badge.icon className="size-5" />
               <span className="text-sm font-medium">{badge.text}</span>
            </motion.div>
         ))}
      </motion.div>
   );
}

// FAQ Section Component
function FAQSection() {
   return (
      <motion.div
         animate={{ opacity: 1, y: 0 }}
         className="max-w-2xl mx-auto py-12 px-4"
         initial={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.6, delay: 0.5 }}
      >
         <h2 className="text-2xl font-bold text-center mb-8">
            Perguntas frequentes
         </h2>
         <Accordion className="space-y-2" collapsible type="single">
            {faqItems.map((item, index) => (
               <AccordionItem
                  className="border rounded-lg px-4 data-[state=open]:bg-muted/50"
                  key={`faq-${index + 1}`}
                  value={`item-${index + 1}`}
               >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                     {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                     {item.answer}
                  </AccordionContent>
               </AccordionItem>
            ))}
         </Accordion>
      </motion.div>
   );
}

function PlansPageContent() {
   const { activeOrganization, activeSubscription } = useActiveOrganization();
   const [isAnnual, setIsAnnual] = useState(true);
   const [isLoading, startTransition] = useTransition();

   const handleSelectPlan = async (planName: string) => {
      if (planName === PlanName.FREE) return;

      startTransition(async () => {
         if (!activeOrganization?.id) {
            toast.error("Nenhuma organização selecionada");
            return;
         }

         try {
            const baseUrl = `${window.location.origin}${window.location.pathname}`;

            await authClient.subscription.upgrade({
               annual: isAnnual,
               cancelUrl: `${baseUrl}?cancel=true`,
               plan: planName,
               referenceId: activeOrganization?.id,
               successUrl: `${baseUrl}?success=true`,
            });
         } catch (error) {
            console.error("Failed to create checkout session:", error);
            toast.error("Falha ao iniciar checkout", {
               description: "Tente novamente mais tarde.",
            });
         }
      });
   };

   // Reorder plans for mobile: Pro first
   const orderedPlans = [...plans].sort((a, b) => {
      if (a.highlighted) return -1;
      if (b.highlighted) return 1;
      return 0;
   });

   return (
      <main className="relative overflow-hidden">
         <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-[#f7f1e8] via-background to-background" />
            <div className="absolute -top-24 left-1/2 h-64 w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
         </div>

         <div className="relative z-10 flex flex-col gap-12 pb-16">
            <section className="px-4">
               <HeroSection />
               <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
            </section>

            <section className="px-4">
               <motion.div
                  className="grid gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto w-full"
                  initial="hidden"
                  variants={containerVariants}
                  viewport={{ once: true, margin: "-100px" }}
                  whileInView="show"
               >
                  <div className="contents lg:hidden">
                     {orderedPlans.map((plan) => (
                        <PlanCard
                           isAnnual={isAnnual}
                           isLoading={isLoading}
                           key={plan.name}
                           onSelect={handleSelectPlan}
                           plan={plan}
                           subscription={
                              activeSubscription as Subscription | null
                           }
                        />
                     ))}
                  </div>
                  <div className="hidden lg:contents">
                     {plans.map((plan) => (
                        <PlanCard
                           isAnnual={isAnnual}
                           isLoading={isLoading}
                           key={plan.name}
                           onSelect={handleSelectPlan}
                           plan={plan}
                           subscription={
                              activeSubscription as Subscription | null
                           }
                        />
                     ))}
                  </div>
               </motion.div>
            </section>

            <section className="px-4">
               <div className="max-w-6xl mx-auto space-y-4">
                  <div className="space-y-2">
                     <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                        Comparativo detalhado
                     </p>
                     <h2 className="text-2xl md:text-3xl font-semibold font-serif">
                        Compare cada detalhe antes de decidir
                     </h2>
                     <p className="text-sm text-muted-foreground max-w-2xl">
                        A diferença entre os planos está no volume de créditos,
                        membros e nível de suporte. Tudo o que você precisa para
                        crescer está aqui.
                     </p>
                  </div>
                  <ComparisonTable isAnnual={isAnnual} />
               </div>
            </section>

            <TrustBadges />
            <FAQSection />
         </div>
      </main>
   );
}

function PlansPage() {
   return (
      <ErrorBoundary FallbackComponent={PlansPageErrorFallback}>
         <Suspense fallback={<PlansPageSkeleton />}>
            <PlansPageContent />
         </Suspense>
      </ErrorBoundary>
   );
}
