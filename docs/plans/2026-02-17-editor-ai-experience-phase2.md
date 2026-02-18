# Editor AI Experience Redesign — Phase 2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

> **Depends on:** `2026-02-17-editor-chat-integration.md` (Phase 1) must be completed first. Phase 1 provides: fixed tool UI rendering, `EditorContextStore`, `SelectionContextPlugin`, streaming tool bridge, and basic slash/@ commands.

**Goal:** Transform the editor AI from three disconnected tools (FIM, Ctrl+K, Chat) into a unified, context-aware writing assistant. Cursor-style inline editing, mission-aware completions, simplified FIM, expanded floating toolbar with AI actions, and full-featured slash/@ commands for content workflows.

**Architecture:** A `ContentMission` persisted in raw IndexedDB (no library) holds brand voice, audience, tone, keywords per contentId. A TanStack Store (`contentMissionStore`) hydrates from IndexedDB on mount and debounce-writes back. Every AI call (FIM, edit, chat) reads from this store + the existing `EditorContextStore` to build rich context. The Ctrl+K experience is rebuilt as a Cursor-style inline prompt bar with inline diff rendering in the Lexical document. The FIM panel is removed — ghost text only. The floating toolbar gets an AI actions dropdown.

**Tech Stack:** Raw IndexedDB API, TanStack Store, Lexical (custom nodes + decorators), `@assistant-ui/react`, React, TypeScript, Tailwind CSS

---

## Task 1: IndexedDB Content Mission Storage

**Context:** Raw browser IndexedDB — three functions, zero dependencies. Stores the persistent content mission (brand voice, audience, tone, content type, keywords, word count target) keyed by `contentId`.

**Files:**
- Create: `apps/web/src/features/editor/storage/content-mission-db.ts`

**Step 1: Create the IndexedDB wrapper**

```typescript
/**
 * ContentMission IndexedDB Storage
 *
 * Raw IndexedDB wrapper for persisting content mission context.
 * Three functions, zero dependencies. Keyed by contentId.
 */

const DB_NAME = "contentta-editor";
const DB_VERSION = 1;
const STORE_NAME = "content-missions";

export interface ContentMission {
  contentId: string;
  // Content brief
  targetAudience: string | null;
  brandVoice: string | null;
  toneGuideline: string | null;
  contentType: "blog" | "landing" | "docs" | "email" | "social" | "other" | null;
  wordCountTarget: number | null;
  // SEO
  targetKeywords: string[];
  searchIntent: string | null;
  // Custom quick actions (for floating toolbar)
  customQuickActions: Array<{ label: string; prompt: string }>;
  // Timestamps
  updatedAt: number;
}

export const DEFAULT_MISSION: Omit<ContentMission, "contentId"> = {
  targetAudience: null,
  brandVoice: null,
  toneGuideline: null,
  contentType: null,
  wordCountTarget: null,
  targetKeywords: [],
  searchIntent: null,
  customQuickActions: [],
  updatedAt: Date.now(),
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "contentId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getMission(contentId: string): Promise<ContentMission | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(contentId);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMission(contentId: string, mission: Partial<ContentMission>): Promise<void> {
  const db = await openDB();
  const existing = await getMission(contentId);

  const merged: ContentMission = {
    ...DEFAULT_MISSION,
    ...existing,
    ...mission,
    contentId,
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(merged);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMission(contentId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(contentId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
```

**Step 2: Commit**
```bash
git add apps/web/src/features/editor/storage/content-mission-db.ts
git commit -m "feat(editor): add IndexedDB storage for ContentMission"
```

---

## Task 2: Content Mission TanStack Store

**Context:** In-memory reactive store that hydrates from IndexedDB on mount and debounce-writes back. Components read from this store. Also holds computed live editor state (document outline, current section).

**Files:**
- Create: `apps/web/src/features/editor/stores/content-mission-store.ts`

**Step 1: Create the store**

