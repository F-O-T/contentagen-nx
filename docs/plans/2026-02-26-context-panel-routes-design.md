# Context Panel Info — All Routes Design

**Goal:** Fill the context panel info tab with relevant data on all main list and detail routes.

**Scope:** List pages (B+) and detail pages (B). Chat, settings, billing, search, home, data-management sub-routes, and assets are excluded (read-only or incompatible with context panel actions).

---

## Pattern Reference

All implementations use the primitives from `@packages/ui/components/context-panel` and helpers from `@/features/context-panel/context-panel-info`:

```tsx
import {
  ContextPanel, ContextPanelContent,
  ContextPanelHeader, ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import {
  ContextPanelAction, ContextPanelMeta, ContextPanelDivider,
} from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
```

Use `useMemo` to stabilize JSX passed to `useContextPanelInfo` so the store only updates when relevant data changes.

---

## List Pages

Four list pages get an "Ações" section with a single primary create action.

### `writers/index.tsx`

- **Action:** "Novo escritor"
- **Trigger:** Call `createMutation.mutate({})` directly (mutation already exists in route)
- **Icon:** `Plus`

### `clusters/index.tsx`

- **Action:** "Novo cluster"
- **Trigger:** `navigate({ to: "/$slug/$teamSlug/clusters/new", params: { slug, teamSlug } })`
- **Icon:** `Plus`

### `experiments/index.tsx`

- **Action:** "Novo experimento"
- **Trigger:** `navigate({ to: "/$slug/$teamSlug/experiments/new", params: { slug, teamSlug } })`
- **Icon:** `Plus`

### `analytics/insights/index.tsx`

- **Action:** "Novo insight"
- **Trigger:** `navigate({ to: "/$slug/$teamSlug/analytics/insights/new", params: { slug, teamSlug } })`
- **Icon:** `Plus`

---

## Detail Pages

### `writers/$writerId.tsx`

Data from `orpc.writer.getById`. Hook called in the route component.

```
[writer.name]               ← ContextPanelTitle
──────────────────
Conteúdos   {contentCount}  ← ContextPanelMeta
Criado em   {createdAt}     ← ContextPanelMeta (dd/MM/yyyy)
──────────────────
🗑 Excluir escritor         ← ContextPanelAction (destructive) → handleDelete()
```

`useMemo` deps: `[writer?.name, writer?.contentCount, writer?.createdAt, handleDelete]`

### `analytics/insights/$insightId.tsx`

Data from `orpc.insights.getById`. Hook called in the route component.

Type label mapping:
- `trends` → "Tendências"
- `funnels` → "Funis"
- `retention` → "Retenção"

Goal label mapping (used only internally, not shown in panel):

```
[insightName]                     ← ContextPanelTitle
──────────────────
Tipo        {typeLabel}           ← ContextPanelMeta
Calculado   {lastComputedAt|"—"}  ← ContextPanelMeta (relative time or "—")
──────────────────
⧉ Duplicar                        ← ContextPanelAction → duplicateMutation
↺ Atualizar resultados             ← ContextPanelAction → refreshResults
🗑 Excluir insight                 ← ContextPanelAction (destructive) → deleteMutation
```

`useMemo` deps: `[insightName, insight?.type, insight?.lastComputedAt, ...]`

### `clusters/$clusterId.tsx` — inside `ClusterBuilderEdit`

`useContextPanelInfo` added inside `ClusterBuilderEdit` (where cluster data lives). Only edit mode — create mode shows nothing.

Mode label mapping:
- `seo` → "SEO"
- `changelog` → "Changelog"
- `series` → "Série"

Status label mapping:
- `draft` → "Rascunho"
- `published` → "Publicado"

```
[pillarTitle]               ← ContextPanelTitle
──────────────────
Modo        {modeLabel}     ← ContextPanelMeta
Status      {statusLabel}   ← ContextPanelMeta
Satélites   {count}         ← ContextPanelMeta
──────────────────
🗑 Deletar cluster          ← ContextPanelAction (destructive) → handleDelete()
```

`useMemo` deps: `[pillarTitle, cluster?.status, cluster?.clusterConfig?.mode, satellites.length, handleDelete]`

### `experiments/$experimentId.tsx` — inside `ExperimentBuilderEditContent`

`useContextPanelInfo` added inside `ExperimentBuilderEditContent` (where experiment data and handlers live). Only edit mode — create mode shows nothing.

targetType label mapping:
- `content` → "Conteúdo"
- `form` → "Formulário"
- `cluster` → "Cluster"

goal label mapping:
- `conversion` → "Conversão"
- `ctr` → "Taxa de clique"
- `time_on_page` → "Tempo na página"
- `form_submit` → "Envio de formulário"

Actions shown conditionally (mirrors header logic):
- "Iniciar" → when `canStart` (status draft|paused and variantCount >= 2)
- "Pausar" → when `isRunning` (status running)
- "Concluir" → when status running or paused
- "Excluir" → always (destructive, disabled when running)

```
[experiment.name]           ← ContextPanelTitle
──────────────────
Status      {statusLabel}   ← ContextPanelMeta
Tipo        {targetLabel}   ← ContextPanelMeta
Meta        {goalLabel}     ← ContextPanelMeta
Variantes   {variantCount}  ← ContextPanelMeta
──────────────────
▶ Iniciar                   ← conditional
⏸ Pausar                    ← conditional
✓ Concluir                  ← conditional
🗑 Excluir experimento       ← always (destructive)
```

`useMemo` deps: `[experiment.name, experiment.status, experiment.targetType, experiment.goal, variantCount, canStart, isRunning, ...]`

---

## Files to Touch

| File | Change |
|------|--------|
| `routes/.../writers/index.tsx` | Add `useContextPanelInfo` |
| `routes/.../clusters/index.tsx` | Add `useContextPanelInfo` |
| `routes/.../experiments/index.tsx` | Add `useContextPanelInfo` |
| `routes/.../analytics/insights/index.tsx` | Add `useContextPanelInfo` |
| `routes/.../writers/$writerId.tsx` | Add `useContextPanelInfo` |
| `routes/.../analytics/insights/$insightId.tsx` | Add `useContextPanelInfo` |
| `features/clusters/ui/cluster-builder.tsx` | Add `useContextPanelInfo` inside `ClusterBuilderEdit` |
| `features/experiments/ui/experiment-builder.tsx` | Add `useContextPanelInfo` inside `ExperimentBuilderEditContent` |
