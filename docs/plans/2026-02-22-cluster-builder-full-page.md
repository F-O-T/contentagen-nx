# Cluster Builder Full-Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the cluster creation sheet + detail page with a single full-page builder following the same pattern as InsightBuilder and FormBuilder.

**Architecture:** Create `ClusterBuilder` + `ClusterBuilderHeader` + `useClusterConfig` hook. New route `clusters/new` for creation; refactor `clusters/$clusterId` to mount `<ClusterBuilder>`. Three tabs: Visão Geral (AI assist + config), Posts Satélite (sidebar/canvas with dnd-kit), Embed (reuse existing panel). Update `clusters/index.tsx` to navigate instead of opening a sheet.

**Tech Stack:** React, TanStack Router, TanStack Query (useSuspenseQuery / useMutation), oRPC (orpc.clusters.*, orpc.relatedContent.*), @dnd-kit/core + @dnd-kit/sortable, InlineEditableText, useAlertDialog, useSheet

---

## Context & References

### Key Files (READ before implementing each task)
- `apps/web/src/features/analytics/ui/insight-builder.tsx` — reference for builder layout + tab bar
- `apps/web/src/features/analytics/ui/insight-header.tsx` — reference for sticky header with InlineEditableText + actions dropdown
- `apps/web/src/features/analytics/hooks/use-insight-config.ts` — reference for state hook with debounce
- `apps/web/src/features/analytics/ui/inline-editable-text.tsx` — InlineEditableText component
- `apps/web/src/features/forms/ui/form-canvas.tsx` — reference for dnd-kit sortable list
- `apps/web/src/features/clusters/ui/cluster-embed-panel.tsx` — embed panel (reuse as-is)
- `apps/web/src/features/clusters/ui/cluster-satellite-list.tsx` — existing satellite list (replace with DnD canvas)
- `apps/web/src/features/clusters/ui/create-cluster-sheet.tsx` — existing sheet (will be removed)
- `apps/web/src/features/clusters/ui/cluster-detail-section.tsx` — existing detail (will be removed)
- `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/index.tsx`
- `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId.tsx`
- `apps/web/src/integrations/orpc/router/clusters.ts` — cluster procedures
- `apps/web/src/integrations/orpc/router/related-content.ts` — satellite procedures
- `apps/web/src/hooks/use-alert-dialog.ts` — useAlertDialog hook
- `apps/web/src/hooks/use-sheet.ts` — useSheet hook

### oRPC Procedures Available
- `orpc.clusters.list` — list clusters
- `orpc.clusters.getById({ id })` — get single cluster (returns Content with clusterConfig)
- `orpc.clusters.create({ pillarTitle, mode?, embedEnabled, satellites[] })` — create cluster + satellites
- `orpc.clusters.suggestStructure({ description })` — AI suggest structure
- `orpc.clusters.updateConfig({ id, clusterConfig })` — update cluster config
- `orpc.clusters.promote({ contentId, clusterConfig })` — promote content to cluster pillar
- `orpc.relatedContent.listSatellites({ pillarId })` — list satellites
- `orpc.relatedContent.addSatellite({ pillarId, satelliteId })` — add satellite
- `orpc.relatedContent.removeSatellite({ pillarId, satelliteId })` — remove satellite
- `orpc.relatedContent.reorderSatellites({ pillarId, orderedSatelliteIds })` — reorder

### Content type (from router)
```typescript
// Content with clusterConfig has:
{
  id: string;
  meta: { title: string; description: string; slug: string };
  status: "draft" | "published";
  clusterConfig: {
    mode?: string;
    embedEnabled?: boolean;
    embedSettings?: { theme: "light" | "dark" | "auto"; label: string; accentColor: string };
  } | null;
}
```

---

## Task 1: Create `useClusterConfig` hook

**Files:**
- Create: `apps/web/src/features/clusters/hooks/use-cluster-config.ts`

**Step 1: Write the hook**

