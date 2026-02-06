# Phase 3 Week 7-8: Billing & Analytics UI - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build PostHog-style billing dashboard with Overview/Usage/Spend tabs, product cards showing current usage, projections, and PostHog-inspired UI components.

**Architecture:** TanStack Router for routing, oRPC for data fetching, TanStack Query for caching, Radix UI + Tailwind for components. Query materialized views for fast billing data.

**Tech Stack:** React 19, TanStack Router, oRPC, Radix UI, Tailwind CSS 4, Recharts

**Duration:** 2 weeks

---

## Week 7: Billing API & Core UI

### Task 1: Billing API Router

**Files:**
- Create: `packages/api/src/server/routers/billing.ts`
- Modify: `packages/api/src/server/router.ts`

**Step 1: Create billing router**

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@packages/database/client';
import {
  currentMonthUsageByCategory,
  currentMonthUsageByEvent,
  dailyUsageByEvent,
} from '@packages/database/schemas/event-views';
import { eventCatalog } from '@packages/database/schemas/event-catalog';
import { organization } from '@packages/database/schemas/organization';
import { eq, and, sql } from 'drizzle-orm';

export const billingRouter = router({
  /**
   * Get current month usage summary
   */
  getCurrentUsage: protectedProcedure
    .query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const usage = await db.select()
        .from(currentMonthUsageByCategory)
        .where(eq(currentMonthUsageByCategory.organizationId, resolvedCtx.organizationId));

      const total = usage.reduce((sum, cat) => sum + parseFloat(cat.monthToDateCost), 0);
      const projected = usage.reduce((sum, cat) => sum + parseFloat(cat.projectedCost), 0);

      return {
        monthToDate: total,
        projected,
        byCategory: usage,
      };
    }),

  /**
   * Get usage by event for a category
   */
  getCategoryUsage: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      const events = await db.select()
        .from(currentMonthUsageByEvent)
        .where(
          and(
            eq(currentMonthUsageByEvent.organizationId, resolvedCtx.organizationId),
            eq(currentMonthUsageByEvent.eventCategory, input.category)
          )
        );

      // Get free tier limits from catalog
      const catalog = await db.select()
        .from(eventCatalog)
        .where(eq(eventCatalog.category, input.category));

      // Merge with usage
      const enriched = events.map(event => {
        const catalogEntry = catalog.find(c => c.eventName === event.eventName);
        return {
          ...event,
          freeTierLimit: catalogEntry?.freeTierLimit || 0,
          pricePerEvent: catalogEntry?.pricePerEvent || '0',
          displayName: catalogEntry?.displayName || event.eventName,
        };
      });

      return enriched;
    }),

  /**
   * Get daily usage chart data
   */
  getDailyUsage: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      const usage = await db.select()
        .from(dailyUsageByEvent)
        .where(
          and(
            eq(dailyUsageByEvent.organizationId, resolvedCtx.organizationId),
            sql`${dailyUsageByEvent.date} >= CURRENT_DATE - INTERVAL '${input.days} days'`
          )
        );

      // Group by date
      const byDate = usage.reduce((acc, row) => {
        if (!acc[row.date]) {
          acc[row.date] = { date: row.date, total: 0, byCategory: {} };
        }
        acc[row.date].total += parseFloat(row.totalCost);
        acc[row.date].byCategory[row.eventCategory] =
          (acc[row.date].byCategory[row.eventCategory] || 0) + parseFloat(row.totalCost);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }),

  /**
   * Set billing limit
   */
  setBillingLimit: protectedProcedure
    .input(z.object({ limit: z.number().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      await db.update(organization)
        .set({
          billingLimit: input.limit ? input.limit.toString() : null,
        })
        .where(eq(organization.id, resolvedCtx.organizationId));

      return { success: true };
    }),

  /**
   * Get billing limit
   */
  getBillingLimit: protectedProcedure
    .query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const [org] = await db.select({ billingLimit: organization.billingLimit })
        .from(organization)
        .where(eq(organization.id, resolvedCtx.organizationId))
        .limit(1);

      return {
        limit: org?.billingLimit ? parseFloat(org.billingLimit) : null,
      };
    }),
});
```

**Step 2: Mount billing router**

File: `packages/api/src/server/router.ts`

```typescript
import { billingRouter } from './routers/billing';