```typescript
/**
 * ContentMissionStore
 *
 * Reactive in-memory store for content mission context.
 * Hydrates from IndexedDB on mount, debounce-writes on change.
 * Every AI call reads from this for rich context injection.
 */
import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";
import {
  type ContentMission,
  DEFAULT_MISSION,
  getMission,
  saveMission,
} from "../storage/content-mission-db";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ContentMissionState {
  // Persisted (IndexedDB)
  mission: Omit<ContentMission, "contentId" | "updatedAt">;
  // Computed (live editor state)
  documentOutline: OutlineEntry[];
  currentSection: { heading: string; content: string } | null;
  fullMarkdown: string | null;
  wordCount: number;
  // Hydration state
  isHydrated: boolean;
  contentId: string | null;
}

export interface OutlineEntry {
  level: number; // 1-6
  text: string;
  position: number; // char offset
}

const INITIAL_STATE: ContentMissionState = {
  mission: { ...DEFAULT_MISSION },
  documentOutline: [],
  currentSection: null,
  fullMarkdown: null,
  wordCount: 0,
  isHydrated: false,
  contentId: null,
};

// ─── Store ─────────────────────────────────────────────────────────────────────

export const contentMissionStore = new Store<ContentMissionState>(INITIAL_STATE);

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 1000;

// ─── Actions ───────────────────────────────────────────────────────────────────

/**
 * Hydrate mission from IndexedDB for a given contentId.
 * Also seeds from frontmatter if no mission exists yet.
 */
export async function hydrateMission(
  contentId: string,
  frontmatter?: {
    title?: string;
    description?: string;
    keywords?: string[];
  },
): Promise<void> {
  contentMissionStore.setState((s) => ({
    ...s,
    contentId,
    isHydrated: false,
  }));

  const stored = await getMission(contentId);

  if (stored) {
    contentMissionStore.setState((s) => ({
      ...s,
      mission: {
        targetAudience: stored.targetAudience,
        brandVoice: stored.brandVoice,
        toneGuideline: stored.toneGuideline,
        contentType: stored.contentType,
        wordCountTarget: stored.wordCountTarget,
        targetKeywords: stored.targetKeywords,
        searchIntent: stored.searchIntent,
        customQuickActions: stored.customQuickActions,
      },
      isHydrated: true,
    }));
  } else {
    // Seed from frontmatter keywords if available
    const seeded = {
      ...DEFAULT_MISSION,
      targetKeywords: frontmatter?.keywords ?? [],
    };

    contentMissionStore.setState((s) => ({
      ...s,
      mission: seeded,
      isHydrated: true,
    }));

    // Persist the seed
    await saveMission(contentId, seeded);
  }
}

/**
 * Update mission fields. Debounce-persists to IndexedDB.
 */
export function updateMission(
  updates: Partial<Omit<ContentMission, "contentId" | "updatedAt">>,
): void {
  contentMissionStore.setState((s) => ({
    ...s,
    mission: { ...s.mission, ...updates },
  }));

  // Debounce persist
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const state = contentMissionStore.state;
    if (state.contentId) {
      saveMission(state.contentId, state.mission);
    }
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Update computed editor state (called by plugins, not persisted).
 */
export function updateEditorState(updates: {
  documentOutline?: OutlineEntry[];
  currentSection?: { heading: string; content: string } | null;
  fullMarkdown?: string | null;
  wordCount?: number;
}): void {
  contentMissionStore.setState((s) => ({
    ...s,
    ...updates,
  }));
}

/**
 * Reset store when leaving editor.
 */
export function resetMissionStore(): void {
  if (saveTimer) clearTimeout(saveTimer);
  contentMissionStore.setState(() => INITIAL_STATE);
}

/**
 * Get current snapshot for AI calls (non-reactive).
 */
export function getMissionSnapshot(): ContentMissionState {
  return contentMissionStore.state;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useMission() {
  return useStore(contentMissionStore, (s) => s.mission);
}

export function useMissionHydrated() {
  return useStore(contentMissionStore, (s) => s.isHydrated);
}

export function useDocumentOutline() {
  return useStore(contentMissionStore, (s) => s.documentOutline);
}

export function useCurrentSection() {
  return useStore(contentMissionStore, (s) => s.currentSection);
}
```

**Step 2: Commit**
```bash
git add apps/web/src/features/editor/stores/content-mission-store.ts
git commit -m "feat(editor): add ContentMissionStore with IndexedDB hydration"
```

---

## Task 3: Mission Hydration in Editor Layout

**Context:** Wire up hydration on editor mount, reset on unmount, and keep document outline + fullMarkdown updated.

**Files:**
- Modify: `apps/web/src/layout/editor/ui/editor-layout.tsx`

**Step 1: Hydrate on mount**

Import from mission store:
```typescript
import {
  hydrateMission,
  resetMissionStore,
  updateEditorState,
} from "@/features/editor/stores/content-mission-store";
```

Add hydration effect after the existing `resetEditorState` cleanup:
```typescript
// Hydrate content mission from IndexedDB
useEffect(() => {
  hydrateMission(contentId, {
    title: content.meta?.title ?? undefined,
    description: content.meta?.description ?? undefined,
    keywords: content.meta?.keywords ?? undefined,
  });

  return () => {
    resetMissionStore();
  };
}, [contentId, content.meta?.title, content.meta?.description, content.meta?.keywords]);
```

**Step 2: Update document outline + markdown on change**

In the `ContentEditor` `onChange` handler, after `saveBody(markdown)` and `setEditorDocument(markdown)`, add:
```typescript
// Update mission store with live editor state
const outline = extractOutline(markdown);
updateEditorState({
  fullMarkdown: markdown,
  wordCount: markdown.trim().split(/\s+/).filter(Boolean).length,
  documentOutline: outline,
});
```

Add a simple outline extractor above the component (or in a utils file):
```typescript
import type { OutlineEntry } from "@/features/editor/stores/content-mission-store";

function extractOutline(markdown: string): OutlineEntry[] {
  const entries: OutlineEntry[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    entries.push({
      level: match[1].length,
      text: match[2].trim(),
      position: match.index,
    });
  }

  return entries;
}
```

**Step 3: Commit**
```bash
git add apps/web/src/layout/editor/ui/editor-layout.tsx
git commit -m "feat(editor): hydrate ContentMission on mount and sync outline on change"
```

---

## Task 4: Mission Context Panel

**Context:** A panel accessible from the statusline or command palette where users configure the content mission (audience, brand voice, tone, content type, word count target, keywords). Replaces the current `EditorConfigPanel` or sits alongside it.

**Files:**
- Create: `apps/web/src/layout/editor/ui/mission-panel.tsx`
- Modify: `apps/web/src/layout/editor/hooks/use-editor-state.ts` (add mission panel toggle)
- Modify: `apps/web/src/layout/editor/ui/editor-layout.tsx` (mount panel)
- Modify: `apps/web/src/features/editor/ui/editor-statusline.tsx` (add mission indicator)

**Step 1: Create the panel**

