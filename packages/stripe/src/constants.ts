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

// Backward compatibility aliases
export const ADDON_IDS = {
   BOOST: PlatformAddOn.BOOST,
   SCALE: PlatformAddOn.SCALE,
   ENTERPRISE: PlatformAddOn.ENTERPRISE,
} as const;

export type AddonId = PlatformAddOn;

export const PLAN_PROJECT_LIMITS: Record<PlanName, number> = {
   [PlanName.FREE]: 1,
   [PlanName.LITE]: 6,
   [PlanName.PRO]: 6,
};

export const PLATFORM_ADDONS = [
   {
      name: PlatformAddOn.BOOST,
      displayName: "Boost",
      description:
         "Projetos ilimitados, white labeling, SSO e recursos de colaboração com membros da equipe",
      price: "R$ 99",
      annualPrice: "R$ 990",
      perUnit: "/mês",
      availableFor: [PlanName.LITE, PlanName.PRO],
      features: [
         "Projetos ilimitados",
         "SSO enforcement",
         "Forçar 2FA",
         "White labeling",
         "Controle de acesso",
         "Configurações de convite da organização",
         "Configurações de segurança da organização",
      ],
   },
   {
      name: PlatformAddOn.SCALE,
      displayName: "Scale",
      description:
         "Suporte prioritário, SAML e mais recursos para escalar sua organização. Inclui todos os recursos do Boost",
      price: "R$ 299",
      annualPrice: "R$ 2.990",
      perUnit: "/mês",
      availableFor: [PlanName.PRO],
      features: [
         "Todos os recursos do Boost",
         "Logs de atividade (2 meses)",
         "Suporte prioritário (resposta em 24h)",
         "SAML SSO",
      ],
   },
   {
      name: PlatformAddOn.ENTERPRISE,
      displayName: "Enterprise",
      description:
         "RBAC, suporte dedicado, treinamento e mais. Inclui todos os recursos do Scale e Boost",
      price: "R$ 799",
      annualPrice: "R$ 7.990",
      perUnit: "/mês",
      availableFor: [PlanName.PRO],
      features: [
         "Todos os recursos do Scale",
         "RBAC (controle de acesso baseado em função)",
         "Suporte dedicado (resposta em 8h)",
         "Treinamento e onboarding",
         "Retenção de dados customizada",
      ],
   },
];

/**
 * Get the effective project limit for an org, considering plan + add-on.
 * Any platform add-on unlocks unlimited projects.
 */
export function getEffectiveProjectLimit(
   plan: PlanName,
   addOn?: PlatformAddOn | null,
): number {
   if (addOn) return Infinity;
   return PLAN_PROJECT_LIMITS[plan];
}