```typescript
// apps/web/src/features/clusters/hooks/use-cluster-config.ts
import { useDebounce } from "@uidotdev/usehooks";
import { useCallback, useEffect, useState } from "react";

export type ClusterMode = "changelog" | "seo" | "series" | string;

export interface ClusterConfig {
  mode: ClusterMode;
  embedEnabled: boolean;
  embedSettings?: {
    theme: "light" | "dark" | "auto";
    label: string;
    accentColor: string;
  };
}

const DEFAULT_CONFIG: ClusterConfig = {
  mode: "seo",
  embedEnabled: false,
};

export function useClusterConfig(initialConfig?: Partial<ClusterConfig>) {
  const [config, setConfig] = useState<ClusterConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const [pendingUpdates, setPendingUpdates] = useState<Partial<ClusterConfig>>({});
  const debouncedUpdates = useDebounce(pendingUpdates, 500);

  useEffect(() => {
    if (Object.keys(debouncedUpdates).length > 0) {
      setConfig((c) => ({ ...c, ...debouncedUpdates }));
      setPendingUpdates({});
    }
  }, [debouncedUpdates]);

  const updateConfig = useCallback((updates: Partial<ClusterConfig>) => {
    setPendingUpdates((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateConfigImmediate = useCallback((updates: Partial<ClusterConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback((newConfig: ClusterConfig) => {
    setConfig(newConfig);
    setPendingUpdates({});
  }, []);

  return { config, updateConfig, updateConfigImmediate, resetConfig };
}
```

**Step 2: Verify the file exists**

Run: `ls apps/web/src/features/clusters/hooks/`
Expected: `use-cluster-config.ts` present alongside `use-batch-generate.ts`, `use-cluster-detail.ts`, `use-cluster-embed-settings.ts`

**Step 3: Commit**

```bash
git add apps/web/src/features/clusters/hooks/use-cluster-config.ts
git commit -m "feat(clusters): add useClusterConfig state hook"
```

---

## Task 2: Create `ClusterBuilderHeader` component

**Files:**
- Create: `apps/web/src/features/clusters/ui/cluster-builder-header.tsx`

This follows `InsightHeader` exactly: sticky border-b header, InlineEditableText for title, back link, contextual action button + dropdown.

**Step 1: Write the component**

```typescript
// apps/web/src/features/clusters/ui/cluster-builder-header.tsx
import { Button } from "@packages/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ellipsis,
  Loader2,
  Network,
  Save,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";

interface ClusterBuilderHeaderProps {
  pillarTitle: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isNew: boolean;
  onDelete?: () => void;
  onPromote?: () => void;
  backTo: { slug: string; teamSlug: string };
}

export function ClusterBuilderHeader({
  pillarTitle,
  onTitleChange,
  onSave,
  isSaving,
  isNew,
  onDelete,
  onPromote,
  backTo,
}: ClusterBuilderHeaderProps) {
  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              params={backTo as never}
              to="/$slug/$teamSlug/clusters"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <Network className="size-5 flex-shrink-0 text-muted-foreground" />
            <InlineEditableText
              className="text-2xl font-semibold font-serif"
              onSave={onTitleChange}
              placeholder="Nome do cluster"
              value={pillarTitle}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button disabled={isSaving} onClick={onSave}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  {isNew ? "Criar cluster" : "Salvar"}
                </>
              )}
            </Button>

            {!isNew && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline">
                    <Ellipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onPromote && (
                    <>
                      <DropdownMenuItem onClick={onPromote}>
                        <TrendingUp className="size-4 mr-2" />
                        Promover pillar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={onDelete}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Deletar cluster
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/clusters/ui/cluster-builder-header.tsx
git commit -m "feat(clusters): add ClusterBuilderHeader component"
```

---

## Task 3: Create `SatelliteCanvas` (dnd-kit sortable satellite list)

**Files:**
- Create: `apps/web/src/features/clusters/ui/satellite-canvas.tsx`

This is the canvas panel for the "Posts Satélite" tab. Uses @dnd-kit/core + @dnd-kit/sortable, following form-canvas.tsx. Displays a sorted list of satellite content items with drag handle, title, status badge, edit link, remove button.

**Step 1: Understand types needed**

The satellites returned by `orpc.relatedContent.listSatellites` are `RelatedContent[]` with shape:
```typescript
{
  id: string;          // relation ID
  targetContent: {
    id: string;        // content ID
    meta: { title: string; slug: string; description: string };
    status: "draft" | "published";
  };
  displayOrder: number;
}
```

**Step 2: Write the component**