```tsx
/**
 * MissionPanel
 *
 * Configuration panel for the content mission context.
 * Allows users to set brand voice, target audience, tone,
 * content type, word count target, and keywords.
 * Persists to IndexedDB via ContentMissionStore.
 */
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
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import { Target, X } from "lucide-react";
import { useCallback } from "react";
import {
  updateMission,
  useMission,
} from "@/features/editor/stores/content-mission-store";

interface MissionPanelProps {
  open: boolean;
  onClose: () => void;
}

const CONTENT_TYPES = [
  { value: "blog", label: "Blog Post" },
  { value: "landing", label: "Landing Page" },
  { value: "docs", label: "Documentacao" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social Media" },
  { value: "other", label: "Outro" },
] as const;

const TONE_PRESETS = [
  "Formal e profissional",
  "Casual e conversacional",
  "Tecnico e preciso",
  "Persuasivo e envolvente",
  "Educativo e claro",
  "Inspiracional e motivador",
] as const;

export function MissionPanel({ open, onClose }: MissionPanelProps) {
  const mission = useMission();

  const handleUpdate = useCallback(
    (field: string, value: unknown) => {
      updateMission({ [field]: value });
    },
    [],
  );

  if (!open) return null;

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium flex-1">Missao do Conteudo</span>
        <button
          className="p-1 rounded hover:bg-accent"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Content Type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de conteudo</Label>
          <Select
            onValueChange={(v) => handleUpdate("contentType", v)}
            value={mission.contentType ?? undefined}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Audience */}
        <div className="space-y-1.5">
          <Label className="text-xs">Publico-alvo</Label>
          <Input
            className="h-8 text-xs"
            onChange={(e) => handleUpdate("targetAudience", e.target.value)}
            placeholder="Ex: Desenvolvedores senior, Marketeiros B2B..."
            value={mission.targetAudience ?? ""}
          />
        </div>

        {/* Brand Voice */}
        <div className="space-y-1.5">
          <Label className="text-xs">Voz da marca</Label>
          <Textarea
            className="text-xs min-h-[60px] resize-none"
            onChange={(e) => handleUpdate("brandVoice", e.target.value)}
            placeholder="Descreva o estilo de escrita da sua marca..."
            rows={3}
            value={mission.brandVoice ?? ""}
          />
        </div>

        {/* Tone */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tom</Label>
          <div className="flex flex-wrap gap-1.5">
            {TONE_PRESETS.map((tone) => (
              <button
                className={cn(
                  "px-2 py-1 text-[10px] rounded-full border transition-colors",
                  mission.toneGuideline === tone
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-border",
                )}
                key={tone}
                onClick={() => handleUpdate("toneGuideline", tone)}
                type="button"
              >
                {tone}
              </button>
            ))}
          </div>
          <Input
            className="h-8 text-xs mt-1.5"
            onChange={(e) => handleUpdate("toneGuideline", e.target.value)}
            placeholder="Ou escreva um tom personalizado..."
            value={
              TONE_PRESETS.includes(mission.toneGuideline as typeof TONE_PRESETS[number])
                ? ""
                : mission.toneGuideline ?? ""
            }
          />
        </div>

        {/* Word Count Target */}
        <div className="space-y-1.5">
          <Label className="text-xs">Meta de palavras</Label>
          <Input
            className="h-8 text-xs"
            min={0}
            onChange={(e) =>
              handleUpdate("wordCountTarget", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="Ex: 1500"
            type="number"
            value={mission.wordCountTarget ?? ""}
          />
        </div>

        {/* Search Intent */}
        <div className="space-y-1.5">
          <Label className="text-xs">Intencao de busca</Label>
          <Input
            className="h-8 text-xs"
            onChange={(e) => handleUpdate("searchIntent", e.target.value)}
            placeholder="Ex: Como fazer X, O que e Y..."
            value={mission.searchIntent ?? ""}
          />
        </div>

        {/* Keywords */}
        <div className="space-y-1.5">
          <Label className="text-xs">Palavras-chave alvo</Label>
          <Input
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && !mission.targetKeywords.includes(value)) {
                  updateMission({
                    targetKeywords: [...mission.targetKeywords, value],
                  });
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
            placeholder="Digite e pressione Enter..."
          />
          {mission.targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {mission.targetKeywords.map((kw) => (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-muted"
                  key={kw}
                >
                  {kw}
                  <button
                    className="hover:text-destructive"
                    onClick={() =>
                      updateMission({
                        targetKeywords: mission.targetKeywords.filter((k) => k !== kw),
                      })
                    }
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add toggle state**

In `use-editor-state.ts`, add a `missionPanel` toggle following the existing pattern for `configPanel`:
```typescript
// Add to EditorLayoutState:
missionPanel: boolean;

// Add toggle/use functions:
export function toggleMissionPanel() { ... }
export function useMissionPanel() { ... }
```

**Step 3: Mount in `editor-layout.tsx`**

Add `<MissionPanel>` alongside the existing sidebars, toggled by `missionPanelOpen`.

**Step 4: Add statusline indicator**

In `editor-statusline.tsx`, add a `Target` icon button that shows the current mission summary (e.g., "Blog · Formal") and toggles the mission panel.

**Step 5: Commit**
```bash
git add apps/web/src/layout/editor/ui/mission-panel.tsx \
        apps/web/src/layout/editor/hooks/use-editor-state.ts \
        apps/web/src/layout/editor/ui/editor-layout.tsx \
        apps/web/src/features/editor/ui/editor-statusline.tsx
