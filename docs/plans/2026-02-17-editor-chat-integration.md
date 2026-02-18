# Editor-Chat Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the AI chat sidebar and Lexical editor feel like one connected tool — with bidirectional context flow, live streaming text insertion, tool UI rendering fixed, and slash/@ command support.

**Architecture:** A shared `EditorContextStore` bridges selection state from Lexical to the chat adapter. A new `useStreamingToolBridge` replaces the broken tool execution bridge, animating text insertion on `tool_call_start` and highlighting on `tool_call_complete`. Tool UIs are fixed by replacing the non-functional `toolName: "*"` wildcard with `MessagePrimitive.Content`'s `Override` prop. Slash and @ commands are added via a custom `EnhancedComposer` wrapper.

**Tech Stack:** `@assistant-ui/react` v0.12.10, Lexical, TanStack Store, React, TypeScript, Tailwind CSS

---

## Task 1: Fix Tool UI Rendering

**Context:** `makeAssistantToolUI({ toolName: "*" })` stores the render function under the literal key `"*"` in assistant-ui's tools registry. Lookup is `state.tools["insertText"]` → `undefined`. Nothing renders. Fix: pass `components={{ tools: { Override: ... } }}` to `<MessagePrimitive.Content />`.

**Files:**
- Modify: `apps/web/src/layout/editor/ui/assistant-chat-sidebar.tsx`
- Delete logic from: `apps/web/src/layout/editor/lib/tool-ui-registry.tsx`

**Step 1: Update `CustomAssistantMessage` to pass tool Override**

In `assistant-chat-sidebar.tsx`, change every `<MessagePrimitive.Content />` to:

```tsx
import {
  isEditorTool,
  isFrontmatterTool,
  isResearchTool,
  isSEOTool,
} from "@/features/content/lib/assistant-runtime-adapter";
import { EditorToolCard } from "../chat/tool-cards/editor-tool-card";
import { FrontmatterToolCard } from "../chat/tool-cards/frontmatter-tool-card";
import { ResearchToolCard } from "../chat/tool-cards/research-tool-card";
import { SeoToolCard } from "../chat/tool-cards/seo-tool-card";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { ToolStatus } from "../chat/tool-cards/tool-card-base";

function ToolCallOverride({ toolName, args, result, status }: ToolCallMessagePartProps) {
  const toolStatus: ToolStatus =
    status.type === "complete" ? "complete"
    : status.type === "running" ? "running"
    : "error";
  const resolvedArgs = args as Record<string, unknown>;

  if (isEditorTool(toolName))
    return <EditorToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;
  if (isFrontmatterTool(toolName))
    return <FrontmatterToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;
  if (isResearchTool(toolName))
    return <ResearchToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;
  if (isSEOTool(toolName))
    return <SeoToolCard toolName={toolName} args={resolvedArgs} result={result} status={toolStatus} />;

  return (
    <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="font-medium text-sm mb-2">{toolName}</div>
      <pre className="text-xs text-muted-foreground p-2 rounded bg-muted overflow-x-auto">
        {JSON.stringify(args, null, 2)}
      </pre>
      {result !== undefined && (
        <pre className="mt-2 text-xs text-muted-foreground p-2 rounded bg-muted overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

Then replace all `<MessagePrimitive.Content />` in `CustomAssistantMessage` with:
```tsx
<MessagePrimitive.Content
  components={{ tools: { Override: ToolCallOverride } }}
/>
```

**Step 2: Remove TOOL_UIS from `tool-ui-registry.tsx` and sidebar**

In `tool-ui-registry.tsx`, remove `ContenttaToolUI` and `TOOL_UIS` exports entirely (they're no longer needed).

In `assistant-chat-sidebar.tsx`, remove:
```tsx
import { TOOL_UIS } from "../lib/tool-ui-registry";
// and remove the TOOL_UIS.map block inside ThreadPrimitive.Root
```

**Step 3: Verify manually**

Run `bun dev` and open the editor. Send a message that triggers a tool call. Confirm the tool card now renders in the chat sidebar.

**Step 4: Commit**
```bash
git add apps/web/src/layout/editor/ui/assistant-chat-sidebar.tsx \
        apps/web/src/layout/editor/lib/tool-ui-registry.tsx
