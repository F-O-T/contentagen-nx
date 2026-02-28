# Agentic UI Tool Components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic "Ferramenta usada: X" collapsible with domain-aware tool cards that visually narrate the AI workflow — research, writing, SEO, review — as it happens.

**Architecture:** Register named `ToolCallMessagePartComponent` implementations per tool name (or tool group) in `MessagePrimitive.Parts`. Each component knows its domain semantics and shows a tailored card (icon + label + context excerpt). A shared `TOOL_DISPLAY_CONFIG` map provides icon + label for the generic fallback too, so even unregistered tools get a friendly name.

**Tech Stack:** `@assistant-ui/react` (`ToolCallMessagePartComponent`, `MessagePrimitive.Parts`), `lucide-react`, Tailwind CSS, existing `ToolFallback` primitives (`ToolFallbackRoot`, `ToolFallbackTrigger`, etc.)

---

## Context

### File locations

- Thread: `apps/web/src/features/teco-chat/ui/thread.tsx` — `MessagePrimitive.Parts` at line ~398
- Tool fallback: `packages/ui/src/components/assistant-ui/tool-fallback.tsx` — exports `ToolFallback` + its sub-components
- New files go in: `apps/web/src/features/teco-chat/ui/tool-components/`

### Tool name reference

Tool names below are the **object keys** used in each agent's `tools: {}` definition — these are what `toolName` will be in the component props.

**Agent sub-calls (network routing):**
- `agent-research-agent`, `agent-writer-agent`, `agent-seo-auditor-agent`, `agent-reviewer-agent`, `agent-content-agent`

**Writer agent tools:**
- Editor: `insertText`, `replaceText`, `deleteText`, `formatText`, `insertHeading`, `insertList`, `insertCodeBlock`, `insertTable`
- Frontmatter: `editTitle`, `editDescription`, `editKeywords`, `editSlug`
- Review: `addEditorComment`, `proposeSuggestion`
- Memory: `getInstructionMemories`
- Utility: `dateTool`

**Research agent tools:**
- Research: `webSearch`, `serpAnalysis`, `competitorContent`, `contentGap`, `relatedKeywords`, `factFinder`, `webCrawl`, `researchCompleteness`
- RAG: `searchPreviousContent`, `graphSearch`
- Frontmatter (same as writer): `editTitle`, `editDescription`, `editKeywords`, `editSlug`

**SEO Auditor tools:**
- Analysis: `seoScore`, `readability`, `keywordDensity`, `contentStructure`, `badPatterns`, `titleMeta`, `quickAnswerAnalysis`, `imageSeo`, `linkDensity`, `duplicateContent`, `toneAnalysis`, `citation`, `originality`
- SEO editor: `optimizeTitle`, `optimizeMeta`, `injectKeywords`, `addInternalLinks`, `addExternalLinks`, `improveReadability`, `generateQuickAnswer`

**Reviewer tools:**
- Analysis: `contentStructure`, `citation`, `originality`, `toneAnalysis`, `readability`, `badPatterns`, `duplicateContent`
- Edit: `addEditorComment`, `proposeSuggestion`, `replaceText`

### `ToolCallMessagePartComponent` signature
```tsx
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";

const MyTool: ToolCallMessagePartComponent = ({ toolName, argsText, result, status }) => {
  // status.type: "running" | "complete" | "incomplete" | "requires-action"
  return <div>...</div>;
};
```

### How to register named tools in thread.tsx
```tsx
<MessagePrimitive.Parts
  components={{
    Text: MarkdownText,
    tools: {
      Fallback: ToolFallback,
      "agent-research-agent": AgentCallTool,
      insertText: EditorTool,
      // etc.
    },
  }}
/>
```

---

## Task 1: Tool Display Config

**Files:**
- Create: `apps/web/src/features/teco-chat/ui/tool-components/tool-display-config.ts`

**Step 1: Create the config file**

