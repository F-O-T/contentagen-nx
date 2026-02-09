# Sidebar Fixes Design

## Context

The dashboard sidebar has three issues:
1. Nav items with a `+` (quickAction) button also show a `...` (more) button — they should only show one
2. The floating sub-panel (dashboards/insights) positions incorrectly when the sidebar is collapsed to icon mode
3. The settings sidebar is rendered inside `<main>` content area — it should be a second sidebar column next to the main sidebar

## Decisions

- Items with `quickAction` → only show `QuickCreateButton`, no `MoreMenu`
- Items without `quickAction` → only show `MoreMenu`
- Sub-panel positioning reads sidebar collapse state and uses `--sidebar-width-icon` when collapsed
- Settings sidebar uses a separate `SidebarProvider` with `name="settings"` for independent state
- Main sidebar collapse state is independent from settings sidebar visibility
- Settings sidebar is `collapsible="none"` (always visible when on /settings)

## File Changes

### 1. `layout/dashboard/ui/sidebar-item-actions.tsx`

Remove `MoreMenu` from items that have `quickAction`. The `SidebarItemActions` component renders either `QuickCreateButton` OR `MoreMenu`, never both.

Before:
```tsx
export function SidebarItemActions({ item, slug }) {
   return (
      <>
         {item.quickAction && <QuickCreateButton item={item} slug={slug} />}
         <MoreMenu item={item} />
      </>
   );
}
```

After:
```tsx
export function SidebarItemActions({ item, slug }) {
   if (item.quickAction) {
      return <QuickCreateButton item={item} slug={slug} />;
   }
   return <MoreMenu item={item} />;
}
```

### 2. `layout/dashboard/ui/sidebar-sub-panel.tsx`

Import `useSidebar` and dynamically compute `--sidebar-panel-left` based on whether sidebar is expanded or collapsed.

- Expanded: `calc(var(--sidebar-width, 220px) + 8px)`
- Collapsed: `calc(var(--sidebar-width-icon, 48px) + 8px)`

### 3. `layout/dashboard/ui/settings-layout.tsx`

Restructure from current layout (settings sidebar inside `<main>` with its own box styling) to a proper two-column sidebar:

Current:
```
SidebarInset > main > SettingsLayout > SidebarProvider > div.flex > [Sidebar + main]
```

New:
```
SidebarInset > SettingsLayout > SidebarProvider(name="settings") > [Sidebar(collapsible="none") + main]
```

The settings sidebar becomes a second column between the main sidebar and content, using `variant="inset"` for visual consistency. Mobile behavior stays the same (full-screen settings nav on index, back button on sub-pages).