```typescript
// apps/web/src/features/clusters/ui/satellite-canvas.tsx
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ExternalLink, GripVertical, Network, X } from "lucide-react";

export interface SatelliteItem {
  id: string;       // relation id (used for dnd key)
  contentId: string;
  title: string;
  status: string;
}

interface SortableSatelliteCardProps {
  item: SatelliteItem;
  onRemove: (contentId: string) => void;
  isRemoving: boolean;
  slug: string;
  teamSlug: string;
}

function SortableSatelliteCard({
  item,
  onRemove,
  isRemoving,
  slug,
  teamSlug,
}: SortableSatelliteCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 border rounded-lg bg-card",
        "transition-shadow duration-150",
        isDragging
          ? "shadow-lg ring-2 ring-primary/20 opacity-90 z-10"
          : "shadow-sm hover:shadow-md",
      )}
      ref={setNodeRef}
      style={style}
    >
      <button
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
      </div>

      <Badge variant={item.status === "published" ? "default" : "outline"}>
        {item.status === "published" ? "Publicado" : "Rascunho"}
      </Badge>

      <Button
        onClick={() =>
          navigate({
            to: "/$slug/$teamSlug/$contentId",
            params: { slug, teamSlug, contentId: item.contentId },
          })
        }
        size="sm"
        variant="ghost"
      >
        <ExternalLink className="size-3.5 mr-1" />
        Editar
      </Button>

      <Button
        disabled={isRemoving}
        onClick={() => onRemove(item.contentId)}
        size="sm"
        variant="ghost"
      >
        <X className="size-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}

interface SatelliteCanvasProps {
  satellites: SatelliteItem[];
  onReorder: (reordered: SatelliteItem[]) => void;
  onRemove: (contentId: string) => void;
  isRemoving: boolean;
}

export function SatelliteCanvas({
  satellites,
  onReorder,
  onRemove,
  isRemoving,
}: SatelliteCanvasProps) {
  const { slug, teamSlug } = useParams({ strict: false }) as {
    slug: string;
    teamSlug: string;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = satellites.findIndex((s) => s.id === active.id);
    const newIndex = satellites.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...satellites];
    const [removed] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, removed);
    onReorder(updated);
  };

  if (satellites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/30">
        <div className="size-12 rounded-full flex items-center justify-center mb-4 bg-muted text-muted-foreground">
          <Network className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Nenhum satélite adicionado
        </p>
        <p className="text-xs text-muted-foreground mt-1 text-center max-w-[260px]">
          Use o painel ao lado para adicionar posts satélite a este cluster.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={satellites.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {satellites.map((item) => (
            <SortableSatelliteCard
              isRemoving={isRemoving}
              item={item}
              key={item.id}
              onRemove={onRemove}
              slug={slug}
              teamSlug={teamSlug}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/features/clusters/ui/satellite-canvas.tsx
git commit -m "feat(clusters): add SatelliteCanvas with dnd-kit reordering"
```

---

## Task 4: Create `ClusterBuilder` main component

**Files:**
- Create: `apps/web/src/features/clusters/ui/cluster-builder.tsx`

This is the main builder. It has three tabs:
1. **Visão Geral** — AI assist section (only when creating or no satellites yet) + mode selector + pillar link
2. **Posts Satélite** — sidebar panel (add buttons + stats) + canvas (SatelliteCanvas)
3. **Embed** — ClusterEmbedPanel

**Step 1: Write the component**

