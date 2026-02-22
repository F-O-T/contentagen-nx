# Content Clusters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Content Clusters — a content structure where a pillar post is linked to multiple satellite posts, replacing the dead-weight `request`/`draftOrigin` fields with a `clusterConfig` JSONB, plus a full UI and SDK embed integration.

**Architecture:** Any content item can become a cluster pillar by populating its `clusterConfig` JSONB. Satellites are linked via the existing `related_content` table (sourceContentId = pillarId, targetContentId = satelliteId). A dedicated oRPC `clusters` router surfaces cluster operations, and a `ContenttaChangelogClient` SDK class enables embedding cluster entries on external sites.

**Tech Stack:** Drizzle ORM + PostgreSQL, oRPC (`@orpc/server`), TanStack Query, React, Mastra AI agents, Bun SDK (vanilla JS embed)

---

## Prerequisites / Context

- `related_content` table and repository already exist — no schema changes needed there.
- `experimentTargetTypeEnum` already includes `"cluster"` — experiment integration is schema-ready.
- `draftOrigin` is referenced in 3 places: `content.ts` schema, `content.ts` router, `content-table-columns.tsx`.
- `request` (JSONB) is only in the schema + Zod types — no router uses it.
- `defaultLayout` in `product-settings` schema is tied to the `request` field — also removed.
- The `content.tsx` settings page `DefaultLayoutSection` must be removed.
- The plan is scoped to NOT remove `draftOrigin` from the DB yet (destructive migration risk) — instead, make it optional/nullable so old rows remain valid. Remove from router input only.

---

## Task 1: Schema — Add `clusterConfig`, make `request` optional

**Files:**
- Modify: `packages/database/src/schemas/content.ts`

**Step 1: Read the file (already done above)**

**Step 2: Edit the schema**

In `packages/database/src/schemas/content.ts`, make the following changes:

1. Add `ClusterConfigSchema` Zod type and `clusterConfig` column.
2. Keep `request` but mark it as deprecated (already optional — no change needed).
3. Keep `draftOrigin` in schema (DB migration risk) but remove from router input in Task 4.

Add after `ContentStatsSchema`:

```typescript
// Zod schema for cluster configuration (set when content is a cluster pillar)
export const ClusterEmbedSettingsSchema = z.object({
   theme: z.enum(["light", "dark", "auto"]).optional(),
   position: z
      .enum(["bottom-right", "bottom-left", "inline"])
      .optional(),
   accentColor: z.string().optional(),
   label: z.string().optional(),
});

export const ClusterConfigSchema = z.object({
   mode: z.string().optional(),
   embedEnabled: z.boolean().optional(),
   embedSettings: ClusterEmbedSettingsSchema.optional(),
});

export type ClusterConfig = z.infer<typeof ClusterConfigSchema>;
export type ClusterEmbedSettings = z.infer<typeof ClusterEmbedSettingsSchema>;
```

Add in the `content` table definition, after `stats`:

```typescript
clusterConfig: jsonb("cluster_config")
   .$type<ClusterConfig>()
   .default({})
   .notNull(),
```

**Step 3: Push schema to DB**

```bash
bun run db:push
```

Expected: "Changes applied" or "No changes" if column already exists.

**Step 4: Commit**

```bash
git add packages/database/src/schemas/content.ts
git commit -m "feat(schema): add clusterConfig JSONB to content table"
```

---

## Task 2: Content Repository — Update types

**Files:**
- Modify: `packages/database/src/repositories/content-repository.ts`

**Step 1: Read the file**

```bash
# Read the full file to understand the createContent signature
```

**Step 2: Verify `createContent` accepts `clusterConfig`**

After the schema change, `ContentInsert` auto-includes `clusterConfig` because it's derived from the Drizzle table. No manual change needed if the repo uses `typeof content.$inferInsert`.

**Step 3: Add `listClusters` repository function**

Add at the end of `content-repository.ts`:

```typescript
import { isNotNull, ne, sql as sqlFn } from "drizzle-orm";

/**
 * List all cluster pillars (content with non-empty clusterConfig) for a team.
 */
export async function listClustersByTeam(
   db: DatabaseInstance,
   teamId: string,
   opts: { limit?: number; page?: number } = {},
) {
   const { limit = 20, page = 1 } = opts;
   const offset = (page - 1) * limit;

   try {
      const rows = await db
         .select()
         .from(content)
         .where(
            and(
               eq(content.teamId, teamId),
               isNotNull(content.clusterConfig),
               ne(
                  sqlFn<string>`(${content.clusterConfig})::text`,
                  "{}",
               ),
            ),
         )
         .orderBy(desc(content.createdAt))
         .limit(limit)
         .offset(offset);
      return rows;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list clusters");
   }
}
```

> Note: Import `and`, `eq`, `isNotNull`, `ne`, `desc` from `drizzle-orm` at top. Import `sql as sqlFn` to avoid name collision.

**Step 4: Commit**

```bash
git add packages/database/src/repositories/content-repository.ts
git commit -m "feat(repo): add listClustersByTeam repository function"
```

---

## Task 3: Remove dead weight from `content` router input

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/content.ts`

**Step 1: Read `createContentSchema` (lines 34–38)**

Already read: `draftOrigin` is in `createContentSchema`. Remove it.

**Step 2: Edit `createContentSchema`**

Remove `draftOrigin: z.enum(["manual", "ai_generated"]).optional().default("manual")` from the schema.

**Step 3: Edit the `create` handler**

Remove `draftOrigin: input.draftOrigin` from the `createContent(db, { ... })` call.

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/content.ts
git commit -m "feat(router): remove draftOrigin from content create input"
```

---

## Task 4: Create `related-content` oRPC router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/related-content.ts`

**Step 1: Create the file**

