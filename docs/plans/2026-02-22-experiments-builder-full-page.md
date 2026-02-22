# Experiments Builder — Full-Page UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current sheet/credenza flow for creating and editing experiments with a full-page builder UI that follows the established InsightBuilder and FormBuilder patterns.

**Architecture:** Create a new `ExperimentBuilder` component (analogous to `InsightBuilder`) with a sticky header, three tabs (Configuração / Variantes / Resultados), and a `useExperimentConfig` hook for local state management. The `new.tsx` route mounts the builder without an ID (create mode) while the existing `$experimentId.tsx` route is refactored to mount the same builder with an ID (edit mode). Inline variant management replaces the Credenza flow.

**Tech Stack:** React, TanStack Router (file-based), TanStack Query (`useSuspenseQuery` / `useMutation`), oRPC client (`orpc.*`), Lucide icons, `@packages/ui` components (`Button`, `Tabs`, `Input`, `Select`, `Switch`, `Textarea`, `Badge`, Skeleton), `sonner` toasts, `useAlertDialog` global hook.

---

## Task 1: Create `useExperimentConfig` hook

**Files:**
- Create: `apps/web/src/features/experiments/hooks/use-experiment-config.ts`

This hook manages the mutable, local fields of the experiment being built/edited: `name`, `hypothesis`, `targetType`, and `goal`. It mirrors the shape of `useInsightConfig` but is simpler (no debounce needed — fields are saved explicitly on button click, not auto-saved).

**Step 1: Write the hook**

```typescript
// apps/web/src/features/experiments/hooks/use-experiment-config.ts
import { useCallback, useState } from "react";

export type ExperimentTargetType = "content" | "form" | "cluster";
export type ExperimentGoal = "conversion" | "ctr" | "time_on_page" | "form_submit";
export type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

export interface ExperimentConfig {
   name: string;
   hypothesis: string;
   targetType: ExperimentTargetType;
   goal: ExperimentGoal;
}

const DEFAULT_CONFIG: ExperimentConfig = {
   name: "",
   hypothesis: "",
   targetType: "content",
   goal: "conversion",
};

export function useExperimentConfig(initial?: Partial<ExperimentConfig>) {
   const [config, setConfig] = useState<ExperimentConfig>({
      ...DEFAULT_CONFIG,
      ...initial,
   });

   const updateConfig = useCallback(
      (updates: Partial<ExperimentConfig>) => {
         setConfig((prev) => ({ ...prev, ...updates }));
      },
      [],
   );

   const setName = useCallback((name: string) => {
      setConfig((prev) => ({ ...prev, name }));
   }, []);

   return { config, updateConfig, setName };
}
```

**Step 2: Verify the file exists**

Run: `ls apps/web/src/features/experiments/hooks/`
Expected: `use-experiment-config.ts`

**Step 3: Commit**

```bash
git add apps/web/src/features/experiments/hooks/use-experiment-config.ts
git commit -m "feat(experiments): add useExperimentConfig hook"
```

---

## Task 2: Create `ExperimentBuilderHeader` component

**Files:**
- Create: `apps/web/src/features/experiments/ui/experiment-builder-header.tsx`

This header mirrors `InsightHeader`. It renders:
- `ArrowLeft` back link to experiments list
- `FlaskConical` icon
- `InlineEditableText` for the experiment name (imported from `@/features/analytics/ui/inline-editable-text`)
- Contextual primary button: **Salvar** (draft) → **Iniciar** (draft + ≥2 variants) → **Pausar** / **Retomar** / disabled (concluded)
- Dropdown (Ellipsis): Concluir, separator, Excluir (destructive) — both with `useAlertDialog`

**Step 1: Write the component**

