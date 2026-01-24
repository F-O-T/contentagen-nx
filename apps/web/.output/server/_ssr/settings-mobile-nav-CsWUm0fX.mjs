import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { C as Card, a as CardAction, b as CardHeader, c as CardTitle, d as CardDescription, e as CardContent } from "./card-D_7Rsx9D.mjs";
import { h as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { u as useActiveOrganization } from "./use-active-organization-a8BhfK6J.mjs";
import { U as User, g as Shield, h as Settings2, i as Activity, d as CreditCard, o as ArrowUpRight } from "../_libs/lucide-react.mjs";
function QuickAccessCard({
  content,
  icon,
  title,
  description,
  onClick,
  disabled = false
}) {
  const handleKeyDown = (event) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    Card,
    {
      "aria-disabled": disabled,
      "aria-label": `${title}: ${description}`,
      className: `${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} transition-opacity`,
      onClick: disabled ? void 0 : onClick,
      onKeyDown: handleKeyDown,
      role: disabled ? void 0 : "button",
      tabIndex: disabled ? -1 : 0,
      children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CardAction, { className: "px-6 flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "rounded-lg bg-muted p-2 text-primary", children: icon }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
            lineNumber: 48,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ArrowUpRight, { className: "size-4 text-primary" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
            lineNumber: 49,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
          lineNumber: 47,
          columnNumber: 10
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CardHeader, { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CardTitle, { children: title }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
            lineNumber: 52,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CardDescription, { children: description }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
            lineNumber: 53,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CardAction, {}, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
            lineNumber: 54,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
          lineNumber: 51,
          columnNumber: 10
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CardContent, { children: content }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
          lineNumber: 56,
          columnNumber: 10
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/packages/ui/src/components/quick-access-card.tsx",
      lineNumber: 38,
      columnNumber: 7
    },
    this
  );
}
const settingsNavItems = [
  {
    description: "Gerencie seu nome, email e foto",
    href: "/$slug/settings/profile",
    icon: User,
    id: "profile",
    title: "Perfil"
  },
  {
    description: "Senha e autenticação em dois fatores",
    href: "/$slug/settings/security",
    icon: Shield,
    id: "security",
    title: "Segurança"
  },
  {
    description: "Tema, idioma e privacidade",
    href: "/$slug/settings/preferences",
    icon: Settings2,
    id: "preferences",
    title: "Preferências"
  },
  {
    description: "Estatísticas de uso de recursos IA",
    href: "/$slug/settings/usage",
    icon: Activity,
    id: "usage",
    title: "Uso de IA"
  },
  {
    description: "Plano e método de pagamento",
    href: "/$slug/settings/billing",
    icon: CreditCard,
    id: "billing",
    title: "Assinatura"
  }
];
function SettingsMobileNav() {
  const { activeOrganization } = useActiveOrganization();
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid gap-4", children: settingsNavItems.map((item) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    QuickAccessCard,
    {
      description: item.description,
      icon: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(item.icon, { className: "size-4" }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/settings-mobile-nav.tsx",
        lineNumber: 53,
        columnNumber: 22
      }, this),
      onClick: () => navigate({
        params: { slug: activeOrganization.slug },
        to: item.href
      }),
      title: item.title
    },
    item.id,
    false,
    {
      fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/settings-mobile-nav.tsx",
      lineNumber: 51,
      columnNumber: 13
    },
    this
  )) }, void 0, false, {
    fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/layout/settings-mobile-nav.tsx",
    lineNumber: 49,
    columnNumber: 7
  }, this);
}
export {
  SettingsMobileNav as S
};
