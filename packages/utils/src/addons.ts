export const ADDON_IDS = {
   BOOST: "boost",
   SCALE: "scale",
   ENTERPRISE: "enterprise",
} as const;

export type AddonId = (typeof ADDON_IDS)[keyof typeof ADDON_IDS];

export type AddonInfo = {
   id: AddonId;
   name: string;
   description: string;
   features: string[];
   price: string;
   highlight?: string;
};

export const ADDONS: Record<AddonId, AddonInfo> = {
   boost: {
      id: "boost",
      name: "Boost",
      description: "Controle de acesso avançado para seus projetos",
      features: ["access-control"],
      price: "R$ 99/mês",
      highlight: "Mais popular",
   },
   scale: {
      id: "scale",
      name: "Scale",
      description: "Registro de atividades e análises avançadas",
      features: ["activity-logs", "advanced-analytics"],
      price: "R$ 199/mês",
   },
   enterprise: {
      id: "enterprise",
      name: "Enterprise",
      description: "SSO, funções customizadas e suporte dedicado",
      features: ["custom-roles", "sso", "saml", "oidc", "audit-logs"],
      price: "Sob consulta",
      highlight: "Para empresas",
   },
} as const;

export function hasFeature(addonId: AddonId, featureId: string): boolean {
   return ADDONS[addonId].features.includes(featureId);
}
