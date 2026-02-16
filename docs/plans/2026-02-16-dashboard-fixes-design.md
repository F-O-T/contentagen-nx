# Dashboard Fixes - Complete Design Document

**Date:** 2026-02-16
**Issue:** #531 - Multiple critical dashboard issues
**Status:** Design Approved

## Overview

This document outlines the complete solution for 7 critical dashboard issues:
1. Duplicate dashboards created
2. Unwanted sample insights auto-created
3. Cannot edit dashboard title/description
4. "Add insight" button not working
5. Filter bar buttons non-functional
6. Dashboard layout has gaps
7. All text in English (should be Portuguese)

---

## Section 1: Dashboard Creation Flow (Issues #1, #2)

### Problem
Dashboards are created in TWO different places:
- `packages/database/src/repositories/auth-repository.ts:164-198` (during org creation)
- `packages/database/src/repositories/dashboard-repository.ts:155-225` (on first visit)

This causes duplicate dashboards and confusion about which team owns them.

### Solution

**1.1 Remove from auth-repository.ts**
- Delete lines 164-198 (entire dashboard creation block)
- Keep only organization and default team creation

**1.2 Create during onboarding completion**
Add to `orpc.onboarding.completeProjectOnboarding` procedure:

```typescript
// After marking team.onboardingCompleted = true

// Create default insights first
const insightIds = await createDefaultInsights(
  db,
  organizationId,
  teamId,
  userId
);

// Build tiles array
const tiles = insightIds.map((insightId, index) => ({
  insightId,
  size: DEFAULT_INSIGHTS[index].defaultSize,
  order: index,
}));

// Create dashboard with tiles
await db.insert(dashboards).values({
  organizationId,
  teamId,
  createdBy: userId,
  name: "Dashboard Principal",
  description: "Seu painel de análise principal",
  isDefault: true,
  tiles,
});
```

**1.3 Simplify dashboard-repository.ts**
- `getDefaultDashboard()` becomes query-only
- Remove creation logic (lines 179-214)
- Just return dashboard or throw if not found

### Result
✅ One dashboard per team
✅ Created at the right time (onboarding)
✅ Always has 8 default insights

---

## Section 2: Insight Caching System (Performance)

### Problem
Insights compute on every dashboard load, causing slow performance.

### Solution

**2.1 Database Schema Changes**
```typescript
// packages/database/src/schemas/insights.ts
export const insights = pgTable("insights", {
  // ... existing fields ...
  cachedResults: jsonb("cached_results"),
  lastComputedAt: timestamp("last_computed_at", { withTimezone: true }),
});
```

**2.2 Initial Computation During Onboarding (Synchronous)**
```typescript
// In completeProjectOnboarding procedure

// 1. Create insights
const insightIds = await createDefaultInsights(db, organizationId, teamId, userId);

// 2. Compute initial data synchronously
for (let i = 0; i < insightIds.length; i++) {
  const insightId = insightIds[i];
  const freshData = await computeInsightData(insightId);

  await db.update(insights)
    .set({
      cachedResults: freshData,
      lastComputedAt: new Date()
    })
    .where(eq(insights.id, insightId));
}

// 3. Create dashboard (data is ready)
// ... dashboard creation code
```

**2.3 Background Refresh Job (Every 3 Hours)**
```typescript
// apps/worker/src/jobs/refresh-insights.ts
export async function refreshAllInsights() {
  const allInsights = await db.select({ id: insights.id }).from(insights);

  for (const insight of allInsights) {
    const freshData = await computeInsightData(insight.id);
    await db.update(insights)
      .set({
        cachedResults: freshData,
        lastComputedAt: new Date()
      })
      .where(eq(insights.id, insight.id));
  }
}

// apps/worker/src/index.ts
cron.schedule("0 */3 * * *", refreshAllInsights);
```

**2.4 Dashboard Load (Fast Path)**
```typescript
// Just read cachedResults from database, no computation
const tiles = dashboard.tiles.map(tile => ({
  ...tile,
  data: tile.insight.cachedResults, // Pre-computed
  lastUpdated: tile.insight.lastComputedAt,
}));
```

