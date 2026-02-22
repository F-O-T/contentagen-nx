# Editor Block Menu, Slash Commands, Caption & TOC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Slash Commands (/), Block Menu with drag-and-drop, and Table of Contents to the Plate.js editor, with AI actions integrated into both the slash menu and block menu.

**Architecture:** Four new plugin kits (slash-kit, dnd-kit, block-menu-kit, toc-kit) follow the same pattern as existing kits (ai-kit, link-kit, media-kit). Each kit is a const array of Plate plugins registered into `usePlateEditor` in `plate-editor.tsx`. The `DndProvider` (react-dnd) wraps the entire `<Plate>` tree.

**Tech Stack:** `@platejs/slash-command`, `@platejs/toc`, `@platejs/selection` (new deps in apps/web), `@platejs/dnd` + `react-dnd` + `react-dnd-html5-backend` (already installed)

---

## Context

- Editor lives at: `apps/web/src/features/editor/plate/`
- Plugins dir: `apps/web/src/features/editor/plate/plugins/`
- UI dir: `apps/web/src/features/editor/plate/ui/`
- Main editor: `apps/web/src/features/editor/plate/plate-editor.tsx`
- Existing plugins: `ai-kit.tsx`, `copilot-kit.tsx`, `link-kit.tsx`, `media-kit.tsx`
- `TocElement` already exists: `@packages/ui/components/toc-node`
- `AIChatPlugin` is already wired — AI actions use `editor.getApi(AIChatPlugin).aiChat.show()` and `.submit()`

---

## Task 1: Install Missing Packages

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Add package declarations**

Edit `apps/web/package.json` to add (keep alphabetical order with existing `@platejs/*`):
```json
"@platejs/selection": "^52.0.11",
"@platejs/slash-command": "^52.0.11",
"@platejs/toc": "^52.0.11",
```

**Step 2: Install dependencies**

```bash
bun install
```

Expected: resolves ~3 new packages, no errors.

**Step 3: Verify install**

```bash
ls node_modules/@platejs/slash-command node_modules/@platejs/toc node_modules/@platejs/selection
```

Expected: directories exist.

**Step 4: Commit**

```bash
git add apps/web/package.json bun.lock
git commit -m "chore(editor): install @platejs/slash-command, @platejs/toc, @platejs/selection"
```

---

## Task 2: TOC Plugin

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/toc-kit.tsx`

**Step 1: Create toc-kit.tsx**

```tsx
// apps/web/src/features/editor/plate/plugins/toc-kit.tsx
import { TocElement } from "@packages/ui/components/toc-node";
import { TocPlugin } from "@platejs/toc/react";

export const TocKit = [
   TocPlugin.configure({
      node: { component: TocElement },
      options: {
         topOffset: 80,
         isScroll: true,
      },
   }),
] as const;
```

**Step 2: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "toc-kit|TocPlugin|TocElement"
```

Expected: no errors for toc-kit.tsx.

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/toc-kit.tsx
git commit -m "feat(editor): add TocKit plugin (table of contents)"
```

---

## Task 3: DnD Plugin + Drag Handle Component

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/dnd-kit.tsx`
- Create: `apps/web/src/features/editor/plate/ui/drag-handle.tsx`

**Step 1: Create dnd-kit.tsx**

```tsx
// apps/web/src/features/editor/plate/plugins/dnd-kit.tsx
import { DndPlugin } from "@platejs/dnd";

export const DndKit = [
   DndPlugin.configure({
      options: { enableScroller: true },
   }),
] as const;
```

**Step 2: Create drag-handle.tsx**

This component renders a draggable wrapper around any block node. It shows the grip handle on hover and a drop line indicator during drag.

```tsx
// apps/web/src/features/editor/plate/ui/drag-handle.tsx
"use client";

import { cn } from "@packages/ui/lib/utils";
import { useDraggable, useDropLine } from "@platejs/dnd";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import type { TElement } from "platejs";
import { useEditorRef } from "platejs/react";

interface DragHandleProps {
   element: TElement;
   children: ReactNode;
   className?: string;
}

export function DragHandle({ element, children, className }: DragHandleProps) {
   const editor = useEditorRef();
   const nodeRef = useRef<HTMLDivElement>(null);
   const previewRef = useRef<HTMLDivElement>(null);

   const { isDragging, handleRef } = useDraggable({
      element,
      type: element.type,
   });

   const { dropLine } = useDropLine({ id: element.id as string });

   return (
      <div
         className={cn("relative group", isDragging && "opacity-50", className)}
         ref={previewRef}
      >
         {/* Drop line indicator */}
         {dropLine && (
            <div
               className={cn(
                  "absolute z-50 h-0.5 w-full bg-primary/40 rounded-full",
                  dropLine === "top" ? "-top-px" : "-bottom-px",
               )}
            />
         )}

         {/* Drag handle — visible on hover */}
         <div
            className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            ref={handleRef as React.RefObject<HTMLDivElement>}
         >
            <GripVertical className="size-4 text-muted-foreground" />
         </div>

         <div ref={nodeRef}>{children}</div>
      </div>
   );
}
```