export const appRouter = router({
  // ... existing routers
  billing: billingRouter,
});
```

**Step 3: Test billing API**

Start server and test:

```bash
curl http://localhost:3000/api/billing/getCurrentUsage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Step 4: Commit**

```bash
git add packages/api
git commit -m "feat(api): add billing router

- Get current usage summary
- Get category usage breakdown
- Get daily usage chart data
- Manage billing limits"
```

---

### Task 2: Billing Route & Layout

**Files:**
- Create: `apps/web/src/routes/$slug/_dashboard/billing.tsx`

**Step 1: Create billing route**

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@packages/ui/components/tabs';

export const Route = createFileRoute('/$slug/_dashboard/billing')({
  component: BillingPage,
});

function BillingPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your usage and billing settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="spend">Spend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BillingOverview />
        </TabsContent>

        <TabsContent value="usage">
          <BillingUsage />
        </TabsContent>

        <TabsContent value="spend">
          <BillingSpend />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BillingOverview() {
  return <div>Overview content (Task 3)</div>;
}

function BillingUsage() {
  return <div>Usage content (Task 4)</div>;
}

function BbillingSpend() {
  return <div>Spend content (Task 5)</div>;
}
```

**Step 2: Add to navigation**

File: `apps/web/src/components/dashboard-nav.tsx` (or wherever nav is)

```tsx
<NavItem href="/$slug/billing" icon={CreditCardIcon}>
  Billing
</NavItem>
```

**Step 3: Test route**

Navigate to `/your-org/billing` - should show tabs

**Step 4: Commit**

```bash
git add apps/web/src/routes
git commit -m "feat(web): add billing page with tabs

- Create billing route
- Add Overview/Usage/Spend tabs
- Add to navigation"
```

---

### Task 3: Billing Overview Tab

**Files:**
- Create: `apps/web/src/features/billing/ui/billing-overview.tsx`
- Create: `apps/web/src/features/billing/ui/current-bill-card.tsx`
- Create: `apps/web/src/features/billing/ui/billing-period-card.tsx`

**Step 1: Create overview component**

File: `apps/web/src/features/billing/ui/billing-overview.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@packages/ui/components/card';
import { Skeleton } from '@packages/ui/components/skeleton';