```typescript
// apps/web/src/features/experiments/ui/experiment-builder-header.tsx
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
   ChevronDown,
   FlaskConical,
   Loader2,
   Pause,
   Play,
   Save,
   Trash2,
   Trophy,
} from "lucide-react";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import type { ExperimentStatus } from "./experiment-builder-header";

export interface ExperimentBuilderHeaderProps {
   name: string;
   onNameChange: (name: string) => void;
   status: ExperimentStatus | null; // null = create mode (no experiment yet)
   variantCount: number;
   backTo: { slug: string; teamSlug: string };
   // Actions
   onSave: () => void;
   isSaving: boolean;
   onStart?: () => void;
   isStarting?: boolean;
   onPause?: () => void;
   isPausing?: boolean;
   onConclude?: () => void;
   isConcluding?: boolean;
   onDelete?: () => void;
   isDeleting?: boolean;
}

export type { ExperimentStatus };

export function ExperimentBuilderHeader({
   name,
   onNameChange,
   status,
   variantCount,
   backTo,
   onSave,
   isSaving,
   onStart,
   isStarting,
   onPause,
   isPausing,
   onConclude,
   isConcluding,
   onDelete,
   isDeleting,
}: ExperimentBuilderHeaderProps) {
   const { openAlertDialog } = useAlertDialog();

   const isCreateMode = status === null;
   const canStart =
      (status === "draft" || status === "paused") && variantCount >= 2;
   const canStartButNeedsMore =
      (status === "draft" || status === "paused") && variantCount < 2;
   const isRunning = status === "running";
   const isConcluded = status === "concluded";
   const isAnyPending =
      isSaving || isStarting || isPausing || isConcluding || isDeleting;

   const handleDelete = () => {
      openAlertDialog({
         title: "Excluir experimento?",
         description:
            "Esta ação não pode ser desfeita. Todos os dados serão perdidos.",
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => { onDelete?.(); },
      });
   };

   const handleConclude = () => {
      openAlertDialog({
         title: "Concluir experimento?",
         description:
            "O experimento será marcado como concluído e não coletará mais dados.",
         actionLabel: "Concluir",
         cancelLabel: "Cancelar",
         onAction: async () => { onConclude?.(); },
      });
   };

   return (
      <div className="border-b bg-background">
         <div className="container mx-auto px-4 py-4">
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                     <Link
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        params={backTo as never}
                        to="/$slug/$teamSlug/experiments"
                     >
                        <ArrowLeft className="size-5" />
                     </Link>
                     <FlaskConical className="size-5 flex-shrink-0 text-muted-foreground" />
                     <InlineEditableText
                        className="text-2xl font-semibold"
                        onSave={onNameChange}
                        placeholder="Nome do experimento"
                        value={name}
                     />
                  </div>
               </div>

               <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Save — always visible (create mode or draft/paused) */}
                  {(isCreateMode || status === "draft" || status === "paused") && (
                     <Button
                        disabled={isAnyPending || !name.trim()}
                        onClick={onSave}
                        variant="outline"
                     >
                        {isSaving ? (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                           <Save className="size-4 mr-2" />
                        )}
                        Salvar
                     </Button>
                  )}

                  {/* Start — visible when draft/paused with ≥2 variants */}
                  {canStart && (
                     <Button disabled={isAnyPending} onClick={onStart}>
                        {isStarting ? (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                           <Play className="size-4 mr-2" />
                        )}
                        {status === "paused" ? "Retomar" : "Iniciar"}
                     </Button>
                  )}

                  {/* Start disabled — needs more variants */}
                  {canStartButNeedsMore && !isCreateMode && (
                     <Button
                        disabled
                        title="Adicione pelo menos 2 variantes para iniciar"
                     >
                        <Play className="size-4 mr-2" />
                        Iniciar
                     </Button>
                  )}

                  {/* Pause — visible when running */}
                  {isRunning && (
                     <Button
                        disabled={isAnyPending}
                        onClick={onPause}
                        variant="outline"
                     >
                        {isPausing ? (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                           <Pause className="size-4 mr-2" />
                        )}
                        Pausar
                     </Button>
                  )}

                  {/* Dropdown: Concluir + Excluir */}
                  {!isCreateMode && !isConcluded && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button
                              disabled={isAnyPending}
                              size="icon"
                              variant="outline"
                           >
                              <ChevronDown className="size-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           {(isRunning || status === "paused") && (
                              <>
                                 <DropdownMenuItem onClick={handleConclude}>
                                    <Trophy className="size-4 mr-2" />
                                    Concluir experimento
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator />
                              </>
                           )}
                           {isRunning ? (
                              <DropdownMenuItem
                                 className="text-muted-foreground"
                                 disabled
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 Pause primeiro para excluir
                              </DropdownMenuItem>
                           ) : (
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onClick={handleDelete}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 Excluir experimento
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
git add apps/web/src/features/experiments/ui/experiment-builder-header.tsx
git commit -m "feat(experiments): add ExperimentBuilderHeader component"
```

---

## Task 3: Create `ExperimentConfigTab` component

**Files:**
- Create: `apps/web/src/features/experiments/ui/experiment-config-tab.tsx`

This tab renders the configuration fields for the experiment: name (read-only, editing happens in header inline text), hypothesis, targetType (as visual cards), and goal (as Select or radio group, conditional on targetType).

**Step 1: Write the component**