```typescript
import { ORPCError } from "@orpc/server";
import {
   addRelatedContent,
   getRelatedContentBySourceId,
   removeRelatedContent,
   updateRelatedContentOrder,
} from "@packages/database/repositories/related-content-repository";
import { getContentById } from "@packages/database/repositories/content-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * Add a satellite post to a pillar (source → target).
 */
export const addSatellite = protectedProcedure
   .input(
      z.object({
         pillarId: z.string().uuid(),
         satelliteId: z.string().uuid(),
         relationType: z.enum(["manual", "ai_suggested"]).default("manual"),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      // Verify both content items belong to this org
      const [pillar, satellite] = await Promise.all([
         getContentById(db, input.pillarId),
         getContentById(db, input.satelliteId),
      ]);

      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }
      if (!satellite || satellite.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Satellite not found." });
      }

      return addRelatedContent(db, {
         sourceContentId: input.pillarId,
         targetContentId: input.satelliteId,
         relationType: input.relationType,
      });
   });

/**
 * Remove a satellite from a pillar.
 */
export const removeSatellite = protectedProcedure
   .input(
      z.object({
         pillarId: z.string().uuid(),
         satelliteId: z.string().uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }

      return removeRelatedContent(db, input.pillarId, input.satelliteId);
   });

/**
 * List satellites for a given pillar, with target content metadata.
 */
export const listSatellites = protectedProcedure
   .input(z.object({ pillarId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }

      return getRelatedContentBySourceId(db, input.pillarId);
   });

/**
 * Reorder satellites within a pillar.
 */
export const reorderSatellites = protectedProcedure
   .input(
      z.object({
         pillarId: z.string().uuid(),
         orderedSatelliteIds: z.array(z.string().uuid()),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }

      return updateRelatedContentOrder(
         db,
         input.pillarId,
         input.orderedSatelliteIds,
      );
   });
```

**Step 2: Commit**

```bash
git add apps/web/src/integrations/orpc/router/related-content.ts
git commit -m "feat(router): add related-content oRPC router (pillar-satellite operations)"
```

---

## Task 5: Create `clusters` oRPC router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/clusters.ts`

**Step 1: Create the file**

```typescript
import { ORPCError } from "@orpc/server";
import {
   createContent,
   getContentById,
   listClustersByTeam,
   updateContent,
} from "@packages/database/repositories/content-repository";
import { addRelatedContent } from "@packages/database/repositories/related-content-repository";
import { ClusterConfigSchema } from "@packages/database/schemas/content";
import { mastra, createRequestContext } from "@packages/agents";
import { createSlug, generateRandomSuffix } from "@packages/utils/text";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Schemas
// =============================================================================

const SuggestedSatelliteSchema = z.object({
   title: z.string(),
   description: z.string(),
});

const SuggestStructureOutputSchema = z.object({
   pillarTitle: z.string(),
   mode: z.string(),
   embedEnabled: z.boolean(),
   satellites: z.array(SuggestedSatelliteSchema),
});

// =============================================================================
// Procedures
// =============================================================================

/**
 * List all cluster pillars for the current team.
 */
export const list = protectedProcedure
   .input(
      z.object({
         limit: z.number().int().min(1).max(100).default(20),
         page: z.number().int().min(1).default(1),
      }).optional(),
   )
   .handler(async ({ context, input }) => {
      const { db, teamId } = context;
      const { limit = 20, page = 1 } = input ?? {};
      return listClustersByTeam(db, teamId, { limit, page });
   });

/**
 * Get a single cluster pillar with its satellites.
 */
export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const pillar = await getContentById(db, input.id);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Cluster not found." });
      }
      if (!pillar.clusterConfig || Object.keys(pillar.clusterConfig).length === 0) {
         throw new ORPCError("NOT_FOUND", { message: "Content is not a cluster pillar." });
      }

      return pillar;
   });

/**
 * Convert an existing content item into a cluster pillar by setting its clusterConfig.
 */
export const promote = protectedProcedure
   .input(
      z.object({
         contentId: z.string().uuid(),
         clusterConfig: ClusterConfigSchema,
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const existing = await getContentById(db, input.contentId);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found." });
      }

      return updateContent(db, input.contentId, {
         clusterConfig: input.clusterConfig,
      });
   });

/**
 * Update cluster embed configuration on a pillar.
 */
export const updateConfig = protectedProcedure
   .input(
      z.object({
         id: z.string().uuid(),
         clusterConfig: ClusterConfigSchema.partial(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const pillar = await getContentById(db, input.id);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Cluster not found." });
      }

      const merged = { ...(pillar.clusterConfig ?? {}), ...input.clusterConfig };
      return updateContent(db, input.id, { clusterConfig: merged });
   });

/**
 * Create a new cluster from scratch: creates pillar content + satellite stubs.
 */
export const create = protectedProcedure
   .input(
      z.object({
         pillarTitle: z.string().min(1),
         mode: z.string().optional(),
         embedEnabled: z.boolean().default(false),
         satellites: z
            .array(z.object({ title: z.string().min(1) }))
            .max(20)
            .default([]),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, teamId, session } = context;

      // Resolve member
      const members = await db.query.member.findMany({
         where: (m, { eq, and }) =>
            and(
               eq(m.organizationId, organizationId),
               eq(m.userId, session.user.id),
            ),
      });
      if (members.length === 0) {
         throw new ORPCError("FORBIDDEN", { message: "Not a member." });
      }
      const memberId = members[0].id;

      // Create pillar
      const pillarSlug = `${createSlug(input.pillarTitle)}-${generateRandomSuffix()}`;
      const pillar = await createContent(db, {
         meta: { title: input.pillarTitle, description: "", slug: pillarSlug },
         organizationId,
         teamId,
         createdByMemberId: memberId,
         clusterConfig: {
            mode: input.mode,
            embedEnabled: input.embedEnabled,
         },
      });

      // Create satellite stubs and link them
      const satelliteResults = await Promise.all(
         input.satellites.map(async (s) => {
            const satSlug = `${createSlug(s.title)}-${generateRandomSuffix()}`;
            const sat = await createContent(db, {
               meta: { title: s.title, description: "", slug: satSlug },
               organizationId,
               teamId,
               createdByMemberId: memberId,
            });
            await addRelatedContent(db, {
               sourceContentId: pillar.id,
               targetContentId: sat.id,
               relationType: "manual",
            });
            return sat;
         }),
      );

      return { pillar, satellites: satelliteResults };
   });

/**
 * Ask the unified AI agent to suggest a cluster structure from a free-text description.
 * Returns pillarTitle, mode, embedEnabled, and a list of satellite titles/descriptions.
 */
export const suggestStructure = protectedProcedure
   .input(z.object({ description: z.string().min(1) }))
   .handler(async ({ context, input }) => {
      const agent = mastra.getAgent("unifiedContent");

      const prompt = `
You are helping a content strategist design a Content Cluster.

A Content Cluster consists of:
1. One **pillar post** — the main comprehensive piece on the topic.
2. Multiple **satellite posts** — subtopics or related entries that link back to the pillar.

The user described their goal as:
"${input.description}"