```typescript
// apps/web/src/features/clusters/ui/cluster-builder.tsx
import type { Content } from "@packages/database/schemas/content";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs";
import { cn } from "@packages/ui/lib/utils";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import type { ClusterConfig } from "../hooks/use-cluster-config";
import { AddSatelliteSheet } from "./add-satellite-sheet";
import { ClusterBuilderHeader } from "./cluster-builder-header";
import { ClusterEmbedPanel } from "./cluster-embed-panel";
import type { SatelliteItem } from "./satellite-canvas";
import { SatelliteCanvas } from "./satellite-canvas";

// ─── Mode Options ──────────────────────────────────────────────────────────

const CLUSTER_MODES = [
  {
    value: "seo",
    label: "SEO",
    description: "Cluster voltado para ranqueamento e conteúdo de busca",
    icon: "🔍",
  },
  {
    value: "changelog",
    label: "Changelog",
    description: "Documenta atualizações e mudanças do produto",
    icon: "📋",
  },
  {
    value: "series",
    label: "Série",
    description: "Conteúdo em série com episódios ou partes relacionadas",
    icon: "📚",
  },
] as const;

// ─── AI Assist Panel ────────────────────────────────────────────────────────

interface AIAssistPanelProps {
  onApply: (data: {
    pillarTitle: string;
    mode: string;
    embedEnabled: boolean;
    satellites: { title: string; description: string }[];
  }) => void;
}

function AIAssistPanel({ onApply }: AIAssistPanelProps) {
  const [description, setDescription] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const suggestMutation = useMutation(
    orpc.clusters.suggestStructure.mutationOptions({
      onSuccess: (data) => {
        onApply(data);
        toast.success("Estrutura sugerida pela IA aplicada!");
      },
      onError: () => toast.error("Erro ao gerar sugestão. Tente novamente."),
    }),
  );

  if (dismissed) return null;

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-medium">Assistente IA</p>
          </div>
          <Button
            onClick={() => setDismissed(true)}
            size="icon"
            variant="ghost"
            className="size-6"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Descreva o objetivo do cluster e a IA sugerirá a estrutura.
        </p>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Quero documentar atualizações do produto para meus usuários"
          value={description}
        />
        <Button
          className="w-full"
          disabled={!description.trim() || suggestMutation.isPending}
          onClick={() => suggestMutation.mutate({ description })}
          size="sm"
        >
          {suggestMutation.isPending ? (
            <Loader2 className="size-3.5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 mr-2" />
          )}
          Sugerir estrutura
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

interface OverviewTabProps {
  mode: string;
  onModeChange: (mode: string) => void;
  pillarTitle: string;
  pillarId?: string;
  pillarStatus?: string;
  showAiAssist: boolean;
  onAiApply: (data: {
    pillarTitle: string;
    mode: string;
    embedEnabled: boolean;
    satellites: { title: string; description: string }[];
  }) => void;
}

function OverviewTab({
  mode,
  onModeChange,
  pillarId,
  pillarStatus,
  showAiAssist,
  onAiApply,
}: OverviewTabProps) {
  const navigate = useNavigate();
  const { slug, teamSlug } = useParams({ strict: false }) as {
    slug: string;
    teamSlug: string;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {showAiAssist && <AIAssistPanel onApply={onAiApply} />}

      <div className="space-y-3">
        <Label className="text-sm font-medium">Tipo de cluster</Label>
        <div className="grid grid-cols-3 gap-3">
          {CLUSTER_MODES.map((m) => (
            <button
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                mode === m.value
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-input hover:border-muted-foreground/50 hover:bg-accent/30",
              )}
              key={m.value}
              onClick={() => onModeChange(m.value)}
              type="button"
            >
              <span className="text-lg mb-1">{m.icon}</span>
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {m.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {pillarId && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Post Pillar</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                O conteúdo principal deste cluster
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pillarStatus && (
                <Badge variant={pillarStatus === "published" ? "default" : "outline"}>
                  {pillarStatus === "published" ? "Publicado" : "Rascunho"}
                </Badge>
              )}
              <Button
                onClick={() =>
                  navigate({
                    to: "/$slug/$teamSlug/$contentId",
                    params: { slug, teamSlug, contentId: pillarId },
                  })
                }
                size="sm"
                variant="outline"
              >
                <ExternalLink className="size-3.5 mr-1.5" />
                Abrir editor
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Satellites Tab ────────────────────────────────────────────────────────

interface SatellitesTabProps {
  pillarId: string;
  satellites: SatelliteItem[];
  onReorder: (items: SatelliteItem[]) => void;
  onRemove: (contentId: string) => void;
  isRemoving: boolean;
  onRefetch: () => void;
}

function SatellitesTab({
  pillarId,
  satellites,
  onReorder,
  onRemove,
  isRemoving,
  onRefetch,
}: SatellitesTabProps) {
  const { openSheet } = useSheet();
  const navigate = useNavigate();
  const { slug, teamSlug } = useParams({ strict: false }) as {
    slug: string;
    teamSlug: string;
  };

  const published = satellites.filter((s) => s.status === "published").length;
  const drafts = satellites.filter((s) => s.status !== "published").length;

  const createMutation = useMutation(
    orpc.clusters.create.mutationOptions({
      onSuccess: (data) => {
        // Navigate to the new satellite's editor
        navigate({
          to: "/$slug/$teamSlug/$contentId",
          params: { slug, teamSlug, contentId: data.satellites[0]?.id },
        });
      },
      onError: () => toast.error("Erro ao criar satélite"),
    }),
  );

  return (
    <div className="flex gap-6 items-start">
      {/* Sidebar Panel */}
      <div className="w-[280px] shrink-0 space-y-4">
        <Card className="sticky top-4">
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold">Adicionar satélite</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full justify-start"
                onClick={() =>
                  openSheet({
                    children: (
                      <AddSatelliteSheet
                        onSuccess={onRefetch}
                        pillarId={pillarId}
                      />
                    ),
                  })
                }
                size="sm"
                variant="outline"
              >
                <BookOpen className="size-3.5 mr-2" />
                Conteúdo existente
              </Button>
            </div>

            {satellites.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Satélites
                  </p>
                  <div className="flex gap-3 text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {published}
                      </span>{" "}
                      publicados
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {drafts}
                      </span>{" "}
                      rascunhos
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0">
        <SatelliteCanvas
          isRemoving={isRemoving}
          onRemove={onRemove}
          onReorder={onReorder}
          satellites={satellites}
        />
        <div className="mt-3">
          <Button
            onClick={() =>
              openSheet({
                children: (
                  <AddSatelliteSheet
                    onSuccess={onRefetch}
                    pillarId={pillarId}
                  />
                ),
              })
            }
            size="sm"
            variant="ghost"
          >
            <Plus className="size-3.5 mr-1.5" />
            Novo post satélite
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Cluster Builder (Edit Mode) ─────────────────────────────────────────────

interface ClusterBuilderEditProps {
  clusterId: string;
  backTo: { slug: string; teamSlug: string };
}

function ClusterBuilderEdit({ clusterId, backTo }: ClusterBuilderEditProps) {
  const queryClient = useQueryClient();
  const { openAlertDialog } = useAlertDialog();
  const navigate = useNavigate();
  const { slug, teamSlug } = backTo;

  const { data: cluster, refetch } = useSuspenseQuery(
    orpc.clusters.getById.queryOptions({ input: { id: clusterId } }),
  );

  const { data: satelliteRelations, refetch: refetchSatellites } = useSuspenseQuery(
    orpc.relatedContent.listSatellites.queryOptions({ input: { pillarId: clusterId } }),
  );

  const [pillarTitle, setPillarTitle] = useState(cluster.meta.title);
  const [mode, setMode] = useState(cluster.clusterConfig?.mode ?? "seo");

  // Map API response to SatelliteItem[]
  const [satellites, setSatellites] = useState<SatelliteItem[]>(() =>
    satelliteRelations.map((rel) => ({
      id: rel.id,
      contentId: rel.targetContent.id,
      title: rel.targetContent.meta.title,
      status: rel.targetContent.status,
    })),
  );

  const updateMutation = useMutation(
    orpc.clusters.updateConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Cluster atualizado");
        queryClient.invalidateQueries({
          queryKey: orpc.clusters.getById.queryKey({ input: { id: clusterId } }),
        });
      },
      onError: () => toast.error("Erro ao salvar cluster"),
    }),
  );

  const removeMutation = useMutation(
    orpc.relatedContent.removeSatellite.mutationOptions({
      onSuccess: () => {
        toast.success("Satélite removido");
        refetchSatellites();
      },
      onError: () => toast.error("Erro ao remover satélite"),
    }),
  );

  const reorderMutation = useMutation(
    orpc.relatedContent.reorderSatellites.mutationOptions({
      onError: () => toast.error("Erro ao reordenar satélites"),
    }),
  );

  const handleSave = useCallback(() => {
    updateMutation.mutate({
      id: clusterId,
      clusterConfig: { mode },
    });
  }, [clusterId, mode, updateMutation]);

  const handleDelete = useCallback(() => {
    openAlertDialog({
      title: "Deletar cluster?",
      description:
        "Isso não pode ser desfeito. Os posts satélite não serão deletados, apenas desvinculados.",
      actionLabel: "Deletar",
      variant: "destructive",
      onAction: () => {
        // Clusters don't have a delete procedure yet - navigate back
        // TODO: implement delete when procedure is available
        navigate({ to: "/$slug/$teamSlug/clusters", params: { slug, teamSlug } } as never);
      },
    });
  }, [openAlertDialog, navigate, slug, teamSlug]);

  const handleReorder = useCallback(
    (reordered: SatelliteItem[]) => {
      setSatellites(reordered);
      reorderMutation.mutate({
        pillarId: clusterId,
        orderedSatelliteIds: reordered.map((s) => s.contentId),
      });
    },
    [clusterId, reorderMutation],
  );

  const handleRemove = useCallback(
    (contentId: string) => {
      removeMutation.mutate({ pillarId: clusterId, satelliteId: contentId });
      setSatellites((prev) => prev.filter((s) => s.contentId !== contentId));
    },
    [clusterId, removeMutation],
  );

  const handleAiApply = useCallback(
    (data: {
      pillarTitle: string;
      mode: string;
      embedEnabled: boolean;
      satellites: { title: string; description: string }[];
    }) => {
      setPillarTitle(data.pillarTitle);
      setMode(data.mode);
    },
    [],
  );

  return (
    <div className="flex flex-col h-full">
      <ClusterBuilderHeader
        backTo={{ slug, teamSlug }}
        isNew={false}
        isSaving={updateMutation.isPending}
        onDelete={handleDelete}
        onSave={handleSave}
        onTitleChange={setPillarTitle}
        pillarTitle={pillarTitle}
      />

      {/* Tab bar */}
      <div className="border-b bg-background">
        <Tabs defaultValue="overview" className="w-full">
          <div className="container mx-auto px-4">
            <TabsList className="h-auto bg-transparent rounded-none p-0 gap-0">
              <TabsTrigger
                className="px-4 py-2.5 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground"
                value="overview"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                className="px-4 py-2.5 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground"
                value="satellites"
              >
                Posts Satélite
              </TabsTrigger>
              <TabsTrigger
                className="px-4 py-2.5 h-auto rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground"
                value="embed"
              >
                Embed
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
              <TabsContent value="overview">
                <OverviewTab
                  mode={mode}
                  onAiApply={handleAiApply}
                  onModeChange={setMode}
                  pillarId={clusterId}
                  pillarStatus={cluster.status}
                  pillarTitle={pillarTitle}
                  showAiAssist={satellites.length === 0}
                />
              </TabsContent>

              <TabsContent value="satellites">
                <SatellitesTab
                  isRemoving={removeMutation.isPending}
                  onRefetch={() => {
                    refetchSatellites().then((result) => {
                      if (result.data) {
                        setSatellites(
                          result.data.map((rel) => ({
                            id: rel.id,
                            contentId: rel.targetContent.id,
                            title: rel.targetContent.meta.title,
                            status: rel.targetContent.status,
                          })),
                        );
                      }
                    });
                  }}
                  onRemove={handleRemove}
                  onReorder={handleReorder}
                  pillarId={clusterId}
                  satellites={satellites}
                />
              </TabsContent>

              <TabsContent value="embed">
                <ClusterEmbedPanel
                  cluster={cluster}
                  onSaved={() => refetch()}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Cluster Builder (Create Mode) ───────────────────────────────────────────

interface ClusterBuilderNewProps {
  backTo: { slug: string; teamSlug: string };
}

function ClusterBuilderNew({ backTo }: ClusterBuilderNewProps) {
  const navigate = useNavigate();
  const { slug, teamSlug } = backTo;
  const queryClient = useQueryClient();

  const [pillarTitle, setPillarTitle] = useState("");
  const [mode, setMode] = useState("seo");
  const [pendingSatellites, setPendingSatellites] = useState<
    { title: string; description: string }[]
  >([]);

  const createMutation = useMutation(
    orpc.clusters.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Cluster criado!");
        queryClient.invalidateQueries({
          queryKey: orpc.clusters.list.queryKey({}),
        });
        navigate({
          to: "/$slug/$teamSlug/clusters/$clusterId",
          params: { slug, teamSlug, clusterId: data.pillar.id },
        } as never);
      },
      onError: () => toast.error("Erro ao criar cluster"),
    }),
  );

  const handleSave = useCallback(() => {
    if (!pillarTitle.trim()) {
      toast.error("O título do cluster é obrigatório");
      return;
    }
    createMutation.mutate({
      pillarTitle: pillarTitle.trim(),
      mode,
      embedEnabled: false,
      satellites: pendingSatellites.map((s) => ({ title: s.title })),
    });
  }, [pillarTitle, mode, pendingSatellites, createMutation]);

  const handleAiApply = useCallback(
    (data: {
      pillarTitle: string;
      mode: string;
      embedEnabled: boolean;
      satellites: { title: string; description: string }[];
    }) => {
      setPillarTitle(data.pillarTitle);
      setMode(data.mode);
      setPendingSatellites(data.satellites);
    },
    [],
  );

  return (
    <div className="flex flex-col h-full">
      <ClusterBuilderHeader
        backTo={{ slug, teamSlug }}
        isNew={true}
        isSaving={createMutation.isPending}
        onSave={handleSave}
        onTitleChange={setPillarTitle}
        pillarTitle={pillarTitle}
      />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 space-y-8">
          <OverviewTab
            mode={mode}
            onAiApply={handleAiApply}
            onModeChange={setMode}
            pillarTitle={pillarTitle}
            showAiAssist={true}
          />

          {pendingSatellites.length > 0 && (
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Posts satélite sugeridos ({pendingSatellites.length})
                </p>
                <Button
                  onClick={() => setPendingSatellites([])}
                  size="sm"
                  variant="ghost"
                >
                  Limpar
                </Button>
              </div>
              <div className="space-y-2">
                {pendingSatellites.map((s, i) => (
                  <div
                    className="flex items-start gap-2 p-3 border rounded-lg bg-card"
                    key={`pending-sat-${i + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() =>
                        setPendingSatellites((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      size="sm"
                      variant="ghost"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface ClusterBuilderProps {
  clusterId?: string;
  backTo: { slug: string; teamSlug: string };
}

export function ClusterBuilder({ clusterId, backTo }: ClusterBuilderProps) {
  if (clusterId) {
    return <ClusterBuilderEdit backTo={backTo} clusterId={clusterId} />;
  }
  return <ClusterBuilderNew backTo={backTo} />;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/clusters/ui/cluster-builder.tsx
git commit -m "feat(clusters): add ClusterBuilder main component"
```

---

## Task 5: Create `clusters/new.tsx` route

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/new.tsx`

**Step 1: Write the route**

```typescript
// apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/new.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { ClusterBuilder } from "@/features/clusters/ui/cluster-builder";

export const Route = createFileRoute(
  "/_authenticated/$slug/$teamSlug/_dashboard/clusters/new",
)({
  component: NewClusterPage,
});

function NewClusterPage() {
  const { slug, teamSlug } = useParams({ strict: false }) as {
    slug: string;
    teamSlug: string;
  };

  return <ClusterBuilder backTo={{ slug, teamSlug }} />;
}
```

**Step 2: Verify route file exists**

Run: `ls apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/clusters/`
Expected: `new.tsx`, `index.tsx`, `$clusterId.tsx`

**Step 3: Commit**

```bash
git add "apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/clusters/new.tsx"
git commit -m "feat(clusters): add clusters/new route"
```

---

## Task 6: Refactor `$clusterId.tsx` route to use `ClusterBuilder`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId.tsx`

**Step 1: Read the current file**

Current content:
```typescript
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterDetailSection } from "@/features/clusters/ui/cluster-detail-section";

export const Route = createFileRoute(
  "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
)({
  component: ClusterDetailPage,
});

function ClusterDetailPage() {
  return (
    <div className="p-6">
      <ErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            Erro ao carregar cluster.
          </p>
        }
      >
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Carregando...</p>
          }
        >
          <ClusterDetailSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

**Step 2: Replace with ClusterBuilder**

```typescript
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterBuilder } from "@/features/clusters/ui/cluster-builder";

export const Route = createFileRoute(
  "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
)({
  component: ClusterDetailPage,
});

function ClusterDetailPage() {
  const { clusterId, slug, teamSlug } = Route.useParams();

  return (
    <ErrorBoundary
      fallback={
        <p className="text-sm text-muted-foreground p-6">
          Erro ao carregar cluster.
        </p>
      }
    >
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground p-6">Carregando...</p>
        }
      >
        <ClusterBuilder
          backTo={{ slug, teamSlug }}
          clusterId={clusterId}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
```

**Step 3: Commit**

```bash
git add "apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/clusters/\$clusterId.tsx"
git commit -m "feat(clusters): refactor clusterId route to use ClusterBuilder"
```

---

## Task 7: Update `clusters/index.tsx` to navigate instead of open sheet

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/index.tsx`
- Modify: `apps/web/src/features/clusters/ui/clusters-list-section.tsx`

**Step 1: Update clusters/index.tsx — replace openSheet with navigate**

Replace the `ClustersPage` component. Remove `useSheet` import and `CreateClusterSheet` import. Add `useNavigate`.

```typescript
import { Button } from "@packages/ui/components/button";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Network, Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ClustersListSection } from "@/features/clusters/ui/clusters-list-section";

export const Route = createFileRoute(
  "/_authenticated/$slug/$teamSlug/_dashboard/clusters/",
)({
  component: ClustersPage,
});

function ClustersPage() {
  const navigate = useNavigate();
  const { slug, teamSlug } = useParams({ strict: false }) as {
    slug: string;
    teamSlug: string;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-serif flex items-center gap-2">
            <Network className="size-6" />
            Clusters
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize conteúdos relacionados em grupos temáticos.
          </p>
        </div>
        <Button
          onClick={() =>
            navigate({
              to: "/$slug/$teamSlug/clusters/new",
              params: { slug, teamSlug },
            } as never)
          }
        >
          <Plus className="size-4 mr-2" />
          Novo cluster
        </Button>
      </div>
      <ErrorBoundary
        fallback={
          <p className="text-sm text-muted-foreground">
            Erro ao carregar clusters.
          </p>
        }
      >
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Carregando...</p>
          }
        >
          <ClustersListSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

**Step 2: Update clusters-list-section.tsx empty state button**

In `clusters-list-section.tsx`, `useNavigate` is already imported. The empty state currently opens the sheet. Update it to navigate to `clusters/new`:

Remove these imports:
```typescript
import { useSheet } from "@/hooks/use-sheet";
import { CreateClusterSheet } from "./create-cluster-sheet";
```

Remove `const { openSheet } = useSheet();` from the component body.

Replace the empty state button:
```typescript
// FROM:
<button
  className="text-sm underline text-primary"
  onClick={() => openSheet({ children: <CreateClusterSheet /> })}
  type="button"
>
  Criar cluster
</button>

// TO:
<button
  className="text-sm underline text-primary"
  onClick={() =>
    navigate({
      to: "/$slug/$teamSlug/clusters/new",
      params: { slug, teamSlug },
    } as never)
  }
  type="button"
>
  Criar cluster
</button>
```

**Step 3: Commit**

```bash
git add "apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/clusters/index.tsx" \
        apps/web/src/features/clusters/ui/clusters-list-section.tsx
git commit -m "feat(clusters): navigate to clusters/new instead of opening sheet"
```

---

## Task 8: Typecheck and fix any TypeScript errors

**Files:** Any files with TS errors

**Step 1: Run typecheck**

Run: `bun run typecheck`

**Step 2: Common issues to watch for**

1. **`as never` navigation casts** — TanStack Router is strict about route params. If you get type errors on `to:` navigation, check that the `to` string matches exactly what TanStack Router knows. Using `as never` is acceptable per the existing codebase pattern.

2. **`rel.id` on satellite relations** — The `listSatellites` result returns `RelatedContent[]`. Check the actual schema shape. If `id` is not on the relation object, use `rel.targetContentId` as a fallback key or use a composite `${rel.sourceContentId}-${rel.targetContentId}`.

3. **`cluster.status`** — The `Content` type has `status: "draft" | "published"`. This should work directly.

4. **`refetchSatellites` return type** — `useSuspenseQuery` `refetch()` returns `QueryObserverResult`. Use `.then((result) => result.data)` pattern or just call `refetch()` without chaining for simplicity.

5. **Missing exports in package.json** — If `InlineEditableText` import fails (e.g. `@packages/ui/components/inline-editable-text`), check the actual import path. The component lives at `apps/web/src/features/analytics/ui/inline-editable-text.tsx` — import it with the `@/features/analytics/ui/inline-editable-text` path alias.

6. **`useAlertDialog` API** — The correct API is `openAlertDialog({ title, description, onAction, actionLabel?, cancelLabel?, variant? })`. NOT `onConfirm`/`confirmLabel`. Use `variant: "destructive"` for delete actions.

**Step 3: Run typecheck again until clean**

Run: `bun run typecheck`
Expected: No errors

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(clusters): resolve TypeScript errors in cluster builder"
```

---

## Task 9: Verify build passes

**Step 1: Run build**

Run: `bun run build`
Expected: Build completes without errors

**Step 2: If build fails due to bundle issues**

- Do NOT add `NODE_OPTIONS='--max-old-space-size=...'`
- Check for circular imports or missing exports
- Fix root cause

**Step 3: Commit if any fixes were needed**

---

## Task 10: Clean up deprecated files (optional, post-validation)

**Files:**
- `apps/web/src/features/clusters/ui/create-cluster-sheet.tsx` — can be removed (replaced by builder)
- `apps/web/src/features/clusters/ui/cluster-detail-section.tsx` — can be removed (absorbed into builder)

> **Note:** Only remove these after verifying the builder works correctly end-to-end. They can remain as dead code in the first iteration and be removed in a follow-up.

**Step 1: Check for remaining imports**

Run: `grep -r "create-cluster-sheet\|cluster-detail-section" apps/web/src/`
Expected: No remaining imports (only the files themselves)

**Step 2: Remove files**

```bash
rm apps/web/src/features/clusters/ui/create-cluster-sheet.tsx
rm apps/web/src/features/clusters/ui/cluster-detail-section.tsx
```

**Step 3: Run typecheck to confirm nothing broke**

Run: `bun run typecheck`

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(clusters): remove deprecated CreateClusterSheet and ClusterDetailSection"
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `features/clusters/hooks/use-cluster-config.ts` | **NEW** — state hook with debounce |
| `features/clusters/ui/cluster-builder-header.tsx` | **NEW** — sticky header with InlineEditableText + actions |
| `features/clusters/ui/satellite-canvas.tsx` | **NEW** — dnd-kit sortable satellite list |
| `features/clusters/ui/cluster-builder.tsx` | **NEW** — main builder (3 tabs, create/edit modes) |
| `routes/.../clusters/new.tsx` | **NEW** — creation route |
| `routes/.../clusters/$clusterId.tsx` | **MODIFIED** — mounts ClusterBuilder |
| `routes/.../clusters/index.tsx` | **MODIFIED** — navigate instead of openSheet |
| `features/clusters/ui/clusters-list-section.tsx` | **MODIFIED** — empty state button navigates |
| `features/clusters/ui/create-cluster-sheet.tsx` | **REMOVE** (Task 10) |
| `features/clusters/ui/cluster-detail-section.tsx` | **REMOVE** (Task 10) |

No router/DB/schema changes required — all infrastructure exists.