git commit -m "fix(editor): fix tool UI rendering — replace wildcard makeAssistantToolUI with MessagePrimitive Override"
```

---

## Task 2: Fix Tool Execution Bridge (deprecated API)

**Context:** `useToolExecutionBridge` uses `useThread` which is deprecated in assistant-ui v0.12 and the message format may have changed. Update to `useAuiState` and verify the bridge correctly detects tool call parts with results.

**Files:**
- Modify: `apps/web/src/layout/editor/hooks/use-tool-execution-bridge.ts`

**Step 1: Update imports and hook**

Replace `useThread` with `useAuiState`:

```typescript
import { useAuiState } from "@assistant-ui/react";
// Remove: import { useThread } from "@assistant-ui/react";
```

Replace:
```typescript
const messages = useThread((state) => state.messages);
```
With:
```typescript
const messages = useAuiState((s) => s.thread.messages);
```

**Step 2: Verify tool execution runs**

Open editor, send a message that triggers `insertText` tool. Open browser console — confirm `[ToolBridge] Executing editor tool: insertText` log appears and text is inserted into the Lexical editor.

**Step 3: Commit**
```bash
git add apps/web/src/layout/editor/hooks/use-tool-execution-bridge.ts
git commit -m "fix(editor): update tool execution bridge to use non-deprecated useAuiState"
```

---

## Task 3: Editor Context Store

**Context:** New store that tracks selection state from Lexical so the chat adapter can inject it into agent calls.

**Files:**
- Create: `apps/web/src/layout/editor/stores/editor-context-store.ts`

**Step 1: Create the store**

```typescript
/**
 * EditorContextStore
 *
 * Tracks editor selection state for injection into chat agent calls.
 * Updated by SelectionContextPlugin inside the Lexical editor.
 */
import { Store } from "@tanstack/store";

interface EditorContextState {
  selectedText: string | null;
  cursorParagraph: string | null;
  documentMarkdown: string | null;
}

export const editorContextStore = new Store<EditorContextState>({
  selectedText: null,
  cursorParagraph: null,
  documentMarkdown: null,
});

export function setEditorSelection(selectedText: string | null, cursorParagraph: string | null) {
  editorContextStore.setState((s) => ({ ...s, selectedText, cursorParagraph }));
}

export function setEditorDocument(documentMarkdown: string | null) {
  editorContextStore.setState((s) => ({ ...s, documentMarkdown }));
}