Respond ONLY with a valid JSON object matching this exact shape:
{
  "pillarTitle": "<title for the main pillar post>",
  "mode": "<single lowercase word describing cluster type, e.g. changelog, seo, series, tutorial, docs>",
  "embedEnabled": <true if the cluster should be embeddable on external sites, false otherwise>,
  "satellites": [
    { "title": "<satellite post title>", "description": "<one-sentence description>" },
    ...
  ]
}

Suggest 3–6 satellite posts. Be specific and actionable. Do not include markdown, code fences, or any text outside the JSON.
`.trim();

      const result = await agent.generate(prompt, {
         requestContext: createRequestContext({ userId: context.userId }),
      });

      try {
         const parsed = SuggestStructureOutputSchema.parse(
            JSON.parse(result.text),
         );
         return parsed;
      } catch {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "AI returned an invalid structure. Please try again.",
         });
      }
   });
```

**Step 2: Commit**

```bash
git add apps/web/src/integrations/orpc/router/clusters.ts
git commit -m "feat(router): add clusters oRPC router with AI suggestStructure"
```

---

## Task 6: Register new routers in `index.ts`

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Add imports**

After line 11 (`import * as contentRouter from "./content";`), add:

```typescript
import * as clustersRouter from "./clusters";
import * as relatedContentRouter from "./related-content";
```

**Step 2: Add to export object**

After `content: contentRouter,`, add:

```typescript
clusters: clustersRouter,
relatedContent: relatedContentRouter,
```

**Step 3: Commit**

```bash
git add apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(router): register clusters and relatedContent routers"
```

---

## Task 7: Remove `DefaultLayoutSection` from settings page

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/content.tsx`

**Step 1: Remove DefaultLayoutSection component** (lines 32–99)

**Step 2: Remove `<DefaultLayoutSection ... />` and the `<Separator />` after it** from `ContentProductContent` (lines 291–295).

**Step 3: Update product-settings schema — remove `defaultLayout`**

File: `packages/database/src/schemas/product-settings.ts`

Remove `defaultLayout: z.enum(["tutorial", "article", "changelog"]).optional()` from `ContentDefaultsSchema`.

**Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/content.tsx
git add packages/database/src/schemas/product-settings.ts
git commit -m "feat(settings): remove dead defaultLayout setting from content product settings"
```

---

## Task 8: Add "Clusters" to sidebar navigation

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts`

**Step 1: Add `Network` icon import**

Add `Network` to the lucide-react import list.

**Step 2: Add clusters nav item**

After the `experiments` nav item (around line 78), insert:

```typescript
{
   id: "clusters",
   label: "Clusters",
   icon: Network,
   route: "/$slug/$teamSlug/clusters",
   quickAction: { type: "create", target: "sheet" },
},
```

**Step 3: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts
git commit -m "feat(nav): add Clusters item to sidebar navigation"
```

---

## Task 9: Create clusters feature hooks

**Files:**
- Create: `apps/web/src/features/clusters/hooks/use-clusters.ts`
- Create: `apps/web/src/features/clusters/hooks/use-cluster-detail.ts`
- Create: `apps/web/src/features/clusters/hooks/use-batch-generate.ts`
- Create: `apps/web/src/features/clusters/hooks/use-cluster-embed-settings.ts`

### `use-clusters.ts`

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useClusters(opts: { limit?: number; page?: number } = {}) {
   return useSuspenseQuery(
      orpc.clusters.list.queryOptions({
         input: { limit: opts.limit ?? 20, page: opts.page ?? 1 },
      }),
   );
}
```

### `use-cluster-detail.ts`

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useClusterDetail(clusterId: string) {
   return useSuspenseQuery(
      orpc.clusters.getById.queryOptions({ input: { id: clusterId } }),
   );
}

export function useClusterSatellites(pillarId: string) {
   return useSuspenseQuery(
      orpc.relatedContent.listSatellites.queryOptions({
         input: { pillarId },
      }),
   );
}
```

### `use-batch-generate.ts`

```typescript
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";
import { toast } from "sonner";

export function useBatchGenerate() {
   return useMutation(
      orpc.clusters.create.mutationOptions({
         onSuccess: () => {
            toast.success("Cluster criado com sucesso!");
         },
         onError: () => {
            toast.error("Erro ao criar cluster");
         },
      }),
   );
}
```

### `use-cluster-embed-settings.ts`

```typescript
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";
import { toast } from "sonner";

export function useClusterEmbedSettings() {
   return useMutation(
      orpc.clusters.updateConfig.mutationOptions({
         onSuccess: () => {
            toast.success("Configurações de embed salvas!");
         },
         onError: () => {
            toast.error("Erro ao salvar configurações de embed");
         },
      }),
   );
}
```

**Commit after creating all hooks:**

```bash
git add apps/web/src/features/clusters/hooks/
git commit -m "feat(clusters): add feature hooks (use-clusters, use-cluster-detail, use-batch-generate, use-cluster-embed-settings)"
```

---

## Task 10: Create `create-cluster-sheet.tsx`

**Files:**
- Create: `apps/web/src/features/clusters/ui/create-cluster-sheet.tsx`

This sheet has two steps:
1. AI suggestion step (user types description → AI suggests structure)
2. Confirmation step (user edits before creating)