```typescript
// apps/web/src/features/experiments/ui/experiment-config-tab.tsx
import { Badge } from "@packages/ui/components/badge";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import { FileText, FlaskConical, Layers } from "lucide-react";
import type { ExperimentConfig, ExperimentGoal, ExperimentTargetType } from "../hooks/use-experiment-config";

interface ExperimentConfigTabProps {
   config: ExperimentConfig;
   onUpdate: (updates: Partial<ExperimentConfig>) => void;
   canEdit: boolean;
}

const TARGET_TYPE_OPTIONS: {
   value: ExperimentTargetType;
   label: string;
   description: string;
   icon: React.ElementType;
}[] = [
   {
      value: "content",
      label: "Conteúdo",
      description: "Compare variantes de artigos e páginas de conteúdo",
      icon: FileText,
   },
   {
      value: "form",
      label: "Formulário",
      description: "Compare variantes de formulários de captura",
      icon: FlaskConical,
   },
   {
      value: "cluster",
      label: "Cluster",
      description: "Compare clusters de conteúdo inteiros",
      icon: Layers,
   },
];

const GOAL_OPTIONS: { value: ExperimentGoal; label: string; description: string }[] = [
   { value: "conversion", label: "Conversão", description: "Taxa de conversão geral" },
   { value: "ctr", label: "CTR", description: "Taxa de cliques (Click-through rate)" },
   { value: "time_on_page", label: "Tempo na página", description: "Tempo médio de permanência" },
   { value: "form_submit", label: "Envio de formulário", description: "Taxa de preenchimento de formulário" },
];

export function ExperimentConfigTab({
   config,
   onUpdate,
   canEdit,
}: ExperimentConfigTabProps) {
   return (
      <div className="flex flex-col gap-8 max-w-2xl">
         {/* Hypothesis */}
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-hypothesis">
               Hipótese
               <span className="ml-1 text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
               disabled={!canEdit}
               id="exp-hypothesis"
               onChange={(e) => onUpdate({ hypothesis: e.target.value })}
               placeholder="Descreva o que você espera descobrir com este experimento..."
               rows={3}
               value={config.hypothesis}
            />
         </div>

         {/* Target Type */}
         <div className="flex flex-col gap-3">
            <Label>Tipo de alvo</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               {TARGET_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = config.targetType === opt.value;
                  return (
                     <button
                        className={cn(
                           "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                           isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/40 hover:bg-muted/30",
                           !canEdit && "cursor-not-allowed opacity-60",
                        )}
                        disabled={!canEdit}
                        key={opt.value}
                        onClick={() => canEdit && onUpdate({ targetType: opt.value })}
                        type="button"
                     >
                        <div className="flex items-center gap-2">
                           <Icon
                              className={cn(
                                 "size-4",
                                 isSelected
                                    ? "text-primary"
                                    : "text-muted-foreground",
                              )}
                           />
                           <span className="text-sm font-medium">{opt.label}</span>
                           {isSelected && (
                              <Badge
                                 className="ml-auto"
                                 variant="default"
                              >
                                 Selecionado
                              </Badge>
                           )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                           {opt.description}
                        </p>
                     </button>
                  );
               })}
            </div>
         </div>

         {/* Goal */}
         <div className="flex flex-col gap-2">
            <Label htmlFor="exp-goal">Métrica principal</Label>
            <Select
               disabled={!canEdit}
               onValueChange={(v) => onUpdate({ goal: v as ExperimentGoal })}
               value={config.goal}
            >
               <SelectTrigger className="max-w-sm" id="exp-goal">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {GOAL_OPTIONS.map((opt) => (
                     <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col gap-0.5">
                           <span>{opt.label}</span>
                           <span className="text-xs text-muted-foreground">{opt.description}</span>
                        </div>
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
      </div>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/experiments/ui/experiment-config-tab.tsx
git commit -m "feat(experiments): add ExperimentConfigTab component"
```

---

## Task 4: Refactor `ExperimentVariantsTab` to inline management (no Credenza)

**Files:**
- Modify: `apps/web/src/features/experiments/ui/experiment-variants-tab.tsx`

Replace the `openCredenza` call with an inline "add variant" form that expands inline in the variants tab. Remove all Credenza imports. The inline form shows a name input, content/form selector (based on `targetType`), and an isControl switch. When submitted, it calls the same `addVariantToExperiment` mutation.

**Step 1: Rewrite the component**

Replace the entire file content with:

```typescript
// apps/web/src/features/experiments/ui/experiment-variants-tab.tsx
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Switch } from "@packages/ui/components/switch";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Crown, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

interface ExperimentVariantsTabProps {
   experimentId: string;
   status: ExperimentStatus;
   targetType: "content" | "form" | "cluster";
   winnerId: string | null;
}

interface InlineAddVariantFormProps {
   experimentId: string;
   targetType: "content" | "form" | "cluster";
   onClose: () => void;
}

function InlineAddVariantForm({
   experimentId,
   targetType,
   onClose,
}: InlineAddVariantFormProps) {
   const [name, setName] = useState("");
   const [isControl, setIsControl] = useState(false);
   const [linkedId, setLinkedId] = useState("");

   const { data: contentList } = useSuspenseQuery(
      orpc.content.listAllContent.queryOptions({ input: { limit: 100 } }),
   );

   const addMutation = useMutation(
      orpc.experiments.addVariantToExperiment.mutationOptions({
         onSuccess: () => {
            toast.success("Variante adicionada!");
            onClose();
         },
         onError: (err) => {
            toast.error(err.message ?? "Erro ao adicionar variante");
         },
      }),
   );

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      addMutation.mutate({
         experimentId,
         name: name.trim(),
         isControl,
         ...(targetType === "content" && linkedId ? { contentId: linkedId } : {}),
         ...(targetType === "form" && linkedId ? { formId: linkedId } : {}),
      });
   };

   return (
      <div className="rounded-lg border bg-muted/30 p-4">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Nova variante</h3>
            <Button
               className="size-7"
               onClick={onClose}
               size="icon"
               type="button"
               variant="ghost"
            >
               <X className="size-4" />
            </Button>
         </div>
         <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
               <Label htmlFor="inline-variant-name">Nome da variante</Label>
               <Input
                  autoFocus
                  id="inline-variant-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Variante A"
                  value={name}
               />
            </div>

            {targetType === "content" && (
               <div className="flex flex-col gap-2">
                  <Label htmlFor="inline-variant-content">Conteúdo vinculado</Label>
                  <Select onValueChange={setLinkedId} value={linkedId}>
                     <SelectTrigger id="inline-variant-content">
                        <SelectValue placeholder="Selecione um conteúdo" />
                     </SelectTrigger>
                     <SelectContent>
                        {contentList?.items?.map(
                           (item: { id: string; title?: string | null }) => (
                              <SelectItem key={item.id} value={item.id}>
                                 {item.title ?? "Sem título"}
                              </SelectItem>
                           ),
                        )}
                     </SelectContent>
                  </Select>
               </div>
            )}

            <div className="flex items-center gap-3">
               <Switch
                  checked={isControl}
                  id="inline-variant-control"
                  onCheckedChange={setIsControl}
               />
               <Label className="cursor-pointer" htmlFor="inline-variant-control">
                  Variante de controle
               </Label>
            </div>

            <div className="flex items-center gap-2 justify-end">
               <Button
                  onClick={onClose}
                  size="sm"
                  type="button"
                  variant="ghost"
               >
                  Cancelar
               </Button>
               <Button
                  disabled={!name.trim() || addMutation.isPending}
                  size="sm"
                  type="submit"
               >
                  {addMutation.isPending && (
                     <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Adicionar
               </Button>
            </div>
         </form>
      </div>
   );
}

export function ExperimentVariantsTab({
   experimentId,
   status,
   targetType,
   winnerId,
}: ExperimentVariantsTabProps) {
   const [showAddForm, setShowAddForm] = useState(false);
   const { openAlertDialog } = useAlertDialog();

   const { data: experiment } = useSuspenseQuery(
      orpc.experiments.getById.queryOptions({
         input: { id: experimentId },
      }),
   );

   const removeMutation = useMutation(
      orpc.experiments.removeVariantFromExperiment.mutationOptions({
         onSuccess: () => toast.success("Variante removida"),
         onError: (err) =>
            toast.error(err.message ?? "Erro ao remover variante"),
      }),
   );

   const canEdit = status === "draft" || status === "paused";
   const variants = experiment.variants ?? [];
   const needsMoreVariants = variants.length < 2;

   const handleRemove = (variantId: string, variantName: string) => {
      openAlertDialog({
         title: `Remover variante "${variantName}"?`,
         description:
            "Esta ação não pode ser desfeita. Os dados desta variante serão perdidos.",
         actionLabel: "Remover",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await removeMutation.mutateAsync({ variantId });
         },
      });
   };

   return (
      <div className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <p className="text-sm text-muted-foreground">
                  {variants.length} variante{variants.length !== 1 ? "s" : ""}{" "}
                  configurada{variants.length !== 1 ? "s" : ""}
               </p>
               {needsMoreVariants && canEdit && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                     Mínimo de 2 variantes para iniciar
                  </p>
               )}
            </div>
            {canEdit && !showAddForm && (
               <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  variant="outline"
               >
                  <Plus className="mr-2 size-4" />
                  Adicionar variante
               </Button>
            )}
         </div>

         {variants.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border rounded-lg border-dashed">
               <p className="text-sm text-muted-foreground">
                  Nenhuma variante configurada ainda.
               </p>
               {canEdit && (
                  <Button
                     onClick={() => setShowAddForm(true)}
                     size="sm"
                     variant="outline"
                  >
                     <Plus className="mr-2 size-4" />
                     Adicionar primeira variante
                  </Button>
               )}
            </div>
         ) : (
            <div className="flex flex-col gap-2">
               {variants.map((variant) => (
                  <div
                     className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                     key={variant.id}
                  >
                     <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                 {variant.name}
                              </span>
                              {variant.isControl && (
                                 <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    Controle
                                 </span>
                              )}
                              {winnerId === variant.id && (
                                 <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    <Crown className="size-3" />
                                    Vencedor
                                 </span>
                              )}
                           </div>
                           {(variant.contentId ?? variant.formId) && (
                              <span className="text-xs text-muted-foreground">
                                 ID:{" "}
                                 {(variant.contentId ?? variant.formId)?.slice(0, 8)}…
                              </span>
                           )}
                        </div>
                     </div>
                     {canEdit && (
                        <Button
                           className="size-8 text-destructive hover:text-destructive"
                           disabled={removeMutation.isPending}
                           onClick={() => handleRemove(variant.id, variant.name)}
                           size="icon"
                           variant="ghost"
                        >
                           {removeMutation.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                           ) : (
                              <Trash2 className="size-4" />
                           )}
                        </Button>
                     )}
                  </div>
               ))}
            </div>
         )}

         {showAddForm && (
            <InlineAddVariantForm
               experimentId={experimentId}
               onClose={() => setShowAddForm(false)}
               targetType={targetType}
            />
         )}

         {!canEdit && status === "running" && (
            <p className="text-xs text-muted-foreground text-center">
               Variantes não podem ser modificadas enquanto o experimento está em execução.
            </p>
         )}
      </div>
   );
}
```