**2.5 Manual Refresh (Dashboard Only)**
```typescript
// apps/web/src/integrations/orpc/router/insights.ts
export const refreshDashboard = protectedProcedure
  .input(z.object({ dashboardId: z.string() }))
  .handler(async ({ context, input }) => {
    const dashboard = await getDashboard(context.db, input.dashboardId);
    const insightIds = dashboard.tiles.map(t => t.insightId);

    // Only refresh insights on THIS dashboard
    await Promise.all(insightIds.map(async (id) => {
      const freshData = await computeInsightData(id);
      await context.db.update(insights)
        .set({ cachedResults: freshData, lastComputedAt: new Date() })
        .where(eq(insights.id, id));
    }));
  });
```

### Result
✅ Data ready immediately after onboarding
✅ Dashboard loads instantly (reads from cache)
✅ Background job keeps all insights fresh (max 3 hours stale)
✅ Manual refresh only computes visible insights (fast)

---

## Section 3: Dashboard Editing UI (Issues #3, #4)

### Problem
- Cannot edit dashboard title/description
- "Add insight" button just enters edit mode, doesn't open sheet

### Solution

**3.1 Title/Description Editing with TanStack Form**
```typescript
// apps/web/src/features/analytics/ui/editable-dashboard-grid.tsx
import { useForm } from "@tanstack/react-form";

export function EditableDashboardGrid({
  dashboard,
  isEditing,
  onDoneEditing,
}: EditableDashboardGridProps) {
  const queryClient = useQueryClient();
  const { openSheet, closeSheet } = useSheet();

  // Form for title/description
  const metadataForm = useForm({
    defaultValues: {
      name: dashboard.name,
      description: dashboard.description,
    },
  });

  // Local tile state (existing)
  const [localTiles, setLocalTiles] = useState<DashboardTileType[]>(
    dashboard.tiles,
  );

  // Combined save mutation
  const saveMutation = useMutation(
    orpc.dashboards.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.analytics.getDefaultDashboard.queryKey({}),
        });
        onDoneEditing();
      },
    }),
  );

  const handleSave = () => {
    const formValues = metadataForm.state.values;
    saveMutation.mutate({
      dashboardId: dashboard.id,
      name: formValues.name,
      description: formValues.description,
      tiles: localTiles,
    });
  };

  const handleCancel = () => {
    metadataForm.reset();
    setLocalTiles(dashboard.tiles);
    onDoneEditing();
  };

  return (
    <div>
      {isEditing && (
        <div className="mb-4 space-y-3 p-4 border rounded-lg bg-muted/50">
          {/* Name field */}
          <metadataForm.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value ? "Nome é obrigatório" : undefined,
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor="dashboard-name">Nome do Dashboard</Label>
                <Input
                  id="dashboard-name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Dashboard Principal"
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </metadataForm.Field>

          {/* Description field */}
          <metadataForm.Field name="description">
            {(field) => (
              <div>
                <Label htmlFor="dashboard-description">Descrição</Label>
                <Textarea
                  id="dashboard-description"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Seu painel de análise principal"
                  rows={2}
                />
              </div>
            )}
          </metadataForm.Field>
        </div>
      )}

      {/* Existing tile grid */}
      <DashboardGrid tiles={localTiles} isEditing={isEditing} ... />

      {/* Edit mode toolbar */}
      {isEditing && (
        <EditToolbar
          hasChanges={
            metadataForm.state.isDirty ||
            JSON.stringify(localTiles) !== JSON.stringify(dashboard.tiles)
          }
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}
```

**3.2 Fix "Add Insight" Button**
```typescript
// apps/web/src/routes/.../home/index.tsx

// Expose handleOpenAddSheet from EditableDashboardGrid
const handleOpenAddSheet = useCallback(() => {
  openSheet({
    children: <InsightSelector onSelect={handleAddTile} />,
  });
}, [openSheet, handleAddTile]);

// Pass to DashboardHeader
<DashboardHeader
  isEditing={isEditing}
  onEditToggle={() => setIsEditing(!isEditing)}
  onOpenAddSheet={handleOpenAddSheet}
/>

// In DashboardHeader component
function DashboardHeader({ isEditing, onEditToggle, onOpenAddSheet }) {
  return (
    <div className="flex items-center gap-2">
      {!isEditing && (
        <>
          <Button onClick={onEditToggle} size="sm" variant="outline">
            <Pencil className="size-3.5" />
            Personalizar
          </Button>
          <Button onClick={onOpenAddSheet} size="sm">
            <Plus className="size-3.5" />
            Add insight
          </Button>
        </>
      )}
    </div>
  );
}
```