```typescript
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { useSheet } from "@/hooks/use-sheet"; // global hook
import { useBatchGenerate } from "../hooks/use-batch-generate";

interface SatelliteEntry {
   title: string;
   description: string;
}

interface Props {
   onSuccess?: (pillarId: string) => void;
}

export function CreateClusterSheet({ onSuccess }: Props) {
   const { closeSheet } = useSheet();
   const [step, setStep] = useState<"describe" | "confirm">("describe");
   const [description, setDescription] = useState("");
   const [pillarTitle, setPillarTitle] = useState("");
   const [mode, setMode] = useState("");
   const [embedEnabled, setEmbedEnabled] = useState(false);
   const [satellites, setSatellites] = useState<SatelliteEntry[]>([]);

   const suggestMutation = useMutation(
      orpc.clusters.suggestStructure.mutationOptions({
         onSuccess: (data) => {
            setPillarTitle(data.pillarTitle);
            setMode(data.mode);
            setEmbedEnabled(data.embedEnabled);
            setSatellites(data.satellites);
            setStep("confirm");
         },
         onError: () => toast.error("Erro ao gerar sugestão. Tente novamente."),
      }),
   );

   const createMutation = useBatchGenerate();

   const handleSuggest = () => {
      if (!description.trim()) return;
      suggestMutation.mutate({ description });
   };

   const handleCreate = () => {
      createMutation.mutate(
         {
            pillarTitle,
            mode,
            embedEnabled,
            satellites: satellites.map((s) => ({ title: s.title })),
         },
         {
            onSuccess: (data) => {
               closeSheet();
               onSuccess?.(data.pillar.id);
            },
         },
      );
   };

   const removeSatellite = (index: number) => {
      setSatellites((prev) => prev.filter((_, i) => i !== index));
   };

   if (step === "describe") {
      return (
         <div className="space-y-6 p-6">
            <div>
               <h2 className="text-lg font-semibold">Novo Cluster</h2>
               <p className="text-sm text-muted-foreground mt-1">
                  Descreva seu objetivo e a IA vai sugerir a estrutura do cluster.
               </p>
            </div>
            <div className="space-y-2">
               <Label htmlFor="cluster-description">Objetivo do cluster</Label>
               <textarea
                  id="cluster-description"
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ex: Quero documentar atualizações do produto para meus usuários"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
               />
            </div>
            <div className="flex gap-2">
               <Button
                  disabled={!description.trim() || suggestMutation.isPending}
                  onClick={handleSuggest}
                  className="flex-1"
               >
                  {suggestMutation.isPending ? (
                     <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                     <Sparkles className="size-4 mr-2" />
                  )}
                  Sugerir estrutura
               </Button>
               <Button variant="outline" onClick={closeSheet}>
                  Cancelar
               </Button>
            </div>
            <Separator />
            <div>
               <p className="text-xs text-muted-foreground">
                  Prefere criar manualmente?{" "}
                  <button
                     type="button"
                     className="underline"
                     onClick={() => setStep("confirm")}
                  >
                     Pular sugestão
                  </button>
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6 p-6">
         <div>
            <h2 className="text-lg font-semibold">Confirmar estrutura</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Revise e edite antes de criar.
            </p>
         </div>
         <div className="space-y-2">
            <Label htmlFor="pillar-title">Título do post pillar</Label>
            <Input
               id="pillar-title"
               value={pillarTitle}
               onChange={(e) => setPillarTitle(e.target.value)}
               placeholder="Título principal"
            />
         </div>
         <div className="space-y-2">
            <Label htmlFor="cluster-mode">Tipo de cluster</Label>
            <Input
               id="cluster-mode"
               value={mode}
               onChange={(e) => setMode(e.target.value)}
               placeholder="ex: changelog, seo, series"
            />
         </div>
         <div className="space-y-2">
            <p className="text-sm font-medium">Posts satélite ({satellites.length})</p>
            {satellites.map((s, i) => (
               <div key={`sat-${i + 1}`} className="flex items-start gap-2 p-2 border rounded-md">
                  <div className="flex-1 space-y-1">
                     <Input
                        value={s.title}
                        onChange={(e) => {
                           const next = [...satellites];
                           next[i] = { ...next[i], title: e.target.value };
                           setSatellites(next);
                        }}
                        placeholder="Título do satélite"
                        className="text-sm"
                     />
                     <p className="text-xs text-muted-foreground px-1">{s.description}</p>
                  </div>
                  <button
                     type="button"
                     onClick={() => removeSatellite(i)}
                     className="text-muted-foreground hover:text-destructive mt-1"
                  >
                     <X className="size-4" />
                  </button>
               </div>
            ))}
            <Button
               variant="outline"
               size="sm"
               onClick={() =>
                  setSatellites((prev) => [
                     ...prev,
                     { title: "", description: "" },
                  ])
               }
            >
               + Adicionar satélite
            </Button>
         </div>
         <div className="flex gap-2">
            <Button
               disabled={!pillarTitle.trim() || createMutation.isPending}
               onClick={handleCreate}
               className="flex-1"
            >
               {createMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Criar cluster
            </Button>
            <Button variant="outline" onClick={() => setStep("describe")}>
               Voltar
            </Button>
         </div>
      </div>
   );
}
```

**Commit:**

```bash
git add apps/web/src/features/clusters/ui/create-cluster-sheet.tsx
git commit -m "feat(clusters): add CreateClusterSheet with AI suggestion step"
```

---

## Task 11: Create `clusters-table-columns.tsx` and `clusters-list-section.tsx`

**Files:**
- Create: `apps/web/src/features/clusters/ui/clusters-table-columns.tsx`
- Create: `apps/web/src/features/clusters/ui/clusters-list-section.tsx`

### `clusters-table-columns.tsx`

```typescript
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Content } from "@packages/database/schemas/content";

export type ClusterRow = Pick<
   Content,
   "id" | "meta" | "status" | "createdAt" | "clusterConfig"
>;

export function createClustersColumns(opts: {
   onOpen: (id: string) => void;
}): ColumnDef<ClusterRow>[] {
   return [
      {
         accessorKey: "meta.title",
         header: "Título",
         cell: ({ row }) => (
            <button
               type="button"
               className="text-left font-medium hover:underline"
               onClick={() => opts.onOpen(row.original.id)}
            >
               {row.original.meta.title}
            </button>
         ),
      },
      {
         accessorKey: "clusterConfig.mode",
         header: "Tipo",
         cell: ({ row }) => {
            const mode = row.original.clusterConfig?.mode;
            return mode ? (
               <Badge variant="secondary">{mode}</Badge>
            ) : (
               <span className="text-muted-foreground text-sm">—</span>
            );
         },
      },
      {
         accessorKey: "status",
         header: "Status",
         cell: ({ row }) => (
            <Badge
               variant={
                  row.original.status === "published" ? "default" : "outline"
               }
            >
               {row.original.status}
            </Badge>
         ),
      },
      {
         accessorKey: "clusterConfig.embedEnabled",
         header: "Embed",
         cell: ({ row }) =>
            row.original.clusterConfig?.embedEnabled ? (
               <Badge variant="default">Ativo</Badge>
            ) : (
               <span className="text-muted-foreground text-sm">—</span>
            ),
      },
      {
         accessorKey: "createdAt",
         header: "Criado em",
         cell: ({ row }) =>
            format(new Date(row.original.createdAt), "dd MMM yyyy", {
               locale: ptBR,
            }),
      },
      {
         id: "actions",
         cell: ({ row }) => (
            <Button
               variant="ghost"
               size="sm"
               onClick={() => opts.onOpen(row.original.id)}
            >
               Ver
            </Button>
         ),
      },
   ];
}
```