export function getEditorContext(): EditorContextState {
  return editorContextStore.state;
}
```

**Step 2: Commit**
```bash
git add apps/web/src/layout/editor/stores/editor-context-store.ts
git commit -m "feat(editor): add EditorContextStore for selection-to-chat context flow"
```

---

## Task 4: Selection Context Plugin (Lexical)

**Context:** A Lexical plugin that listens to selection changes and updates `EditorContextStore`. Mounted inside `ContentEditor`.

**Files:**
- Create: `apps/web/src/features/editor/plugins/selection-context-plugin.tsx`
- Modify: `apps/web/src/features/editor/ui/content-editor.tsx`
- Modify: `apps/web/src/features/editor/index.ts`

**Step 1: Create the plugin**

```tsx
/**
 * SelectionContextPlugin
 *
 * Listens to Lexical selection changes and syncs selected text +
 * cursor paragraph to EditorContextStore for use in chat context.
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { SELECTION_CHANGE_COMMAND, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from "lexical";
import { $getNearestNodeOfType } from "@lexical/utils";
import { HeadingNode } from "@lexical/rich-text";
import { useEffect } from "react";
import { setEditorSelection } from "@/layout/editor/stores/editor-context-store";

export function SelectionContextPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            setEditorSelection(null, null);
            return;
          }

          const selectedText = selection.getTextContent().trim();

          // Get the paragraph/block the cursor is in
          const anchorNode = selection.anchor.getNode();
          const topNode = anchorNode.getTopLevelElement();
          const cursorParagraph = topNode?.getTextContent().trim() ?? null;

          setEditorSelection(
            selectedText.length > 0 ? selectedText : null,
            cursorParagraph,
          );
        });
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}
```

**Step 2: Mount plugin in `ContentEditor`**

In `content-editor.tsx`, add `SelectionContextPlugin` to the list of plugins inside `LexicalComposer`. Import it at the top of the file.

**Step 3: Export from feature index**

In `apps/web/src/features/editor/index.ts`, add:
```typescript
export { SelectionContextPlugin } from "./plugins/selection-context-plugin";
```

**Step 4: Commit**
```bash
git add apps/web/src/features/editor/plugins/selection-context-plugin.tsx \
        apps/web/src/features/editor/ui/content-editor.tsx \
        apps/web/src/features/editor/index.ts
git commit -m "feat(editor): add SelectionContextPlugin to sync selection state to EditorContextStore"
```

---

## Task 5: Inject Context into Agent Calls

**Context:** Update `createContenttaAdapter` to read from `EditorContextStore` before each agent call and append selection/document context to the user message.

**Files:**
- Modify: `apps/web/src/features/content/lib/assistant-runtime-adapter.ts`

**Step 1: Update the adapter**

Import `getEditorContext`:
```typescript
import { getEditorContext } from "@/layout/editor/stores/editor-context-store";
```

Inside the `run` function, after extracting `messageText`, build enriched message:

```typescript
const messageText = extractMessageText(lastMessage);

// Enrich with editor context
const editorCtx = getEditorContext();
const contextParts: string[] = [];

if (editorCtx.selectedText) {
  contextParts.push(`[TEXTO SELECIONADO]\n${editorCtx.selectedText}`);
}

const enrichedMessage = contextParts.length > 0
  ? `${messageText}\n\n${contextParts.join("\n\n")}`
  : messageText;

// Call ORPC chatStream
const stream = await client.agent.chatStream({
  message: enrichedMessage,
  contentId,
});
```

**Step 2: Verify**

Select text in editor, open chat, send "melhore isso". Open browser network tab and confirm the `chatStream` request body contains `[TEXTO SELECIONADO]` with the selected text.

**Step 3: Commit**
```bash
git add apps/web/src/features/content/lib/assistant-runtime-adapter.ts
git commit -m "feat(editor): inject selected text into agent calls from EditorContextStore"
```

---

## Task 6: Selection Banner in Chat Composer

**Context:** When text is selected in the editor, show a small dismissable banner above the composer indicating context is being used.

**Files:**
- Modify: `apps/web/src/layout/editor/ui/assistant-chat-sidebar.tsx`

**Step 1: Add selection banner**

Import `useStore` from `@tanstack/react-store` and `editorContextStore`:
```typescript
import { useStore } from "@tanstack/react-store";
import { editorContextStore } from "../stores/editor-context-store";
```

Add above the `<ComposerPrimitive.Root>` in `AssistantChatSidebar`:

```tsx
{/* Selection context banner */}
{selectedText && (
  <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary/5 border-t border-primary/20 text-primary">
    <span className="size-1.5 rounded-full bg-primary shrink-0" />
    <span className="flex-1 truncate">
      Usando seleção: "{selectedText.slice(0, 50)}{selectedText.length > 50 ? "…" : ""}"
    </span>
  </div>
)}
```

Where `selectedText` comes from:
```typescript
const selectedText = useStore(editorContextStore, (s) => s.selectedText);
```

**Step 2: Commit**
```bash
git add apps/web/src/layout/editor/ui/assistant-chat-sidebar.tsx
git commit -m "feat(editor): show selection context banner in chat composer"
```

---

## Task 7: Streaming Text Animation + Highlight on Completion

**Context:** When `insertText` or `replaceText` tool_call_start fires, animate text character by character into Lexical. When tool_call_complete fires, flash-highlight the inserted range.

**Files:**
- Create: `apps/web/src/layout/editor/hooks/use-streaming-tool-bridge.ts`
- Modify: `apps/web/src/layout/editor/ui/editor-layout.tsx` (swap bridge hooks)
- Modify: `apps/web/src/features/editor/ui/content-editor.tsx` (add AI insert highlight CSS)

**Step 1: Create `use-streaming-tool-bridge.ts`**

```typescript
/**
 * useStreamingToolBridge
 *
 * Improved tool execution bridge that:
 * 1. Animates text insertion char-by-char on tool_call_start
 * 2. Flashes a green highlight on tool_call_complete
 * 3. Uses non-deprecated useAuiState API
 */
import { useAuiState } from "@assistant-ui/react";
import type { LexicalEditor } from "lexical";
import { $createTextNode, $getRoot } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import {
  isEditorTool,
  isFrontmatterTool,
} from "@/features/content/lib/assistant-runtime-adapter";
import { executeEditorTool } from "@/features/editor";