**Step 2: Verify no Credenza imports remain**

Run: `grep -n "useCredenza\|openCredenza\|Credenza" apps/web/src/features/experiments/ui/experiment-variants-tab.tsx`
Expected: no output (zero matches)

**Step 3: Commit**

```bash
git add apps/web/src/features/experiments/ui/experiment-variants-tab.tsx
git commit -m "feat(experiments): refactor variants tab to inline add form, remove Credenza"
```

---

## Task 5: Create `ExperimentBuilder` main component

**Files:**
- Create: `apps/web/src/features/experiments/ui/experiment-builder.tsx`

This is the top-level builder. It:
1. Accepts an optional `experimentId` prop
2. In **create mode** (`experimentId` is `undefined`): manages local state with `useExperimentConfig`, shows only the Configuração tab (Variantes and Resultados tabs are disabled until creation)
3. In **edit mode** (`experimentId` is a UUID): loads the experiment via `useSuspenseQuery`, populates `useExperimentConfig` from the loaded data, shows all three tabs

For edit mode, mutations for start/pause/conclude/delete are wired into the header.

**Step 1: Write the component**

```typescript
// apps/web/src/features/experiments/ui/experiment-builder.tsx
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { Button } from "@packages/ui/components/button";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Suspense, useCallback, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import {
   useExperimentConfig,
   type ExperimentStatus,
} from "../hooks/use-experiment-config";
import { ExperimentBuilderHeader } from "./experiment-builder-header";
import { ExperimentConfigTab } from "./experiment-config-tab";
import { ExperimentResultsTab } from "./experiment-results-tab";
import { ExperimentVariantsTab } from "./experiment-variants-tab";
import { orpc } from "@/integrations/orpc/client";

const TABS = [
   { value: "config", label: "Configuração" },
   { value: "variants", label: "Variantes" },
   { value: "results", label: "Resultados" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function ExperimentBuilderSkeleton() {
   return (
      <div className="flex flex-col gap-0 h-full">
         <div className="border-b bg-background">
            <div className="container mx-auto px-4 py-4">
               <div className="flex items-center gap-3">
                  <Skeleton className="size-5" />
                  <Skeleton className="size-5" />
                  <Skeleton className="h-8 w-64" />
               </div>
            </div>
         </div>
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex gap-0">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-24 ml-2" />
                  <Skeleton className="h-10 w-24 ml-2" />
               </div>
            </div>
         </div>
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
               <Skeleton className="h-24 w-full max-w-2xl" />
               <Skeleton className="h-40 w-full max-w-2xl" />
               <Skeleton className="h-16 w-full max-w-sm" />
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────
// Edit mode inner component (needs Suspense)
// ─────────────────────────────────────────────────────────────

interface ExperimentBuilderEditContentProps {
   experimentId: string;
   activeTab: TabValue;
   onTabChange: (tab: TabValue) => void;
   backTo: { slug: string; teamSlug: string };
}

function ExperimentBuilderEditContent({
   experimentId,
   activeTab,
   onTabChange,
   backTo,
}: ExperimentBuilderEditContentProps) {
   const navigate = useNavigate();
   const { config, updateConfig, setName } = useExperimentConfig();

   const { data: experiment } = useSuspenseQuery(
      orpc.experiments.getById.queryOptions({ input: { id: experimentId } }),
   );

   // Populate config from loaded experiment on first load
   useEffect(() => {
      updateConfig({
         name: experiment.name,
         hypothesis: experiment.hypothesis ?? "",
         targetType: experiment.targetType as "content" | "form" | "cluster",
         goal: experiment.goal as "conversion" | "ctr" | "time_on_page" | "form_submit",
      });
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [experiment.id]);

   const status = experiment.status as ExperimentStatus;
   const canEdit = status === "draft" || status === "paused";
   const variantCount = experiment.variants?.length ?? 0;

   const updateMutation = useMutation(
      orpc.experiments.update.mutationOptions({
         onSuccess: () => toast.success("Experimento atualizado!"),
         onError: (err) => toast.error(err.message ?? "Erro ao salvar"),
      }),
   );

   const startMutation = useMutation(
      orpc.experiments.start.mutationOptions({
         onSuccess: () => toast.success("Experimento iniciado!"),
         onError: (err) => toast.error(err.message ?? "Erro ao iniciar"),
      }),
   );

   const pauseMutation = useMutation(
      orpc.experiments.pause.mutationOptions({
         onSuccess: () => toast.success("Experimento pausado"),
         onError: (err) => toast.error(err.message ?? "Erro ao pausar"),
      }),
   );

   const concludeMutation = useMutation(
      orpc.experiments.conclude.mutationOptions({
         onSuccess: () => toast.success("Experimento concluído"),
         onError: (err) => toast.error(err.message ?? "Erro ao concluir"),
      }),
   );

   const removeMutation = useMutation(
      orpc.experiments.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Experimento excluído");
            navigate({
               to: "/$slug/$teamSlug/experiments",
               params: backTo as never,
            });
         },
         onError: (err) => toast.error(err.message ?? "Erro ao excluir"),
      }),
   );

   const handleSave = useCallback(() => {
      if (!config.name.trim()) {
         toast.error("O nome do experimento é obrigatório");
         return;
      }
      updateMutation.mutate({
         id: experimentId,
         name: config.name.trim(),
         hypothesis: config.hypothesis || undefined,
         goal: config.goal,
      });
   }, [config, experimentId, updateMutation]);

   return (
      <div className="flex flex-col gap-0 h-full">
         <ExperimentBuilderHeader
            backTo={backTo}
            isConcluding={concludeMutation.isPending}
            isDeleting={removeMutation.isPending}
            isPausing={pauseMutation.isPending}
            isSaving={updateMutation.isPending}
            isStarting={startMutation.isPending}
            name={config.name}
            onConclude={() => concludeMutation.mutate({ id: experimentId })}
            onDelete={() => removeMutation.mutate({ id: experimentId })}
            onNameChange={setName}
            onPause={() => pauseMutation.mutate({ id: experimentId })}
            onSave={handleSave}
            onStart={() => startMutation.mutate({ id: experimentId })}
            status={status}
            variantCount={variantCount}
         />

         {/* Tab bar */}
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex items-center gap-0">
                  {TABS.map((tab) => (
                     <Button
                        className={cn(
                           "px-4 py-2.5 h-auto rounded-none border-b-2 text-sm font-medium",
                           activeTab === tab.value
                              ? "border-primary text-primary"
                              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                        )}
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        variant="ghost"
                     >
                        {tab.label}
                        {tab.value === "variants" && variantCount > 0 && (
                           <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {variantCount}
                           </span>
                        )}
                     </Button>
                  ))}
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
               {activeTab === "config" && (
                  <ExperimentConfigTab
                     canEdit={canEdit}
                     config={config}
                     onUpdate={updateConfig}
                  />
               )}
               {activeTab === "variants" && (
                  <ErrorBoundary
                     FallbackComponent={createErrorFallback({
                        errorTitle: "Erro ao carregar variantes",
                        errorDescription: "Não foi possível carregar as variantes",
                        retryText: "Tentar novamente",
                     })}
                  >
                     <Suspense
                        fallback={
                           <div className="flex flex-col gap-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                 <Skeleton
                                    className="h-14 w-full rounded-lg"
                                    key={`var-sk-${i + 1}`}
                                 />
                              ))}
                           </div>
                        }
                     >
                        <ExperimentVariantsTab
                           experimentId={experimentId}
                           status={status}
                           targetType={experiment.targetType as "content" | "form" | "cluster"}
                           winnerId={experiment.winnerId ?? null}
                        />
                     </Suspense>
                  </ErrorBoundary>
               )}
               {activeTab === "results" && (
                  <ErrorBoundary
                     FallbackComponent={createErrorFallback({
                        errorTitle: "Erro ao carregar resultados",
                        errorDescription: "Não foi possível carregar os resultados",
                        retryText: "Tentar novamente",
                     })}
                  >
                     <Suspense
                        fallback={
                           <Skeleton className="h-64 w-full rounded-lg" />
                        }
                     >
                        <ExperimentResultsTab experimentId={experimentId} />
                     </Suspense>
                  </ErrorBoundary>
               )}
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────
// Create mode inner component (no data loading)
// ─────────────────────────────────────────────────────────────

interface ExperimentBuilderCreateContentProps {
   activeTab: TabValue;
   onTabChange: (tab: TabValue) => void;
   backTo: { slug: string; teamSlug: string };
   onCreate: (config: { name: string; hypothesis?: string; targetType: string; goal: string }) => void;
   isCreating: boolean;
}

function ExperimentBuilderCreateContent({
   activeTab,
   onTabChange,
   backTo,
   onCreate,
   isCreating,
}: ExperimentBuilderCreateContentProps) {
   const { config, updateConfig, setName } = useExperimentConfig();

   const handleSave = useCallback(() => {
      if (!config.name.trim()) {
         toast.error("O nome do experimento é obrigatório");
         return;
      }
      onCreate({
         name: config.name.trim(),
         hypothesis: config.hypothesis || undefined,
         targetType: config.targetType,
         goal: config.goal,
      });
   }, [config, onCreate]);

   return (
      <div className="flex flex-col gap-0 h-full">
         <ExperimentBuilderHeader
            backTo={backTo}
            isSaving={isCreating}
            name={config.name}
            onNameChange={setName}
            onSave={handleSave}
            status={null}
            variantCount={0}
         />

         {/* Tab bar — only Configuração is enabled in create mode */}
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex items-center gap-0">
                  {TABS.map((tab) => {
                     const isDisabled = tab.value !== "config";
                     return (
                        <Button
                           className={cn(
                              "px-4 py-2.5 h-auto rounded-none border-b-2 text-sm font-medium",
                              activeTab === tab.value
                                 ? "border-primary text-primary"
                                 : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                              isDisabled && "opacity-40 cursor-not-allowed",
                           )}
                           disabled={isDisabled}
                           key={tab.value}
                           onClick={() => !isDisabled && onTabChange(tab.value)}
                           variant="ghost"
                        >
                           {tab.label}
                        </Button>
                     );
                  })}
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
               <ExperimentConfigTab
                  canEdit
                  config={config}
                  onUpdate={updateConfig}
               />
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────
// Public interface
// ─────────────────────────────────────────────────────────────

export interface ExperimentBuilderProps {
   experimentId?: string;
   backTo: { slug: string; teamSlug: string };
   // Provided by parent in create mode
   onCreate?: (config: { name: string; hypothesis?: string; targetType: string; goal: string }) => void;
   isCreating?: boolean;
   initialTab?: TabValue;
}

export function ExperimentBuilder({
   experimentId,
   backTo,
   onCreate,
   isCreating = false,
   initialTab = "config",
}: ExperimentBuilderProps) {
   const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

   const isEditMode = experimentId !== undefined;

   if (isEditMode) {
      return (
         <ErrorBoundary
            FallbackComponent={createErrorFallback({
               errorTitle: "Erro ao carregar experimento",
               errorDescription: "Não foi possível carregar o experimento",
               retryText: "Tentar novamente",
            })}
         >
            <Suspense fallback={<ExperimentBuilderSkeleton />}>
               <ExperimentBuilderEditContent
                  activeTab={activeTab}
                  backTo={backTo}
                  experimentId={experimentId}
                  onTabChange={setActiveTab}
               />
            </Suspense>
         </ErrorBoundary>
      );
   }

   return (
      <ExperimentBuilderCreateContent
         activeTab={activeTab}
         backTo={backTo}
         isCreating={isCreating}
         onCreate={onCreate ?? (() => {})}
         onTabChange={setActiveTab}
      />
   );
}
```