### `clusters-list-section.tsx`

```typescript
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { useMemo } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useClusters } from "../hooks/use-clusters";
import { CreateClusterSheet } from "./create-cluster-sheet";
import { createClustersColumns } from "./clusters-table-columns";

export function ClustersListSection() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard/clusters/",
   });
   const { openSheet } = useSheet();
   const { data } = useClusters();

   const columns = useMemo(
      () =>
         createClustersColumns({
            onOpen: (id) =>
               navigate({
                  to: "/$slug/$teamSlug/clusters/$clusterId",
                  params: { slug, teamSlug, clusterId: id },
               }),
         }),
      [navigate, slug, teamSlug],
   );

   if (data.length === 0) {
      return (
         <Empty>
            <EmptyMedia>
               <Network className="size-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyContent>
               <EmptyTitle>Nenhum cluster ainda</EmptyTitle>
               <EmptyDescription>
                  Crie seu primeiro cluster para organizar conteúdos relacionados.
               </EmptyDescription>
            </EmptyContent>
            <button
               type="button"
               className="text-sm underline text-primary"
               onClick={() =>
                  openSheet({ children: <CreateClusterSheet /> })
               }
            >
               Criar cluster
            </button>
         </Empty>
      );
   }

   return (
      <DataTable
         columns={columns}
         data={data}
      />
   );
}
```

**Commit:**

```bash
git add apps/web/src/features/clusters/ui/clusters-table-columns.tsx apps/web/src/features/clusters/ui/clusters-list-section.tsx
git commit -m "feat(clusters): add ClustersListSection and table columns"
```

---

## Task 12: Create cluster detail components

**Files:**
- Create: `apps/web/src/features/clusters/ui/cluster-satellite-list.tsx`
- Create: `apps/web/src/features/clusters/ui/add-satellite-sheet.tsx`
- Create: `apps/web/src/features/clusters/ui/cluster-embed-panel.tsx`
- Create: `apps/web/src/features/clusters/ui/cluster-detail-section.tsx`

### `cluster-satellite-list.tsx`

```typescript
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { useClusterSatellites } from "../hooks/use-cluster-detail";

interface Props {
   pillarId: string;
}

export function ClusterSatelliteList({ pillarId }: Props) {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
   });
   const { data: satellites, refetch } = useClusterSatellites(pillarId);

   const removeMutation = useMutation(
      orpc.relatedContent.removeSatellite.mutationOptions({
         onSuccess: () => {
            toast.success("Satélite removido");
            refetch();
         },
         onError: () => toast.error("Erro ao remover satélite"),
      }),
   );

   if (satellites.length === 0) {
      return (
         <p className="text-sm text-muted-foreground">
            Nenhum post satélite vinculado ainda.
         </p>
      );
   }

   return (
      <div className="space-y-2">
         {satellites.map((rel) => (
            <div
               key={rel.id}
               className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
               <div className="flex-1 min-w-0">
                  <button
                     type="button"
                     className="text-sm font-medium truncate hover:underline text-left"
                     onClick={() =>
                        navigate({
                           to: "/$slug/$teamSlug/content/$contentId/edit",
                           params: {
                              slug,
                              teamSlug,
                              contentId: rel.targetContent.id,
                           },
                        })
                     }
                  >
                     {rel.targetContent.meta.title}
                  </button>
               </div>
               <div className="flex items-center gap-2 ml-2">
                  <Badge
                     variant={
                        rel.targetContent.status === "published"
                           ? "default"
                           : "outline"
                     }
                  >
                     {rel.targetContent.status}
                  </Badge>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() =>
                        removeMutation.mutate({
                           pillarId,
                           satelliteId: rel.targetContent.id,
                        })
                     }
                     disabled={removeMutation.isPending}
                  >
                     Remover
                  </Button>
               </div>
            </div>
         ))}
      </div>
   );
}
```

### `add-satellite-sheet.tsx`

```typescript
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { useSheet } from "@/hooks/use-sheet";

interface Props {
   pillarId: string;
   onSuccess?: () => void;
}

export function AddSatelliteSheet({ pillarId, onSuccess }: Props) {
   const { closeSheet } = useSheet();
   const [search, setSearch] = useState("");

   const { data: contentList } = useSuspenseQuery(
      orpc.content.listAllContent.queryOptions({
         input: { limit: 50, page: 1 },
      }),
   );

   const addMutation = useMutation(
      orpc.relatedContent.addSatellite.mutationOptions({
         onSuccess: () => {
            toast.success("Satélite adicionado!");
            closeSheet();
            onSuccess?.();
         },
         onError: () => toast.error("Erro ao adicionar satélite"),
      }),
   );

   const filtered = contentList.items.filter((c) =>
      c.meta.title.toLowerCase().includes(search.toLowerCase()),
   );

   return (
      <div className="space-y-4 p-6">
         <div>
            <h2 className="text-lg font-semibold">Adicionar satélite</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Selecione um conteúdo existente para vincular como satélite.
            </p>
         </div>
         <Input
            placeholder="Buscar conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
         <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {filtered.map((c) => (
               <button
                  key={c.id}
                  type="button"
                  className="w-full text-left p-3 rounded-md hover:bg-accent text-sm"
                  onClick={() =>
                     addMutation.mutate({
                        pillarId,
                        satelliteId: c.id,
                     })
                  }
                  disabled={addMutation.isPending}
               >
                  {c.meta.title}
               </button>
            ))}
            {filtered.length === 0 && (
               <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum conteúdo encontrado.
               </p>
            )}
         </div>
      </div>
   );
}
```

### `cluster-embed-panel.tsx`