```ts
import {
  BookOpen,
  Bot,
  ChartBar,
  CheckCircle,
  Code,
  FileText,
  Globe,
  Hash,
  Key,
  Link,
  List,
  MessageSquare,
  PenLine,
  Search,
  Sparkles,
  Table,
  Tag,
  Type,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory =
  | "agent"
  | "editor"
  | "frontmatter"
  | "research"
  | "seo"
  | "analysis"
  | "memory"
  | "utility";

export interface ToolDisplayConfig {
  icon: LucideIcon;
  label: string;
  category: ToolCategory;
}

export const TOOL_DISPLAY_CONFIG: Record<string, ToolDisplayConfig> = {
  // ── Agent sub-calls ──────────────────────────────────────────────
  "agent-research-agent": {
    icon: Search,
    label: "Research & Planning Agent",
    category: "agent",
  },
  "agent-writer-agent": {
    icon: PenLine,
    label: "Writer & Editor Agent",
    category: "agent",
  },
  "agent-seo-auditor-agent": {
    icon: ChartBar,
    label: "SEO Auditor Agent",
    category: "agent",
  },
  "agent-reviewer-agent": {
    icon: CheckCircle,
    label: "Content Reviewer Agent",
    category: "agent",
  },
  "agent-content-agent": {
    icon: Bot,
    label: "Content Agent",
    category: "agent",
  },

  // ── Editor tools ─────────────────────────────────────────────────
  insertText: { icon: PenLine, label: "Inserindo texto", category: "editor" },
  replaceText: { icon: Wand2, label: "Substituindo texto", category: "editor" },
  deleteText: { icon: PenLine, label: "Removendo texto", category: "editor" },
  formatText: { icon: Type, label: "Formatando texto", category: "editor" },
  insertHeading: { icon: Hash, label: "Inserindo título", category: "editor" },
  insertList: { icon: List, label: "Inserindo lista", category: "editor" },
  insertCodeBlock: { icon: Code, label: "Inserindo código", category: "editor" },
  insertTable: { icon: Table, label: "Inserindo tabela", category: "editor" },
  addEditorComment: { icon: MessageSquare, label: "Adicionando comentário", category: "editor" },
  proposeSuggestion: { icon: Sparkles, label: "Propondo sugestão", category: "editor" },

  // ── Frontmatter tools ────────────────────────────────────────────
  editTitle: { icon: Type, label: "Definindo título", category: "frontmatter" },
  editDescription: { icon: FileText, label: "Definindo descrição", category: "frontmatter" },
  editKeywords: { icon: Tag, label: "Definindo palavras-chave", category: "frontmatter" },
  editSlug: { icon: Link, label: "Definindo slug", category: "frontmatter" },

  // ── Research tools ───────────────────────────────────────────────
  webSearch: { icon: Globe, label: "Buscando na web", category: "research" },
  serpAnalysis: { icon: ChartBar, label: "Analisando SERP", category: "research" },
  competitorContent: { icon: BookOpen, label: "Analisando concorrentes", category: "research" },
  contentGap: { icon: Search, label: "Identificando lacunas", category: "research" },
  relatedKeywords: { icon: Key, label: "Pesquisando palavras-chave", category: "research" },
  factFinder: { icon: Search, label: "Verificando dados", category: "research" },
  webCrawl: { icon: Globe, label: "Analisando página", category: "research" },
  researchCompleteness: { icon: CheckCircle, label: "Validando pesquisa", category: "research" },
  searchPreviousContent: { icon: BookOpen, label: "Verificando conteúdo existente", category: "memory" },
  graphSearch: { icon: Search, label: "Buscando conhecimento", category: "memory" },

  // ── SEO editor tools ─────────────────────────────────────────────
  optimizeTitle: { icon: Type, label: "Otimizando título", category: "seo" },
  optimizeMeta: { icon: FileText, label: "Otimizando meta", category: "seo" },
  injectKeywords: { icon: Key, label: "Inserindo palavras-chave", category: "seo" },
  addInternalLinks: { icon: Link, label: "Adicionando links internos", category: "seo" },
  addExternalLinks: { icon: Globe, label: "Adicionando links externos", category: "seo" },
  improveReadability: { icon: BookOpen, label: "Melhorando legibilidade", category: "seo" },
  generateQuickAnswer: { icon: Sparkles, label: "Gerando resposta rápida", category: "seo" },

  // ── Analysis tools ───────────────────────────────────────────────
  seoScore: { icon: ChartBar, label: "Calculando score SEO", category: "analysis" },
  readability: { icon: BookOpen, label: "Analisando legibilidade", category: "analysis" },
  keywordDensity: { icon: Key, label: "Analisando densidade", category: "analysis" },
  contentStructure: { icon: List, label: "Analisando estrutura", category: "analysis" },
  badPatterns: { icon: Search, label: "Detectando padrões", category: "analysis" },
  titleMeta: { icon: Type, label: "Auditando título/meta", category: "analysis" },
  quickAnswerAnalysis: { icon: Sparkles, label: "Analisando snippet", category: "analysis" },
  imageSeo: { icon: Search, label: "Auditando imagens", category: "analysis" },
  linkDensity: { icon: Link, label: "Analisando links", category: "analysis" },
  duplicateContent: { icon: FileText, label: "Verificando duplicatas", category: "analysis" },
  toneAnalysis: { icon: MessageSquare, label: "Analisando tom", category: "analysis" },
  citation: { icon: BookOpen, label: "Verificando citações", category: "analysis" },
  originality: { icon: Sparkles, label: "Verificando originalidade", category: "analysis" },

  // ── Memory & Utility ─────────────────────────────────────────────
  getInstructionMemories: { icon: BookOpen, label: "Carregando preferências", category: "memory" },
  dateTool: { icon: FileText, label: "Obtendo data atual", category: "utility" },
};

export function getToolDisplay(toolName: string): ToolDisplayConfig | null {
  return TOOL_DISPLAY_CONFIG[toolName] ?? null;
}
```

