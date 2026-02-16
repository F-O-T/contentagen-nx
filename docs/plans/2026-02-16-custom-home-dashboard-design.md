# Custom Home Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify the home page dashboard and custom dashboards — the home page shows the custom dashboard marked `isDefault: true`, users can mark any dashboard as home.

**Architecture:** The `isDefault` field already exists on `dashboards` table. We add a `setAsHome` endpoint with transaction-based exclusivity, enforce one-home-per-team via partial unique index, update the home page to use DB data instead of hardcoded text, and add UI controls to the dashboard list.

**Tech Stack:** Drizzle ORM, oRPC, React, TanStack Query, Radix UI

---

### Task 1: Add unique partial index to schema

**Files:**
- Modify: `packages/database/src/schemas/dashboards.ts:1-65`

**Step 1: Add uniqueIndex import and partial index**

In `packages/database/src/schemas/dashboards.ts`, add `uniqueIndex` to the drizzle imports and add the constraint to the table definition:

```typescript
import {
   boolean,
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uniqueIndex,
   uuid,
} from "drizzle-orm/pg-core";
```

Update the table's index function (line 64):

```typescript
(table) => [
   index("dashboards_team_idx").on(table.teamId),
   uniqueIndex("dashboards_team_default_idx")
      .on(table.teamId)
      .where(sql`${table.isDefault} = true`),
],
```

**Step 2: Push schema to database**

Run: `bun run db:push`
Expected: Schema synced, new unique index created.

**Step 3: Commit**

```bash
git add packages/database/src/schemas/dashboards.ts
git commit -m "feat(database): add unique partial index for one home dashboard per team"
```

---

### Task 2: Add `setDashboardAsHome` repository function

**Files:**
- Modify: `packages/database/src/repositories/dashboard-repository.ts`

**Step 1: Add `setDashboardAsHome` function**

Add after the existing `deleteDashboard` function (after line 120):

```typescript
export async function setDashboardAsHome(
   db: DatabaseInstance,
   dashboardId: string,
   teamId: string,
) {
   try {
      return await db.transaction(async (tx) => {
         // Unset current home dashboard for this team
         await tx
            .update(dashboards)
            .set({ isDefault: false })
            .where(
               and(
                  eq(dashboards.teamId, teamId),
                  eq(dashboards.isDefault, true),
               ),
            );

         // Set the target dashboard as home
         const [updated] = await tx
            .update(dashboards)
            .set({ isDefault: true })
            .where(eq(dashboards.id, dashboardId))
            .returning();

         return updated;
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to set dashboard as home");
   }
}
```

**Step 2: Add delete protection to `deleteDashboard`**

Replace the existing `deleteDashboard` function (lines 110-120) with:

```typescript
export async function deleteDashboard(
   db: DatabaseInstance,
   dashboardId: string,
) {
   try {
      const dashboard = await getDashboardById(db, dashboardId);

      if (dashboard?.isDefault) {
         const teamDashboards = await listDashboardsByTeam(db, dashboard.teamId);
         if (teamDashboards.length > 1) {
            throw AppError.validation(
               "Cannot delete home dashboard. Set another dashboard as home first.",
            );
         }
      }

      await db.delete(dashboards).where(eq(dashboards.id, dashboardId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete dashboard");
   }
}
```

**Step 3: Commit**

```bash
git add packages/database/src/repositories/dashboard-repository.ts
git commit -m "feat(database): add setDashboardAsHome with transaction and delete protection"
```

---

### Task 3: Add `setAsHome` oRPC endpoint

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/dashboards.ts`

**Step 1: Add import for new repository function**

Add `setDashboardAsHome` to the import from dashboard-repository (line 3):

```typescript
import {
   createDashboard,
   deleteDashboard,
   getDashboardById,
   listDashboardsByTeam,
   setDashboardAsHome,
   updateDashboard,
   updateDashboardTiles,
} from "@packages/database/repositories/dashboard-repository";
```

**Step 2: Add `setAsHome` procedure**

Add after the `updateGlobalFilters` procedure (after line 259):

```typescript
export const setAsHome = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db, posthog, userId } = context;

      const dashboard = await getDashboardById(db, input.id);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      if (dashboard.isDefault) {
         return dashboard;
      }

      const updated = await setDashboardAsHome(db, input.id, teamId);

      try {
         await emitDashboardUpdated(
            { db, posthog, organizationId, userId, teamId },
            { dashboardId: input.id, changedFields: ["isDefault"] },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return updated;
   });