```typescript
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Switch } from "@packages/ui/components/switch";
import { Loader2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Content } from "@packages/database/schemas/content";
import { useClusterEmbedSettings } from "../hooks/use-cluster-embed-settings";

interface Props {
   cluster: Content;
   onSaved?: () => void;
}

export function ClusterEmbedPanel({ cluster, onSaved }: Props) {
   const cfg = cluster.clusterConfig ?? {};
   const [embedEnabled, setEmbedEnabled] = useState(cfg.embedEnabled ?? false);
   const [theme, setTheme] = useState<"light" | "dark" | "auto">(
      cfg.embedSettings?.theme ?? "auto",
   );
   const [label, setLabel] = useState(cfg.embedSettings?.label ?? "What's New");
   const [accentColor, setAccentColor] = useState(
      cfg.embedSettings?.accentColor ?? "#6366f1",
   );

   const updateMutation = useClusterEmbedSettings();

   const apiKey = "sk_..."; // Placeholder — instruct user to use their API key
   const snippet = `<script\n  src="https://cdn.contentta.com/embed.js"\n  data-api-key="${apiKey}"\n  data-cluster-id="${cluster.id}"\n  data-theme="${theme}"\n></script>`;

   const handleSave = () => {
      updateMutation.mutate(
         {
            id: cluster.id,
            clusterConfig: {
               embedEnabled,
               embedSettings: { theme, label, accentColor },
            },
         },
         { onSuccess: onSaved },
      );
   };

   const copySnippet = () => {
      navigator.clipboard.writeText(snippet);
      toast.success("Snippet copiado!");
   };

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <p className="font-medium">Embed ativado</p>
               <p className="text-sm text-muted-foreground">
                  Permite incorporar este cluster em sites externos.
               </p>
            </div>
            <Switch
               checked={embedEnabled}
               onCheckedChange={setEmbedEnabled}
            />
         </div>

         {embedEnabled && (
            <>
               <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex gap-2">
                     {(["light", "dark", "auto"] as const).map((t) => (
                        <button
                           key={t}
                           type="button"
                           className={`px-3 py-1 rounded-md border text-sm ${
                              theme === t
                                 ? "border-primary bg-primary/10"
                                 : "border-input"
                           }`}
                           onClick={() => setTheme(t)}
                        >
                           {t}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <Label htmlFor="embed-label">Label do badge</Label>
                  <Input
                     id="embed-label"
                     value={label}
                     onChange={(e) => setLabel(e.target.value)}
                     placeholder="What's New"
                  />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="embed-accent">Cor de destaque</Label>
                  <Input
                     id="embed-accent"
                     type="color"
                     value={accentColor}
                     onChange={(e) => setAccentColor(e.target.value)}
                     className="h-10 w-20"
                  />
               </div>
               <div className="space-y-2">
                  <Label>Script de embed</Label>
                  <div className="relative">
                     <pre className="text-xs bg-muted rounded-md p-3 pr-10 overflow-x-auto">
                        {snippet}
                     </pre>
                     <button
                        type="button"
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                        onClick={copySnippet}
                     >
                        <Copy className="size-4" />
                     </button>
                  </div>
               </div>
            </>
         )}

         <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
         >
            {updateMutation.isPending && (
               <Loader2 className="size-4 mr-2 animate-spin" />
            )}
            Salvar
         </Button>
      </div>
   );
}
```

### `cluster-detail-section.tsx`

```typescript
import { Button } from "@packages/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ExternalLink, Plus } from "lucide-react";
import { useSheet } from "@/hooks/use-sheet";
import { useClusterDetail } from "../hooks/use-cluster-detail";
import { AddSatelliteSheet } from "./add-satellite-sheet";
import { ClusterEmbedPanel } from "./cluster-embed-panel";
import { ClusterSatelliteList } from "./cluster-satellite-list";

export function ClusterDetailSection() {
   const { slug, teamSlug, clusterId } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
   });
   const navigate = useNavigate();
   const { openSheet } = useSheet();
   const { data: cluster, refetch } = useClusterDetail(clusterId);

   const openPillar = () =>
      navigate({
         to: "/$slug/$teamSlug/content/$contentId/edit",
         params: { slug, teamSlug, contentId: cluster.id },
      });

   return (
      <div className="space-y-6">
         <div className="flex items-start justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">
                  {cluster.meta.title}
               </h1>
               {cluster.clusterConfig?.mode && (
                  <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                     {cluster.clusterConfig.mode}
                  </p>
               )}
            </div>
            <Button variant="outline" size="sm" onClick={openPillar}>
               <ExternalLink className="size-4 mr-2" />
               Editar pillar
            </Button>
         </div>

         <Tabs defaultValue="satellites">
            <TabsList>
               <TabsTrigger value="satellites">Posts Satélite</TabsTrigger>
               <TabsTrigger value="embed">Embed</TabsTrigger>
            </TabsList>

            <TabsContent value="satellites" className="space-y-4 pt-4">
               <div className="flex justify-end">
                  <Button
                     size="sm"
                     onClick={() =>
                        openSheet({
                           children: (
                              <AddSatelliteSheet
                                 pillarId={clusterId}
                                 onSuccess={() => refetch()}
                              />
                           ),
                        })
                     }
                  >
                     <Plus className="size-4 mr-2" />
                     Adicionar satélite
                  </Button>
               </div>
               <ClusterSatelliteList pillarId={clusterId} />
            </TabsContent>

            <TabsContent value="embed" className="pt-4">
               <ClusterEmbedPanel cluster={cluster} onSaved={() => refetch()} />
            </TabsContent>
         </Tabs>
      </div>
   );
}
```

**Commit:**

```bash
git add apps/web/src/features/clusters/ui/
git commit -m "feat(clusters): add cluster detail UI components (satellite list, embed panel, detail section, add satellite sheet)"
```

---

## Task 13: Create routes

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/index.tsx`
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId.tsx`

### `clusters/index.tsx`

```typescript
import { Button } from "@packages/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { Network, Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSheet } from "@/hooks/use-sheet";
import { ClustersListSection } from "@/features/clusters/ui/clusters-list-section";
import { CreateClusterSheet } from "@/features/clusters/ui/create-cluster-sheet";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/",
)({
   component: ClustersPage,
});

function ClustersPage() {
   const { openSheet } = useSheet();

   return (
      <div className="space-y-6 p-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif flex items-center gap-2">
                  <Network className="size-6" />
                  Clusters
               </h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Organize conteúdos relacionados em grupos temáticos.
               </p>
            </div>
            <Button
               onClick={() =>
                  openSheet({ children: <CreateClusterSheet /> })
               }
            >
               <Plus className="size-4 mr-2" />
               Novo cluster
            </Button>
         </div>
         <ErrorBoundary fallback={<p className="text-sm text-muted-foreground">Erro ao carregar clusters.</p>}>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
               <ClustersListSection />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}
```

### `clusters/$clusterId.tsx`

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterDetailSection } from "@/features/clusters/ui/cluster-detail-section";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/clusters/$clusterId",
)({
   component: ClusterDetailPage,
});