const ANIMATION_CHARS_PER_TICK = 10;
const ANIMATION_INTERVAL_MS = 30;
const HIGHLIGHT_DURATION_MS = 1500;

// Tools that animate text insertion
const STREAMING_TOOLS = new Set(["insertText", "insertHeading", "insertList"]);

interface UseStreamingToolBridgeOptions {
  editor: LexicalEditor | null;
  onFrontmatterUpdate?: (updates: {
    title?: string;
    description?: string;
    slug?: string;
    keywords?: string[];
  }) => void;
  autoExecute?: boolean;
}

export function useStreamingToolBridge({
  editor,
  onFrontmatterUpdate,
  autoExecute = true,
}: UseStreamingToolBridgeOptions) {
  const executedTools = useRef(new Set<string>());
  const animationRefs = useRef(new Map<string, ReturnType<typeof setInterval>>());

  const messages = useAuiState((s) => s.thread.messages);

  // Animate text insertion char-by-char into editor
  const animateTextInsertion = useCallback(
    (toolCallId: string, text: string) => {
      if (!editor) return;
      if (animationRefs.current.has(toolCallId)) return; // already animating

      let charIndex = 0;

      const interval = setInterval(() => {
        const chunk = text.slice(
          charIndex,
          charIndex + ANIMATION_CHARS_PER_TICK,
        );
        charIndex += ANIMATION_CHARS_PER_TICK;

        if (chunk) {
          editor.update(() => {
            const root = $getRoot();
            const lastChild = root.getLastChild();
            if (lastChild) {
              const textNode = $createTextNode(chunk);
              lastChild.append(textNode);
            }
          });
        }

        if (charIndex >= text.length) {
          clearInterval(interval);
          animationRefs.current.delete(toolCallId);
        }
      }, ANIMATION_INTERVAL_MS);

      animationRefs.current.set(toolCallId, interval);
    },
    [editor],
  );

  // Flash highlight on completed insertion
  const flashHighlight = useCallback(() => {
    if (!editor) return;
    editor.update(() => {
      const root = $getRoot();
      const lastChild = root.getLastChild();
      if (!lastChild) return;

      // Add temporary highlight class via DOM
      const key = lastChild.getKey();
      const domElement = editor.getElementByKey(key);
      if (domElement) {
        domElement.classList.add("ai-inserted");
        setTimeout(() => {
          domElement.classList.remove("ai-inserted");
        }, HIGHLIGHT_DURATION_MS);
      }
    });
  }, [editor]);

  const executeFrontmatter = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      if (!onFrontmatterUpdate) return;
      const updates: Parameters<NonNullable<typeof onFrontmatterUpdate>>[0] = {};
      switch (toolName) {
        case "editTitle":
          if (typeof args.title === "string") updates.title = args.title;
          break;
        case "editDescription":
          if (typeof args.description === "string") updates.description = args.description;
          break;
        case "editSlug":
          if (typeof args.slug === "string") updates.slug = args.slug;
          break;
        case "editKeywords":
          if (Array.isArray(args.keywords)) updates.keywords = args.keywords as string[];
          break;
      }
      if (Object.keys(updates).length > 0) onFrontmatterUpdate(updates);
    },
    [onFrontmatterUpdate],
  );

  useEffect(() => {
    if (!autoExecute) return;

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      const content = message.content;
      if (!Array.isArray(content)) continue;

      for (const part of content) {
        if (part.type !== "tool-call") continue;

        const toolPart = part as {
          toolCallId: string;
          toolName: string;
          args: Record<string, unknown>;
          result?: unknown;
        };
        const { toolCallId, toolName, args, result } = toolPart;

        if (executedTools.current.has(toolCallId)) continue;

        // For streaming tools: start animation on tool_call_start (result undefined = still running)
        if (
          result === undefined &&
          STREAMING_TOOLS.has(toolName) &&
          isEditorTool(toolName) &&
          typeof args.text === "string"
        ) {
          animateTextInsertion(toolCallId, args.text);
          continue;
        }

        if (result === undefined) continue;

        // Stop any running animation for this tool
        const runningInterval = animationRefs.current.get(toolCallId);
        if (runningInterval) {
          clearInterval(runningInterval);
          animationRefs.current.delete(toolCallId);
        }

        executedTools.current.add(toolCallId);

        if (isEditorTool(toolName) && editor) {
          // Only execute non-streaming tools via executeEditorTool
          // (streaming tools were already animated above)
          if (!STREAMING_TOOLS.has(toolName)) {
            executeEditorTool(editor, {
              id: toolCallId,
              name: toolName,
              args,
            });
          }
          flashHighlight();
        } else if (isFrontmatterTool(toolName)) {
          executeFrontmatter(toolName, args);
        }
      }
    }
  }, [messages, autoExecute, editor, animateTextInsertion, flashHighlight, executeFrontmatter]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      for (const interval of animationRefs.current.values()) {
        clearInterval(interval);
      }
      executedTools.current.clear();
    };
  }, []);
}
```

**Step 2: Add highlight CSS**

In the global CSS file (check `apps/web/src/index.css` or `apps/web/src/app.css`), add:

```css
/* AI inserted text highlight animation */
@keyframes ai-insert-flash {
  0%   { background-color: hsl(142 76% 36% / 0.25); }
  100% { background-color: transparent; }
}

