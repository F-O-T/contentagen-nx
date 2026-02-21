# Asset Bank Navbar & Page Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Wire the existing assets page into the sidebar navigation with correct early access gating, alpha stage badge, and fix pagination/memory issues in the page itself.

**Architecture:** The sidebar reads nav items from `sidebar-nav-items.ts` and filters by `earlyAccessFlag` via `useEarlyAccess().isEnrolled()`. Items with `earlyAccessFlag` set show a `FeatureStageBadge` — currently hardcoded to "beta". We extend `NavItemDef` to carry its own `earlyAccessStage` so the badge reflects the actual stage. The assets page already exists but has a broken pagination (ignores `total`) and a `URL.createObjectURL` leak.

**Tech Stack:** TanStack Router (file-based), Radix sidebar, PostHog early access feature flags, Drizzle oRPC assets router, react-dropzone.

---

## Existing files (do NOT recreate)

- Page: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx` ✅ exists
- Nav items: `apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts`
- Nav render: `apps/web/src/layout/dashboard/ui/sidebar-nav.tsx`

---

### Task 1: Extend `NavItemDef` with `earlyAccessStage` and add assets entry

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts`
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav.tsx`

**Context:**

`NavItemDef` currently has `earlyAccessFlag?: string` but the badge stage is hardcoded to `"beta"` in `sidebar-nav.tsx`. The asset bank is alpha, so this will show the wrong badge.

**Step 1: Add `earlyAccessStage` to `NavItemDef` and add assets entry**

In `sidebar-nav-items.ts`:

```typescript
// Add ImageIcon to imports
import {
   BarChart3,
   ClipboardList,
   Database,
   FileText,
   House,
   ImageIcon,           // ADD
   LayoutDashboard,
   Lightbulb,
} from "lucide-react";

// Add earlyAccessStage to NavItemDef type
export type NavItemDef = {
   id: string;
   label: string;
   icon: LucideIcon;
   route: string;
   quickAction?: NavItemAction;
   subPanel?: SubSidebarSection;
   /** PostHog early access flag key — if set, item is hidden when user is not enrolled */
   earlyAccessFlag?: string;
   /** Stage badge shown next to the label when earlyAccessFlag is set. Defaults to "beta". */
   earlyAccessStage?: "alpha" | "beta" | "concept";
};

// Add to main group items (after "forms"):
{
   id: "assets",
   label: "Banco de Imagens",
   icon: ImageIcon,
   route: "/$slug/$teamSlug/assets",
   earlyAccessFlag: "asset-bank",
   earlyAccessStage: "alpha",
},
```

**Step 2: Use `earlyAccessStage` in sidebar-nav.tsx**

Find both places that render `<FeatureStageBadge ... stage="beta" />` inside `NavItem` and change to:

```tsx
{item.earlyAccessFlag && (
   <FeatureStageBadge
      className="ml-1.5 group-data-[collapsible=icon]:hidden"
      stage={item.earlyAccessStage ?? "beta"}
   />
)}
```

There are two instances in `NavItem` — one for the `item.subPanel` branch and one for the `<Link>` branch. Update both.

**Step 3: Verify type check passes**

```bash
nx typecheck web
```

Expected: no errors.

**Step 4: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts \
        apps/web/src/layout/dashboard/ui/sidebar-nav.tsx
git commit -m "feat(nav): add asset bank to sidebar with alpha stage badge"
```

---

### Task 2: Fix assets page — pagination total + URL memory leak

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx`

**Context:**

Two bugs in the existing page:

1. **Pagination ignores total.** The oRPC `assets.list` returns `{ assets: Asset[], total: number }`. The "Próxima" button is never disabled, so users can page past the last page. Fix: use `total` to compute `hasNextPage` and disable the button.

2. **`URL.createObjectURL` leak.** `getImageDimensions` creates an object URL in `img.src` but never calls `URL.revokeObjectURL`. Fix: call it in `img.onload` and `img.onerror`.

3. **Redundant data shape fallback.** The line `data?.assets ?? (Array.isArray(data) ? data : [])` is a leftover workaround. The router always returns `{ assets, total }`, so simplify to `data.assets ?? []`.

**Step 1: Fix `AssetsGrid` — use `data.total` for pagination**

The `AssetsGrid` component currently ignores `total`. Pass it up via a callback so the parent `AssetBankContent` can disable the "Próxima" button.

Change `AssetsGrid` props to include `onTotalChange: (total: number) => void`:

```tsx
interface AssetsGridProps {
   teamId: string;
   search: string;
   page: number;
   onTotalChange: (total: number) => void;
}

function AssetsGrid({ teamId, search, page, onTotalChange }: AssetsGridProps) {
   const { data } = useSuspenseQuery(
      orpc.assets.list.queryOptions({
         input: {
            teamId,
            search: search || undefined,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
         },
      }),
   );

   const assets: Asset[] = data.assets ?? [];
   const total: number = data.total ?? 0;

   // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
   useEffect(() => {
      onTotalChange(total);
   }, [total]);

   // ... rest unchanged
}
```

In `AssetBankContent`, track total and compute `hasNextPage`:

```tsx
const [total, setTotal] = useState(0);
const hasNextPage = (page + 1) * PAGE_SIZE < total;
```

Update pagination buttons:

```tsx
<Button
   disabled={page === 0}
   onClick={() => setPage((p) => Math.max(0, p - 1))}
   variant="outline"
>
   Anterior
</Button>
<span className="text-sm text-muted-foreground">
   Página {page + 1} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}
</span>
<Button
   disabled={!hasNextPage}
   onClick={() => setPage((p) => p + 1)}
   variant="outline"
>
   Próxima
</Button>
```

Also pass `onTotalChange` to `<AssetsGrid>`:

```tsx
<AssetsGrid
   page={page}
   search={debouncedSearch}
   teamId={teamId}
   onTotalChange={setTotal}
/>
```

**Step 2: Fix `getImageDimensions` URL leak**

```typescript
function getImageDimensions(
   file: File,
): Promise<{ width: number; height: number }> {
   return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
         URL.revokeObjectURL(url);
         resolve({ height: img.naturalHeight, width: img.naturalWidth });
      };
      img.onerror = (err) => {
         URL.revokeObjectURL(url);
         reject(err);
      };
      img.src = url;
   });
}
```

**Step 3: Simplify data shape fallback**

```typescript
// Before
const assets: Asset[] = data?.assets ?? (Array.isArray(data) ? data : []);

// After
const assets: Asset[] = data.assets ?? [];
```

**Step 4: Verify type check**

```bash
nx typecheck web
```

Expected: no errors.

**Step 5: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx
git commit -m "fix(assets): correct pagination with total count and fix URL object leak"
```

---

## Testing

After both tasks:

1. **Navbar visible:** Enroll in "Banco de Imagens" via Settings → Prévias de Funcionalidades → toggle on. Sidebar should show "Banco de Imagens" with an orange **Alpha** badge.
2. **Navbar hidden:** Unenroll. Sidebar item should disappear.
3. **Pagination:** Upload 25+ images. Page 1 shows 24, "Próxima" enabled. Page 2 shows remainder, "Próxima" disabled.
4. **Direct URL access unenrolled:** Navigate to `/$slug/$teamSlug/assets` while not enrolled. Should show the unenrolled CTA (not crash).