git commit -m "feat(editor): add MissionPanel for configuring content mission context"
```

---

## Task 5: Inject Mission Context into All AI Calls

**Context:** Every AI call (FIM, edit, chat) should include the content mission. Update the oRPC stream functions and the assistant-ui adapter to read from `getMissionSnapshot()`.

**Files:**
- Modify: `apps/web/src/layout/editor/hooks/use-fim-stream.ts` (FIM + edit streams)
- Modify: `apps/web/src/features/content/lib/assistant-runtime-adapter.ts` (chat stream — from Phase 1)
- Modify: `apps/web/src/features/editor/schemas.ts` (add mission context to request schemas)

**Step 1: Extend FIMRequest and EditRequest schemas**

In `schemas.ts`, add a shared mission context schema:
```typescript
export const MissionContextSchema = z.object({
  targetAudience: z.string().nullable(),
  brandVoice: z.string().nullable(),
  toneGuideline: z.string().nullable(),
  contentType: z.string().nullable(),
  targetKeywords: z.array(z.string()),
  searchIntent: z.string().nullable(),
  documentOutline: z.array(z.object({
    level: z.number(),
    text: z.string(),
  })).optional(),
  currentSection: z.object({
    heading: z.string(),
    content: z.string(),
  }).nullable().optional(),
});
export type MissionContext = z.infer<typeof MissionContextSchema>;
```

Add `missionContext: MissionContextSchema.optional()` to both `FIMRequestSchema` and `EditRequestSchema`.

**Step 2: Inject in FIM/edit stream creation**

In `use-fim-stream.ts`, update `createFIMStreamFn` and `createEditStreamFn` to read `getMissionSnapshot()` and attach the mission to every request before calling the oRPC stream.

**Step 3: Inject in chat adapter**

In the assistant-runtime-adapter (already modified in Phase 1), expand the context enrichment to include mission data:
```typescript
const missionState = getMissionSnapshot();
if (missionState.isHydrated) {
  const m = missionState.mission;
  const missionParts: string[] = [];
  if (m.brandVoice) missionParts.push(`Voz da marca: ${m.brandVoice}`);
  if (m.targetAudience) missionParts.push(`Publico-alvo: ${m.targetAudience}`);
  if (m.toneGuideline) missionParts.push(`Tom: ${m.toneGuideline}`);
  if (m.contentType) missionParts.push(`Tipo: ${m.contentType}`);
  if (m.targetKeywords.length > 0) missionParts.push(`Keywords: ${m.targetKeywords.join(", ")}`);
  if (missionParts.length > 0) {
    contextParts.push(`[MISSAO DO CONTEUDO]\n${missionParts.join("\n")}`);
  }
}
```

**Step 4: Update server-side agent procedures**

In `apps/web/src/integrations/orpc/router/agent.ts`, update `fimStream` and `editStream` handlers to pass mission context through to the LLM system prompt. The mission context shapes the AI's personality for this content piece.

**Step 5: Commit**
```bash
git add apps/web/src/features/editor/schemas.ts \
        apps/web/src/layout/editor/hooks/use-fim-stream.ts \
        apps/web/src/features/content/lib/assistant-runtime-adapter.ts \
        apps/web/src/integrations/orpc/router/agent.ts
git commit -m "feat(editor): inject ContentMission context into all AI calls (FIM, edit, chat)"
```

---

## Task 6: FIM Simplification — Kill the Panel

**Context:** Remove `FIMPanel`, `FIMPanelWrapper`, `FIMKeyboardHints`. The ghost text (`GhostTextNode`) + Tab/Escape is the entire UX. Confidence scoring still works internally — low-confidence suggestions silently don't appear.

**Files:**
- Delete: `apps/web/src/features/editor/ui/fim-panel.tsx`
- Modify: `apps/web/src/layout/editor/ui/editor-layout.tsx` (remove `FIMPanelWrapper`)
- Modify: `apps/web/src/features/editor/index.ts` (remove `FIMPanel` exports)
- Modify: `apps/web/src/features/editor/schemas.ts` (remove `FIMPosition` from `FIMStateSchema` — no longer needed for panel positioning)
- Modify: `apps/web/src/features/editor/stores/fim-store.ts` (remove position-related state/actions)
- Modify: `apps/web/src/features/editor/plugins/fim-plugin.tsx` (remove position calculation on trigger)

**Step 1: Remove FIMPanelWrapper from editor-layout.tsx**

In the `ContentEditor` children, delete:
```tsx
<FIMPanelWrapper />
```

Delete the `FIMPanelWrapper` function entirely.

Remove `FIMPanel` and `useFIMState` from imports (if no longer used elsewhere).

**Step 2: Delete fim-panel.tsx**

Remove the entire file.

**Step 3: Clean up fim-store.ts**

Remove the `position` field from the FIM state. Remove `setFIMPosition` action. The store only needs: `ghostText`, `isLoading`, `isVisible`, `confidenceScore`, `shouldShow`, `mode`, `completionId`, `chainDepth`.

**Step 4: Clean up fim-plugin.tsx**

Remove any code that calculates `position` for the now-deleted panel. The plugin should only:
1. Detect triggers → call FIM stream
2. Insert `GhostTextNode` inline
3. Handle Tab (accept) and Escape (dismiss)

**Step 5: Add first-time tooltip**

On the first FIM suggestion (check a flag in IndexedDB or `localStorage`), show a tiny fade-in tooltip near the ghost text: "Tab para aceitar sugestao". Set `contentta.fim-tooltip-shown = true` and never show again.

**Step 6: Verify the statusline still shows FIM state**

The statusline should still display "Tab para aceitar" when ghost text is visible. This is driven by the FIM store `isVisible` flag, not the panel — verify it still works.

**Step 7: Commit**
```bash
git add -A
git commit -m "feat(editor): simplify FIM to ghost-text-only — remove FIMPanel"
```

---

## Task 7: Cursor-Style Inline Prompt Bar (Ctrl+K Redesign)

**Context:** Replace the floating 400px `EditPanel` card with a slim inline prompt bar that renders inside the Lexical document flow. The bar appears at the selection point, not as a floating card.

**Files:**
- Create: `apps/web/src/features/editor/ui/inline-prompt-bar.tsx`
- Modify: `apps/web/src/features/editor/plugins/edit-plugin.tsx` (use new bar)
- Modify: `apps/web/src/layout/editor/ui/editor-layout.tsx` (swap `EditPanelWrapper`)
- Modify: `apps/web/src/features/editor/stores/edit-store.ts` (add recent instructions)

**Step 1: Create `InlinePromptBar`**

A minimal prompt bar that renders as a Lexical decorator node or portals to a position inside the editor. Design:

```
┌──────────────────────────────────────────────────────┐
│ ✨ [instruction input...........................] ⏎  │
│    Recent: "mais formal" · "expandir" · "simplificar"│
└──────────────────────────────────────────────────────┘
```

- Full width of the editor content area
- Appears between the selected text block and the next block (or below the selection)
- Input auto-focuses, Enter submits, Escape cancels
- Shows 3 most recent instructions (stored in IndexedDB via mission store's `recentInstructions`)
- No header, no "Editar com AI" label, no selected text preview (user can see the selection highlighted above)

```tsx
/**
 * InlinePromptBar
 *
 * Cursor-style inline prompt that appears inside the editor flow.
 * Minimal, focused, keyboard-driven.
 */