.ai-inserted {
  animation: ai-insert-flash 1.5s ease-out forwards;
  border-radius: 2px;
}
```

**Step 3: Swap bridge in `editor-layout.tsx`**

Replace the import:
```typescript
// Remove:
import { useToolExecutionBridge } from "../hooks/use-tool-execution-bridge";
// Add:
import { useStreamingToolBridge } from "../hooks/use-streaming-tool-bridge";
```

In `ToolExecutionBridgeWrapper`, call `useStreamingToolBridge` instead of `useToolExecutionBridge`.

**Step 4: Verify manually**

Run `bun dev`. Open editor, send a message that triggers `insertText`. Confirm:
- Text appears animated in the editor during generation
- Text flashes green when done

**Step 5: Commit**
```bash
git add apps/web/src/layout/editor/hooks/use-streaming-tool-bridge.ts \
        apps/web/src/layout/editor/ui/editor-layout.tsx \
        apps/web/src/index.css
git commit -m "feat(editor): animate text insertion with streaming bridge + green flash on completion"
```

---

## Task 8: Enhanced Composer with Slash Commands

**Context:** When user types `/` as the first character in the composer, show a floating popover with predefined commands. Selecting a command pre-fills and sends the message.

**Files:**
- Create: `apps/web/src/layout/editor/ui/enhanced-composer.tsx`
- Modify: `apps/web/src/layout/editor/ui/assistant-chat-sidebar.tsx`

**Step 1: Create `enhanced-composer.tsx`**

```tsx
/**
 * EnhancedComposer
 *
 * Wraps ComposerPrimitive.Input to add:
 * - Slash commands (/) — pre-filled action prompts
 * - @ mentions — context injection tokens
 */
import { ComposerPrimitive, useComposer } from "@assistant-ui/react";
import { useStore } from "@tanstack/react-store";
import { cn } from "@packages/ui/lib/utils";
import { useRef, useState, useCallback } from "react";
import { editorContextStore } from "../stores/editor-context-store";

// ─── Slash Commands ────────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { id: "melhore",  label: "/melhore",  description: "Melhorar texto",        prompt: "Melhore a qualidade e clareza deste texto:" },
  { id: "expand",   label: "/expand",   description: "Expandir seção",        prompt: "Expanda esta seção com mais detalhes:" },
  { id: "resumo",   label: "/resumo",   description: "Resumir conteúdo",      prompt: "Faça um resumo conciso deste conteúdo:" },
  { id: "seo",      label: "/seo",      description: "Otimizar para SEO",     prompt: "Otimize este conteúdo para SEO mantendo a naturalidade:" },
  { id: "pesquise", label: "/pesquise", description: "Pesquisar tema",        prompt: "Pesquise e traga informações atualizadas sobre:" },
  { id: "corrige",  label: "/corrige",  description: "Corrigir erros",        prompt: "Corrija erros gramaticais e ortográficos:" },
] as const;

// ─── @ Mentions ────────────────────────────────────────────────────────────────