> **Note:** `useState` import is missing in the above — add `import { Suspense, useCallback, useEffect, useState } from "react";` at the top.

**Step 2: Commit**

```bash
git add apps/web/src/features/experiments/ui/experiment-builder.tsx
git commit -m "feat(experiments): add ExperimentBuilder full-page component"
```

---

## Task 6: Create `experiments/new.tsx` route

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/new.tsx`

Mirrors `analytics/insights/new.tsx` exactly. No data loading — just mounts `<ExperimentBuilder />` in create mode and wires up the create mutation.

**Step 1: Write the route**

```typescript
// apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/new.tsx
import { useMutation } from "@tanstack/react-query";
import {
   createFileRoute,
   useNavigate,
   useParams,
} from "@tanstack/react-router";
import { toast } from "sonner";
import { ExperimentBuilder } from "@/features/experiments/ui/experiment-builder";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/experiments/new",
)({
   component: NewExperimentPage,
});

function NewExperimentPage() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };

   const createMutation = useMutation(
      orpc.experiments.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Experimento criado!");
            navigate({
               to: "/$slug/$teamSlug/experiments/$experimentId",
               params: { slug, teamSlug, experimentId: data.id },
            } as never);
         },
         onError: (err) => {
            toast.error(err.message ?? "Erro ao criar experimento");
         },
      }),
   );

   return (
      <ExperimentBuilder
         backTo={{ slug, teamSlug }}
         isCreating={createMutation.isPending}
         onCreate={(config) =>
            createMutation.mutate({
               name: config.name,
               hypothesis: config.hypothesis,
               targetType: config.targetType as "content" | "form" | "cluster",
               goal: config.goal as "conversion" | "ctr" | "time_on_page" | "form_submit",
            })
         }
      />
   );
}
```

**Step 2: Commit**

```bash
git add "apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/experiments/new.tsx"
git commit -m "feat(experiments): add new experiment route with ExperimentBuilder"
```

---

## Task 7: Refactor `$experimentId.tsx` to use `ExperimentBuilder`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/$experimentId.tsx`