### Result
✅ Users can edit title/description with validation
✅ Form state properly tracked (dirty detection)
✅ "Add insight" button opens the sheet correctly

---

## Section 4: Filter Bar Implementation (Issue #5)

### Problem
All three buttons (Date range, Filter, Refresh) have no functionality.

### Solution: Implement All Features

**4.1 Database Schema Changes**
```typescript
// packages/database/src/schemas/dashboards.ts
export const dashboards = pgTable("dashboards", {
  // ... existing fields ...
  globalDateRange: jsonb("global_date_range").$type<{
    type: "relative" | "absolute";
    value: string; // "7d" | "30d" | "2024-01-01,2024-01-31"
  }>(),
  globalFilters: jsonb("global_filters").$type<Array<{
    property: string;
    operator: "equals" | "contains" | "gt" | "lt";
    value: string;
  }>>(),
});
```

**4.2 Refresh Button**
```typescript
// apps/web/src/routes/.../home/index.tsx
function DashboardFilterBar({ dashboard }: { dashboard: Dashboard }) {
  const queryClient = useQueryClient();

  const refreshMutation = useMutation(
    orpc.insights.refreshDashboard.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.analytics.getDefaultDashboard.queryKey({}),
        });
      },
    })
  );

  return (
    <Button
      onClick={() => refreshMutation.mutate({ dashboardId: dashboard.id })}
      disabled={refreshMutation.isPending}
      className="h-7 text-xs gap-1.5"
      size="sm"
      variant="outline"
    >
      <RefreshCw className={cn(
        "size-3",
        refreshMutation.isPending && "animate-spin"
      )} />
      {refreshMutation.isPending ? "Atualizando..." : "Atualizar"}
    </Button>
  );
}
```

**4.3 Date Range Override**
```typescript
import { Popover, PopoverContent, PopoverTrigger } from "@packages/ui/components/popover";

function DateRangeOverride({ dashboard }: { dashboard: Dashboard }) {
  const [open, setOpen] = useState(false);
  const updateMutation = useMutation(
    orpc.dashboards.updateGlobalFilters.mutationOptions()
  );

  const presets = [
    { label: "Últimos 7 dias", value: "7d" },
    { label: "Últimos 30 dias", value: "30d" },
    { label: "Últimos 90 dias", value: "90d" },
    { label: "Este mês", value: "this_month" },
    { label: "Mês passado", value: "last_month" },
  ];

  const handlePreset = (value: string) => {
    updateMutation.mutate({
      dashboardId: dashboard.id,
      globalDateRange: { type: "relative", value },
    });
    setOpen(false);
  };

  const currentLabel = dashboard.globalDateRange
    ? presets.find(p => p.value === dashboard.globalDateRange?.value)?.label
    : "Sem substituição";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="h-7 text-xs gap-1.5 text-muted-foreground"
          size="sm"
          variant="outline"
        >
          <Calendar className="size-3.5" />
          {currentLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Período global</h4>
          <p className="text-xs text-muted-foreground">
            Substitui o período de todos os insights
          </p>
          <div className="space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handlePreset(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          {dashboard.globalDateRange && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                updateMutation.mutate({
                  dashboardId: dashboard.id,
                  globalDateRange: null,
                });
                setOpen(false);
              }}
            >
              Remover substituição
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**4.4 Filter Button with Sheet**
```typescript
function FilterButton({ dashboard }: { dashboard: Dashboard }) {
  const { openSheet, closeSheet } = useSheet();
  const filterCount = dashboard.globalFilters?.length ?? 0;

  return (
    <Button
      onClick={() => {
        openSheet({
          children: (
            <DashboardFilterSheet
              dashboard={dashboard}
              onClose={closeSheet}
            />
          ),
        });
      }}
      className="h-7 text-xs gap-1 text-muted-foreground"
      size="sm"
      variant="outline"
    >
      <Plus className="size-3" />
      Filtros
      {filterCount > 0 && (
        <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
          {filterCount}
        </Badge>
      )}
    </Button>
  );
}