const AT_MENTIONS = [
  { id: "selecao",   label: "@selecao",   description: "Texto selecionado"  },
  { id: "documento", label: "@documento", description: "Documento completo" },
  { id: "titulo",    label: "@titulo",    description: "Título e metadados" },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────────

interface EnhancedComposerProps {
  className?: string;
}

export function EnhancedComposer({ className }: EnhancedComposerProps) {
  const composer = useComposer();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [atOpen, setAtOpen] = useState(false);
  const [filterText, setFilterText] = useState("");

  const selectedText = useStore(editorContextStore, (s) => s.selectedText);
  const documentMarkdown = useStore(editorContextStore, (s) => s.documentMarkdown);

  const filteredSlash = SLASH_COMMANDS.filter((c) =>
    c.id.startsWith(filterText.toLowerCase()),
  );
  const filteredAt = AT_MENTIONS.filter((c) =>
    c.id.startsWith(filterText.toLowerCase()),
  );

  const handleChange = useCallback(
    (value: string) => {
      // Detect slash command at start
      if (value.startsWith("/")) {
        setSlashOpen(true);
        setAtOpen(false);
        setFilterText(value.slice(1));
        return;
      }

      // Detect @ mention
      const lastAt = value.lastIndexOf("@");
      if (lastAt !== -1) {
        const afterAt = value.slice(lastAt + 1);
        if (!/\s/.test(afterAt)) {
          setAtOpen(true);
          setSlashOpen(false);
          setFilterText(afterAt);
          return;
        }
      }

      setSlashOpen(false);
      setAtOpen(false);
      setFilterText("");
    },
    [],
  );

  const selectSlashCommand = useCallback(
    (prompt: string) => {
      composer.setText(prompt + " ");
      setSlashOpen(false);
      inputRef.current?.focus();
    },
    [composer],
  );

  const selectAtMention = useCallback(
    (mentionId: string) => {
      const current = composer.text ?? "";
      const lastAt = current.lastIndexOf("@");
      const before = current.slice(0, lastAt);

      let resolved = "";
      switch (mentionId) {
        case "selecao":
          resolved = selectedText ? `[seleção: "${selectedText.slice(0, 100)}"]` : "[seleção vazia]";
          break;
        case "documento":
          resolved = documentMarkdown ? `[documento completo incluído]` : "[documento vazio]";
          break;
        case "titulo":
          resolved = "[título e metadados]";
          break;
      }

      composer.setText(`${before}${resolved} `);
      setAtOpen(false);
      inputRef.current?.focus();
    },
    [composer, selectedText, documentMarkdown],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSlashOpen(false);
        setAtOpen(false);
      }
    },
    [],
  );

  return (
    <div className="relative">
      {/* Slash command popover */}
      {slashOpen && filteredSlash.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-lg shadow-md overflow-hidden z-50">
          {filteredSlash.map((cmd) => (
            <button
              key={cmd.id}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
              onMouseDown={(e) => { e.preventDefault(); selectSlashCommand(cmd.prompt); }}
              type="button"
            >
              <span className="font-mono text-primary font-medium w-24 shrink-0">{cmd.label}</span>
              <span className="text-muted-foreground">{cmd.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* @ mention popover */}
      {atOpen && filteredAt.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-lg shadow-md overflow-hidden z-50">
          {filteredAt.map((mention) => (
            <button
              key={mention.id}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
              onMouseDown={(e) => { e.preventDefault(); selectAtMention(mention.id); }}
              type="button"
            >
              <span className="font-mono text-blue-500 font-medium w-28 shrink-0">{mention.label}</span>
              <span className="text-muted-foreground">{mention.description}</span>
            </button>
          ))}
        </div>
      )}

      <ComposerPrimitive.Input
        ref={inputRef}
        className={cn(
          "flex-1 px-3 py-2 text-sm rounded-lg resize-none",
          "bg-muted border-none",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "min-h-[60px] max-h-[120px]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        onValueChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte algo, use / para comandos ou @ para contexto"
      />
    </div>
  );
}
```

**Step 2: Check `useComposer` API in installed version**

```bash
grep -r "useComposer\|setText" /home/yorizel/Documents/contentta-nx/node_modules/@assistant-ui/react/dist --include="*.d.ts" | head -10
```

If `setText` isn't available, use `useThreadRuntime` and `runtime.composer.setText()` instead, or control the value via a local `useState` and pass it as `value` to `ComposerPrimitive.Input`.

**Step 3: Swap in `assistant-chat-sidebar.tsx`**

Replace the `<ComposerPrimitive.Input ... />` block inside `<ComposerPrimitive.Root>` with:
```tsx
import { EnhancedComposer } from "./enhanced-composer";

// Inside ComposerPrimitive.Root:
<EnhancedComposer className="flex-1" />
```

**Step 4: Verify**

Open chat, type `/`. Confirm popover appears with command list. Select `/melhore` and confirm the prompt is pre-filled. Type `@`, confirm mention popover appears.

**Step 5: Commit**
```bash
git add apps/web/src/layout/editor/ui/enhanced-composer.tsx \
        apps/web/src/layout/editor/ui/assistant-chat-sidebar.tsx
git commit -m "feat(editor): add slash commands and @ mentions to chat composer"
```

---

## Task 9: Document Context Update

**Context:** Keep `EditorContextStore.documentMarkdown` updated whenever the editor content changes, so `@documento` can inject it.

**Files:**
- Modify: `apps/web/src/layout/editor/ui/editor-layout.tsx`

**Step 1: Update `onChange` handler**

Import `setEditorDocument` from the store:
```typescript
import { setEditorDocument } from "../stores/editor-context-store";
```

Inside `ContentEditor`'s `onChange` prop, after `saveBody(markdown)`:
```typescript
onChange={(_, editor) => {
  editor.read(() => {
    const markdown = getEditorMarkdown(editor);
    saveBody(markdown);
    setEditorDocument(markdown); // ← add this
  });
}}
```

**Step 2: Resolve `@documento` in adapter**

In `createContenttaAdapter`, expand the context enrichment from Task 5:
```typescript
if (editorCtx.selectedText) {
  contextParts.push(`[TEXTO SELECIONADO]\n${editorCtx.selectedText}`);
}

// Only inject full doc if message contains the resolved @documento token
if (messageText.includes("[documento completo incluído]") && editorCtx.documentMarkdown) {
  contextParts.push(`[DOCUMENTO COMPLETO]\n${editorCtx.documentMarkdown}`);
}
```

**Step 3: Commit**
```bash
git add apps/web/src/layout/editor/ui/editor-layout.tsx \
        apps/web/src/features/content/lib/assistant-runtime-adapter.ts
git commit -m "feat(editor): sync document markdown to EditorContextStore and resolve @documento in adapter"
```

---

## Task 10: Cleanup + Polish

**Files:**
- Delete: `apps/web/src/layout/editor/hooks/use-tool-execution-bridge.ts` (replaced by streaming bridge)

**Step 1: Remove old bridge file**
```bash
rm apps/web/src/layout/editor/hooks/use-tool-execution-bridge.ts
```

Verify no other file imports `use-tool-execution-bridge`. Search:
```bash
grep -r "use-tool-execution-bridge" apps/ --include="*.ts" --include="*.tsx"
```

**Step 2: Remove `tool-ui-registry.tsx` if now empty/unused**

Check if the file still exports anything needed. If only `TOOL_UIS` was exported and that's removed, delete it too:
```bash
grep -r "tool-ui-registry" apps/ --include="*.ts" --include="*.tsx"
```

**Step 3: Final verify**

Run `bun run typecheck` to confirm no TypeScript errors.

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck
```

**Step 4: Final commit**
```bash
git add -A
git commit -m "chore(editor): remove deprecated tool-execution-bridge and unused tool-ui-registry"
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `layout/editor/ui/assistant-chat-sidebar.tsx` | Fix tool UI via Override; add selection banner; swap composer |
| `layout/editor/lib/tool-ui-registry.tsx` | Remove (replaced by inline Override) |
| `layout/editor/hooks/use-tool-execution-bridge.ts` | Remove (replaced) |
| `layout/editor/hooks/use-streaming-tool-bridge.ts` | **New** — streaming animation + highlight |
| `layout/editor/stores/editor-context-store.ts` | **New** — selection/document context store |
| `layout/editor/ui/enhanced-composer.tsx` | **New** — slash + @ commands |
| `layout/editor/ui/editor-layout.tsx` | Swap bridge; sync document to store |
| `features/editor/plugins/selection-context-plugin.tsx` | **New** — Lexical selection listener |
| `features/editor/ui/content-editor.tsx` | Mount SelectionContextPlugin |
| `features/editor/index.ts` | Export new plugin |
| `features/content/lib/assistant-runtime-adapter.ts` | Inject editor context into agent calls |
| `apps/web/src/index.css` | Add `ai-inserted` flash animation |