**Step 3: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "dnd-kit|drag-handle|DndPlugin"
```

Expected: no errors.

**Step 4: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/dnd-kit.tsx apps/web/src/features/editor/plate/ui/drag-handle.tsx
git commit -m "feat(editor): add DndKit plugin and DragHandle component"
```

---

## Task 4: Block Context Menu

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/block-menu-kit.tsx`
- Create: `apps/web/src/features/editor/plate/ui/block-context-menu.tsx`

**Step 1: Create block-context-menu.tsx**

```tsx
// apps/web/src/features/editor/plate/ui/block-context-menu.tsx
"use client";

import {
   ContextMenu,
   ContextMenuContent,
   ContextMenuItem,
   ContextMenuSeparator,
   ContextMenuTrigger,
} from "@packages/ui/components/context-menu";
import { cn } from "@packages/ui/lib/utils";
import { AIChatPlugin } from "@platejs/ai/react";
import {
   BlockMenuPlugin,
   BlockSelectionPlugin,
} from "@platejs/selection/react";
import { Copy, Sparkles, Trash2, WandSparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useEditorPlugin, useEditorRef } from "platejs/react";

interface BlockContextMenuProps {
   children: ReactNode;
}

export function BlockContextMenu({ children }: BlockContextMenuProps) {
   const editor = useEditorRef();
   const { api: blockMenuApi } = useEditorPlugin(BlockMenuPlugin);

   const handleAIAction = (prompt: string, mode: "insert" | "replace") => {
      const aiApi = editor.getApi(AIChatPlugin);
      aiApi.aiChat.show();
      aiApi.aiChat.submit({ prompt, mode });
      blockMenuApi.blockMenu.hide();
   };

   const handleDuplicate = () => {
      editor.getApi(BlockSelectionPlugin).blockSelection.duplicate?.();
      blockMenuApi.blockMenu.hide();
   };

   const handleDelete = () => {
      editor.getApi(BlockSelectionPlugin).blockSelection.removeNodes?.();
      blockMenuApi.blockMenu.hide();
   };

   return (
      <ContextMenu>
         <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
         <ContextMenuContent className="w-48">
            <ContextMenuItem
               className="gap-2"
               onClick={handleDuplicate}
            >
               <Copy className="size-4" />
               Duplicar bloco
            </ContextMenuItem>
            <ContextMenuItem
               className="gap-2 text-destructive focus:text-destructive"
               onClick={handleDelete}
            >
               <Trash2 className="size-4" />
               Deletar bloco
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem
               className="gap-2"
               onClick={() =>
                  handleAIAction("improve the writing of this block", "replace")
               }
            >
               <Sparkles className="size-4" />
               Melhorar com IA
            </ContextMenuItem>
            <ContextMenuItem
               className="gap-2"
               onClick={() =>
                  handleAIAction(
                     "expand this block with more details and examples",
                     "insert",
                  )
               }
            >
               <WandSparkles className="size-4" />
               Expandir com IA
            </ContextMenuItem>
            <ContextMenuItem
               className="gap-2"
               onClick={() =>
                  handleAIAction(
                     "summarize this block concisely in one paragraph",
                     "replace",
                  )
               }
            >
               <WandSparkles className="size-4" />
               Resumir com IA
            </ContextMenuItem>
         </ContextMenuContent>
      </ContextMenu>
   );
}
```

**Step 2: Create block-menu-kit.tsx**

```tsx
// apps/web/src/features/editor/plate/plugins/block-menu-kit.tsx
import { BlockContextMenu } from "../ui/block-context-menu";
import {
   BlockMenuPlugin,
   BlockSelectionPlugin,
} from "@platejs/selection/react";

