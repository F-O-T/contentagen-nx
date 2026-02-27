# ContextPanel Composition Primitives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add PostHog-style composition primitives (`ContextPanel`, `ContextPanelHeader`, `ContextPanelTitle`, `ContextPanelHeaderActions`, `ContextPanelContent`, `ContextPanelFooter`) to `@packages/ui` and migrate all existing ContextPanel callers to the new pattern.

**Architecture:** New primitives live in `packages/ui/src/components/context-panel.tsx` as plain styled divs (same pattern as `sidebar.tsx` — `data-slot` + `cn()`). The `ContextPanelSection` helper (title-based) is removed from `context-panel-info.tsx` and replaced by the composable header. All 4 caller sites are migrated mechanically.

**Tech Stack:** React, Tailwind CSS, `cn()` from `@packages/ui/lib/utils`, TanStack Router (`useNavigate`, `useParams`), Lucide React (`ArrowUpRight`)

---

## Key facts before starting

- `packages/ui/package.json` has wildcard `"./components/*"` export — **no package.json change needed**; the new file is auto-exported.
- `apps/web/src/features/context-panel/context-panel.tsx` already has `overflow-hidden` on `SidebarContent`, but wraps content in an extra `<div className="h-full rounded-b-xl bg-muted">`. The fix is to remove that wrapper and move its classes to `SidebarContent` directly.
- There are **two different things** named `ContextPanelHeaderActions`:
  - OLD: `apps/web/src/features/context-panel/context-panel-header-actions.tsx` — top-bar buttons (AI + panel toggle). Do NOT touch.
  - NEW: primitive in `packages/ui/src/components/context-panel.tsx` — used inside tab content.
- The `ChatContent` function in `context-panel.tsx` needs `useNavigate` + `useParams` from TanStack Router (same pattern already used in `teco-chat-tab.tsx`).
- After migrating callers, `ContextPanelSection` import is removed from each file, and `ContextPanelSection` is removed from `context-panel-info.tsx`.

---

## Task 1: Create the primitive component file

**Files:**
- Create: `packages/ui/src/components/context-panel.tsx`

**Step 1: Create the file with all 6 primitives**

```tsx
import { cn } from "@packages/ui/lib/utils";
import type React from "react";

function ContextPanel({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex h-full min-h-0 flex-col", className)}
			data-slot="context-panel"
			{...props}
		/>
	);
}

function ContextPanelHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex shrink-0 items-center gap-2 border-b px-3 py-2",
				className,
			)}
			data-slot="context-panel-header"
			{...props}
		/>
	);
}

function ContextPanelTitle({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex-1 text-sm font-semibold", className)}
			data-slot="context-panel-title"
			{...props}
		/>
	);
}

function ContextPanelHeaderActions({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex items-center gap-1", className)}
			data-slot="context-panel-header-actions"
			{...props}
		/>
	);
}

function ContextPanelContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex min-h-0 flex-1 flex-col overflow-auto", className)}
			data-slot="context-panel-content"
			{...props}
		/>
	);
}

function ContextPanelFooter({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex shrink-0 flex-col border-t p-2", className)}
			data-slot="context-panel-footer"
			{...props}
		/>
	);
}

export {
	ContextPanel,
	ContextPanelContent,
	ContextPanelFooter,
	ContextPanelHeader,
	ContextPanelHeaderActions,
	ContextPanelTitle,
};
```

**Step 2: Verify TypeScript compiles**

```bash
bun run typecheck 2>&1 | head -30
```

Expected: no errors in `packages/ui/src/components/context-panel.tsx`

**Step 3: Commit**

```bash
git add packages/ui/src/components/context-panel.tsx
git commit -m "feat(ui): add ContextPanel composition primitives"
```

---

## Task 2: Update `context-panel.tsx` — InfoContent, ChatContent, SidebarContent

**Files:**
- Modify: `apps/web/src/features/context-panel/context-panel.tsx`

**Step 1: Read the full current file** (already read — line-by-line reference below)

Current state:
- Line 1: `"use client";`
- Lines 3–16: imports
- Lines 28–34: `CHAT_TAB` with `<TecoChatTab />` as content
- Lines 36–39: `InfoContent()` returns `<>{infoContent}<>`
- Lines 41–47: `INFO_TAB`
- Lines 107–111: `<SidebarContent className=" overflow-hidden h-full"><div className="h-full rounded-b-xl bg-muted ">{activeTab?.content}</div></SidebarContent>`

**Step 2: Apply all 3 changes to `context-panel.tsx`**

**Change A — New imports (add at top):**

Add these imports after the existing import block:
```tsx
import {
	ContextPanel,
	ContextPanelContent,
	ContextPanelHeader,
	ContextPanelHeaderActions,
	ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { ArrowUpRight } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
```

**Change B — Replace `InfoContent` and add `ChatContent`, update tabs:**