**Step 2: Typecheck**
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "(error|tool-display-config)" | head -20
```
Expected: no errors from tool-display-config.ts

**Step 3: Commit**
```bash
git add apps/web/src/features/teco-chat/ui/tool-components/tool-display-config.ts
git commit -m "feat(teco-chat): add tool display config with icons and labels for all agent tools"
```

---

## Task 2: Agent Call Tool Component

This component handles `agent-*` tool names. It shows which specialist agent is being called, with a clear running/complete state.

**Files:**
- Create: `apps/web/src/features/teco-chat/ui/tool-components/agent-call-tool.tsx`

**Step 1: Create the component**

```tsx
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { AlertCircleIcon, CheckIcon, LoaderIcon, XCircleIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

const AgentCallToolImpl: ToolCallMessagePartComponent = ({ toolName, status }) => {
  const config = getToolDisplay(toolName);
  const Icon = config?.icon;
  const label = config?.label ?? toolName;

  const statusType = status?.type ?? "complete";
  const isRunning = statusType === "running";
  const isCancelled = status?.type === "incomplete" && status.reason === "cancelled";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
        isRunning && "border-primary/20 bg-primary/5",
        !isRunning && !isCancelled && "border-border bg-muted/30",
        isCancelled && "border-muted-foreground/20 bg-muted/20 opacity-60",
      )}
    >
      {/* Agent icon */}
      {Icon && (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            isRunning && "bg-primary/10 text-primary",
            !isRunning && !isCancelled && "bg-muted text-muted-foreground",
            isCancelled && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      )}

      {/* Label */}
      <div className="relative min-w-0 grow">
        <span
          className={cn(
            "font-medium",
            isCancelled && "line-through text-muted-foreground",
          )}
        >
          {label}
        </span>
        {isRunning && (
          <span
            aria-hidden
            className="shimmer pointer-events-none absolute inset-0 font-medium motion-reduce:animate-none"
          >
            {label}
          </span>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {isRunning && (
          <LoaderIcon className="size-4 animate-spin text-primary" />
        )}
        {statusType === "complete" && !isCancelled && (
          <CheckIcon className="size-4 text-muted-foreground" />
        )}
        {isCancelled && (
          <XCircleIcon className="size-4 text-muted-foreground" />
        )}
        {status?.type === "incomplete" && !isCancelled && (
          <AlertCircleIcon className="size-4 text-destructive" />
        )}
      </div>
    </div>
  );
};

export const AgentCallTool = memo(
  AgentCallToolImpl,
) as ToolCallMessagePartComponent;

AgentCallTool.displayName = "AgentCallTool";
```

**Step 2: Typecheck**
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "(error|agent-call-tool)" | head -20
```
Expected: no errors