export const BlockMenuKit = [
   BlockSelectionPlugin.configure({
      options: { enableContextMenu: true },
   }),
   BlockMenuPlugin.configure({
      render: { aboveEditable: BlockContextMenu },
   }),
] as const;
```

**Step 3: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "block-menu-kit|block-context-menu|BlockMenuPlugin"
```

Expected: no errors.

**Step 4: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/block-menu-kit.tsx apps/web/src/features/editor/plate/ui/block-context-menu.tsx
git commit -m "feat(editor): add BlockMenuKit with context menu and AI actions"
```

---

## Task 5: Slash Command Plugin + Slash Input Component

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/slash-kit.tsx`
- Create: `apps/web/src/features/editor/plate/ui/slash-input-node.tsx`

**Step 1: Verify @platejs/slash-command API**

Check what the package exports:
```bash
cat node_modules/@platejs/slash-command/dist/react/index.d.ts | head -50
```

Look for: `SlashPlugin`, `SlashInputPlugin`, any item type interfaces. Adjust code in steps 2-3 to match actual exported types.

**Step 2: Create slash-input-node.tsx**

```tsx
// apps/web/src/features/editor/plate/ui/slash-input-node.tsx
"use client";

import {
   InlineCombobox,
   InlineComboboxContent,
   InlineComboboxEmpty,
   InlineComboboxGroup,
   InlineComboboxGroupLabel,
   InlineComboboxInput,
   InlineComboboxItem,
} from "@packages/ui/components/inline-combobox";
import { AIChatPlugin } from "@platejs/ai/react";
import { SlashInputPlugin } from "@platejs/slash-command/react";
import {
   Heading1,
   Heading2,
   Heading3,
   List,
   ListOrdered,
   ListTodo,
   Minus,
   Sparkles,
   Table,
   Text,
   WandSparkles,
} from "lucide-react";
import { KEYS } from "platejs";
import {
   PlateElement,
   type PlateElementProps,
   useEditorRef,
} from "platejs/react";

interface SlashItem {
   focusEditor?: boolean;
   group?: string;
   icon: React.ReactNode;
   keywords?: string[];
   label: string;
   value: string;
   onSelect: (editor: ReturnType<typeof useEditorRef>) => void;
}

const createSlashItems = (
   editor: ReturnType<typeof useEditorRef>,
): SlashItem[] => {
   const aiApi = editor.getApi(AIChatPlugin);

   return [
      // --- Texto ---
      {
         group: "Texto",
         icon: <Text className="size-4" />,
         keywords: ["paragraph", "parágrafo", "p"],
         label: "Parágrafo",
         onSelect: (ed) => {
            ed.tf.toggleBlock({ type: KEYS.p });
         },
         value: "paragraph",
      },
      {
         group: "Texto",
         icon: <Heading1 className="size-4" />,
         keywords: ["h1", "heading 1", "título"],
         label: "Título 1",
         onSelect: (ed) => {
            ed.tf.toggleBlock({ type: KEYS.h1 });
         },
         value: "h1",
      },
      {
         group: "Texto",
         icon: <Heading2 className="size-4" />,
         keywords: ["h2", "heading 2", "subtítulo"],
         label: "Título 2",
         onSelect: (ed) => {
            ed.tf.toggleBlock({ type: KEYS.h2 });
         },
         value: "h2",
      },
      {
         group: "Texto",
         icon: <Heading3 className="size-4" />,
         keywords: ["h3", "heading 3"],
         label: "Título 3",
         onSelect: (ed) => {
            ed.tf.toggleBlock({ type: KEYS.h3 });
         },
         value: "h3",
      },
      {
         group: "Texto",
         icon: <Minus className="size-4" />,
         keywords: ["hr", "separador", "divider", "rule"],
         label: "Separador",
         onSelect: (ed) => {
            ed.tf.insertNodes({ type: KEYS.hr, children: [{ text: "" }] });
         },
         value: "hr",
      },

      // --- Lista ---
      {
         group: "Lista",
         icon: <List className="size-4" />,
         keywords: ["ul", "bulleted", "marcadores"],
         label: "Lista com marcadores",
         onSelect: (ed) => {
            ed.tf.toggleBlock({ type: KEYS.ul });
         },
         value: "ul",
      },
      {
         group: "Lista",
         icon: <ListOrdered className="size-4" />,
         keywords: ["ol", "numbered", "numerada"],
         label: "Lista numerada",
         onSelect: (ed) => {
            ed.tf.toggleBlock({ type: KEYS.ol });
         },
         value: "ol",
      },
      {
         group: "Lista",
         icon: <ListTodo className="size-4" />,
         keywords: ["todo", "task", "checkbox", "tarefa"],
         label: "Lista de tarefas",
         onSelect: (ed) => {
            ed.tf.toggleBlock({ type: KEYS.listItem });
         },
         value: "todo",
      },

      // --- Tabela ---
      {
         group: "Avançado",
         icon: <Table className="size-4" />,
         keywords: ["table", "tabela", "grid"],
         label: "Tabela",
         onSelect: (ed) => {
            ed.tf.insertTable(
               { colCount: 3, rowCount: 2 },
               { select: true },
            );
         },
         value: "table",
      },

      // --- IA ---
      {
         group: "IA",
         icon: <Sparkles className="size-4" />,
         keywords: ["ai", "continue", "continuar"],
         label: "Continuar escrevendo",
         onSelect: () => {
            aiApi.aiChat.show();
            aiApi.aiChat.submit({
               mode: "insert",
               prompt: "continue writing from the current position",
            });
         },
         value: "ai-continue",
      },
      {
         group: "IA",
         icon: <WandSparkles className="size-4" />,
         keywords: ["ai", "improve", "melhorar"],
         label: "Melhorar parágrafo",
         onSelect: () => {
            aiApi.aiChat.show();
            aiApi.aiChat.submit({
               mode: "replace",
               prompt: "improve the writing of the current paragraph",
            });
         },
         value: "ai-improve",
      },
      {
         group: "IA",
         icon: <WandSparkles className="size-4" />,
         keywords: ["ai", "summarize", "resumir"],
         label: "Resumir seleção",
         onSelect: () => {
            aiApi.aiChat.show();
            aiApi.aiChat.submit({
               mode: "replace",
               prompt: "summarize the selected text concisely",
            });
         },
         value: "ai-summarize",
      },
   ];
};

const groups = ["Texto", "Lista", "Avançado", "IA"] as const;

export function SlashInputElement(props: PlateElementProps) {
   const editor = useEditorRef();
   const items = createSlashItems(editor);

   return (
      <PlateElement {...props} as="span">
         <InlineCombobox element={props.element} trigger="/">
            <span className="inline-block rounded-sm bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium">
               <InlineComboboxInput />
            </span>

            <InlineComboboxContent className="my-1.5">
               <InlineComboboxEmpty>Nenhum resultado encontrado</InlineComboboxEmpty>

               {groups.map((group) => {
                  const groupItems = items.filter((i) => i.group === group);
                  if (groupItems.length === 0) return null;

                  return (
                     <InlineComboboxGroup key={group}>
                        <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>
                        {groupItems.map((item) => (
                           <InlineComboboxItem
                              focusEditor={item.focusEditor ?? true}
                              key={item.value}
                              keywords={item.keywords}
                              onClick={() => item.onSelect(editor)}
                              value={item.value}
                           >
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                           </InlineComboboxItem>
                        ))}
                     </InlineComboboxGroup>
                  );
               })}
            </InlineComboboxContent>
         </InlineCombobox>
         {props.children}
      </PlateElement>
   );
}
```