Replace the entire existing content with a thin wrapper that just mounts `<ExperimentBuilder experimentId={experimentId} />`. All the logic (mutations, tabs, header) now lives in the builder and its sub-components.

**Step 1: Replace the route file**

```typescript
// apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/$experimentId.tsx
import {
   createFileRoute,
   useParams,
} from "@tanstack/react-router";
import { ExperimentBuilder } from "@/features/experiments/ui/experiment-builder";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/experiments/$experimentId",
)({
   component: ExperimentDetailPage,
});

function ExperimentDetailPage() {
   const { experimentId, slug, teamSlug } = Route.useParams();

   return (
      <ExperimentBuilder
         backTo={{ slug, teamSlug }}
         experimentId={experimentId}
      />
   );
}
```

**Step 2: Commit**

```bash
git add "apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/experiments/\$experimentId.tsx"
git commit -m "feat(experiments): refactor detail route to use ExperimentBuilder"
```

---

## Task 8: Update `ExperimentsListSection` — replace `openSheet` with `navigate`

**Files:**
- Modify: `apps/web/src/features/experiments/ui/experiments-list-section.tsx`

Remove the `useSheet` import and `openSheet` call. The "Novo experimento" button now navigates to `/$slug/$teamSlug/experiments/new`.

**Step 1: Edit the file**

