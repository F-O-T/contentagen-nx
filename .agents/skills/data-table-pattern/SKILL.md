---
name: data-table-pattern
description: Use when building, updating, or reviewing any data table in the contentta project. Triggers on DataTable usage, table actions, table columns, expandable rows, renderSubComponent, or any list view with tabular data.
---

# Contentta Data Table Pattern

## Overview

All tables use `DataTable` from `@packages/ui/components/data-table` with this rule:
**Primary actions** → visible icon buttons on the row. **Secondary/destructive actions** → inside the `renderSubComponent` expandable area. No action hides behind a "more" dropdown menu on the main row.

## Core Rules

1. **Never use `DropdownMenu` in the actions column** of the main row
2. **Primary actions** (1–3 max) → `<Button size="icon" variant="ghost">` directly in the row
3. **All other actions** → inside `renderSubComponent` as labeled `size="sm"` buttons
4. **Destructive actions** (delete, revoke) → always in the expandable, never on the main row
5. **Mobile card** → replicate the icon buttons pattern inline; no dropdowns
6. **Tooltips** → every primary action icon button MUST be wrapped in `<Tooltip><TooltipTrigger asChild>...</TooltipTrigger><TooltipContent>Label</TooltipContent></Tooltip>`
7. **Expandable actions** → secondary/destructive actions are normal buttons: `<Button size="sm" variant="outline|ghost">` with **icon + text** (e.g. `<Trash2 className="size-3 mr-2" /> Excluir`), never icon-only in the expandable

## Action Classification

| Category | Where | Examples |
|----------|-------|---------|
| **Primary** | Icon button on row | Edit, View, Enable/Disable toggle |
| **Secondary** | Expandable section | Duplicate, Export, History, Settings |
| **Destructive** | Expandable section only | Delete, Revoke, Archive |

## Full Pattern

```tsx
// 1. Column definition — primary actions as icon buttons
{
  id: "actions",
  header: "",
  cell: ({ row }) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
      >
        <Pencil className="size-4" />
        <span className="sr-only">Editar</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => { e.stopPropagation(); onView(row.original); }}
      >
        <Eye className="size-4" />
        <span className="sr-only">Ver detalhes</span>
      </Button>
    </div>
  ),
}

// 2. Expandable sub-component — secondary + destructive actions
function RowExpandedContent({ row }: { row: Row<T> }) {
  const item = row.original;
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Optional: extra details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* details here */}
      </div>
      {/* Secondary + destructive actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => onDuplicate(item)}>
          <Copy className="size-3 mr-2" />
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="size-3 mr-2" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

// 3. DataTable usage
<DataTable
  columns={columns}
  data={data}
  getRowId={(row) => row.id}
  renderSubComponent={({ row }) => <RowExpandedContent row={row} />}
  renderMobileCard={(props) => <ItemMobileCard {...props} />}
/>
```

## Mobile Card Pattern

```tsx
function ItemMobileCard({
  row,
  isExpanded,
  toggleExpanded,
  canExpand,
}: MobileCardRenderProps<T>) {
  const item = row.original;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Identity info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
          </div>
          {/* Primary icon actions inline, then expand toggle */}
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
              <Pencil className="size-4" />
            </Button>
            {canExpand && (
              <Button size="icon" variant="ghost" onClick={toggleExpanded}>
                <ChevronDown
                  className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## `e.stopPropagation()` on Icon Buttons

Because row click expands the row, icon button `onClick` handlers MUST call `e.stopPropagation()` to prevent triggering expand when clicking an action.

```tsx
onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `DropdownMenu` in action column | Remove dropdown; expose top 1–2 as icon buttons, rest in expandable |
| Delete button on main row | Move to expandable — destructive actions are always secondary |
| Forgetting `e.stopPropagation()` | All icon button `onClick` handlers must stop propagation |
| No `renderMobileCard` | Always provide mobile card renderer — DataTable doesn't auto-collapse on mobile |
| Too many icon buttons (>3) | Move anything beyond top 2 to expandable |
| No `sr-only` span on icon button | Always add `<span className="sr-only">Action label</span>` for accessibility |
| No tooltip on icon button | Wrap in `<Tooltip>` + `<TooltipTrigger asChild>` + `<TooltipContent>Label</TooltipContent>` |
| Icon-only in expandable | Use normal buttons with icon + text (e.g. `<Trash2 className="size-3 mr-2" /> Excluir`) |

## Reference Files

- Base component: `packages/ui/src/components/data-table.tsx`
- Best full example: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/members.tsx`
- Mobile card reference: `apps/web/src/features/webhooks/ui/webhooks-table.tsx`
