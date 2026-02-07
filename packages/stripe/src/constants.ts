export enum PlanName {
   FREE = "free",
   LITE = "lite",
   PRO = "pro",
}

export const STRIPE_PLANS = [
   {
      annualPrice: null,
      description: "Todos os recursos, uso limitado",
      displayName: "Free",
      features: [
         "Todos os recursos incluídos",
         "1 projeto",
         "1 usuário",
         "R$ 2,50 em créditos de IA/mês",
         "R$ 2,50 em créditos de plataforma/mês",
         "Suporte por email",
      ],
      name: PlanName.FREE,
      price: "R$ 0",
   },
   {
      annualPrice: "R$ 790",
      description: "Mais créditos para uso intenso",
      displayName: "Lite",
      features: [
         "Todos os recursos incluídos",
         "6 projetos",
         "3 usuários",
         "R$ 25 em créditos de IA/mês",
         "R$ 25 em créditos de plataforma/mês",
         "Suporte prioritário",
      ],
      name: PlanName.LITE,
      price: "R$ 79",
   },
   {
      annualPrice: "R$ 1500",
      description: "Uso profissional sem limites práticos",
      displayName: "Pro",
      features: [
         "Todos os recursos incluídos",
         "6 projetos",
         "Membros ilimitados",
         "R$ 50 em créditos de IA/mês",
         "R$ 50 em créditos de plataforma/mês",
         "API access",
         "Suporte prioritário",
         "14 dias de teste grátis",
      ],
      highlighted: true,
      name: PlanName.PRO,
      price: "R$ 150",
   },
];

export enum PlatformAddOn {
   BOOST = "boost",
   SCALE = "scale",
   ENTERPRISE = "enterprise",
}

export const PLAN_PROJECT_LIMITS: Record<PlanName, number> = {
   [PlanName.FREE]: 1,
   [PlanName.LITE]: 6,
   [PlanName.PRO]: 6,
};

export const PLATFORM_ADDONS = [
   {
      name: PlatformAddOn.BOOST,
      displayName: "Boost",
      description: "Mais projetos e créditos para crescer",
      price: "R$ 99",
      annualPrice: "R$ 990",
      perUnit: "/mês",
      extraProjects: 10,
      availableFor: [PlanName.LITE, PlanName.PRO],
   },
   {
      name: PlatformAddOn.SCALE,
      displayName: "Scale",
      description: "Para equipes em expansão com alto volume",
      price: "R$ 299",
      annualPrice: "R$ 2.990",
      perUnit: "/mês",
      extraProjects: 50,
      availableFor: [PlanName.LITE, PlanName.PRO],
   },
   {
      name: PlatformAddOn.ENTERPRISE,
      displayName: "Enterprise",
      description: "Uso ilimitado para operações em escala",
      price: "R$ 799",
      annualPrice: "R$ 7.990",
      perUnit: "/mês",
      extraProjects: Infinity,
      availableFor: [PlanName.PRO],
   },
];

export function getEffectiveProjectLimit(
   plan: PlanName,
   addOn?: PlatformAddOn | null,
): number {
   const baseLimit = PLAN_PROJECT_LIMITS[plan];

   if (!addOn) {
      return baseLimit;
   }

   const addOnConfig = PLATFORM_ADDONS.find((a) => a.name === addOn);

   if (!addOnConfig) {
      return baseLimit;
   }

   if (addOnConfig.extraProjects === Infinity) {
      return Infinity;
   }

   return baseLimit + addOnConfig.extraProjects;
}