Replace the `InfoContent` function + `INFO_TAB` + `CHAT_TAB` block with:

```tsx
function InfoContent() {
	const { infoContent } = useStore(contextPanelStore);
	if (!infoContent) {
		return (
			<ContextPanel>
				<ContextPanelContent className="flex items-center justify-center p-6">
					<p className="text-sm text-muted-foreground/50">Sem informações</p>
				</ContextPanelContent>
			</ContextPanel>
		);
	}
	return <>{infoContent}</>;
}

function ChatContent() {
	const navigate = useNavigate();
	const { slug, teamSlug } = useParams({
		from: "/_authenticated/$slug/$teamSlug/_dashboard",
	});

	return (
		<ContextPanel>
			<ContextPanelHeader>
				<ContextPanelTitle>Chat IA</ContextPanelTitle>
				<ContextPanelHeaderActions>
					<Button
						className="size-6 rounded"
						onClick={() =>
							navigate({
								to: "/$slug/$teamSlug/chat",
								params: { slug, teamSlug },
							})
						}
						size="icon"
						type="button"
						variant="ghost"
					>
						<ArrowUpRight className="size-3.5" />
					</Button>
				</ContextPanelHeaderActions>
			</ContextPanelHeader>
			<ContextPanelContent>
				<TecoChatTab />
			</ContextPanelContent>
		</ContextPanel>
	);
}

const CHAT_TAB: ContextPanelTab = {
	id: "chat",
	icon: MessageSquare,
	label: "Chat IA",
	content: <ChatContent />,
	order: 1,
};

const INFO_TAB: ContextPanelTab = {
	id: "info",
	icon: Info,
	label: "Informações",
	content: <InfoContent />,
	order: 0,
};
```

**Change C — Fix SidebarContent (remove inner div wrapper):**

Replace:
```tsx
<SidebarContent className=" overflow-hidden h-full">
   <div className="h-full rounded-b-xl bg-muted ">
      {activeTab?.content}
   </div>
</SidebarContent>
```

With:
```tsx
<SidebarContent className="h-full overflow-hidden rounded-b-xl bg-muted">
   {activeTab?.content}
</SidebarContent>
```

**Step 3: Verify TypeScript**

```bash
bun run typecheck 2>&1 | head -40
```

Expected: no new errors

**Step 4: Commit**

```bash
git add apps/web/src/features/context-panel/context-panel.tsx
git commit -m "feat(context-panel): add InfoContent empty state, ChatContent with expand, fix SidebarContent overflow"
```

---

## Task 3: Remove `ContextPanelSection` from `context-panel-info.tsx`

**Files:**
- Modify: `apps/web/src/features/context-panel/context-panel-info.tsx`

**Step 1: Remove the `ContextPanelSection` function**

The file currently contains `ContextPanelSection` (lines 5–24) plus `ContextPanelAction`, `ContextPanelMeta`, `ContextPanelDivider`.

Delete only the `ContextPanelSection` export (lines 5–24). Keep everything else unchanged.

After: file starts at `export function ContextPanelAction(...)`.

**Step 2: Commit**

```bash
git add apps/web/src/features/context-panel/context-panel-info.tsx
git commit -m "feat(context-panel): remove ContextPanelSection (replaced by ContextPanelHeader primitives)"
```

---

## Task 4: Migrate `content-list-section.tsx`

**Files:**
- Modify: `apps/web/src/features/content/ui/content-list-section.tsx`

**Step 1: Update import**

Replace:
```tsx
import {
   ContextPanelAction,
   ContextPanelSection,
} from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
```

With:
```tsx
import {
	ContextPanel,
	ContextPanelContent,
	ContextPanelHeader,
	ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
```

**Step 2: Update `useContextPanelInfo` call**

Replace:
```tsx
useContextPanelInfo(
   <ContextPanelSection title="Ações">
      <ContextPanelAction
         icon={Plus}
         label="Novo conteúdo"
         onClick={handleCreateNew}
      />
   </ContextPanelSection>,
);
```

With:
```tsx
useContextPanelInfo(
	<ContextPanel>
		<ContextPanelHeader>
			<ContextPanelTitle>Ações</ContextPanelTitle>
		</ContextPanelHeader>
		<ContextPanelContent>
			<ContextPanelAction
				icon={Plus}
				label="Novo conteúdo"
				onClick={handleCreateNew}
			/>
		</ContextPanelContent>
	</ContextPanel>,
);
```

**Step 3: Verify TypeScript**

```bash
bun run typecheck 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add apps/web/src/features/content/ui/content-list-section.tsx
git commit -m "feat(content): migrate ContextPanelSection to new primitives"
```

---

## Task 5: Migrate `dashboards/index.tsx`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/index.tsx`

**Step 1: Update import**

Replace:
```tsx
import {
   ContextPanelAction,
   ContextPanelSection,
} from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
```

