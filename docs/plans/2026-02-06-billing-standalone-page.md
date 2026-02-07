# Billing Standalone Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move billing to a standalone top-level dashboard route (`/$slug/billing`) without the settings sidebar, add an Early Access banner, and always show all product category cards even with zero usage.

**Architecture:** Move the billing route from `settings/billing.tsx` to a new `billing.tsx` route under `_dashboard/`. The billing page renders directly inside `DashboardLayout` (main app sidebar + header) without the settings sidebar wrapper. Add a shared `EarlyAccessBanner` component shown on all three tabs. Modify the Overview component to always render all 6 known categories (content, ai, form, seo, experiment, webhook) even when the API returns no data for some.

**Tech Stack:** React 19, TanStack Router (file-based routing), Radix UI, Tailwind CSS, Lucide icons, oRPC

---

### Task 1: Create standalone billing route

Move billing from `settings/billing.tsx` to a top-level dashboard route.

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/_dashboard/billing.tsx`
- Delete: `apps/web/src/routes/_authenticated/$slug/_dashboard/settings/billing.tsx`

**Step 1: Create the new route file**

Create `apps/web/src/routes/_authenticated/$slug/_dashboard/billing.tsx` with the following content. This is the same billing page content but registered at the new route path:

```tsx
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { BillingOverview } from "@/features/billing/ui/billing-overview";
import { BillingSpend } from "@/features/billing/ui/billing-spend";
import { BillingUsage } from "@/features/billing/ui/billing-usage";
import { EarlyAccessBanner } from "@/features/billing/ui/early-access-banner";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/billing",
)({
   component: BillingPage,
});

// ============================================
// Error and Loading States
// ============================================

function BillingSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Cobranca</CardTitle>
            <CardDescription>
               Gerencie sua cobranca e informacoes de uso.
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: "Erro ao carregar informacoes de cobranca",
               errorTitle: "Erro",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BillingSectionSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-24 w-full lg:max-w-md" />
         </div>
         <Skeleton className="h-5 w-96" />
         <Skeleton className="h-9 w-56" />
         <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
               <Skeleton
                  className="h-32 w-full"
                  key={`product-skeleton-${i + 1}`}
               />
            ))}
         </div>
      </div>
   );
}

// ============================================
// Exported Component
// ============================================

function BillingPage() {
   return (
      <div className="space-y-6">
         <EarlyAccessBanner />

         <Tabs defaultValue="overview">
            <TabsList>
               <TabsTrigger value="overview">Overview</TabsTrigger>
               <TabsTrigger value="usage">Uso</TabsTrigger>
               <TabsTrigger value="spend">Gastos</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-6" value="overview">
               <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
                  <Suspense fallback={<BillingSectionSkeleton />}>
                     <BillingOverview />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>

            <TabsContent className="mt-6" value="usage">
               <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
                  <Suspense fallback={<BillingSectionSkeleton />}>
                     <BillingUsage />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>

            <TabsContent className="mt-6" value="spend">
               <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
                  <Suspense fallback={<BillingSectionSkeleton />}>
                     <BillingSpend />
                  </Suspense>
               </ErrorBoundary>
            </TabsContent>
         </Tabs>
      </div>
   );
}
```

**Step 2: Delete the old route file**

Delete: `apps/web/src/routes/_authenticated/$slug/_dashboard/settings/billing.tsx`

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/_dashboard/billing.tsx
git rm apps/web/src/routes/_authenticated/$slug/_dashboard/settings/billing.tsx
git commit -m "feat(billing): move billing to standalone dashboard route"
```

---

### Task 2: Remove billing from settings sidebar

Remove the billing nav item from the settings sidebar and mobile nav since billing is now a standalone route.

**Files:**
- Modify: `apps/web/src/layout/dashboard/settings-sidebar.tsx`
- Modify: `apps/web/src/layout/dashboard/settings-mobile-nav.tsx`

**Step 1: Remove billing from settings sidebar**

In `apps/web/src/layout/dashboard/settings-sidebar.tsx`, remove the billing entry from `settingsNavItems` array (lines 43-48) and remove the `CreditCard` import from lucide-react.

The `settingsNavItems` array should become:
```typescript
const settingsNavItems = [
   {
      href: "/$slug/settings/profile",
      icon: User,
      id: "profile",
      title: "Perfil",
   },
   {
      href: "/$slug/settings/security",
      icon: Shield,
      id: "security",
      title: "Segurança",
   },
   {
      href: "/$slug/settings/preferences",
      icon: Settings2,
      id: "preferences",
      title: "Preferências",
   },
   {
      href: "/$slug/settings/usage",
      icon: Activity,
      id: "usage",
      title: "Uso de IA",
   },
];
```

**Step 2: Remove billing from settings mobile nav**

In `apps/web/src/layout/dashboard/settings-mobile-nav.tsx`, remove the billing entry from the `settingsNavItems` array and remove the `CreditCard` import from lucide-react.

The array should become:
```typescript
const settingsNavItems = [
   {
      description: "Gerencie seu nome, email e foto",
      href: "/$slug/settings/profile",
      icon: User,
      id: "profile",
      title: "Perfil",
   },
   {
      description: "Senha e autenticação em dois fatores",
      href: "/$slug/settings/security",
      icon: Shield,
      id: "security",
      title: "Segurança",
   },
   {
      description: "Tema, idioma e privacidade",
      href: "/$slug/settings/preferences",
      icon: Settings2,
      id: "preferences",
      title: "Preferências",
   },
   {
      description: "Estatísticas de uso de recursos IA",
      href: "/$slug/settings/usage",
      icon: Activity,
      id: "usage",
      title: "Uso de IA",
   },
];
```

**Step 3: Commit**