// apps/web/src/features/analytics/ui/dashboard-filter-sheet.tsx
function DashboardFilterSheet({ dashboard, onClose }) {
  const form = useForm({
    defaultValues: {
      filters: dashboard.globalFilters ?? [],
    },
  });

  const updateMutation = useMutation(
    orpc.dashboards.updateGlobalFilters.mutationOptions({
      onSuccess: onClose,
    })
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Filtros do Dashboard</h2>

      <form.Field name="filters">
        {(field) => (
          <div className="space-y-2">
            {field.state.value.map((filter, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={filter.property} ...>
                  {/* Property options */}
                </Select>
                <Select value={filter.operator} ...>
                  {/* Operator options */}
                </Select>
                <Input value={filter.value} ... />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newFilters = [...field.state.value];
                    newFilters.splice(i, 1);
                    field.handleChange(newFilters);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                field.handleChange([
                  ...field.state.value,
                  { property: "", operator: "equals", value: "" },
                ]);
              }}
            >
              <Plus className="size-4 mr-2" />
              Adicionar filtro
            </Button>
          </div>
        )}
      </form.Field>

      <Button
        onClick={() => {
          updateMutation.mutate({
            dashboardId: dashboard.id,
            globalFilters: form.state.values.filters,
          });
        }}
      >
        Aplicar filtros
      </Button>
    </div>
  );
}
```

### Result
✅ Refresh button triggers dashboard-only refresh with loading state
✅ Date range override applies globally to all tiles
✅ Filter button opens sheet to add property filters
✅ Filter count badge shows active filter count

---

## Section 5: Layout Optimization (Issue #6)

### Problem
Current tile sizes don't fill complete rows in 12-column grid:
- Row 2: Content Created (3) + Top Content (6) = 9 → 3-COL GAP ❌
- Row 4: Conversion Rate (3) + Credit Usage (6) = 9 → 3-COL GAP ❌

### Solution: PostHog-Style Hierarchy

Update `packages/database/src/default-insights.ts` with new sizes:

| Insight | Old Size | New Size | Reasoning |
|---------|----------|----------|-----------|
| Page Views | md (6) | **lg (9)** | Chart visualization needs space |
| Unique Visitors | md (6) | **sm (3)** | Number metric, compact |
| Content Created | sm (3) | **sm (3)** | Number metric, stays same |
| Top Content | md (6) | **lg (9)** | Chart with breakdown needs space |
| AI Usage | md (6) | **full (12)** | Multi-series chart needs full width |
| SDK Requests | md (6) | **full (12)** | Multi-series chart needs full width |
| Conversion Rate | sm (3) | **sm (3)** | Percentage metric, stays same |
| Credit Usage | md (6) | **lg (9)** | Chart visualization needs space |

**Final Layout (no gaps):**
```
Row 1: Page Views (lg=9) + Unique Visitors (sm=3) = 12 ✓
Row 2: Content Created (sm=3) + Top Content (lg=9) = 12 ✓
Row 3: AI Usage (full=12) = 12 ✓
Row 4: SDK Requests (full=12) = 12 ✓
Row 5: Conversion Rate (sm=3) + Credit Usage (lg=9) = 12 ✓
```

### Result
✅ Visual hierarchy - metrics compact, single charts medium, multi-series full-width
✅ All rows fill completely (no gaps)
✅ PostHog-style professional layout

---

## Section 6: Portuguese i18n (Issue #7)

### Problem
All text is in English:
- Insight names, descriptions, series labels
- Dashboard tile type labels
- Date range labels

### Solution: Translate All Strings

**6.1 Insight Metadata (`packages/database/src/default-insights.ts`)**

| English | Portuguese |
|---------|------------|
| Page Views | Visualizações de Página |
| Unique Visitors | Visitantes Únicos |
| Content Created | Conteúdo Criado |
| Top Content | Top Conteúdo |
| AI Usage | Uso de IA |
| SDK Requests | Requisições SDK |
| Conversion Rate | Taxa de Conversão |
| Credit Usage | Uso de Créditos |

**Series Labels:**
- Views → Visualizações
- Clicks → Cliques
- Completions → Conclusões
- Chat Messages → Mensagens de Chat
- Agent Actions → Ações de Agente
- Author → Autor
- List → Lista
- Content → Conteúdo
- Image → Imagem
- AI → IA
- Forms → Formulários

**6.2 Dashboard Tile Labels (`apps/web/src/features/analytics/ui/dashboard-tile.tsx`)**

**Type Labels (lines 83-90):**
```typescript
const typeLabel =
  type === "trends"
    ? "TENDÊNCIAS" // was "TRENDS"
    : type === "funnels"
      ? "FUNIS" // was "FUNNELS"
      : type === "retention"
        ? "RETENÇÃO" // was "RETENTION"
        : "INSIGHT";
```

**Date Range Labels (lines 104-123):**
```typescript
function formatDateRange(value: string): string {
  switch (value) {
    case "7d":
      return "ÚLTIMOS 7 DIAS";
    case "14d":
      return "ÚLTIMOS 14 DIAS";
    case "30d":
      return "ÚLTIMOS 30 DIAS";
    case "90d":
      return "ÚLTIMOS 90 DIAS";
    case "this_month":
      return "ESTE MÊS";
    case "last_month":
      return "MÊS PASSADO";
    case "this_year":
      return "ESTE ANO";
    default:
      return value.toUpperCase();
  }
}

// Default
const dateRangeLabel = dateRange?.value
  ? formatDateRange(dateRange.value)
  : "ÚLTIMOS 30 DIAS"; // was "LAST 30 DAYS"
```

### Result
✅ All insight names and descriptions in Portuguese
✅ All series labels translated
✅ Type labels (TENDÊNCIAS, FUNIS, RETENÇÃO)
✅ Date range labels (ÚLTIMOS X DIAS, ESTE MÊS, etc.)

---

## Implementation Summary

### Files to Modify

| File | Changes |
|------|---------|
| `packages/database/src/repositories/auth-repository.ts` | Remove lines 164-198 (dashboard creation) |
| `packages/database/src/repositories/dashboard-repository.ts` | Simplify `getDefaultDashboard()` to query-only |
| `packages/database/src/schemas/insights.ts` | Add `cachedResults`, `lastComputedAt` fields |
| `packages/database/src/schemas/dashboards.ts` | Add `globalDateRange`, `globalFilters` fields |
| `packages/database/src/default-insights.ts` | Update sizes (lg/full), translate to Portuguese |
| `apps/web/src/integrations/orpc/router/onboarding.ts` | Add dashboard creation with computed insights |
| `apps/web/src/integrations/orpc/router/insights.ts` | Add `refreshDashboard` procedure |
| `apps/web/src/integrations/orpc/router/dashboards.ts` | Add `updateGlobalFilters` procedure |
| `apps/web/src/features/analytics/ui/editable-dashboard-grid.tsx` | Add TanStack Form for metadata editing |
| `apps/web/src/features/analytics/ui/dashboard-tile.tsx` | Translate type labels and date ranges |
| `apps/web/src/routes/.../home/index.tsx` | Fix "Add insight" button, implement filter bar |
| `apps/worker/src/jobs/refresh-insights.ts` | Create background refresh job |
| `apps/worker/src/index.ts` | Add cron schedule (every 3 hours) |

### Database Migrations Required

1. Add `cachedResults` and `lastComputedAt` to `insights` table
2. Add `globalDateRange` and `globalFilters` to `dashboards` table

---

## Testing Checklist

- [ ] New user completes onboarding → dashboard created with 8 insights
- [ ] Dashboard loads instantly (reads cached results)
- [ ] Edit mode allows changing title/description
- [ ] "Add insight" button opens sheet
- [ ] Refresh button refreshes only dashboard insights
- [ ] Date range override applies to all tiles
- [ ] Filter button opens sheet, adds filters
- [ ] Layout has no gaps (all rows fill 12 columns)
- [ ] All text is in Portuguese
- [ ] Background job runs every 3 hours
- [ ] No duplicate dashboards created

---

## Success Criteria

✅ **One dashboard per team** - Created during onboarding, never duplicated
✅ **Fast performance** - Cached results, instant dashboard loads
✅ **Full editing** - Title, description, tiles all editable
✅ **Working filter bar** - Refresh, date override, filters all functional
✅ **Professional layout** - No gaps, PostHog-style hierarchy
✅ **Complete i18n** - All Portuguese, no English strings

---

**Design Approved:** 2026-02-16
**Ready for Implementation:** Yes
