# Insight Builder — PostHog-Style Redesign

**Date**: 2026-02-16
**Status**: Approved

## Context

The current insight builder uses a 2-column sidebar layout for all insight types (Trends, Funnels, Retention). The user wants the page redesigned to match PostHog's insight builder pattern, which varies layout by type and provides a more integrated editing experience.

## Design Summary

Single page, always editable (no separate view/edit modes). Layout varies per insight type.

### Header (All Types)

```
← 📈 Pageview count ✏️                    [Salvar] [...]
Enter description (optional) ✏️
─────────────────────────────────────────────────────────
Tendências | Funis | Retenção
```

- Back arrow: `Link` to `/analytics/insights`
- Type emoji: 📈 Trends, 📊 Funnels, 🔄 Retention
- Title: `InlineEditableText` (reuse existing component)
- Description: `InlineEditableText` with placeholder
- **Salvar** button: primary, triggers save mutation
- **...** menu: Duplicar insight, Deletar insight
- Tabs: allow switching type (remove `disableTypeSwitch` restriction)

### Trends Layout — Full-Width Card

```
┌────────────────────────────────────────────────────┐
│ Series                        Filtros              │
│ Ⓐ [Event ▾] [Math ▾] ≡ ✏️   + Add filter group   │
│ + Adicionar série              Breakdown           │
│                                + Breakdown         │
│ ▼ Opções avançadas                                 │
└────────────────────────────────────────────────────┘
📅 Últimos 7d ▾ | agrupado por dia ▾ | Sem comparação ▾   Opções ▾ | 📈 Linha ▾
Computado há 5min • Atualizar
┌────────────────────────────────────────────────────┐
│                    CHART                            │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ Resultados detalhados                   Exportar ▾ │
│ SERIES | COR | TOTAL | 9 FEV | 10 FEV | 11 FEV   │
└────────────────────────────────────────────────────┘
```

### Funnels Layout — Sidebar

```
┌──────────────┬──────────────────────────────────────┐
│ Query Steps  │ 📅 Últimos 7d ▾           Layout ▾  │
│ Graph type ▾ │                                      │
│ 1. [Event]   │ Computado há 5min • Atualizar        │
│ + Add step   │                                      │
│              │ [          CHART           ]          │
│ Aggregating  │                                      │
│ Conv window  │                                      │
│ Step order   │                                      │
│ Exclusions   │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Retention Layout — Sidebar

```
┌──────────────┬──────────────────────────────────────┐
│ Retention    │ 📅 No date range ▾  Options ▾  📈 ▾  │
│ condition    │                                      │
│ For [Users]  │ Computado há 5min • Atualizar        │
│ who performed│                                      │
│ [Event ▾]    │ [          CHART           ]          │
│ and returned │                                      │
│ [Event ▾]    │ [       COHORT TABLE       ]          │
│ during next  │                                      │
│ [7] [days ▾] │                                      │
│              │                                      │
│ Calculation  │                                      │
│ options      │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Filter Bar

Appears between query builder and chart. Content varies by type:

| Control | Trends | Funnels | Retention |
|---------|--------|---------|-----------|
| Date range | ✅ | ✅ | ✅ (optional override) |
| Grouped by (interval) | ✅ | ❌ | ❌ |
| Comparison | ✅ | ❌ | ❌ |
| Options dropdown | ✅ | ❌ | ✅ |
| Chart type | ✅ (line/bar/area/number) | ❌ | ✅ (line chart/table) |
| Layout direction | ❌ | ✅ (left-to-right/top-to-bottom) | ❌ |

### Status Line

```
Computado há 5 minutos • Atualizar
```

- Uses `lastComputedAt` from insight data
- "Atualizar" link invalidates query cache and refetches
- Relative time format: "agora", "há Xmin", "há Xh", "há Xd"

### Detailed Results Table (Trends Only)

Table below the chart showing raw data per series per date:

- Columns: Series name, Color dot, Total (sortable), one column per date interval
- Rows: one per series in the config
- "Exportar" button (placeholder for now, CSV later)
- Built with `DataTable` component from `@packages/ui`

## Files to Modify

### Main restructure
- `apps/web/src/features/analytics/ui/insight-builder.tsx` — complete rewrite of layout
- `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/$insightId.tsx` — remove `disableTypeSwitch`, update props
- `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/new.tsx` — align with new builder

### New components
- `apps/web/src/features/analytics/ui/insight-header.tsx` — PostHog-style header with inline edit
- `apps/web/src/features/analytics/ui/insight-filter-bar.tsx` — date range, interval, comparison, chart type
- `apps/web/src/features/analytics/ui/insight-status-line.tsx` — "Computed X ago • Refresh"
- `apps/web/src/features/analytics/ui/trends-results-table.tsx` — detailed results table for trends
- `apps/web/src/features/analytics/ui/insight-more-menu.tsx` — "..." dropdown menu

### Query builder layout changes
- `apps/web/src/features/analytics/ui/trends-query-builder.tsx` — move from vertical sidebar to horizontal card layout; extract date/interval/chartType controls to filter bar
- `apps/web/src/features/analytics/ui/funnels-query-builder.tsx` — keep sidebar, extract date range to filter bar
- `apps/web/src/features/analytics/ui/retention-query-builder.tsx` — keep sidebar, extract date range to filter bar

### Reuse existing
- `apps/web/src/features/analytics/ui/inline-editable-text.tsx` — for title/description
- `apps/web/src/features/analytics/ui/insight-preview.tsx` — chart rendering (unchanged)
- `apps/web/src/features/analytics/hooks/use-insight-config.ts` — state management (unchanged)
- All chart components (trends-line-chart, trends-bar-chart, etc.) — unchanged

## Implementation Order

1. **InsightHeader** — new component with back link, inline title/description, save button, "..." menu
2. **InsightFilterBar** — new component with date range, interval, comparison, chart type selectors
3. **InsightStatusLine** — new component with computed time + refresh link
4. **TrendsQueryBuilder layout** — refactor from sidebar to horizontal card (extract date/interval/chartType)
5. **FunnelsQueryBuilder layout** — extract date range to external prop
6. **RetentionQueryBuilder layout** — extract date range to external prop
7. **InsightBuilder** — rewrite main layout to use new components, vary by type
8. **TrendsResultsTable** — new component for detailed results below chart
9. **Route updates** — remove `disableTypeSwitch`, align both new.tsx and $insightId.tsx
10. **InsightMoreMenu** — "..." menu with duplicate/delete actions

## Verification

1. Navigate to `/analytics/insights/new` — should show Trends builder with full-width card
2. Switch tabs (Tendências → Funis → Retenção) — layout should change accordingly
3. Edit an existing insight — title/description should be inline editable
4. Change chart type in filter bar — chart should update
5. Change date range / interval — data should refetch
6. "Atualizar" link should refresh data
7. Detailed results table should show below Trends chart
8. Save button should persist changes
9. "..." menu should have Duplicar and Deletar options
10. `bun run typecheck` passes
