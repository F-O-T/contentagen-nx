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
import { createFileRoute } from "@tanstack/react-router";
import {
   AnimatePresence,
   motion,
   useMotionValue,
   useTransform,
} from "framer-motion";
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
   Zap,
} from "lucide-react";
import { Suspense, useState, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { authClient } from "@/integrations/better-auth/auth-client";

export const Route = createFileRoute("/_authenticated/$slug/_dashboard/plans")({
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

// Animation variants
const containerVariants = {
   hidden: { opacity: 0 },
   show: {
      opacity: 1,
      transition: {
         staggerChildren: 0.1,
         delayChildren: 0.2,
      },
   },
};

const cardVariants = {
   hidden: { opacity: 0, y: 40 },
   show: {
      opacity: 1,
      y: 0,
      transition: {
         type: "spring",
         stiffness: 100,
         damping: 15,
      },
   },
};

const featureVariants = {
   hidden: { opacity: 0, x: -10 },
   show: {
      opacity: 1,
      x: 0,
      transition: {
         type: "spring",
         stiffness: 200,
         damping: 20,
      },
   },
};

const featureListVariants = {
   hidden: { opacity: 0 },
   show: {
      opacity: 1,
      transition: {
         staggerChildren: 0.05,
         delayChildren: 0.1,
      },
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
      question: "Posso mudar de plano a qualquer momento?",
      answer:
         "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Ao fazer upgrade, você terá acesso imediato aos novos recursos. No downgrade, as mudanças entram em vigor no próximo ciclo de cobrança.",
   },
   {
      question: "O que acontece quando o período de teste termina?",
      answer:
         "Quando o período de teste termina, você será automaticamente cobrado pelo plano escolhido. Não se preocupe, enviaremos um lembrete antes do término do teste. Você pode cancelar a qualquer momento durante o período de teste sem nenhuma cobrança.",
   },
   {
      question: "Como funciona o pagamento?",
      answer:
         "Aceitamos os principais cartões de crédito (Visa, Mastercard, American Express) e processamos todos os pagamentos de forma segura através do Stripe. Sua assinatura será renovada automaticamente no final de cada período.",
   },
   {
      question: "Posso cancelar a qualquer momento?",
      answer:
         "Absolutamente! Não há contratos de longo prazo ou taxas de cancelamento. Você pode cancelar sua assinatura a qualquer momento e continuará tendo acesso até o final do período já pago.",
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
         className="text-center space-y-4 py-8"
         initial={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.6, ease: "easeOut" }}
      >
         <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
         >
            Escolha o plano perfeito para{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
               acelerar sua criação
            </span>
         </motion.h1>
         <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
         >
            Todos os membros da sua organização terão acesso ao mesmo plano.
            Comece gratuitamente e faça upgrade quando precisar.
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
         className="flex justify-center mb-8"
         initial={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.6, delay: 0.3 }}
      >
         <div className="relative bg-muted p-1.5 rounded-full flex items-center">
            {/* Sliding indicator */}
            <motion.div
               animate={{ x: isAnnual ? "100%" : "0%" }}
               className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-background rounded-full shadow-sm"
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
               className="text-4xl font-bold inline-block"
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

   // Motion values for hover effect
   const y = useMotionValue(0);
   const scale = useMotionValue(1);
   const shadowOpacity = useTransform(y, [-8, 0], [0.15, 0.05]);

   return (
      <motion.div
         className={`relative flex flex-col rounded-2xl border p-8 backdrop-blur-xl transition-colors ${
            isHighlighted
               ? "bg-card/90 border-primary/50 ring-2 ring-primary/20 lg:scale-105 z-10"
               : "bg-card/80"
         } ${isCurrentPlan ? "border-green-500 bg-green-500/5 ring-2 ring-green-500/20" : ""}`}
         data-plan={plan.name.toLowerCase()}
         onHoverEnd={() => {
            y.set(0);
            scale.set(1);
         }}
         onHoverStart={() => {
            y.set(-8);
            scale.set(1.02);
         }}
         style={{
            y,
            scale,
            boxShadow: isHighlighted
               ? `0 8px 32px rgba(251, 146, 60, ${shadowOpacity.get()})`
               : `0 2px 4px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,${shadowOpacity.get()})`,
         }}
         variants={cardVariants}
      >
         {/* Glow effect for highlighted card */}
         {isHighlighted && !isCurrentPlan && (
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-xl -z-10" />
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

         {/* Plan Icon */}
         <div className="text-center pb-2 pt-4">
            <motion.div
               className={`mx-auto mb-4 p-4 rounded-2xl inline-flex ${
                  isHighlighted
                     ? "bg-primary/10 text-primary"
                     : "bg-muted text-muted-foreground"
               }`}
               transition={{ type: "spring", stiffness: 400, damping: 17 }}
               whileHover={{ scale: 1.1, rotate: 5 }}
            >
               {plan.icon}
            </motion.div>
            <h3 className="text-2xl font-bold">{plan.displayName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
               {plan.description}
            </p>
         </div>

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

         {/* Features List */}
         <motion.ul
            className="space-y-3 flex-1"
            initial="hidden"
            variants={featureListVariants}
            viewport={{ once: true }}
            whileInView="show"
         >
            {plan.features.map((feature) => (
               <motion.li
                  className="flex items-center gap-3"
                  key={feature}
                  variants={featureVariants}
               >
                  <div className="flex-shrink-0 size-5 rounded-full bg-green-500/10 flex items-center justify-center">
                     <Check className="size-3 text-green-500" />
                  </div>
                  <span className="text-sm">{feature}</span>
               </motion.li>
            ))}
         </motion.ul>

         {/* CTA Button */}
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
      <main className="flex flex-col">
         {/* Hero Section */}
         <HeroSection />

         {/* Billing Toggle */}
         <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />

         {/* Plan Cards */}
         <motion.div
            className="grid gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto w-full px-4"
            initial="hidden"
            variants={containerVariants}
            viewport={{ once: true, margin: "-100px" }}
            whileInView="show"
         >
            {/* Mobile: Show Pro first */}
            <div className="contents lg:hidden">
               {orderedPlans.map((plan) => (
                  <PlanCard
                     isAnnual={isAnnual}
                     isLoading={isLoading}
                     key={plan.name}
                     onSelect={handleSelectPlan}
                     plan={plan}
                     subscription={activeSubscription as Subscription | null}
                  />
               ))}
            </div>
            {/* Desktop: Original order */}
            <div className="hidden lg:contents">
               {plans.map((plan) => (
                  <PlanCard
                     isAnnual={isAnnual}
                     isLoading={isLoading}
                     key={plan.name}
                     onSelect={handleSelectPlan}
                     plan={plan}
                     subscription={activeSubscription as Subscription | null}
                  />
               ))}
            </div>
         </motion.div>

         {/* Trust Badges */}
         <TrustBadges />

         {/* FAQ Section */}
         <FAQSection />
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