```bash
git add apps/web/src/layout/dashboard/settings-sidebar.tsx apps/web/src/layout/dashboard/settings-mobile-nav.tsx
git commit -m "feat(settings): remove billing from settings sidebar nav"
```

---

### Task 3: Add billing link to main dashboard sidebar

Add a "Billing" link to the main dashboard sidebar so users can access it directly from the main nav, just like PostHog puts Billing in the top-level navigation.

**Files:**
- Modify: `apps/web/src/layout/dashboard/nav-main.tsx`

**Step 1: Add billing to mainItems**

In `apps/web/src/layout/dashboard/nav-main.tsx`, add `CreditCard` to the lucide-react imports and add a billing item to the `mainItems` array:

```typescript
import { CreditCard, FileText, Home } from "lucide-react";

const mainItems = [
   {
      icon: Home,
      id: "home",
      title: "Início",
      url: "/$slug/home",
   },
   {
      icon: FileText,
      id: "content",
      title: "Conteúdos",
      url: "/$slug/content",
   },
   {
      icon: CreditCard,
      id: "billing",
      title: "Billing",
      url: "/$slug/billing",
   },
];
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/nav-main.tsx
git commit -m "feat(nav): add billing link to main dashboard sidebar"
```

---

### Task 4: Create Early Access Banner component

Create a reusable `EarlyAccessBanner` component similar to PostHog's early access banner with bullet points about data updates.

**Files:**
- Create: `apps/web/src/features/billing/ui/early-access-banner.tsx`

**Step 1: Create the banner component**

Create `apps/web/src/features/billing/ui/early-access-banner.tsx`:

```tsx
import { Badge } from "@packages/ui/components/badge";
import { FlaskConical } from "lucide-react";

export function EarlyAccessBanner() {
   return (
      <div className="rounded-lg border bg-card p-4 flex gap-4">
         <div className="shrink-0 mt-0.5">
            <FlaskConical className="size-5 text-amber-500" />
         </div>
         <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
               <Badge
                  className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                  variant="outline"
               >
                  Acesso antecipado
               </Badge>
               <span className="text-sm text-muted-foreground">
                  Estamos aprimorando estes dashboards — tem perguntas, ideias ou
                  bugs?{" "}
                  <a
                     className="text-primary hover:underline"
                     href="mailto:suporte@contentta.com"
                  >
                     Fale com a gente
                  </a>
                  !
               </span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
               <li>
                  Dados de uso atualizados diariamente (UTC) — os numeros de hoje
                  aparecem amanha
               </li>
               <li>
                  Gastos historicos e periodos de cobranca sao baseados no plano
                  atual
               </li>
               <li>
                  Para mais detalhes por evento, expanda os cards de produto na aba
                  Overview
               </li>
            </ul>
         </div>
      </div>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/billing/ui/early-access-banner.tsx
git commit -m "feat(billing): add early access banner component"
```

---

### Task 5: Always show all product category cards

Modify `BillingOverview` to always render all 6 known categories (content, ai, form, seo, experiment, webhook) even when the API returns no usage data for some categories. Cards with zero usage should show `0` counts and `R$ 0,00` costs.

**Files:**
- Modify: `apps/web/src/features/billing/ui/billing-overview.tsx`

**Step 1: Add all-categories constant and merge logic**

In `billing-overview.tsx`, after the existing `CATEGORY_CONFIG` constant (around line 115), the component should ensure all categories appear. Modify the `BillingOverview` component (starting at line 556) to merge API data with the full list of known categories.

Replace the `sortedCategories` logic in `BillingOverview` with:

```tsx
// All known categories that should always be displayed
const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

// Merge API data with known categories — always show all cards
const categoryDataMap = new Map(
   data.byCategory.map((c) => [c.category, c]),
);

const allCategories: CategorySummary[] = ALL_CATEGORIES.map((cat) => {
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
```

Also remove the "Nenhum uso registrado neste periodo" empty state block (lines 609-614 area) since we now always show all cards:

```tsx
{/* Remove this block: */}
{sortedCategories.length === 0 && (
   <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
         Nenhum uso registrado neste periodo
      </CardContent>
   </Card>
)}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/billing/ui/billing-overview.tsx
git commit -m "feat(billing): always show all product category cards"
```

---

### Task 6: Update all billing-related links

Update any remaining links that point to the old `/$slug/settings/billing` route to use the new `/$slug/billing` route.

**Files:**
- Search for: any file referencing `settings/billing` across the codebase

**Step 1: Find and update all references**

Run a search for `settings/billing` across the codebase:
```bash
grep -r "settings/billing" apps/web/src/ --include="*.tsx" --include="*.ts" -l
```

For each file found, update the route path from `/$slug/settings/billing` to `/$slug/billing`.

Common locations to check:
- `apps/web/src/features/billing/ui/billing-overview.tsx` — the "Gerenciar plano e faturas" link (this points to `/$slug/plans` so likely no change needed)
- Any navigation components that link to billing
- The site header if it has a billing shortcut

**Step 2: Commit**

```bash
git add -A
git commit -m "fix(billing): update all references to new billing route"
```

---

### Task 7: Verify and test

**Step 1: Run type checking**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck
```

Expected: No errors

**Step 2: Run linter**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run check
```

Expected: No errors (or only pre-existing ones)

**Step 3: Verify TanStack Router generates the new route**

After creating the new route file, TanStack Router's file-based routing should auto-generate the route tree. Run the dev server briefly to confirm:

```bash
cd /home/yorizel/Documents/contentta-nx && npx nx run web:dev
```

Check that `/$slug/billing` loads the billing page with tabs and the Early Access banner.

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(billing): address typecheck/lint issues"
```