With:
```tsx
import {
	ContextPanel,
	ContextPanelContent,
	ContextPanelHeader,
	ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
```

**Step 2: Update `useContextPanelInfo` call**

Replace:
```tsx
useContextPanelInfo(
   <ContextPanelSection title="Ações">
      <ContextPanelAction
         icon={Plus}
         label="Novo dashboard"
         onClick={() => {
            // TODO: Wire to create dashboard action
         }}
      />
   </ContextPanelSection>,
);
```

With:
```tsx
useContextPanelInfo(
	<ContextPanel>
		<ContextPanelHeader>
			<ContextPanelTitle>Ações</ContextPanelTitle>
		</ContextPanelHeader>
		<ContextPanelContent>
			<ContextPanelAction
				icon={Plus}
				label="Novo dashboard"
				onClick={() => {
					// TODO: Wire to create dashboard action
				}}
			/>
		</ContextPanelContent>
	</ContextPanel>,
);
```

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/analytics/dashboards/index.tsx
git commit -m "feat(dashboards): migrate ContextPanelSection to new primitives"
```

---

## Task 6: Migrate `forms/index.tsx`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/forms/index.tsx`

**Step 1: Update import**

Replace:
```tsx
import {
   ContextPanelAction,
   ContextPanelSection,
} from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
```

With:
```tsx
import {
	ContextPanel,
	ContextPanelContent,
	ContextPanelHeader,
	ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
```

**Step 2: Update `useContextPanelInfo` call**

Replace:
```tsx
useContextPanelInfo(
   <ContextPanelSection title="Ações">
      <ContextPanelAction
         icon={Plus}
         label="Novo formulário"
         onClick={() =>
            navigate({
               to: "/$slug/$teamSlug/forms/$formId",
               params: { slug, teamSlug, formId: "new" },
            })
         }
      />
   </ContextPanelSection>,
);
```

With:
```tsx
useContextPanelInfo(
	<ContextPanel>
		<ContextPanelHeader>
			<ContextPanelTitle>Ações</ContextPanelTitle>
		</ContextPanelHeader>
		<ContextPanelContent>
			<ContextPanelAction
				icon={Plus}
				label="Novo formulário"
				onClick={() =>
					navigate({
						to: "/$slug/$teamSlug/forms/$formId",
						params: { slug, teamSlug, formId: "new" },
					})
				}
			/>
		</ContextPanelContent>
	</ContextPanel>,
);
```

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/forms/index.tsx
git commit -m "feat(forms): migrate ContextPanelSection to new primitives"
```

---

## Task 7: Migrate `editor-context-panel-tabs.tsx`

**Files:**
- Modify: `apps/web/src/features/editor/plate/ui/editor-context-panel-tabs.tsx`

**Step 1: Update imports**

Add new imports at top:
```tsx
import {
	ContextPanel,
	ContextPanelContent,
	ContextPanelHeader,
	ContextPanelTitle,
} from "@packages/ui/components/context-panel";
```

**Step 2: Wrap `settings` tab content**

Replace:
```tsx
registerTab({
   id: "settings",
   icon: Settings2,
   label: "Metadados",
   content: (
      <FrontmatterSection
         meta={meta}
         onChange={onChange}
         readOnly={readOnly}
      />
   ),
   order: 1,
});
```

With:
```tsx
registerTab({
	id: "settings",
	icon: Settings2,
	label: "Metadados",
	content: (
		<ContextPanel>
			<ContextPanelHeader>
				<ContextPanelTitle>Metadados</ContextPanelTitle>
			</ContextPanelHeader>
			<ContextPanelContent>
				<FrontmatterSection
					meta={meta}
					onChange={onChange}
					readOnly={readOnly}
				/>
			</ContextPanelContent>
		</ContextPanel>
	),
	order: 1,
});
```

**Step 3: Wrap `links` tab content**

Replace:
```tsx
registerTab({
   id: "links",
   icon: Link2,
   label: "Links do Cluster",
   content: <InternalLinksSidebar contentId={contentId} />,
   order: 2,
});
```

With:
```tsx
registerTab({
	id: "links",
	icon: Link2,
	label: "Links do Cluster",
	content: (
		<ContextPanel>
			<ContextPanelHeader>
				<ContextPanelTitle>Links do Cluster</ContextPanelTitle>
			</ContextPanelHeader>
			<ContextPanelContent>
				<InternalLinksSidebar contentId={contentId} />
			</ContextPanelContent>
		</ContextPanel>
	),
	order: 2,
});
```

**Step 4: Verify TypeScript**

```bash
bun run typecheck 2>&1 | head -40
```

Expected: no errors

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/plate/ui/editor-context-panel-tabs.tsx
git commit -m "feat(editor): migrate editor tabs to ContextPanel primitives"
```

---

## Final verification

```bash
bun run typecheck 2>&1 | tail -5
bun run check 2>&1 | tail -10
```

Expected: no TypeScript errors, no Biome lint errors.