function ClusterDetailPage() {
   return (
      <div className="p-6">
         <ErrorBoundary fallback={<p className="text-sm text-muted-foreground">Erro ao carregar cluster.</p>}>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
               <ClusterDetailSection />
            </Suspense>
         </ErrorBoundary>
      </div>
   );
}
```

**Commit:**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/clusters/
git commit -m "feat(routes): add clusters list and detail routes"
```

---

## Task 14: SDK Server — `clusters` router

**Files:**
- Create: `apps/sdk-server/src/orpc/router/clusters.ts`
- Modify: `apps/sdk-server/src/orpc/router/index.ts`

### `clusters.ts`

Check what the existing `sdkProcedure` looks like first:

```bash
# Read apps/sdk-server/src/orpc/router/forms.ts lines 1-15 to find the sdkProcedure import
```

Then create:

```typescript
import { ORPCError } from "@orpc/server";
import { getContentById } from "@packages/database/repositories/content-repository";
import { getPublishedRelatedContent } from "@packages/database/repositories/related-content-repository";
import { z } from "zod";
import { sdkProcedure } from "../server"; // adjust import path if needed

/**
 * Get embed config + published satellite entries for a cluster pillar.
 * Used by the ContenttaChangelogClient SDK embed.
 */
export const getEmbed = sdkProcedure
   .input(z.object({ pillarId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (
         !pillar ||
         !pillar.clusterConfig ||
         Object.keys(pillar.clusterConfig).length === 0
      ) {
         throw new ORPCError("NOT_FOUND", { message: "Cluster not found." });
      }

      if (!pillar.clusterConfig.embedEnabled) {
         throw new ORPCError("FORBIDDEN", {
            message: "Embed not enabled for this cluster.",
         });
      }

      const entries = await getPublishedRelatedContent(db, input.pillarId);

      return {
         config: pillar.clusterConfig,
         pillarTitle: pillar.meta.title,
         entries: entries.map((e) => ({
            id: e.id,
            title: e.meta.title,
            description: e.meta.description,
            createdAt: e.createdAt,
         })),
      };
   });

/**
 * Get a single published cluster entry by ID.
 */
export const getEntry = sdkProcedure
   .input(z.object({ contentId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db } = context;

      const item = await getContentById(db, input.contentId);
      if (!item || item.status !== "published" || item.shareStatus !== "shared") {
         throw new ORPCError("NOT_FOUND", { message: "Entry not found." });
      }

      return {
         id: item.id,
         title: item.meta.title,
         description: item.meta.description,
         body: item.body,
         createdAt: item.createdAt,
      };
   });
```

### Update `apps/sdk-server/src/orpc/router/index.ts`

Add:

```typescript
import * as clusters from "./clusters";

export default {
   clusters,
   content,
   events,
   forms,
};
```

**Commit:**

```bash
git add apps/sdk-server/src/orpc/router/clusters.ts apps/sdk-server/src/orpc/router/index.ts
git commit -m "feat(sdk-server): add clusters router for embed API"
```

---

## Task 15: SDK Client — `ContenttaChangelogClient`

**Files:**
- Create: `libraries/sdk/src/changelog.ts`
- Modify: `libraries/sdk/src/index.ts`

### `changelog.ts`

Follow the same pattern as `forms.ts` (vanilla JS, no React, CSS injection once):

```typescript
import type { ContenttaSdkConfig } from "./events/types.ts";
import { createSdk } from "./index.ts";

// ── Types ────────────────────────────────────────────────────────

interface ChangelogEntry {
	id: string;
	title: string;
	description: string;
	createdAt: string;
}

interface EmbedConfig {
	theme?: "light" | "dark" | "auto";
	label?: string;
	accentColor?: string;
}

// ── CSS ─────────────────────────────────────────────────────────

let stylesInjected = false;

function injectChangelogStyles(accentColor = "#6366f1"): void {
	if (stylesInjected) return;
	stylesInjected = true;

	const style = document.createElement("style");
	style.textContent = `