```

**Step 3: Update `remove` to handle delete protection**

Replace the `remove` handler body (lines 173-201) to catch the validation error:

```typescript
export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;
      const dashboard = await getDashboardById(db, input.id);

      if (
         !dashboard ||
         dashboard.organizationId !== organizationId ||
         dashboard.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Dashboard not found.",
         });
      }

      try {
         await deleteDashboard(db, input.id);
      } catch (err) {
         if (
            err instanceof Error &&
            err.message.includes("home dashboard")
         ) {
            throw new ORPCError("BAD_REQUEST", {
               message: err.message,
            });
         }
         throw err;
      }

      try {
         await emitDashboardDeleted(
            { db, posthog, organizationId, userId, teamId },
            { dashboardId: input.id },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return { success: true };
   });
```

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/dashboards.ts
git commit -m "feat(dashboards): add setAsHome endpoint and delete protection"
```

---

### Task 4: Fix home page to use DB data

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/home/index.tsx:98-142`

**Step 1: Update `DashboardHeader` to use DB data**

Replace the `DashboardHeader` component (lines 98-142) with:

```typescript
function DashboardHeader({
   dashboard,
   isEditing,
   onEditToggle,
   onAddInsight,
}: {
   dashboard: Dashboard;
   isEditing: boolean;
   onEditToggle: () => void;
   onAddInsight: () => void;
}) {
   return (
      <div className="flex flex-col gap-0">
         {/* Title row */}
         <div className="flex items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-2 min-w-0">
               <LayoutDashboard className="size-5 text-muted-foreground shrink-0" />
               <h1 className="text-lg font-semibold tracking-tight truncate">
                  {dashboard.name}
               </h1>
            </div>
            {!isEditing && (
               <div className="flex items-center gap-1.5 shrink-0">
                  <Button onClick={onEditToggle} size="sm" variant="outline">
                     <Pencil className="size-3.5" />
                     Personalizar
                  </Button>
                  <Button onClick={onAddInsight} size="sm">
                     <Plus className="size-3.5" />
                     Add insight
                  </Button>
               </div>
            )}
         </div>

         {/* Description */}
         {dashboard.description && (
            <p className="text-sm text-muted-foreground pb-3">
               {dashboard.description}
            </p>
         )}

         {/* Filter bar */}
         <DashboardFilterBar dashboard={dashboard} />
      </div>
   );
}
```

Key changes:
- `h1` now renders `{dashboard.name}` instead of hardcoded "Dashboard"
- Description now renders `{dashboard.description}` from DB instead of hardcoded "Seu espaço de trabalho..."
- Description is conditional (only shown if set)

**Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/home/index.tsx
git commit -m "fix(home): use dashboard name and description from DB instead of hardcoded text"
```

---

### Task 5: Update onboarding to use team name

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/onboarding.ts:237-249`

**Step 1: Query team name and use it for dashboard name**

In the `completeOnboarding` handler, before the dashboard insert (around line 237), add a query for the team name and update the insert:

Add before the dashboard creation block (before line 237):

```typescript
         // Get team name for dashboard
         const teamRecord = await tx.query.team.findFirst({
            where: (t, { eq }) => eq(t.id, teamId),
            columns: { name: true },
         });
```

Then update the insert values (lines 244-245):

```typescript
               name: teamRecord?.name
                  ? `Dashboard ${teamRecord.name}`
                  : "Dashboard",
               description: null,