> **Note:** `InlineCombobox` and its subcomponents may come from `@packages/ui/components/inline-combobox` or may need to be created. First check:
> ```bash
> ls packages/ui/src/components/ | grep inline
> ```
> If `inline-combobox.tsx` exists, use it. If not, use the combobox primitives from `@platejs/combobox` directly (see `withTriggerCombobox` docs).

**Step 3: Create slash-kit.tsx**

```tsx
// apps/web/src/features/editor/plate/plugins/slash-kit.tsx
import { KEYS } from "platejs";
import { SlashPlugin, SlashInputPlugin } from "@platejs/slash-command/react";
import { SlashInputElement } from "../ui/slash-input-node";

export const SlashKit = [
   SlashPlugin.configure({
      options: {
         trigger: "/",
         triggerPreviousCharPattern: /^\s?$/,
         // Disable slash menu inside code blocks
         triggerQuery: (editor) =>
            !editor.api.some({
               match: { type: editor.getType(KEYS.codeBlock) },
            }),
      },
   }),
   SlashInputPlugin.withComponent(SlashInputElement),
] as const;
```

**Step 4: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "slash-kit|slash-input|SlashPlugin"
```

Expected: no errors.

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/slash-kit.tsx apps/web/src/features/editor/plate/ui/slash-input-node.tsx
git commit -m "feat(editor): add SlashKit plugin with block items and AI commands"
```