Find:
```typescript
import { useSheet } from "@/hooks/use-sheet";
import { CreateExperimentSheet } from "./create-experiment-sheet";
```

Replace with:
```typescript
import { useNavigate } from "@tanstack/react-router";
```

Find:
```typescript
   const { openSheet, closeSheet } = useSheet();
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };
```

Replace with:
```typescript
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };
```

Find:
```typescript
   const handleOpenCreateSheet = () => {
      openSheet({
         children: <CreateExperimentSheet onSuccess={closeSheet} />,
      });
   };
```

Replace with:
```typescript
   const handleOpenCreateSheet = () => {
      navigate({
         to: "/$slug/$teamSlug/experiments/new",
         params: { slug, teamSlug },
      } as never);
   };
```

**Step 2: Verify no `useSheet` / `CreateExperimentSheet` imports remain**

Run: `grep -n "useSheet\|CreateExperimentSheet\|openSheet" apps/web/src/features/experiments/ui/experiments-list-section.tsx`
Expected: no output

**Step 3: Commit**

```bash
git add apps/web/src/features/experiments/ui/experiments-list-section.tsx
git commit -m "feat(experiments): replace openSheet with navigate to /experiments/new"
```

---

## Task 9: Delete `create-experiment-sheet.tsx`

The sheet component is now replaced by the builder. Remove it to keep the codebase clean.

**Files:**
- Delete: `apps/web/src/features/experiments/ui/create-experiment-sheet.tsx`

**Step 1: Delete the file**

Run: `rm apps/web/src/features/experiments/ui/create-experiment-sheet.tsx`

**Step 2: Verify no imports reference it**

Run: `grep -rn "create-experiment-sheet" apps/web/src/`
Expected: no output

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(experiments): remove obsolete create-experiment-sheet (replaced by builder)"
```

---

## Task 10: TypeScript check and fix

Run the TypeScript compiler to catch any type errors introduced by the new files.

**Step 1: Run typecheck**

Run: `bun run typecheck`
Expected: zero errors

**Step 2: Fix any errors**

Common issues to look for:
- Missing `useState` import in `experiment-builder.tsx`
- `ExperimentStatus` type being imported from the wrong file (it's defined in `use-experiment-config.ts` and re-exported from `experiment-builder-header.tsx` — consolidate to `use-experiment-config.ts`)
- `createErrorFallback` being called incorrectly — check the existing usage in `$experimentId.tsx` for the correct call pattern (it returns a component, so you need `FallbackComponent={createErrorFallback({...})}`)
- `navigate` params type assertions with `as never` — this is the existing pattern in the codebase, keep it

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(experiments): resolve TypeScript errors in ExperimentBuilder"
```

---

## Task 11: Final verification — Biome lint check

Run: `bun run check`
Expected: no lint errors

Fix any Biome lint issues (unused imports, missing types, etc.) then commit.

```bash
git add -A
git commit -m "fix(experiments): resolve Biome lint issues"
```

---

## Summary of File Changes

| Action | File |
|--------|------|
| **Create** | `apps/web/src/features/experiments/hooks/use-experiment-config.ts` |
| **Create** | `apps/web/src/features/experiments/ui/experiment-builder-header.tsx` |
| **Create** | `apps/web/src/features/experiments/ui/experiment-config-tab.tsx` |
| **Create** | `apps/web/src/features/experiments/ui/experiment-builder.tsx` |
| **Create** | `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/new.tsx` |
| **Modify** | `apps/web/src/features/experiments/ui/experiment-variants-tab.tsx` |
| **Modify** | `apps/web/src/features/experiments/ui/experiments-list-section.tsx` |
| **Replace** | `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/$experimentId.tsx` |
| **Delete** | `apps/web/src/features/experiments/ui/create-experiment-sheet.tsx` |

No schema, router, or database changes required — all infrastructure is already in place.