**Step 3: Commit**
```bash
git add apps/web/src/features/teco-chat/ui/tool-components/agent-call-tool.tsx
git commit -m "feat(teco-chat): add AgentCallTool component for agent sub-calls"
```

---

## Task 3: Editor Tool Component

Handles `insertText`, `replaceText`, `deleteText`, `formatText`, `insertHeading`, `insertList`, `insertCodeBlock`, `insertTable`, `addEditorComment`, `proposeSuggestion`.

Shows a compact card with a preview of what's being written/changed.

**Files:**
- Create: `apps/web/src/features/teco-chat/ui/tool-components/editor-tool.tsx`

**Step 1: Create the component**

```tsx
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, LoaderIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

/**
 * Extract a short preview string from the tool args JSON.
 * For insertText: first 60 chars of args.text
 * For replaceText: first 60 chars of args.replaceWith
 * For others with text/content: first 60 chars of that field
 */
function extractPreview(argsText: string | undefined): string | null {
  if (!argsText) return null;
  try {
    const args = JSON.parse(argsText) as Record<string, unknown>;
    const text =
      typeof args.text === "string"
        ? args.text
        : typeof args.replaceWith === "string"
          ? args.replaceWith
          : typeof args.content === "string"
            ? args.content
            : typeof args.comment === "string"
              ? args.comment
              : typeof args.suggestion === "string"
                ? args.suggestion
                : null;
    if (!text) return null;
    const clean = text.replace(/#+\s*/g, "").replace(/\n+/g, " ").trim();
    return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean;
  } catch {
    return null;
  }
}

const EditorToolImpl: ToolCallMessagePartComponent = ({ toolName, argsText, status }) => {
  const config = getToolDisplay(toolName);
  const Icon = config?.icon;
  const label = config?.label ?? toolName;
  const preview = extractPreview(argsText);

  const isRunning = status?.type === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        isRunning && "border-primary/20 bg-primary/5",
        !isRunning && "border-border bg-muted/20",
      )}
    >
      {/* Status/icon */}
      {isRunning ? (
        <LoaderIcon className="size-3.5 shrink-0 animate-spin text-primary" />
      ) : (
        Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      )}

      {/* Label */}
      <span className={cn("shrink-0 font-medium", isRunning && "text-primary")}>
        {label}
      </span>

      {/* Preview */}
      {preview && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="min-w-0 truncate text-muted-foreground">{preview}</span>
        </>
      )}

      {/* Done checkmark */}
      {status?.type === "complete" && (
        <CheckIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
};

export const EditorTool = memo(EditorToolImpl) as ToolCallMessagePartComponent;
EditorTool.displayName = "EditorTool";
```

**Step 2: Typecheck**
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "(error|editor-tool)" | head -20
```
Expected: no errors

**Step 3: Commit**
```bash
git add apps/web/src/features/teco-chat/ui/tool-components/editor-tool.tsx
git commit -m "feat(teco-chat): add EditorTool component for write/edit operations"
```

---

## Task 4: Research Tool Component

Handles all research and analysis tools: `webSearch`, `serpAnalysis`, `competitorContent`, `contentGap`, `relatedKeywords`, `factFinder`, `webCrawl`, `researchCompleteness`, `searchPreviousContent`, `graphSearch`, and all analysis tools from SEO auditor and reviewer (`seoScore`, `readability`, `keywordDensity`, etc.).

**Files:**
- Create: `apps/web/src/features/teco-chat/ui/tool-components/research-tool.tsx`

**Step 1: Create the component**

```tsx
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, LoaderIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

/**
 * Extract a short query/subject string from tool args JSON.
 * Tries common field names: query, keyword, url, topic, text
 */
function extractSubject(argsText: string | undefined): string | null {
  if (!argsText) return null;
  try {
    const args = JSON.parse(argsText) as Record<string, unknown>;
    const value =
      typeof args.query === "string"
        ? args.query
        : typeof args.keyword === "string"
          ? args.keyword
          : typeof args.url === "string"
            ? args.url
            : typeof args.topic === "string"
              ? args.topic
              : typeof args.text === "string"
                ? args.text
                : null;
    if (!value) return null;
    return value.length > 50 ? `${value.slice(0, 50)}…` : value;
  } catch {
    return null;
  }
}