.ctt-changelog-badge {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: ${accentColor};
  color: #fff;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 9998;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  transition: transform 0.15s ease;
}
.ctt-changelog-badge:hover { transform: scale(1.04); }
.ctt-changelog-badge--inline {
  position: static;
  border-radius: 0.5rem;
  box-shadow: none;
}
.ctt-changelog-popover {
  position: fixed;
  bottom: 5rem;
  right: 1.5rem;
  width: 22rem;
  max-height: 28rem;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow-y: auto;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.ctt-changelog-popover--dark { background: #1a1a2e; color: #e2e8f0; }
.ctt-changelog-popover__header {
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  font-weight: 600;
  font-size: 0.9375rem;
}
.ctt-changelog-popover--dark .ctt-changelog-popover__header { border-color: rgba(255,255,255,0.08); }
.ctt-changelog-entry {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;
  transition: background 0.1s;
}
.ctt-changelog-entry:hover { background: rgba(0,0,0,0.03); }
.ctt-changelog-popover--dark .ctt-changelog-entry { border-color: rgba(255,255,255,0.06); }
.ctt-changelog-popover--dark .ctt-changelog-entry:hover { background: rgba(255,255,255,0.04); }
.ctt-changelog-entry__title {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 0.25rem;
}
.ctt-changelog-entry__date {
  font-size: 0.75rem;
  color: #9ca3af;
}
.ctt-changelog-entry__desc {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}
.ctt-changelog-popover--dark .ctt-changelog-entry__desc { color: #94a3b8; }
  `;
	document.head.appendChild(style);
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(iso));
}

// ── Client class ─────────────────────────────────────────────────

export class ContenttaChangelogClient {
	private sdk: ReturnType<typeof createSdk>;
	private clusterId: string;
	private config: EmbedConfig;
	private containerId: string | null;
	private popoverEl: HTMLElement | null = null;
	private badgeEl: HTMLElement | null = null;

	constructor(
		sdkConfig: ContenttaSdkConfig,
		opts: {
			clusterId: string;
			theme?: "light" | "dark" | "auto";
			label?: string;
			accentColor?: string;
			containerId?: string;
		},
	) {
		this.sdk = createSdk(sdkConfig);
		this.clusterId = opts.clusterId;
		this.containerId = opts.containerId ?? null;
		this.config = {
			theme: opts.theme ?? "auto",
			label: opts.label ?? "What's New",
			accentColor: opts.accentColor ?? "#6366f1",
		};
	}

	async init(): Promise<void> {
		injectChangelogStyles(this.config.accentColor);
		const data = await this.sdk.clusters.getEmbed({ pillarId: this.clusterId });
		this.render(data.entries, data.config);
	}

	private resolvedTheme(): "light" | "dark" {
		if (this.config.theme === "dark") return "dark";
		if (this.config.theme === "light") return "light";
		return window.matchMedia?.("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}

	private render(entries: ChangelogEntry[], cfg: EmbedConfig): void {
		const theme = this.resolvedTheme();
		const accentColor = cfg.accentColor ?? this.config.accentColor ?? "#6366f1";
		const label = cfg.label ?? this.config.label ?? "What's New";

		if (this.containerId) {
			this.renderInline(entries, theme, label);
		} else {
			this.renderBadgeWithPopover(entries, theme, label, accentColor);
		}
	}

	private renderInline(
		entries: ChangelogEntry[],
		theme: "light" | "dark",
		label: string,
	): void {
		const container = document.getElementById(this.containerId!);
		if (!container) return;
		container.innerHTML = this.buildPopoverHTML(entries, theme, label, true);
	}

	private renderBadgeWithPopover(
		entries: ChangelogEntry[],
		theme: "light" | "dark",
		label: string,
		accentColor: string,
	): void {
		// Badge
		const badge = document.createElement("button");
		badge.type = "button";
		badge.className = "ctt-changelog-badge";
		badge.style.background = accentColor;
		badge.textContent = `${entries.length > 0 ? `${entries.length} ` : ""}${label}`;
		badge.setAttribute("aria-expanded", "false");
		document.body.appendChild(badge);
		this.badgeEl = badge;

		// Popover (hidden by default)
		const popover = document.createElement("div");
		popover.className = `ctt-changelog-popover${theme === "dark" ? " ctt-changelog-popover--dark" : ""}`;
		popover.style.display = "none";
		popover.innerHTML = this.buildPopoverHTML(entries, theme, label, false);
		document.body.appendChild(popover);
		this.popoverEl = popover;

		badge.addEventListener("click", () => {
			const isOpen = popover.style.display !== "none";
			popover.style.display = isOpen ? "none" : "block";
			badge.setAttribute("aria-expanded", String(!isOpen));
		});

		document.addEventListener("click", (e) => {
			if (!badge.contains(e.target as Node) && !popover.contains(e.target as Node)) {
				popover.style.display = "none";
				badge.setAttribute("aria-expanded", "false");
			}
		});
	}

	private buildPopoverHTML(
		entries: ChangelogEntry[],
		theme: "light" | "dark",
		label: string,
		isInline: boolean,
	): string {
		const darkClass = theme === "dark" && !isInline ? " ctt-changelog-popover--dark" : "";
		return `
      <div class="ctt-changelog-popover__header">${escapeHtml(label)}</div>
      ${
			entries.length === 0
				? '<p style="padding:1rem 1.25rem;font-size:0.875rem;color:#9ca3af;">Nenhuma entrada ainda.</p>'
				: entries
						.map(
							(e) => `
        <div class="ctt-changelog-entry" data-entry-id="${escapeHtml(e.id)}">
          <p class="ctt-changelog-entry__title">${escapeHtml(e.title)}</p>
          <p class="ctt-changelog-entry__date">${formatDate(e.createdAt)}</p>
          ${e.description ? `<p class="ctt-changelog-entry__desc">${escapeHtml(e.description)}</p>` : ""}
        </div>
      `,
						)
						.join("")
		}
    `;
	}
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
```

### Update `libraries/sdk/src/index.ts`

Add export after existing exports:

```typescript
export { ContenttaChangelogClient } from "./changelog.ts";
```

**Commit:**

```bash
git add libraries/sdk/src/changelog.ts libraries/sdk/src/index.ts
git commit -m "feat(sdk): add ContenttaChangelogClient for changelog embed"
```

---

## Task 16: Typecheck

Run typecheck to catch any import or type errors introduced:

```bash
bun run typecheck
```

Fix any errors before proceeding. Common issues:
- Missing `clusterConfig` in `updateContent` call (add to update params type in repo)
- `listClusters` import missing from content-repository exports in `package.json`
- `createRequestContext` import from `@packages/agents` — verify the export name

---

## Task 17: Verify `listAllContent` pagination shape

The `AddSatelliteSheet` uses `contentList.items` — verify the actual shape returned by `orpc.content.listAllContent`. If it returns an array directly (not `{ items, total }`), adjust accordingly.

```bash
# Read apps/web/src/integrations/orpc/router/content.ts lines 200-280 to find listAllContent
```

Adjust `filtered = contentList.items.filter(...)` to match the actual return shape.

---

## Task 18: Final typecheck + commit

```bash
bun run typecheck
bun run check
```

Fix any remaining Biome lint warnings. Then:

```bash
git add -A
git commit -m "fix(clusters): address typecheck and lint issues"
```

---

## Checklist Summary

- [x] Schema: `clusterConfig` JSONB added to `content` table
- [x] Schema: `request`/`draftOrigin` kept in DB but removed from router input
- [x] Repository: `listClustersByTeam()` added
- [x] oRPC Router: `related-content.ts` (addSatellite, removeSatellite, listSatellites, reorderSatellites)
- [x] oRPC Router: `clusters.ts` (list, getById, promote, updateConfig, create, suggestStructure)
- [x] Router index: both routers registered
- [x] Settings page: `DefaultLayoutSection` removed, `defaultLayout` removed from schema
- [x] Sidebar: "Clusters" nav item added
- [x] Feature hooks: use-clusters, use-cluster-detail, use-batch-generate, use-cluster-embed-settings
- [x] Feature UI: CreateClusterSheet, ClustersListSection, ClustersTableColumns, ClusterDetailSection, ClusterSatelliteList, AddSatelliteSheet, ClusterEmbedPanel
- [x] Routes: clusters/index.tsx, clusters/$clusterId.tsx
- [x] SDK Server: clusters router (getEmbed, getEntry)
- [x] SDK Client: ContenttaChangelogClient
- [x] Typecheck passes

---

## Out of Scope (deferred)

- **Experiment results in cluster view** — experiment router exists and schema supports "cluster" target type, but the UI integration requires #563 to be fully wired up. Left as a follow-up.
- **DB migration to drop `request`/`draftOrigin` columns** — destructive migration. Defer until confirmed no data depends on them.
- **Batch generation with streaming** — `batchCreate` creates stub posts; AI generation per-post can be triggered individually using the existing `useUnifiedAgent` hook on each satellite.
- **Internal linking panel in editor** — deferred to follow-up after clusters are stable.