export function BillingOverview() {
  const { data, isLoading } = trpc.billing.getCurrentUsage.useQuery();

  if (isLoading) {
    return <BillingOverviewSkeleton />;
  }

  const daysRemaining = getDaysRemainingInMonth();

  return (
    <div className="space-y-6">
      {/* Current Bill Total */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Current bill total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">${data?.monthToDate.toFixed(2) || '0.00'}</div>
          <p className="text-sm text-muted-foreground mt-2">
            Billing period: {getCurrentBillingPeriod()} ({daysRemaining} days remaining)
          </p>

          <button className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded">
            Manage card details and invoices
          </button>
        </CardContent>
      </Card>

      {/* Pay-as-you-go Banner */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100">
                Good call!
              </h3>
              <p className="text-orange-800 dark:text-orange-200 mt-1">
                You're on the Pay-as-you-go plan.
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                If you're growing like crazy, you might want to check out our{' '}
                <a href="#" className="underline">Platform add-ons</a>.
              </p>
            </div>
            <div className="text-6xl">🎉</div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Add-ons */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Platform and support</h2>
        <Card>
          <CardHeader>
            <CardTitle>Advanced AI</CardTitle>
            <CardDescription>
              Planning mode, SERP research, and advanced content generation features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button className="px-4 py-2 border rounded">Coming soon</button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BillingOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function getCurrentBillingPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function getDaysRemainingInMonth() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
```

**Step 2: Use in billing page**

File: `apps/web/src/routes/$slug/_dashboard/billing.tsx`

```tsx
import { BillingOverview } from '@/features/billing/ui/billing-overview';

function BillingPage() {
  // ... existing code
  <TabsContent value="overview">
    <BillingOverview />
  </TabsContent>
}
```

**Step 3: Test overview tab**

Navigate to billing page - should show:
- Current bill total
- Billing period
- Pay-as-you-go banner
- Platform add-ons section

**Step 4: Commit**

```bash
git add apps/web/src/features/billing
git commit -m "feat(billing): add overview tab

- Show current bill total
- Display billing period
- Add pay-as-you-go banner
- Show platform add-ons"
```

---

### Task 4: Product Cards Component

**Files:**
- Create: `packages/ui/src/components/billing/product-card.tsx`
- Create: `packages/ui/src/components/billing/usage-progress.tsx`

**Step 1: Create product card component**

File: `packages/ui/src/components/billing/product-card.tsx`

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card';
import { Progress } from '../progress';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface ProductCardProps {
  name: string;
  description?: string;
  icon?: ReactNode;
  currentUsage?: number;
  freeLimit?: number;
  monthToDate: number;
  projected: number;
  expandable?: boolean;
  children?: ReactNode;
}

export function ProductCard({
  name,
  description,
  icon,
  currentUsage,
  freeLimit,
  monthToDate,
  projected,
  expandable = false,
  children,
}: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const usagePercent = freeLimit && currentUsage
    ? Math.min((currentUsage / freeLimit) * 100, 100)
    : 0;

  const isOverLimit = currentUsage && freeLimit && currentUsage > freeLimit;

  return (
    <Card>
      <CardHeader className={expandable ? 'cursor-pointer' : ''} onClick={() => expandable && setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {expandable && (
            isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Usage Progress */}
        {freeLimit && currentUsage !== undefined && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>
                Current: <strong>{currentUsage.toLocaleString()}</strong>
              </span>
              <span className="text-muted-foreground">
                Free tier limit: {freeLimit.toLocaleString()}
              </span>
            </div>
            <Progress
              value={usagePercent}
              className={isOverLimit ? 'bg-red-200' : ''}
            />
            {isOverLimit && (
              <p className="text-xs text-red-600 mt-1">
                Exceeded free tier by {(currentUsage - freeLimit).toLocaleString()} events
              </p>
            )}
          </div>
        )}

        {/* Cost Summary */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold">${monthToDate.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Month-to-date</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${projected.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Projected</div>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && children && (
          <div className="mt-6 pt-6 border-t">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create sub-product component**

File: `packages/ui/src/components/billing/sub-product.tsx`

```tsx
interface SubProductProps {
  name: string;
  current: number;
  limit?: number;
  cost?: number;
}

export function SubProduct({ name, current, limit, cost }: SubProductProps) {
  const percent = limit ? Math.min((current / limit) * 100, 100) : 0;

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm text-muted-foreground">
          {current.toLocaleString()} {limit ? `/ ${limit.toLocaleString()}` : ''}
        </span>
      </div>
      {limit && (
        <Progress value={percent} className="h-1.5" />
      )}
      {cost !== undefined && (
        <div className="text-xs text-muted-foreground mt-1">
          ${cost.toFixed(2)}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Export components**

File: `packages/ui/src/components/billing/index.tsx`

```tsx
export * from './product-card';
export * from './sub-product';
```

**Step 4: Commit**

```bash
git add packages/ui/src/components/billing
git commit -m "feat(ui): add billing product card components

- ProductCard with usage progress
- SubProduct for nested usage
- Expandable sections
- Free tier limit warnings"
```

---

### Task 5: Billing Usage Tab

**Files:**
- Create: `apps/web/src/features/billing/ui/billing-usage.tsx`

**Step 1: Create usage tab component**

```tsx
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { ProductCard, SubProduct } from '@packages/ui/components/billing';
import { Skeleton } from '@packages/ui/components/skeleton';
import { BarChart3Icon, SparklesIcon, FormIcon, SearchIcon } from 'lucide-react';

export function BillingUsage() {
  const { data, isLoading } = trpc.billing.getCurrentUsage.useQuery();

  const { data: contentUsage } = trpc.billing.getCategoryUsage.useQuery(
    { category: 'content' },
    { enabled: !!data }
  );

  const { data: aiUsage } = trpc.billing.getCategoryUsage.useQuery(
    { category: 'ai' },
    { enabled: !!data }
  );

  const { data: formUsage } = trpc.billing.getCategoryUsage.useQuery(
    { category: 'form' },
    { enabled: !!data }
  );

  if (isLoading) {
    return <BillingUsageSkeleton />;
  }

  // Calculate totals per category
  const contentStats = calculateCategoryStats(contentUsage || [], data?.byCategory?.find(c => c.eventCategory === 'content'));
  const aiStats = calculateCategoryStats(aiUsage || [], data?.byCategory?.find(c => c.eventCategory === 'ai'));
  const formStats = calculateCategoryStats(formUsage || [], data?.byCategory?.find(c => c.eventCategory === 'form'));

  return (
    <div className="space-y-6">
      <div className="prose dark:prose-invert">
        <p>
          Track your usage across all Contentta products. Free tier limits reset monthly.
        </p>
      </div>

      {/* Content Analytics */}
      <ProductCard
        name="Content Analytics"
        description="Track page views, engagement, and scroll depth"
        icon={<BarChart3Icon className="size-8 text-blue-500" />}
        currentUsage={contentStats.currentUsage}
        freeLimit={contentStats.freeLimit}
        monthToDate={contentStats.monthToDate}
        projected={contentStats.projected}
        expandable
      >
        {contentUsage?.map(event => (
          <SubProduct
            key={event.eventName}
            name={event.displayName}
            current={event.eventCount}
            limit={event.freeTierLimit || undefined}
            cost={parseFloat(event.monthToDateCost)}
          />
        ))}
      </ProductCard>

      {/* AI Usage */}
      <ProductCard
        name="AI Usage"
        description="AI completions, chat messages, and agent actions"
        icon={<SparklesIcon className="size-8 text-purple-500" />}
        currentUsage={aiStats.currentUsage}
        freeLimit={aiStats.freeLimit}
        monthToDate={aiStats.monthToDate}
        projected={aiStats.projected}
        expandable
      >
        {aiUsage?.map(event => (
          <SubProduct
            key={event.eventName}
            name={event.displayName}
            current={event.eventCount}
            limit={event.freeTierLimit || undefined}
            cost={parseFloat(event.monthToDateCost)}
          />
        ))}
      </ProductCard>

      {/* Forms */}
      <ProductCard
        name="Forms & Conversions"
        description="Form submissions and conversion tracking"
        icon={<FormIcon className="size-8 text-green-500" />}
        currentUsage={formStats.currentUsage}
        freeLimit={formStats.freeLimit}
        monthToDate={formStats.monthToDate}
        projected={formStats.projected}
      />

      {/* SEO */}
      <ProductCard
        name="SEO & Optimization"
        description="SEO analysis and recommendations"
        icon={<SearchIcon className="size-8 text-orange-500" />}
        currentUsage={0}
        freeLimit={0}
        monthToDate={0}
        projected={0}
      />

      {/* Billing Limit Warning */}
      <BillingLimitCard />
    </div>
  );
}

function calculateCategoryStats(events: any[], categoryData: any) {
  const currentUsage = events.reduce((sum, e) => sum + e.eventCount, 0);
  const freeLimit = events.reduce((sum, e) => sum + (e.freeTierLimit || 0), 0);
  const monthToDate = categoryData ? parseFloat(categoryData.monthToDateCost) : 0;
  const projected = categoryData ? parseFloat(categoryData.projectedCost) : 0;

  return { currentUsage, freeLimit, monthToDate, projected };
}

function BillingLimitCard() {
  const { data: limit } = trpc.billing.getBillingLimit.useQuery();

  if (!limit?.limit) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
        <CardContent className="pt-6">
          <p className="text-sm">
            ⚠️ You do not have a billing limit set.{' '}
            <a href="#" className="text-orange-600 underline">
              Set a billing limit
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}

function BillingUsageSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
}
```

**Step 2: Use in billing page**

File: `apps/web/src/routes/$slug/_dashboard/billing.tsx`

```tsx
import { BillingUsage } from '@/features/billing/ui/billing-usage';

<TabsContent value="usage">
  <BillingUsage />
</TabsContent>
```

**Step 3: Test usage tab**

Navigate to billing → Usage tab - should show:
- Content Analytics product card
- AI Usage product card (expandable)
- Forms product card
- SEO product card
- Billing limit warning (if not set)

**Step 4: Commit**

```bash
git add apps/web/src/features/billing
git commit -m "feat(billing): add usage tab

- Display all product cards
- Show usage vs free tier limits
- Expandable sections for sub-products
- Billing limit warnings"
```

---

## Week 8: Charts & Polish

### Task 6: Billing Spend Tab with Charts

**Files:**
- Create: `apps/web/src/features/billing/ui/billing-spend.tsx`
- Create: `apps/web/src/features/billing/ui/usage-chart.tsx`

**Step 1: Install Recharts**

```bash
cd apps/web
bun add recharts
```

**Step 2: Create usage chart component**

File: `apps/web/src/features/billing/ui/usage-chart.tsx`

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UsageChartProps {
  data: Array<{
    date: string;
    total: number;
    byCategory: Record<string, number>;
  }>;
}

export function UsageChart({ data }: UsageChartProps) {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: d.total,
    content: d.byCategory.content || 0,
    ai: d.byCategory.ai || 0,
    form: d.byCategory.form || 0,
    seo: d.byCategory.seo || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => `$${value.toFixed(2)}`}
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Total" />
        <Line type="monotone" dataKey="content" stroke="#82ca9d" name="Content" />
        <Line type="monotone" dataKey="ai" stroke="#ffc658" name="AI" />
        <Line type="monotone" dataKey="form" stroke="#ff7c7c" name="Forms" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Create spend tab component**

File: `apps/web/src/features/billing/ui/billing-spend.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { UsageChart } from './usage-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@packages/ui/components/card';
import { Skeleton } from '@packages/ui/components/skeleton';
import { useState } from 'react';

export function BillingSpend() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = trpc.billing.getDailyUsage.useQuery({ days });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daily Spend</CardTitle>
              <CardDescription>Your spending over time</CardDescription>
            </div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 border rounded"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <UsageChart data={data || []} />
        </CardContent>
      </Card>

      <SpendSummaryTable data={data || []} />
    </div>
  );
}

function SpendSummaryTable({ data }: { data: any[] }) {
  const totalSpend = data.reduce((sum, d) => sum + d.total, 0);
  const avgDailySpend = totalSpend / (data.length || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Spend</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${avgDailySpend.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Avg Daily Spend</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.length}</div>
            <div className="text-sm text-muted-foreground">Days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Use in billing page**

```tsx
<TabsContent value="spend">
  <BillingSpend />
</TabsContent>
```

**Step 5: Test spend tab**

Navigate to billing → Spend - should show:
- Line chart of daily spend
- Legend for categories
- Time range selector
- Summary stats

**Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(billing): add spend tab with charts

- Daily spend line chart
- Category breakdown
- Time range selector (7/30/90 days)
- Summary statistics"
```

---

## Week 7-8 Checklist

### Week 7
- [x] Billing API router
- [x] Billing page with tabs
- [x] Overview tab UI
- [x] Product card components
- [x] Usage tab with all products

### Week 8
- [x] Spend tab with charts
- [x] Recharts integration
- [x] Time range selector
- [x] Summary statistics

**Phase 3 Weeks 7-8 Complete!**

Continue to [Phase 3 Week 9-10: Forms Feature](./2026-02-05-phase3-week9-10-forms.md)