```

**Step 2: Commit**

```bash
git add apps/web/src/integrations/orpc/router/onboarding.ts
git commit -m "fix(onboarding): use team name for dashboard instead of hardcoded 'Dashboard Principal'"
```

---

### Task 6: Add home badge and setAsHome action to dashboard list card

**Files:**
- Modify: `apps/web/src/features/analytics/ui/dashboard-list-card.tsx`

**Step 1: Rewrite dashboard list card with badge and dropdown**

Replace the entire file content:

```typescript
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Home, LayoutDashboard, MoreHorizontal } from "lucide-react";
import { orpc } from "@/integrations/orpc/client";

interface DashboardListCardProps {
   id: string;
   name: string;
   description?: string | null;
   tileCount: number;
   updatedAt: string;
   slug: string;
   teamSlug?: string | null;
   isDefault?: boolean;
}

export function DashboardListCard({
   id,
   name,
   description,
   tileCount,
   updatedAt,
   slug,
   teamSlug,
   isDefault = false,
}: DashboardListCardProps) {
   const queryClient = useQueryClient();

   const setAsHomeMutation = useMutation(
      orpc.dashboards.setAsHome.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDefaultDashboard.queryKey(),
            });
         },
      }),
   );

   return (
      <div className="relative group">
         <Link
            params={{ slug, teamSlug: teamSlug ?? "", dashboardId: id }}
            to={"/$slug/$teamSlug/analytics/dashboards/$dashboardId"}
         >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
               <CardHeader>
                  <div className="flex items-center gap-3">
                     <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LayoutDashboard className="size-5 text-primary" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <CardTitle className="text-base truncate">
                              {name}
                           </CardTitle>
                           {isDefault && (
                              <Badge
                                 className="gap-1 shrink-0"
                                 variant="secondary"
                              >
                                 <Home className="size-3" />
                                 Home
                              </Badge>
                           )}
                        </div>
                        {description && (
                           <CardDescription className="truncate">
                              {description}
                           </CardDescription>
                        )}
                     </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                     <span>{tileCount} tiles</span>
                     <span>
                        Updated{" "}
                        {new Date(updatedAt).toLocaleDateString("pt-BR")}
                     </span>
                  </div>
               </CardHeader>
            </Card>
         </Link>

         {/* Actions dropdown - positioned over the card */}
         {!isDefault && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost" className="size-8">
                        <MoreHorizontal className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem
                        disabled={setAsHomeMutation.isPending}
                        onClick={(e) => {
                           e.preventDefault();
                           setAsHomeMutation.mutate({ id });
                        }}
                     >
                        <Home className="mr-2 size-4" />
                        Definir como Home
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         )}
      </div>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/analytics/ui/dashboard-list-card.tsx
git commit -m "feat(dashboards): add home badge and set-as-home action to dashboard list card"
```

---

### Task 7: Pass `isDefault` prop in dashboard list page

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/index.tsx:54-65`

**Step 1: Add `isDefault` prop to DashboardListCard usage**

Update the `DashboardListCard` rendering (lines 54-65) — add `isDefault`:

```typescript
            <DashboardListCard
               description={dashboard.description}
               id={dashboard.id}
               isDefault={dashboard.isDefault}
               key={dashboard.id}
               name={dashboard.name}
               slug={slug}
               teamSlug={teamId}
               tileCount={
                  Array.isArray(dashboard.tiles) ? dashboard.tiles.length : 0
               }
               updatedAt={dashboard.updatedAt.toString()}
            />
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/analytics/dashboards/index.tsx
git commit -m "feat(dashboards): pass isDefault to dashboard list cards"
```

---

### Task 8: Verify end-to-end

**Step 1: Run typecheck**

Run: `bun run typecheck`
Expected: No type errors.

**Step 2: Run lint**

Run: `bun run check`
Expected: No lint errors.

**Step 3: Manual verification**

1. Navigate to dashboards list → verify home badge shows on default dashboard
2. Create a new dashboard → verify it appears without home badge
3. Click "Definir como Home" on new dashboard → verify badge moves
4. Navigate to home page → verify it shows the new home dashboard's name
5. Try to delete home dashboard → verify error message appears