import { cn } from "@packages/ui/lib/utils";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface InlinePromptBarProps {
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
  recentInstructions?: string[];
  className?: string;
}

export function InlinePromptBar({
  onSubmit,
  onCancel,
  recentInstructions = [],
  className,
}: InlinePromptBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim()) onSubmit(value.trim());
    },
    [value, onSubmit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <div
      className={cn(
        "border border-primary/30 bg-background rounded-lg shadow-sm",
        "animate-in fade-in-0 slide-in-from-top-1 duration-150",
        className,
      )}
    >
      <form className="flex items-center gap-2 px-3 py-2" onSubmit={handleSubmit}>
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <input
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva a alteracao..."
          ref={inputRef}
          type="text"
          value={value}
        />
        <kbd className="text-[10px] text-muted-foreground px-1 py-0.5 bg-muted rounded">
          Enter
        </kbd>
      </form>

      {/* Recent instructions */}
      {recentInstructions.length > 0 && !value && (
        <div className="flex items-center gap-1.5 px-3 pb-2">
          <span className="text-[10px] text-muted-foreground">Recentes:</span>
          {recentInstructions.slice(0, 3).map((instr) => (
            <button
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent truncate max-w-[120px]"
              key={instr}
              onClick={() => onSubmit(instr)}
              type="button"
            >
              {instr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Store recent instructions**

In `edit-store.ts`, add a `recentInstructions: string[]` field (max 10). When an edit is accepted, push the instruction. Persist to `localStorage` (simple, no need for IndexedDB):
```typescript
const RECENT_KEY = "contentta.recent-edit-instructions";

export function addRecentInstruction(instruction: string): void {
  const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  const updated = [instruction, ...stored.filter((i) => i !== instruction)].slice(0, 10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export function getRecentInstructions(): string[] {
  return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
}
```

**Step 3: Wire into EditPlugin**

Update `EditPlugin` to render `InlinePromptBar` instead of dispatching to the external `EditPanel`. The bar position is computed relative to the selection using `getBoundingClientRect()` and rendered as a portal or absolute div inside the editor container.

**Step 4: Delete old EditPanel**

Remove `apps/web/src/features/editor/ui/edit-panel.tsx` (the floating 400px card). Remove `EditPanelWrapper` from `editor-layout.tsx`. Remove `EditSelectionHint` (the "Ctrl+K para editar com AI" hint) — the floating toolbar AI button replaces this.

**Step 5: Commit**
```bash
git add -A
git commit -m "feat(editor): Cursor-style InlinePromptBar replaces floating EditPanel"
```

---

## Task 8: Inline Diff Rendering in Lexical

**Context:** When Ctrl+K edit streams results, show the diff directly in the Lexical editor — red lines removed, green lines added. Not in a separate DiffView component.

**Files:**
- Create: `apps/web/src/features/editor/core/inline-diff-node.tsx` (custom Lexical DecoratorNode)
- Modify: `apps/web/src/features/editor/plugins/edit-plugin.tsx` (render inline diff during streaming)
- Modify: `apps/web/src/features/editor/ui/content-editor.tsx` (register node)
- Delete: `apps/web/src/features/editor/ui/diff-view.tsx` (old separate diff view)
- Modify: `apps/web/src/layout/editor/ui/editor-layout.tsx` (remove `DiffViewWrapper`)

**Step 1: Create `InlineDiffNode`**

A Lexical `DecoratorNode` that renders a diff block inline in the editor. It shows the original text with red strikethrough and the new text in green. When accepted, it replaces itself with the new text nodes. When rejected, it restores the original.

```typescript
/**
 * InlineDiffNode
 *
 * Lexical DecoratorNode that renders an inline diff directly
 * in the editor document. Shows original (red) vs modified (green)
 * with accept/reject controls.
 */
```

The node stores:
- `originalText: string`
- `modifiedText: string`
- `phase: "streaming" | "complete"`

The React decorator component renders:
```tsx
<div className="inline-diff my-1 rounded border border-border/50">
  {/* Removed lines */}
  {removedLines.map(line => (
    <div className="bg-red-500/10 text-red-700 dark:text-red-400 line-through px-2 py-0.5 text-sm">
      {line}
    </div>
  ))}
  {/* Added lines */}
  {addedLines.map(line => (
    <div className="bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 text-sm">
      {line}
    </div>
  ))}
  {/* Controls (only when complete) */}
  {phase === "complete" && (
    <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 text-xs">
      <button>Aceitar (Ctrl+Enter)</button>
      <button>Rejeitar (Esc)</button>
    </div>
  )}
</div>
```

**Step 2: Wire into EditPlugin streaming**

When Ctrl+K streaming starts:
1. Replace the selected Lexical nodes with an `InlineDiffNode` containing the original text
2. As chunks stream in, update the node's `modifiedText`
3. On complete, set phase to `"complete"`
4. On accept: remove `InlineDiffNode`, insert the modified text as regular nodes
5. On reject: remove `InlineDiffNode`, restore original nodes

**Step 3: Delete old DiffView**

Remove `diff-view.tsx` and `DiffViewWrapper` from editor-layout. Remove the `diff-store.ts` if no longer needed (or keep for chat tool preview diffs).

**Step 4: Register node**

In `content-editor.tsx`, add `InlineDiffNode` to the Lexical config's `nodes` array.

**Step 5: Commit**
```bash
git add -A
git commit -m "feat(editor): inline diff rendering in Lexical via InlineDiffNode"
```

---

## Task 9: Floating Toolbar AI Actions Dropdown

**Context:** Replace the single Sparkles button in the floating toolbar with a dropdown menu of context-aware AI quick actions.

**Files:**
- Modify: `apps/web/src/features/editor/plugins/floating-toolbar.tsx`
- Create: `apps/web/src/features/editor/ui/ai-actions-dropdown.tsx`

**Step 1: Create `AIActionsDropdown`**

```tsx
/**
 * AIActionsDropdown
 *
 * Dropdown menu of AI quick actions for the floating toolbar.
 * Actions are preset prompts that skip the Ctrl+K input and
 * go straight to streaming an inline diff.
 */
```

Default actions:
```typescript
const DEFAULT_AI_ACTIONS = [
  { id: "edit",       label: "Editar com IA",      shortcut: "Ctrl+K", type: "prompt" },
  { id: "improve",    label: "Melhorar escrita",    prompt: "Melhore a clareza e fluidez deste texto mantendo o significado original" },
  { id: "formal",     label: "Mais formal",         prompt: "Reescreva em tom mais formal e profissional" },
  { id: "casual",     label: "Mais casual",         prompt: "Reescreva em tom mais casual e conversacional" },
  { id: "expand",     label: "Expandir",            prompt: "Expanda este texto com mais detalhes e exemplos" },
  { id: "summarize",  label: "Resumir",             prompt: "Resuma este texto de forma concisa" },
  { id: "translate",  label: "Traduzir EN↔PT",      prompt: "Traduza este texto" },
  { id: "simplify",   label: "Simplificar",         prompt: "Simplifique este texto para ser mais facil de entender" },
] as const;
```

The "Editar com IA" option opens the `InlinePromptBar` (Ctrl+K flow). All others skip the prompt and immediately start streaming with the preset instruction.

Also reads `customQuickActions` from `useMission()` and appends them to the list.

**Step 2: Update floating toolbar**

Replace the single Sparkles button with:
```tsx
{showAIEdit && (
  <>
    <div className="w-px h-5 bg-border mx-1" />
    <AIActionsDropdown
      editor={editor}
      onCustomPrompt={handleAIEdit}
    />
  </>
)}
```

The dropdown trigger is a small `Sparkles ▾` button that opens a popover below the toolbar.

**Step 3: Wire preset actions to edit stream**

When a preset action is selected:
1. Read the selected text
2. Call `editStream` with `{ selectedText, instruction: preset.prompt, ... }`
3. Render inline diff (via `InlineDiffNode` from Task 8)
4. Same accept/reject flow as Ctrl+K

This reuses the same `EditPlugin` infrastructure — just skipping the prompt step.

**Step 4: Commit**
```bash
git add apps/web/src/features/editor/plugins/floating-toolbar.tsx \
        apps/web/src/features/editor/ui/ai-actions-dropdown.tsx
git commit -m "feat(editor): AI actions dropdown in floating toolbar with preset prompts"
```

---

## Task 10: Extended Slash Commands for Content Workflows

**Context:** Phase 1 added basic slash commands. Extend with content workflow commands that leverage the mission context.

**Files:**
- Modify: `apps/web/src/layout/editor/ui/enhanced-composer.tsx` (from Phase 1)

**Step 1: Add workflow commands**

Extend `SLASH_COMMANDS` with:
```typescript
const SLASH_COMMANDS = [
  // Quick actions (from Phase 1)
  { id: "melhore",  label: "/melhore",  icon: Sparkles,  description: "Melhorar texto",     prompt: "..." },
  { id: "expand",   label: "/expand",   icon: Expand,    description: "Expandir secao",     prompt: "..." },
  { id: "resumo",   label: "/resumo",   icon: Minimize,  description: "Resumir conteudo",   prompt: "..." },
  { id: "corrige",  label: "/corrige",  icon: Check,     description: "Corrigir erros",     prompt: "..." },

  // Workflow commands (new)
  { id: "outline",  label: "/outline",  icon: ListTree,  description: "Gerar estrutura do artigo",
    prompt: "Com base na missao do conteudo (topico, keywords, audiencia), gere uma estrutura completa do artigo com H2s, H3s e pontos-chave para cada secao." },
  { id: "draft",    label: "/draft",    icon: FileText,  description: "Gerar primeiro rascunho",
    prompt: "Com base no outline atual do documento, gere um primeiro rascunho completo respeitando a voz da marca e o tom definidos na missao." },
  { id: "research", label: "/research", icon: Search,    description: "Pesquisar e trazer dados",
    prompt: "Pesquise o topico deste conteudo na web, traga dados atualizados, estatisticas e citacoes relevantes para enriquecer o artigo." },
  { id: "brief",    label: "/brief",    icon: Target,    description: "Gerar content brief",
    prompt: "Analise o conteudo atual e gere um content brief completo incluindo: publico-alvo sugerido, tom recomendado, keywords principais, estrutura ideal e meta de palavras." },
  { id: "seo",      label: "/seo",      icon: BarChart,  description: "Auditoria SEO",
    prompt: "Analise o conteudo para SEO: uso de keywords, estrutura de headings, meta description, links internos, e sugira melhorias especificas." },
  { id: "translate", label: "/translate", icon: Languages, description: "Traduzir documento",
    prompt: "Traduza o documento completo mantendo formatacao e tom." },
] as const;
```

**Step 2: Inject mission context automatically for workflow commands**

When a workflow command is selected, the system automatically appends the mission context (from `getMissionSnapshot()`) to the prompt before sending. The user doesn't need to manually `@brief` — workflow commands always have full context.

**Step 3: Commit**
```bash
git add apps/web/src/layout/editor/ui/enhanced-composer.tsx
git commit -m "feat(editor): add content workflow slash commands (/outline, /draft, /research, /brief)"
```

---

## Task 11: Extended @ Mentions

**Context:** Phase 1 added `@selecao`, `@documento`, `@titulo`. Extend with richer context tokens.

**Files:**
- Modify: `apps/web/src/layout/editor/ui/enhanced-composer.tsx`
- Modify: `apps/web/src/features/content/lib/assistant-runtime-adapter.ts`

**Step 1: Add new mentions**

```typescript
const AT_MENTIONS = [
  // Phase 1
  { id: "selecao",    label: "@selecao",    icon: MousePointer, description: "Texto selecionado" },
  { id: "documento",  label: "@documento",  icon: FileText,     description: "Documento completo" },
  { id: "titulo",     label: "@titulo",     icon: Type,         description: "Titulo e metadados" },
  // Phase 2
  { id: "secao",      label: "@secao",      icon: Hash,         description: "Secao atual (heading + conteudo)" },
  { id: "outline",    label: "@outline",    icon: ListTree,     description: "Estrutura H2/H3 do documento" },
  { id: "missao",     label: "@missao",     icon: Target,       description: "Missao do conteudo (voz, tom, audiencia)" },
  { id: "seo",        label: "@seo",        icon: BarChart,     description: "Keywords e meta SEO" },
  { id: "diagnostico", label: "@diagnostico", icon: Activity,   description: "Contagem de palavras, tempo de leitura" },
] as const;
```

**Step 2: Resolve mentions in adapter**

In the assistant-runtime-adapter, resolve each `@` token:
- `@secao` → reads `currentSection` from `contentMissionStore`
- `@outline` → reads `documentOutline` and formats as indented list
- `@missao` → reads full mission (brand voice, audience, tone, keywords, etc.)
- `@seo` → reads `targetKeywords` + `searchIntent` from mission + frontmatter meta
- `@diagnostico` → reads `wordCount` from mission store + spelling error count from diagnostics store

**Step 3: Commit**
```bash
git add apps/web/src/layout/editor/ui/enhanced-composer.tsx \
        apps/web/src/features/content/lib/assistant-runtime-adapter.ts
git commit -m "feat(editor): extended @ mentions with @secao, @outline, @missao, @seo, @diagnostico"
```

---

## Task 12: Ctrl+K Works Without Selection (Generation Mode)

**Context:** Currently Ctrl+K requires selected text. In Cursor, you can press Ctrl+K with no selection to generate new content at the cursor position. Add this mode.

**Files:**
- Modify: `apps/web/src/features/editor/plugins/edit-plugin.tsx`
- Modify: `apps/web/src/features/editor/ai/edit.ts`
- Modify: `apps/web/src/features/editor/stores/edit-store.ts`

**Step 1: Update EditPlugin to allow no selection**

In `openPrompt`, remove the guard `if (!selectedText || selectedText.length < 1)`. Instead:
- If text is selected → edit mode (replace selection with diff)
- If no text selected → generation mode (insert new content at cursor)

**Step 2: Update edit store**

Add a `mode: "edit" | "generate"` field to the edit state. The `InlinePromptBar` can show a different placeholder based on mode:
- Edit: "Descreva a alteracao..."
- Generate: "O que voce quer escrever aqui?"

**Step 3: Update streaming behavior**

In generation mode:
- No inline diff needed (there's no original text)
- Stream directly into the document at the cursor position
- Use the same streaming animation from Phase 1's `useStreamingToolBridge`
- On complete, the text is already in place — just flash highlight

**Step 4: Commit**
```bash
git add apps/web/src/features/editor/plugins/edit-plugin.tsx \
        apps/web/src/features/editor/ai/edit.ts \
        apps/web/src/features/editor/stores/edit-store.ts
git commit -m "feat(editor): Ctrl+K works without selection for inline content generation"
```

---

## Task 13: Cleanup & Dead Code Removal

**Context:** After all tasks, clean up files that are no longer used.

**Files to delete (if fully replaced):**
- `apps/web/src/features/editor/ui/fim-panel.tsx` (Task 6)
- `apps/web/src/features/editor/ui/edit-panel.tsx` (Task 7)
- `apps/web/src/features/editor/ui/diff-view.tsx` (Task 8 — if fully replaced by inline diff)

**Files to clean:**
- `apps/web/src/features/editor/index.ts` — remove deleted exports
- `apps/web/src/features/editor/schemas.ts` — remove `FIMPosition` and unused schemas
- `apps/web/src/features/editor/stores/diff-store.ts` — evaluate if still needed (chat tool diffs?) or can be removed

**Step 1: Grep for all imports of deleted files**

```bash
grep -r "fim-panel\|edit-panel\|diff-view\|FIMPanel\|EditPanel\|DiffView\|EditSelectionHint" apps/ --include="*.ts" --include="*.tsx"
```

Remove or update all references.

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Fix any remaining type errors.

**Step 3: Run biome check**

```bash
bun run check
```

Fix any lint issues from the refactor.

**Step 4: Final commit**
```bash
git add -A
git commit -m "chore(editor): remove dead code from Phase 2 refactor (FIMPanel, EditPanel, DiffView)"
```

---

## Summary of Changes

### New Files
| File | Purpose |
|------|---------|
| `features/editor/storage/content-mission-db.ts` | Raw IndexedDB wrapper for ContentMission |
| `features/editor/stores/content-mission-store.ts` | Reactive TanStack Store + IndexedDB hydration |
| `layout/editor/ui/mission-panel.tsx` | UI for configuring content mission |
| `features/editor/ui/inline-prompt-bar.tsx` | Cursor-style inline prompt (Ctrl+K) |
| `features/editor/core/inline-diff-node.tsx` | Lexical DecoratorNode for inline diffs |
| `features/editor/ui/ai-actions-dropdown.tsx` | Floating toolbar AI actions dropdown |

### Modified Files
| File | Changes |
|------|---------|
| `layout/editor/ui/editor-layout.tsx` | Hydrate mission, remove FIM/Edit/Diff wrappers, add MissionPanel |
| `layout/editor/hooks/use-editor-state.ts` | Add mission panel toggle |
| `layout/editor/hooks/use-fim-stream.ts` | Inject mission context into FIM/edit requests |
| `layout/editor/ui/enhanced-composer.tsx` | Extended slash commands + @ mentions |
| `features/editor/schemas.ts` | Add MissionContext, update FIM/Edit schemas |
| `features/editor/plugins/floating-toolbar.tsx` | AI actions dropdown instead of single button |
| `features/editor/plugins/edit-plugin.tsx` | Inline prompt bar + generation mode |
| `features/editor/plugins/fim-plugin.tsx` | Remove panel positioning |
| `features/editor/stores/fim-store.ts` | Remove position state |
| `features/editor/stores/edit-store.ts` | Recent instructions, edit/generate mode |
| `features/editor/ui/editor-statusline.tsx` | Mission indicator |
| `features/editor/ui/content-editor.tsx` | Register InlineDiffNode |
| `features/editor/index.ts` | Updated exports |
| `features/content/lib/assistant-runtime-adapter.ts` | Full mission + @ mention resolution |
| `integrations/orpc/router/agent.ts` | Pass mission to LLM system prompt |

### Deleted Files
| File | Reason |
|------|--------|
| `features/editor/ui/fim-panel.tsx` | Replaced by ghost-text-only FIM |
| `features/editor/ui/edit-panel.tsx` | Replaced by InlinePromptBar |
| `features/editor/ui/diff-view.tsx` | Replaced by InlineDiffNode |

### Interaction Model After Phase 2

```
TYPING → Ghost text appears inline (Tab/Esc)
         Uses mission context (brand voice, keywords, tone)
         No panel, no confidence display, just subtle ghost text

SELECTING → Floating toolbar with [AI ▾] dropdown
            Quick actions: Improve, Formal, Casual, Expand, Summarize, Translate
            Ctrl+K: Custom instruction via InlinePromptBar
            All actions render inline diff in the document

CURSOR ONLY → Ctrl+K opens InlinePromptBar in generation mode
              "O que voce quer escrever aqui?"
              Streams new content directly at cursor

CHAT SIDEBAR → /outline, /draft, /research, /brief, /seo, /translate
               @secao, @outline, @missao, @seo, @diagnostico
               Tool cards with Apply preview
               Mission context auto-injected in every message

MISSION PANEL → Configure audience, brand voice, tone, content type
                Keywords, search intent, word count target
                Persists to IndexedDB per contentId
                Accessible from statusline
```
