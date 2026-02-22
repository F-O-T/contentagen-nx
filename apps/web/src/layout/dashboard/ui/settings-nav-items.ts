import type { LucideIcon } from "lucide-react";
import {
   AlertTriangle,
   Box,
   CreditCard,
   FileText,
   FlaskConical,
   Globe,
   Images,
   Key,
   LayoutGrid,
   Lock,
   Network,
   Palette,
   ScrollText,
   Settings2,
   Shield,
   ShieldCheck,
   Sparkles,
   User,
   UserCog,
   Users,
   Webhook,
} from "lucide-react";

export type SettingsNavItemDef = {
   id: string;
   title: string;
   href: string;
   icon?: LucideIcon;
   external?: boolean;
   danger?: boolean;
   earlyAccessFlag?: string;
   earlyAccessStage?: "alpha" | "beta" | "concept" | "general-availability";
   children?: SettingsNavItemDef[];
};

export type SettingsNavSection = {
   id: string;
   label: string;
   defaultOpen: boolean;
   items: SettingsNavItemDef[];
};

export const settingsNavSections: SettingsNavSection[] = [
   {
      id: "project",
      label: "Projeto",
      defaultOpen: true,
      items: [
         {
            id: "project-general",
            title: "Geral",
            href: "/$slug/$teamSlug/settings/project/general",
            icon: Settings2,
         },
         {
            id: "project-webhooks",
            title: "Webhooks",
            href: "/$slug/$teamSlug/settings/project/webhooks",
            icon: Webhook,
         },
         {
            id: "project-products",
            title: "Produtos",
            href: "/$slug/$teamSlug/settings/project/products",
            icon: Box,
            children: [
               {
                  id: "product-content",
                  title: "Conteúdo",
                  href: "/$slug/$teamSlug/settings/project/products/content",
                  icon: FileText,
               },
               {
                  id: "product-forms",
                  title: "Formulários",
                  href: "/$slug/$teamSlug/settings/project/products/forms",
                  icon: LayoutGrid,
                  earlyAccessFlag: "forms-beta",
               },
               {
                  id: "product-ai-agents",
                  title: "Agentes IA",
                  href: "/$slug/$teamSlug/settings/project/products/ai-agents",
                  icon: Sparkles,
               },
               {
                  id: "product-asset-bank",
                  title: "Imagens",
                  href: "/$slug/$teamSlug/settings/project/products/asset-bank",
                  icon: Images,
                  earlyAccessFlag: "asset-bank",
               },
            ],
         },
         {
            id: "project-integrations",
            title: "Integrações",
            href: "/$slug/$teamSlug/settings/project/integrations",
            icon: Network,
         },
         {
            id: "project-access-control",
            title: "Controle de acesso",
            href: "/$slug/$teamSlug/settings/project/access-control",
            icon: ShieldCheck,
         },
         {
            id: "project-activity-logs",
            title: "Registro de atividades",
            href: "/$slug/$teamSlug/settings/project/activity-logs",
            icon: ScrollText,
         },
         {
            id: "project-danger-zone",
            title: "Zona de perigo",
            href: "/$slug/$teamSlug/settings/project/danger-zone",
            icon: AlertTriangle,
            danger: true,
         },
      ],
   },
   {
      id: "organization",
      label: "Organização",
      defaultOpen: true,
      items: [
         {
            id: "org-general",
            title: "Geral",
            href: "/$slug/$teamSlug/settings/organization/general",
            icon: Settings2,
         },
         {
            id: "org-members",
            title: "Membros",
            href: "/$slug/$teamSlug/settings/organization/members",
            icon: Users,
         },
         {
            id: "org-roles",
            title: "Funções",
            href: "/$slug/$teamSlug/settings/organization/roles",
            icon: UserCog,
         },
         {
            id: "org-authentication",
            title: "Domínios de auth & SSO",
            href: "/$slug/$teamSlug/settings/organization/authentication",
            icon: Globe,
         },
         {
            id: "org-security",
            title: "Segurança",
            href: "/$slug/$teamSlug/settings/organization/security",
            icon: Lock,
         },
         {
            id: "org-billing",
            title: "Faturamento",
            href: "/$slug/$teamSlug/billing",
            icon: CreditCard,
            external: true,
         },
         {
            id: "org-danger-zone",
            title: "Zona de perigo",
            href: "/$slug/$teamSlug/settings/organization/danger-zone",
            icon: AlertTriangle,
            danger: true,
         },
      ],
   },
   {
      id: "account",
      label: "Conta",
      defaultOpen: true,
      items: [
         {
            id: "account-profile",
            title: "Perfil",
            href: "/$slug/$teamSlug/settings/profile",
            icon: User,
         },
         {
            id: "account-personal-api-keys",
            title: "Chaves de API pessoais",
            href: "/$slug/$teamSlug/settings/personal-api-keys",
            icon: Key,
         },
         {
            id: "account-security",
            title: "Segurança",
            href: "/$slug/$teamSlug/settings/security",
            icon: Shield,
         },
         {
            id: "account-feature-previews",
            title: "Prévias de funcionalidades",
            href: "/$slug/$teamSlug/settings/feature-previews",
            icon: FlaskConical,
         },
         {
            id: "account-customization",
            title: "Personalização",
            href: "/$slug/$teamSlug/settings/customization",
            icon: Palette,
         },
         {
            id: "account-danger-zone",
            title: "Zona de perigo",
            href: "/$slug/$teamSlug/settings/danger-zone",
            icon: AlertTriangle,
            danger: true,
         },
      ],
   },
];
