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

export enum AddOnType {
   EXTRA_SEATS = "extra_seats",
   EXTRA_STORAGE = "extra_storage",
   AUTOMATION_PACK = "automation_pack",
}

export const STRIPE_ADDONS = [
   {
      name: AddOnType.EXTRA_SEATS,
      displayName: "Usuário Adicional",
      description: "Adicione mais usuários ao seu workspace",
      price: "R$ 8",
      annualPrice: "R$ 84",
      perUnit: "/usuário/mês",
      availableFor: [PlanName.LITE, PlanName.PRO],
   },
   {
      name: AddOnType.EXTRA_STORAGE,
      displayName: "Armazenamento Extra",
      description: "Mais espaço para arquivos e anexos",
      price: "R$ 3",
      annualPrice: "R$ 24",
      perUnit: "/5GB/mês",
      availableFor: [PlanName.LITE, PlanName.PRO],
   },
   {
      name: AddOnType.AUTOMATION_PACK,
      displayName: "Automações Ilimitadas",
      description: "Fluxos e regras de automação sem limite",
      price: "R$ 12",
      annualPrice: "R$ 120",
      perUnit: "/mês",
      availableFor: [PlanName.PRO],
   },
];
