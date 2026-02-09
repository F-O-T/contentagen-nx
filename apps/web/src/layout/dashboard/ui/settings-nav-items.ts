import type { LucideIcon } from "lucide-react";
import {
   AlertTriangle,
   Bell,
   Box,
   CreditCard,
   FileText,
   FlaskConical,
   Globe,
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
            href: "/$slug/settings/project/general",
            icon: Settings2,
         },
         {
            id: "project-api-keys",
            title: "Chaves de API",
            href: "/$slug/settings/project/api-keys",
            icon: Key,
         },
         {
            id: "project-webhooks",
            title: "Webhooks",
            href: "/$slug/settings/project/webhooks",
            icon: Webhook,
         },
         {
            id: "project-products",
            title: "Produtos",
            href: "/$slug/settings/project/products",
            icon: Box,
            children: [
               {
                  id: "product-content",
                  title: "Conteúdo",
                  href: "/$slug/settings/project/products/content",
                  icon: FileText,
               },
               {
                  id: "product-forms",
                  title: "Formulários",
                  href: "/$slug/settings/project/products/forms",
                  icon: LayoutGrid,
               },
               {
                  id: "product-ai-agents",
                  title: "Agentes IA",
                  href: "/$slug/settings/project/products/ai-agents",
                  icon: Sparkles,
               },
            ],
         },
         {
            id: "project-integrations",
            title: "Integrações",
            href: "/$slug/settings/project/integrations",
            icon: Network,
         },
         {
            id: "project-access-control",
            title: "Controle de acesso",
            href: "/$slug/settings/project/access-control",
            icon: ShieldCheck,
         },
         {
            id: "project-activity-logs",
            title: "Registro de atividades",
            href: "/$slug/settings/project/activity-logs",
            icon: ScrollText,
         },
         {
            id: "project-danger-zone",
            title: "Zona de perigo",
            href: "/$slug/settings/project/danger-zone",
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
            href: "/$slug/settings/organization/general",
            icon: Settings2,
         },
         {
            id: "org-members",
            title: "Membros",
            href: "/$slug/settings/organization/members",
            icon: Users,
         },
         {
            id: "org-roles",
            title: "Funções",
            href: "/$slug/settings/organization/roles",
            icon: UserCog,
         },
         {
            id: "org-authentication",
            title: "Domínios de auth & SSO",
            href: "/$slug/settings/organization/authentication",
            icon: Globe,
         },
         {
            id: "org-reverse-proxy",
            title: "Proxy reverso gerenciado",
            href: "/$slug/settings/organization/reverse-proxy",
            icon: Network,
         },
         {
            id: "org-security",
            title: "Segurança",
            href: "/$slug/settings/organization/security",
            icon: Lock,
         },
         {
            id: "org-billing",
            title: "Faturamento",
            href: "/$slug/billing",
            icon: CreditCard,
            external: true,
         },
         {
            id: "org-danger-zone",
            title: "Zona de perigo",
            href: "/$slug/settings/organization/danger-zone",
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
            href: "/$slug/settings/profile",
            icon: User,
         },
         {
            id: "account-personal-api-keys",
            title: "Chaves de API pessoais",
            href: "/$slug/settings/personal-api-keys",
            icon: Key,
         },
         {
            id: "account-security",
            title: "Segurança",
            href: "/$slug/settings/security",
            icon: Shield,
         },
         {
            id: "account-feature-previews",
            title: "Prévias de funcionalidades",
            href: "/$slug/settings/feature-previews",
            icon: FlaskConical,
         },
         {
            id: "account-notifications",
            title: "Notificações",
            href: "/$slug/settings/notifications",
            icon: Bell,
         },
         {
            id: "account-customization",
            title: "Personalização",
            href: "/$slug/settings/customization",
            icon: Palette,
         },
         {
            id: "account-danger-zone",
            title: "Zona de perigo",
            href: "/$slug/settings/danger-zone",
            icon: AlertTriangle,
            danger: true,
         },
      ],
   },
];