const ResearchToolImpl: ToolCallMessagePartComponent = ({ toolName, argsText, status }) => {
  const config = getToolDisplay(toolName);
  const Icon = config?.icon;
  const label = config?.label ?? toolName;
  const subject = extractSubject(argsText);

  const isRunning = status?.type === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        isRunning && "border-amber-500/20 bg-amber-500/5",
        !isRunning && "border-border bg-muted/20",
      )}
    >
      {/* Status/icon */}
      {isRunning ? (
        <LoaderIcon className="size-3.5 shrink-0 animate-spin text-amber-600" />
      ) : (
        Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      )}

      {/* Label */}
      <span className={cn("shrink-0 font-medium", isRunning && "text-amber-600 dark:text-amber-500")}>
        {label}
      </span>

      {/* Subject/query preview */}
      {subject && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="min-w-0 truncate text-muted-foreground italic">{subject}</span>
        </>
      )}

      {/* Done checkmark */}
      {status?.type === "complete" && (
        <CheckIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
};

export const ResearchTool = memo(ResearchToolImpl) as ToolCallMessagePartComponent;
ResearchTool.displayName = "ResearchTool";
```

**Step 2: Typecheck**
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "(error|research-tool)" | head -20
```
Expected: no errors

**Step 3: Commit**
```bash
git add apps/web/src/features/teco-chat/ui/tool-components/research-tool.tsx
git commit -m "feat(teco-chat): add ResearchTool component for research and analysis operations"
```

---

## Task 5: Update ToolFallback to Use Config Labels

When a tool has no named component registered, the generic `ToolFallback` still shows the raw key (e.g., `"getInstructionMemories"`). Update it to use `getToolDisplay` for a friendly label when available.

**Files:**
- Modify: `packages/ui/src/components/assistant-ui/tool-fallback.tsx`

**Problem:** `ToolFallback` is in `packages/ui` which cannot import from `apps/web`. The display config must move to or be duplicated in a shared location. Since the config is purely data (no React), put a minimal version in `packages/ui`.

**Step 1: Create a minimal display config in packages/ui**

Create: `packages/ui/src/components/assistant-ui/tool-display-labels.ts`

```ts
/**
 * Minimal tool name → human-readable label map for the generic ToolFallback.
 * The full config (with icons) lives in apps/web for domain-specific components.
 */
export const TOOL_DISPLAY_LABELS: Record<string, string> = {
  // Agent sub-calls
  "agent-research-agent": "Research & Planning Agent",
  "agent-writer-agent": "Writer & Editor Agent",
  "agent-seo-auditor-agent": "SEO Auditor Agent",
  "agent-reviewer-agent": "Content Reviewer Agent",
  "agent-content-agent": "Content Agent",
  // Editor
  insertText: "Inserindo texto",
  replaceText: "Substituindo texto",
  deleteText: "Removendo texto",
  formatText: "Formatando texto",
  insertHeading: "Inserindo título",
  insertList: "Inserindo lista",
  insertCodeBlock: "Inserindo código",
  insertTable: "Inserindo tabela",
  addEditorComment: "Adicionando comentário",
  proposeSuggestion: "Propondo sugestão",
  // Frontmatter
  editTitle: "Definindo título",
  editDescription: "Definindo descrição",
  editKeywords: "Definindo palavras-chave",
  editSlug: "Definindo slug",
  // Research
  webSearch: "Buscando na web",
  serpAnalysis: "Analisando SERP",
  competitorContent: "Analisando concorrentes",
  contentGap: "Identificando lacunas",
  relatedKeywords: "Pesquisando palavras-chave",
  factFinder: "Verificando dados",
  webCrawl: "Analisando página",
  researchCompleteness: "Validando pesquisa",
  searchPreviousContent: "Verificando conteúdo existente",
  graphSearch: "Buscando conhecimento",
  // SEO editor
  optimizeTitle: "Otimizando título",
  optimizeMeta: "Otimizando meta",
  injectKeywords: "Inserindo palavras-chave",
  addInternalLinks: "Adicionando links internos",
  addExternalLinks: "Adicionando links externos",
  improveReadability: "Melhorando legibilidade",
  generateQuickAnswer: "Gerando resposta rápida",
  // Analysis
  seoScore: "Calculando score SEO",
  readability: "Analisando legibilidade",
  keywordDensity: "Analisando densidade",
  contentStructure: "Analisando estrutura",
  badPatterns: "Detectando padrões",
  titleMeta: "Auditando título/meta",
  quickAnswerAnalysis: "Analisando snippet",
  imageSeo: "Auditando imagens",
  linkDensity: "Analisando links",
  duplicateContent: "Verificando duplicatas",
  toneAnalysis: "Analisando tom",
  citation: "Verificando citações",
  originality: "Verificando originalidade",
  // Memory & Utility
  getInstructionMemories: "Carregando preferências",
  dateTool: "Obtendo data atual",
};
```

**Step 2: Update ToolFallbackTrigger to use the label map**

In `packages/ui/src/components/assistant-ui/tool-fallback.tsx`, update `ToolFallbackTrigger`:

```tsx
// Add import at top
import { TOOL_DISPLAY_LABELS } from "./tool-display-labels";

// In ToolFallbackTrigger, change the label display:
// Before:
//   {label}: <b>{toolName}</b>
// After:
const displayName = TOOL_DISPLAY_LABELS[toolName] ?? toolName;
// Then use `displayName` instead of `toolName` in the JSX:
//   {label}: <b>{displayName}</b>
```

Specific diff for `ToolFallbackTrigger` function (find the two places that render `{toolName}` and replace with `{displayName}`):

```tsx
function ToolFallbackTrigger({
  toolName,
  status,
  className,
  ...props
}: React.ComponentProps<typeof CollapsibleTrigger> & {
  toolName: string;
  status?: ToolCallMessagePartStatus;
}) {
  const statusType = status?.type ?? "complete";
  const isRunning = statusType === "running";
  const isCancelled =
    status?.type === "incomplete" && status.reason === "cancelled";

  const Icon = statusIconMap[statusType];
  const label = isCancelled ? "Ferramenta cancelada" : "Ferramenta usada";
  const displayName = TOOL_DISPLAY_LABELS[toolName] ?? toolName; // ← NEW

  return (
    <CollapsibleTrigger
      className={cn(
        "aui-tool-fallback-trigger group/trigger flex w-full items-center gap-2 px-4 text-sm transition-colors",
        className,
      )}
      data-slot="tool-fallback-trigger"
      {...props}
    >
      <Icon
        className={cn(
          "aui-tool-fallback-trigger-icon size-4 shrink-0",
          isCancelled && "text-muted-foreground",
          isRunning && "animate-spin",
        )}
        data-slot="tool-fallback-trigger-icon"
      />
      <span
        className={cn(
          "aui-tool-fallback-trigger-label-wrapper relative inline-block grow text-left leading-none",
          isCancelled && "text-muted-foreground line-through",
        )}
        data-slot="tool-fallback-trigger-label"
      >
        <span>
          {label}: <b>{displayName}</b>  {/* ← was toolName */}
        </span>
        {isRunning && (
          <span
            aria-hidden
            className="aui-tool-fallback-trigger-shimmer shimmer pointer-events-none absolute inset-0 motion-reduce:animate-none"
            data-slot="tool-fallback-trigger-shimmer"
          >
            {label}: <b>{displayName}</b>  {/* ← was toolName */}
          </span>
        )}
      </span>
      <ChevronDownIcon
        className={cn(
          "aui-tool-fallback-trigger-chevron size-4 shrink-0",
          "transition-transform duration-(--animation-duration) ease-out",
          "group-data-[state=closed]/trigger:-rotate-90",
          "group-data-[state=open]/trigger:rotate-0",
        )}
        data-slot="tool-fallback-trigger-chevron"
      />
    </CollapsibleTrigger>
  );
}
```

**Step 3: Typecheck**
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep -E "(error|tool-fallback)" | head -20
```
Expected: no errors

**Step 4: Commit**
```bash
git add packages/ui/src/components/assistant-ui/tool-display-labels.ts
git add packages/ui/src/components/assistant-ui/tool-fallback.tsx
git commit -m "feat(ui): use friendly display labels in ToolFallback trigger"
```

---

## Task 6: Register Named Tool Components in thread.tsx

Wire everything up. Register `AgentCallTool` for all `agent-*` names, `EditorTool` for all editor/frontmatter tools, and `ResearchTool` for all research/analysis tools.

**Files:**
- Modify: `apps/web/src/features/teco-chat/ui/thread.tsx`

**Step 1: Add imports**

At the top of `thread.tsx`, add:
```tsx
import { AgentCallTool } from "./tool-components/agent-call-tool";
import { EditorTool } from "./tool-components/editor-tool";
import { ResearchTool } from "./tool-components/research-tool";
```

**Step 2: Replace the tools prop in MessagePrimitive.Parts**

Find the current `MessagePrimitive.Parts` call (around line 398):
```tsx
<MessagePrimitive.Parts
  components={{
    Text: MarkdownText,
    tools: { Fallback: ToolFallback },
  }}
/>
```

Replace with:
```tsx
<MessagePrimitive.Parts
  components={{
    Text: MarkdownText,
    tools: {
      Fallback: ToolFallback,
      // Agent sub-calls
      "agent-research-agent": AgentCallTool,
      "agent-writer-agent": AgentCallTool,
      "agent-seo-auditor-agent": AgentCallTool,
      "agent-reviewer-agent": AgentCallTool,
      "agent-content-agent": AgentCallTool,
      // Editor tools
      insertText: EditorTool,
      replaceText: EditorTool,
      deleteText: EditorTool,
      formatText: EditorTool,
      insertHeading: EditorTool,
      insertList: EditorTool,
      insertCodeBlock: EditorTool,
      insertTable: EditorTool,
      addEditorComment: EditorTool,
      proposeSuggestion: EditorTool,
      // Frontmatter tools
      editTitle: EditorTool,
      editDescription: EditorTool,
      editKeywords: EditorTool,
      editSlug: EditorTool,
      // Research tools
      webSearch: ResearchTool,
      serpAnalysis: ResearchTool,
      competitorContent: ResearchTool,
      contentGap: ResearchTool,
      relatedKeywords: ResearchTool,
      factFinder: ResearchTool,
      webCrawl: ResearchTool,
      researchCompleteness: ResearchTool,
      searchPreviousContent: ResearchTool,
      graphSearch: ResearchTool,
      // Analysis tools (SEO auditor + reviewer)
      seoScore: ResearchTool,
      readability: ResearchTool,
      keywordDensity: ResearchTool,
      contentStructure: ResearchTool,
      badPatterns: ResearchTool,
      titleMeta: ResearchTool,
      quickAnswerAnalysis: ResearchTool,
      imageSeo: ResearchTool,
      linkDensity: ResearchTool,
      duplicateContent: ResearchTool,
      toneAnalysis: ResearchTool,
      citation: ResearchTool,
      originality: ResearchTool,
      // SEO editor tools
      optimizeTitle: EditorTool,
      optimizeMeta: EditorTool,
      injectKeywords: EditorTool,
      addInternalLinks: EditorTool,
      addExternalLinks: EditorTool,
      improveReadability: EditorTool,
      generateQuickAnswer: EditorTool,
    },
  }}
/>
```

**Step 3: Typecheck**
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "error" | head -20
```
Expected: no errors

**Step 4: Final typecheck of entire project**
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | tail -5
```
Expected: clean (0 errors)

**Step 5: Commit**
```bash
git add apps/web/src/features/teco-chat/ui/thread.tsx
git commit -m "feat(teco-chat): register named tool components for all agent tools in MessagePrimitive.Parts"
```

---

## Verification

After all tasks are done, start the dev server and trigger a content generation workflow. You should see:

1. **Research phase**: amber-tinted compact cards like `🔍 Buscando na web · "licitações públicas"`, `📊 Analisando SERP · "..."`
2. **Writing phase**: blue-tinted compact cards like `✏️ Inserindo texto · "## O que são licitações..."`, `🏷️ Definindo título`
3. **Review/SEO phase**: amber analysis cards + blue editor cards from fixes applied
4. **Agent sub-calls** (network path): larger cards with rounded icon + agent name + spinner/checkmark

For the workflow path, there are NO agent-* sub-call cards (steps call agents directly, not via the network tool) — only the individual tool cards from each agent appear.

```bash
bun dev
# Navigate to editor → open context panel → trigger content creation workflow
# Watch the tool cards appear in sequence
```