---

## Task 6: Wire Up All New Plugins in plate-editor.tsx

**Files:**
- Modify: `apps/web/src/features/editor/plate/plate-editor.tsx`

**Step 1: Add imports**

Add these imports near the top (after existing plugin imports at lines 43-46):

```tsx
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BlockMenuKit } from "./plugins/block-menu-kit";
import { DndKit } from "./plugins/dnd-kit";
import { SlashKit } from "./plugins/slash-kit";
import { TocKit } from "./plugins/toc-kit";
```

**Step 2: Register plugins in usePlateEditor**

Add the new kits at the end of the plugins array (around line 238):

```tsx
const editor = usePlateEditor({
   plugins: [
      BasicBlocksPlugin,
      BasicMarksPlugin,
      ...LinkKit,
      ...AIKit,
      ...CopilotKit,
      ...CommentKit,
      ...SuggestionKit,
      ...DiscussionKit,
      ...MediaKit,
      // --- NEW ---
      ...DndKit,
      ...BlockMenuKit,
      ...SlashKit,
      ...TocKit,
   ],
   value: initialValue,
});
```

**Step 3: Wrap with DndProvider**

The `DndProvider` must wrap the entire `<Plate>` component (it needs to be outside `<Plate>`). Wrap the return value of `PlateEditor`:

```tsx
return (
   <UploadFileProvider value={uploadFile}>
      <DndProvider backend={HTML5Backend}>
         <Plate
            editor={editor}
            onValueChange={onChange ? ({ value }) => onChange(value) : undefined}
            readOnly={!editable}
         >
            {/* ... existing children unchanged ... */}
         </Plate>
      </DndProvider>
   </UploadFileProvider>
);
```

**Step 4: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "plate-editor|DndProvider|SlashKit|TocKit|BlockMenuKit|DndKit"
```

Expected: no errors.

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/plate/plate-editor.tsx
git commit -m "feat(editor): wire up DnD, BlockMenu, SlashCommands, and TOC plugins"
```

---

## Task 7: Smoke Test in Browser

**Steps:**

1. Start dev server: `bun dev`
2. Open a content page in the editor
3. Verify slash commands:
   - Place cursor at beginning of a blank line
   - Type `/` — menu should appear
   - Type `h1` — should filter to "Título 1"
   - Press Enter — should insert H1 block
   - Type `/ia` — should show AI section with "Continuar escrevendo" etc.
4. Verify block menu:
   - Right-click any block
   - Context menu should appear with "Duplicar bloco", "Deletar bloco", "Melhorar com IA", "Expandir com IA", "Resumir com IA"
5. Verify drag-and-drop:
   - Hover over a block — grip icon should appear on the left
   - Drag block to a different position
6. Verify TOC:
   - Type `/índice` or `/toc` in the slash menu
   - TOC element should be inserted and auto-populate with headings

---

## Error Handling Notes

### If `InlineCombobox` doesn't exist in `@packages/ui`

Check if it was installed by Plate.js CLI:
```bash
ls packages/ui/src/components/ | grep inline
```

If missing, the simplest fallback is to build `SlashInputElement` using raw Plate combobox primitives. Look at how `@platejs/combobox`'s `withTriggerCombobox` is used and build the element inline.

### If `BlockMenuPlugin.render.aboveEditable` API has changed

Check the actual API:
```bash
grep -A10 "BlockMenuConfig\|aboveEditable\|BlockMenuPlugin.configure" node_modules/@platejs/selection/dist/react/index.d.ts
```

Adjust `block-menu-kit.tsx` accordingly.

### If `SlashPlugin` / `SlashInputPlugin` exports differ

After installing `@platejs/slash-command`, verify exact exports:
```bash
cat node_modules/@platejs/slash-command/dist/react/index.d.ts | grep "export"
```

Adjust imports in `slash-kit.tsx` accordingly.

### TypeScript errors on `editor.tf.toggleBlock`

If `toggleBlock` with type string doesn't typecheck, use the string type directly:
```ts
ed.tf.toggleBlock(KEYS.h1);  // or { type: "h1" }
```

Check the Plate.js v52 `tf.toggleBlock` signature.
