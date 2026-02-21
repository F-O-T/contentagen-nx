# Asset Bank + Media Plugin (Plate.js) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an org-scoped image asset bank (MinIO + Postgres) and wire Plate.js MediaPlugin to upload files into it, replacing Lexical's ImageNode.

**Architecture:** Three-layer approach — (1) backend: Drizzle schema + repository + oRPC router for CRUD and presigned URLs; (2) editor: Plate.js MediaKit plugin with a custom upload hook that calls oRPC then PUTs to MinIO; (3) UI: asset gallery page + reusable modal for editor insertion.

**Tech Stack:** Plate.js v52 (`@platejs/media/react`, `@platejs/caption/react`, `@platejs/dnd`), oRPC + TanStack Query, Drizzle ORM, MinIO presigned PUTs, BullMQ (thumbnail job), `nanoid`

---

## Context & Patterns to Know

- **Presigned upload pattern**: `generatePresignedPutUrl(fileName, bucket, minioClient, ttlSeconds)` from `@packages/files/client` → client PUTs directly to MinIO → server records metadata. See `apps/web/src/integrations/orpc/router/organization.ts:286-321` for exact pattern.
- **File proxy route**: All MinIO files are served via `/api/files/<bucket>/<key>`, e.g. `/api/files/contentta/orgs/org123/assets/img.webp`.
- **Repository pattern**: `propagateError(err)` then `throw AppError.database(...)`. Always wrap DB calls in `try/catch`.
- **oRPC router errors**: `throw new ORPCError("NOT_FOUND", { message: "..." })` — never native `Error`.
- **Event emission**: `emitEvent()` is non-throwing. Call it fire-and-forget, no await needed for result.
- **Plate.js interactive components**: `ImageElement`, `VideoElement`, `FileElement`, `Caption`, `CaptionTextarea`, `MediaToolbar` are all pre-built in `packages/ui/src/components/`. Import from `@packages/ui/components/<name>`.
- **Plate.js v52 upload**: `PlaceholderPlugin` from `@platejs/media/react` handles upload placeholders. Configure with `onUploadFile` (async function returning `{ url: string, name: string }`) and `uploadConfig` per media type.
- **Client-side mutations**: callbacks go INSIDE `mutationOptions()`. No `invalidateQueries` needed per-mutation (global cache invalidation on every mutation success is already wired in).

---

## Phase 1: Database Layer

### Task 1: Create Asset Schema

**Files:**
- Create: `packages/database/src/schemas/assets.ts`

**Step 1: Write the schema**

```typescript
// packages/database/src/schemas/assets.ts
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: text("organization_id").notNull(),
  teamId: text("team_id"), // null = org-wide
  fileKey: text("file_key").notNull().unique(),
  bucket: text("bucket").notNull().default("contentta"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // bytes
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  caption: text("caption"),
  tags: text("tags").array().notNull().default([]),
  thumbnailKey: text("thumbnail_key"),
  publicUrl: text("public_url").notNull(),
  uploaderId: text("uploader_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type AssetInsert = typeof assets.$inferInsert;
```

**Step 2: Push schema to DB**

```bash
bun run db:push
```

Expected: Drizzle creates `assets` table without errors.

**Step 3: Export from schema.ts**

In `packages/database/src/schema.ts`, add before the final export:

```typescript
export * from "./schemas/assets";
```

**Step 4: Commit**

```bash
git add packages/database/src/schemas/assets.ts packages/database/src/schema.ts
git commit -m "feat(db): add assets table schema for image bank"
```

---

### Task 2: Create Asset Repository

**Files:**
- Create: `packages/database/src/repositories/asset-repository.ts`

**Step 1: Write the repository**

```typescript
// packages/database/src/repositories/asset-repository.ts
import { AppError, propagateError } from "@packages/utils/errors";
import {
  and,
  arrayContains,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { type Asset, type AssetInsert, assets } from "../schemas/assets";

export type ListAssetsFilters = {
  organizationId: string;
  teamId?: string | null;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
};

export async function createAsset(
  db: DatabaseInstance,
  data: AssetInsert,
): Promise<Asset> {
  try {
    const result = await db.insert(assets).values(data).returning();
    return result[0]!;
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to create asset");
  }
}

export async function getAssetById(
  db: DatabaseInstance,
  id: string,
  organizationId: string,
): Promise<Asset | undefined> {
  try {
    return await db.query.assets.findFirst({
      where: (a, { eq, and }) =>
        and(eq(a.id, id), eq(a.organizationId, organizationId)),
    });
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to get asset");
  }
}

export async function listAssets(
  db: DatabaseInstance,
  filters: ListAssetsFilters,
): Promise<{ items: Asset[]; total: number }> {
  try {
    const {
      organizationId,
      teamId,
      search,
      tags,
      limit = 24,
      offset = 0,
    } = filters;

    const conditions = [eq(assets.organizationId, organizationId)];

    // teamId = null means org-wide; teamId = string means filter by team
    if (teamId !== undefined) {
      conditions.push(
        teamId === null
          ? sql`${assets.teamId} IS NULL`
          : eq(assets.teamId, teamId),
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(assets.filename, `%${search}%`),
          ilike(assets.alt, `%${search}%`),
          ilike(assets.caption, `%${search}%`),
        )!,
      );
    }

    if (tags?.length) {
      conditions.push(arrayContains(assets.tags, tags));
    }

    const where = and(...conditions);

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(assets)
        .where(where)
        .orderBy(desc(assets.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(assets)
        .where(where),
    ]);

    return { items, total: countResult[0]?.count ?? 0 };
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to list assets");
  }
}

export async function updateAsset(
  db: DatabaseInstance,
  id: string,
  organizationId: string,
  data: Partial<Pick<Asset, "alt" | "caption" | "tags" | "thumbnailKey">>,
): Promise<Asset> {
  try {
    const result = await db
      .update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(assets.id, id), eq(assets.organizationId, organizationId)))
      .returning();
    if (!result[0]) throw new Error("Asset not found");
    return result[0];
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to update asset");
  }
}

export async function deleteAsset(
  db: DatabaseInstance,
  id: string,
  organizationId: string,
): Promise<Asset> {
  try {
    const result = await db
      .delete(assets)
      .where(and(eq(assets.id, id), eq(assets.organizationId, organizationId)))
      .returning();
    if (!result[0]) throw new Error("Asset not found");
    return result[0];
  } catch (err) {
    propagateError(err);
    throw AppError.database("Failed to delete asset");
  }
}
```

**Step 2: Register query relation in DB client**

Open `packages/database/src/client.ts` (or wherever `db.query` relations are configured). Add `assets` to the schema object passed to `drizzle()`.

Look for the existing `schema` import and add:
```typescript
import * as assetsSchema from "./schemas/assets";
// Then add assetsSchema to the merged schema object
```

**Step 3: Commit**

```bash
git add packages/database/src/repositories/asset-repository.ts packages/database/src/client.ts
git commit -m "feat(db): add asset repository with list/CRUD/search"
```

---

## Phase 2: Events + API Layer

### Task 3: Create Asset Events

**Files:**
- Create: `packages/events/src/assets.ts`

**Step 1: Write asset events**

```typescript
// packages/events/src/assets.ts
import { z } from "zod";
import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

export const ASSET_EVENTS = {
  "asset.upload_completed": "asset.upload_completed",
  "asset.deleted": "asset.deleted",
  "asset.thumbnail_generated": "asset.thumbnail_generated",
} as const;

export type AssetEventName =
  (typeof ASSET_EVENTS)[keyof typeof ASSET_EVENTS];

// ---------------------------------------------------------------------------
// Typed emit helpers
// ---------------------------------------------------------------------------

const uploadCompletedSchema = z.object({
  assetId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  organizationId: z.string(),
  teamId: z.string().nullable().optional(),
  uploaderId: z.string(),
});

export type AssetUploadCompletedProperties = z.infer<
  typeof uploadCompletedSchema
>;

export function emitAssetUploadCompleted(
  params: Omit<EmitEventParams, "eventName" | "eventCategory"> &
    AssetUploadCompletedProperties,
) {
  const { assetId, filename, mimeType, size, organizationId, teamId, uploaderId, ...rest } =
    params;
  emitEvent({
    ...rest,
    organizationId,
    eventName: ASSET_EVENTS["asset.upload_completed"],
    eventCategory: EVENT_CATEGORIES.content,
    properties: {
      assetId,
      filename,
      mimeType,
      size,
      teamId: teamId ?? null,
      uploaderId,
    },
  });
}

export function emitAssetDeleted(
  params: Omit<EmitEventParams, "eventName" | "eventCategory"> & {
    assetId: string;
    organizationId: string;
  },
) {
  const { assetId, organizationId, ...rest } = params;
  emitEvent({
    ...rest,
    organizationId,
    eventName: ASSET_EVENTS["asset.deleted"],
    eventCategory: EVENT_CATEGORIES.content,
    properties: { assetId },
  });
}
```

**Step 2: Export from events package index**

Check `packages/events/package.json` exports — there is likely a root export that re-exports everything. If so, add `./assets` export or re-export from the main entry:

Add to the events package index (wherever content.ts and ai.ts are exported from):
```typescript
export * from "./assets";
```

**Step 3: Commit**

```bash
git add packages/events/src/assets.ts
git commit -m "feat(events): add asset.upload_completed and asset.deleted events"
```

---

### Task 4: Create oRPC Assets Router

**Files:**
- Create: `apps/web/src/integrations/orpc/router/assets.ts`

**Step 1: Write the router**

```typescript
// apps/web/src/integrations/orpc/router/assets.ts
import { ORPCError } from "@orpc/server";
import {
  createAsset,
  deleteAsset,
  getAssetById,
  listAssets,
  updateAsset,
} from "@packages/database/repositories/asset-repository";
import { env as serverEnv } from "@packages/environment/server";
import { emitAssetDeleted, emitAssetUploadCompleted } from "@packages/events/assets";
import {
  deleteFile,
  generatePresignedPutUrl,
  getMinioClient,
} from "@packages/files/client";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure } from "../server";

const ASSETS_BUCKET = serverEnv.MINIO_BUCKET ?? "contentta";

// ---------------------------------------------------------------------------
// generateUploadUrl — returns a presigned PUT URL + fileKey for client upload
// ---------------------------------------------------------------------------
export const generateUploadUrl = protectedProcedure
  .input(
    z.object({
      teamId: z.string().uuid().optional(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number().int().positive(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { organizationId } = context;
    const ext = input.filename.split(".").pop() ?? "bin";
    const fileKey = `orgs/${organizationId}/assets/${nanoid()}.${ext}`;

    try {
      const minioClient = getMinioClient(serverEnv);
      const presignedUrl = await generatePresignedPutUrl(
        fileKey,
        ASSETS_BUCKET,
        minioClient,
        300, // 5 minutes
      );
      const publicUrl = `/api/files/${ASSETS_BUCKET}/${fileKey}`;
      return { presignedUrl, fileKey, publicUrl };
    } catch {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to generate upload URL",
      });
    }
  });

// ---------------------------------------------------------------------------
// completeUpload — registers the asset in DB after client upload
// ---------------------------------------------------------------------------
export const completeUpload = protectedProcedure
  .input(
    z.object({
      teamId: z.string().uuid().optional(),
      fileKey: z.string(),
      publicUrl: z.string(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number().int().positive(),
      width: z.number().int().optional(),
      height: z.number().int().optional(),
      alt: z.string().optional(),
      caption: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db, organizationId, userId } = context;

    const asset = await createAsset(db, {
      organizationId,
      teamId: input.teamId ?? null,
      fileKey: input.fileKey,
      bucket: ASSETS_BUCKET,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      alt: input.alt ?? null,
      caption: input.caption ?? null,
      tags: input.tags ?? [],
      publicUrl: input.publicUrl,
      uploaderId: userId,
    });

    emitAssetUploadCompleted({
      assetId: asset.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      size: asset.size,
      organizationId,
      teamId: asset.teamId,
      uploaderId: userId,
      userId,
    });

    return asset;
  });

// ---------------------------------------------------------------------------
// list — paginated list with search and tag filter
// ---------------------------------------------------------------------------
export const list = protectedProcedure
  .input(
    z.object({
      teamId: z.string().uuid().nullable().optional(),
      search: z.string().optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().int().min(1).max(100).default(24),
      offset: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db, organizationId } = context;
    return listAssets(db, { organizationId, ...input });
  });

// ---------------------------------------------------------------------------
// get — single asset by id (org-scoped)
// ---------------------------------------------------------------------------
export const get = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db, organizationId } = context;
    const asset = await getAssetById(db, input.id, organizationId);
    if (!asset) {
      throw new ORPCError("NOT_FOUND", { message: "Asset not found" });
    }
    return asset;
  });

// ---------------------------------------------------------------------------
// update — alt, caption, tags
// ---------------------------------------------------------------------------
export const update = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      alt: z.string().optional(),
      caption: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db, organizationId } = context;
    const { id, ...data } = input;
    const asset = await updateAsset(db, id, organizationId, data);
    return asset;
  });

// ---------------------------------------------------------------------------
// remove — delete asset from DB and MinIO
// ---------------------------------------------------------------------------
export const remove = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db, organizationId, userId } = context;

    const asset = await getAssetById(db, input.id, organizationId);
    if (!asset) {
      throw new ORPCError("NOT_FOUND", { message: "Asset not found" });
    }

    // Delete from MinIO first (best-effort)
    try {
      const minioClient = getMinioClient(serverEnv);
      await deleteFile(asset.fileKey, asset.bucket, minioClient);
    } catch {
      // Non-fatal: DB record still gets deleted
    }

    await deleteAsset(db, input.id, organizationId);

    emitAssetDeleted({ assetId: asset.id, organizationId, userId });

    return { success: true };
  });
```

**Step 2: Commit**

```bash
git add apps/web/src/integrations/orpc/router/assets.ts
git commit -m "feat(orpc): add assets router (upload, list, get, update, delete)"
```

---

### Task 5: Register Assets Router

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/index.ts`

**Step 1: Add import and register**

Add after the last import line:
```typescript
import * as assetsRouter from "./assets";
```

Add to the exported object:
```typescript
assets: assetsRouter,
```

**Step 2: Verify TypeScript**

```bash
bun run typecheck 2>&1 | grep -i asset
```

Expected: no errors related to assets.

**Step 3: Commit**

```bash
git add apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(orpc): register assets router"
```

---

## Phase 3: Editor Media Plugin

### Task 6: Create Upload Hook

**Files:**
- Create: `apps/web/src/features/editor/plate/hooks/use-editor-upload-file.ts`

**What this does:** Called by Plate's `PlaceholderPlugin` when a file is dropped or pasted into the editor. Returns `{ url, name }` for Plate to replace the placeholder with the real image node.

**Step 1: Write the hook**

```typescript
// apps/web/src/features/editor/plate/hooks/use-editor-upload-file.ts
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

interface UploadResult {
  url: string;
  name: string;
}

interface UseEditorUploadFileOptions {
  teamId?: string;
}

/**
 * Returns an `uploadFile` function compatible with Plate.js's PlaceholderPlugin.
 *
 * Flow:
 *   1. Call oRPC `assets.generateUploadUrl` → get presigned PUT URL + fileKey
 *   2. PUT the file directly to MinIO via the presigned URL
 *   3. Call oRPC `assets.completeUpload` → record asset in DB
 *   4. Return { url: asset.publicUrl, name: asset.filename } for Plate
 */
export function useEditorUploadFile(
  options: UseEditorUploadFileOptions = {},
): (file: File) => Promise<UploadResult> {
  const { teamId } = options;

  const generateUrl = useMutation(
    orpc.assets.generateUploadUrl.mutationOptions(),
  );
  const completeUpload = useMutation(
    orpc.assets.completeUpload.mutationOptions(),
  );

  return useCallback(
    async (file: File): Promise<UploadResult> => {
      // 1. Get presigned PUT URL from server
      const { presignedUrl, fileKey, publicUrl } =
        await generateUrl.mutateAsync({
          teamId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

      // 2. PUT directly to MinIO
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // 3. Extract image dimensions if it's an image
      let width: number | undefined;
      let height: number | undefined;
      if (file.type.startsWith("image/")) {
        const dims = await getImageDimensions(file);
        width = dims.width;
        height = dims.height;
      }

      // 4. Register in DB
      const asset = await completeUpload.mutateAsync({
        teamId,
        fileKey,
        publicUrl,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        width,
        height,
      });

      return { url: asset.publicUrl, name: asset.filename };
    },
    [generateUrl, completeUpload, teamId],
  );
}

// ---------------------------------------------------------------------------
// Helper: get image dimensions from a File object
// ---------------------------------------------------------------------------
function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/plate/hooks/use-editor-upload-file.ts
git commit -m "feat(editor): add useEditorUploadFile hook for MinIO presigned uploads"
```

---

### Task 7: Create MediaKit Plugin

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/media-kit.tsx`

**What this does:** Configures the Plate.js media plugins (Image, Video, Audio, File, Caption, Placeholder, DnD) with the interactive UI components from `@packages/ui` and connects the upload handler.

**Step 1: Verify @platejs/media is installed in apps/web**

```bash
grep '@platejs/media' apps/web/package.json
```

If not found, install:
```bash
bun add @platejs/media @platejs/caption @platejs/dnd @platejs/resizable --filter apps/web
```

**Step 2: Write the MediaKit plugin**

```typescript
// apps/web/src/features/editor/plate/plugins/media-kit.tsx
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from "@platejs/media/react";
import { CaptionPlugin } from "@platejs/caption/react";
import { DndPlugin } from "@platejs/dnd";
import { KEYS } from "platejs";

// Interactive UI components (already built in @packages/ui)
import { ImageElement } from "@packages/ui/components/media-image-node";
import { VideoElement } from "@packages/ui/components/media-video-node";
import { AudioElement } from "@packages/ui/components/media-audio-node";
import { FileElement } from "@packages/ui/components/media-file-node";

// ---------------------------------------------------------------------------
// MediaPlaceholderElement — shows upload progress bar
// ---------------------------------------------------------------------------
// NOTE: If @platejs/media/react exports MediaPlaceholderElement, import it.
// Otherwise, check the Plate.js v52 docs or run:
//   bunx shadcn@latest add https://platejs.org/r/media-placeholder-element
// to get the component, then place it in:
//   apps/web/src/features/editor/plate/ui/media-placeholder-element.tsx
// and import from there.
//
// Placeholder import (adjust if path differs):
import { MediaPlaceholderElement } from "@packages/ui/components/media-placeholder-node";

// ---------------------------------------------------------------------------
// createMediaKit — factory that takes uploadFile so PlaceholderPlugin is
// configured at runtime (after React context is available for the hook).
// ---------------------------------------------------------------------------
export function createMediaKit(
  uploadFile: (file: File) => Promise<{ url: string; name: string }>,
) {
  return [
    // Image node with resize handles, captions, drag-and-drop
    ImagePlugin.withComponent(ImageElement),

    // Video node (embed URLs + file upload)
    VideoPlugin.withComponent(VideoElement),

    // Audio player
    AudioPlugin.withComponent(AudioElement),

    // Generic file download link
    FilePlugin.withComponent(FileElement),

    // Caption below any media block
    CaptionPlugin.configure({
      options: {
        query: {
          allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
        },
      },
    }),

    // Placeholder shown during upload (animated progress)
    PlaceholderPlugin.configure({
      options: {
        uploadConfig: {
          // Accepted file types and size limits per media type
          image: {
            mediaType: "image",
            maxFileSize: "10MB",
            maxFileCount: 10,
          },
          video: {
            mediaType: "video",
            maxFileSize: "100MB",
            maxFileCount: 1,
          },
          audio: {
            mediaType: "audio",
            maxFileSize: "50MB",
            maxFileCount: 1,
          },
          blob: {
            mediaType: "blob",
            maxFileSize: "50MB",
            maxFileCount: 1,
          },
        },
        // Custom upload handler — integrates with MinIO via oRPC
        onUploadFile: uploadFile,
      },
      render: {
        node: MediaPlaceholderElement,
      },
    }),

    // Drag-and-drop blocks (required for media DnD to work)
    DndPlugin.configure({ options: { enableScroller: true } }),
  ];
}
```

> **Note on MediaPlaceholderElement:** If the component is not in `@packages/ui`, run `bunx shadcn@latest add https://platejs.org/r/media-placeholder-element` from `apps/web/` to scaffold it, then move the output to `packages/ui/src/components/media-placeholder-node.tsx` following the existing static/interactive pattern.

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/media-kit.tsx
git commit -m "feat(editor): add MediaKit Plate.js plugin wiring image/video/file/caption/placeholder"
```

---

### Task 8: Wire MediaKit into PlateEditor

**Files:**
- Modify: `apps/web/src/features/editor/plate/plate-editor.tsx`

**Step 1: Add `teamId` prop and integrate MediaKit**

Read the current `plate-editor.tsx` (already done — it's at line 151). Make the following changes:

1. Add `teamId?: string` to `PlateEditorProps`
2. Import `createMediaKit` from `./plugins/media-kit`
3. Import `useEditorUploadFile` from `./hooks/use-editor-upload-file`
4. Call `useEditorUploadFile({ teamId })` at the top of the component
5. Build `MediaKit = createMediaKit(uploadFile)` (inline in the component since `usePlateEditor` is called once)
6. Add `...MediaKit` to the plugins array

The updated component signature and relevant additions:

```typescript
// Add to PlateEditorProps interface:
teamId?: string;

// Inside PlateEditor component body, before usePlateEditor:
const uploadFile = useEditorUploadFile({ teamId });
const MediaKit = createMediaKit(uploadFile);

// Inside usePlateEditor plugins array, after ...CopilotKit:
...MediaKit,
```

> **Important**: `createMediaKit(uploadFile)` must be called inside the component (not at module level) because `uploadFile` uses React hooks. `usePlateEditor` memoizes the plugins, so this is safe.

**Step 2: Remove Lexical ImageNode references**

Check if `apps/web/src/features/editor/core/image-node.tsx` still exists:

```bash
ls apps/web/src/features/editor/core/image-node.tsx 2>/dev/null && echo "exists"
```

If it exists, check if anything imports it:

```bash
grep -r "image-node" apps/web/src --include="*.ts" --include="*.tsx"
```

Remove only if no remaining imports:

```bash
rm apps/web/src/features/editor/core/image-node.tsx
```

**Step 3: Verify types**

```bash
bun run typecheck 2>&1 | grep -A2 "editor"
```

**Step 4: Commit**

```bash
git add apps/web/src/features/editor/plate/plate-editor.tsx
git commit -m "feat(editor): integrate MediaKit into PlateEditor with presigned MinIO upload"
```

---

## Phase 4: Asset Bank UI

### Task 9: Asset Bank Gallery Page

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx`

**Step 1: Write the gallery page**

```typescript
// apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { Suspense, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Skeleton } from "@packages/ui/components/skeleton";

export const Route = createFileRoute(
  "/_authenticated/$slug/$teamSlug/_dashboard/assets/",
)({
  component: AssetsPage,
});

// ---------------------------------------------------------------------------
// AssetsPage
// ---------------------------------------------------------------------------
function AssetsPage() {
  return (
    <Suspense fallback={<AssetsSkeleton />}>
      <AssetsContent />
    </Suspense>
  );
}

function AssetsContent() {
  const { slug, teamSlug } = Route.useParams();
  // Resolve teamId from the route — same pattern used across the dashboard
  const { data: team } = useSuspenseQuery(
    orpc.team.getBySlug.queryOptions({ input: { slug: teamSlug } }),
  );
  const teamId = team?.id;

  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 24;

  const { data } = useSuspenseQuery(
    orpc.assets.list.queryOptions({
      input: { teamId, search: search || undefined, limit: LIMIT, offset },
    }),
  );

  const generateUrl = useMutation(orpc.assets.generateUploadUrl.mutationOptions());
  const completeUpload = useMutation(orpc.assets.completeUpload.mutationOptions());
  const removeMutation = useMutation(orpc.assets.remove.mutationOptions({
    onSuccess: () => toast.success("Asset deleted"),
  }));

  const onDrop = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          const { presignedUrl, fileKey, publicUrl } = await generateUrl.mutateAsync({
            teamId,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          });

          await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          await completeUpload.mutateAsync({
            teamId,
            fileKey,
            publicUrl,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          });

          toast.success(`${file.name} uploaded`);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [generateUrl, completeUpload, teamId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
      "audio/*": [],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const { items: assets, total } = data;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Asset Bank</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, alt, caption..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="w-64"
          />
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="size-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop or click to upload"}
        </p>
      </div>

      {/* Grid */}
      {assets.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="size-10" />
          <p>No assets yet. Upload some files above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {asset.mimeType.startsWith("image/") ? (
                <img
                  src={asset.publicUrl}
                  alt={asset.alt ?? asset.filename}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="size-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-end bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="destructive"
                  className="size-7"
                  onClick={() => removeMutation.mutate({ id: asset.id })}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <p className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {asset.filename}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {Math.floor(offset / LIMIT) + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + LIMIT >= total}
            onClick={() => setOffset(offset + LIMIT)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function AssetsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}
```

> **Note:** If `orpc.team.getBySlug` doesn't exist, check the `team` router for how other routes resolve `teamId` from `teamSlug`. Match that pattern.

**Step 2: Add route to nav (if applicable)**

Check the sidebar/nav component to see if routes are auto-discovered or need manual registration. If manual, add an "Assets" entry pointing to `/assets`.

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/'$slug'/'$teamSlug'/_dashboard/assets/index.tsx
git commit -m "feat(ui): add asset bank gallery page with drag-and-drop upload and grid view"
```

---

### Task 10: Asset Bank Modal (for Editor Insertion)

**Files:**
- Create: `apps/web/src/features/file-upload/ui/asset-bank-modal.tsx`

**What this does:** A `Credenza` (modal on desktop / drawer on mobile) that shows the asset gallery and calls `onSelect(asset)` when the user picks an image. Used in the editor toolbar.

**Step 1: Write the modal**

```typescript
// apps/web/src/features/file-upload/ui/asset-bank-modal.tsx
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ImageIcon, Search } from "lucide-react";
import { Suspense } from "react";
import { orpc } from "@/integrations/orpc/client";
import type { Asset } from "@packages/database/schemas/assets";
import { Button } from "@packages/ui/components/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@packages/ui/components/credenza";
import { Input } from "@packages/ui/components/input";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";

interface AssetBankModalProps {
  /** Called when user selects an asset */
  onSelect: (asset: Asset) => void;
  /** Optional teamId to filter assets by project */
  teamId?: string;
  trigger?: React.ReactNode;
}

export function AssetBankModal({
  onSelect,
  teamId,
  trigger,
}: AssetBankModalProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [search, setSearch] = useState("");

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      setOpen(false);
      setSelected(null);
    }
  };

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <ImageIcon className="mr-2 size-4" />
            From bank
          </Button>
        )}
      </CredenzaTrigger>
      <CredenzaContent className="max-w-3xl">
        <CredenzaHeader>
          <CredenzaTitle>Asset Bank</CredenzaTitle>
        </CredenzaHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Suspense fallback={<AssetGridSkeleton />}>
            <AssetGrid
              teamId={teamId}
              search={search}
              selected={selected}
              onSelect={setSelected}
            />
          </Suspense>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!selected} onClick={handleConfirm}>
              Insert image
            </Button>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  );
}

// ---------------------------------------------------------------------------
// Internal grid component (uses Suspense)
// ---------------------------------------------------------------------------
function AssetGrid({
  teamId,
  search,
  selected,
  onSelect,
}: {
  teamId?: string;
  search: string;
  selected: Asset | null;
  onSelect: (asset: Asset) => void;
}) {
  const { data } = useSuspenseQuery(
    orpc.assets.list.queryOptions({
      input: {
        teamId,
        search: search || undefined,
        limit: 48,
        offset: 0,
      },
    }),
  );

  const { items: assets } = data;

  if (assets.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
        <ImageIcon className="size-10" />
        <p className="text-sm">No assets found.</p>
      </div>
    );
  }

  return (
    <div className="grid max-h-[400px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
      {assets.map((asset) => (
        <button
          key={asset.id}
          type="button"
          onClick={() => onSelect(asset)}
          className={cn(
            "relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
            selected?.id === asset.id
              ? "border-primary ring-2 ring-primary/30"
              : "border-transparent hover:border-muted-foreground/30",
          )}
        >
          {asset.mimeType.startsWith("image/") ? (
            <img
              src={asset.publicUrl}
              alt={asset.alt ?? asset.filename}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function AssetGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/file-upload/ui/asset-bank-modal.tsx
git commit -m "feat(ui): add AssetBankModal credenza for editor image insertion"
```

---

### Task 11: Add "From Bank" Button to Media Toolbar

**Files:**
- Modify: `packages/ui/src/components/media-toolbar.tsx`

**Step 1: Read the current file** (already done — it's at lines 1-117 above)

**Step 2: Add AssetBankModal trigger to the toolbar buttons**

The toolbar currently has: Edit link | Caption | (separator) | Delete

We add: **From bank** button between Caption and the separator. This button opens the asset bank modal and replaces the current image's `url` using Plate's `setNodes`.

Since `MediaToolbar` lives in `packages/ui` (shared, has no direct access to oRPC client), the cleanest approach is to accept an optional `onSelectFromBank` callback prop:

```typescript
// In MediaToolbar props, add:
interface MediaToolbarProps {
  children: React.ReactNode;
  plugin: WithRequiredKey;
  /** If provided, shows a "From bank" button that calls this with the new image src */
  onSelectFromBank?: (src: string, alt: string, caption: string) => void;
}

// In the JSX, after CaptionButton:
{onSelectFromBank && (
  <>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        // Signal to parent to open the bank modal
        // Pass a trigger prop or handle via context
      }}
    >
      <ImageIcon className="mr-1 size-4" />
      From bank
    </Button>
  </>
)}
```

> **Alternative (simpler):** Since `ImageElement` in `apps/web` wraps `MediaToolbar` and has access to oRPC context, extend `ImageElement` locally in the editor feature folder instead of modifying the shared `packages/ui` component. Create `apps/web/src/features/editor/plate/ui/image-element.tsx` that wraps the shared `ImageElement` and adds the bank button. Then configure `ImagePlugin.withComponent(LocalImageElement)` in `media-kit.tsx` instead.

**Recommended approach (less coupling):** Create a local `ImageElement` override in the editor feature:

```typescript
// apps/web/src/features/editor/plate/ui/image-element.tsx
'use client';

import type { TImageElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { useEditorRef, useElement } from 'platejs/react';
import { ImagePlugin } from '@platejs/media/react';
import { setNodes } from 'platejs';
import { ImageElement as BaseImageElement } from "@packages/ui/components/media-image-node";
import { AssetBankModal } from "@/features/file-upload/ui/asset-bank-modal";
import type { Asset } from "@packages/database/schemas/assets";

interface ImageElementWithBankProps extends PlateElementProps<TImageElement> {
  teamId?: string;
}

export function ImageElementWithBank({ teamId, ...props }: ImageElementWithBankProps) {
  const editor = useEditorRef();
  const element = useElement<TImageElement>();

  const handleSelectFromBank = (asset: Asset) => {
    setNodes(
      editor,
      {
        url: asset.publicUrl,
        alt: asset.alt ?? asset.filename,
        caption: asset.caption ? [{ type: 'p', children: [{ text: asset.caption }] }] : undefined,
      },
      { at: [], match: (n) => n === element },
    );
  };

  // Render the base element — for now, the "From bank" button will be
  // accessible from the floating toolbar via a separate integration.
  // This component is a placeholder for future toolbar extension.
  return <BaseImageElement {...props} />;
}
```

> **Note:** Full floating toolbar customization with the bank button may require reading Plate.js v52 docs for `FloatingMedia` extension points. The above establishes the component scaffold. For now, the asset bank is accessible from the gallery page and the `AssetBankModal` can be triggered via slash command.

**Step 3: Commit scaffold**

```bash
git add apps/web/src/features/editor/plate/ui/image-element.tsx
git commit -m "feat(editor): scaffold ImageElementWithBank for future asset bank toolbar integration"
```

---

## Phase 5: Verification

### Task 12: End-to-End Smoke Test

**Step 1: TypeScript check**

```bash
bun run typecheck 2>&1 | grep -i "error"
```

Expected: 0 errors in files touched by this feature.

**Step 2: Lint**

```bash
bun run check 2>&1 | grep -i "error"
```

Expected: 0 lint errors.

**Step 3: DB schema verification**

```bash
bun run db:push --dry-run 2>&1
```

Expected: Only `assets` table shown as new, no drops.

**Step 4: Manual smoke test (dev server)**

```bash
bun dev
```

Test the following flows:
- [ ] Navigate to `/[slug]/[teamSlug]/assets` → gallery page loads
- [ ] Drag an image onto the dropzone → upload progress shown, image appears in grid
- [ ] Open editor on a content page → drop an image → placeholder appears, then image renders
- [ ] Click "Delete" on a gallery image → image removed from grid
- [ ] Search in gallery → filters results

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — asset bank + media plugin integration"
```

---

## Phase 6: Feature Flags (PostHog Early Access)

### Task 13: Configure PostHog Early Access Features

**This task is done manually in the PostHog dashboard — no code changes.**

**Step 1: Create "Banco de Imagens" feature (Alpha)**

In PostHog → Early Access Management → Create feature:
- **Name:** `Banco de Imagens`
- **Description:** `Armazene, organize e insira imagens nos seus conteúdos a partir de um banco de imagens centralizado por organização.`
- **Stage:** `Alpha`
- **Flag key:** `asset-bank`
- **Documentation URL:** (leave blank for now)

**Step 2: Create "Geração de Imagens por IA" feature (Concept)**

In PostHog → Early Access Management → Create feature:
- **Name:** `Geração de Imagens por IA`
- **Description:** `Gere imagens diretamente no editor usando FLUX, DALL-E ou Stable Diffusion. A imagem gerada é salva automaticamente no banco de assets.`
- **Stage:** `Concept`
- **Flag key:** (leave empty — concept features have no flag)
- **Documentation URL:** (leave blank)

**Step 3: Verify PostHog returns both features**

After saving, `useEarlyAccessFeatures()` (client-side) should return both. The `concept` feature will have `flagKey: null`.

---

### Task 14: Update Feature Previews UI

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/feature-previews.tsx`

**What changes:**
- Current UI skips features with `flagKey: null` — concept features are invisible
- New UI groups concept sub-features nested under their parent alpha feature
- Concept items are non-toggleable, shown with a "Conceito" badge and an informational style
- A local hierarchy config maps parent flagKeys → concept child names
- Alpha features that are enrolled show a visual indicator

**Step 1: Write the updated feature-previews.tsx**

Replace the entire file with:

```typescript
import { FeatureStageBadge } from "@packages/ui/components/feature-stage-badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, ImageIcon, Lightbulb, Sparkles } from "lucide-react";
import { useEarlyAccess } from "@/hooks/use-early-access";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/feature-previews",
)({
   component: FeaturePreviewsPage,
});

// ---------------------------------------------------------------------------
// Local config — maps parent flagKey to concept sub-feature names.
// Concept features from PostHog have stage="concept" (may or may not have a flagKey).
// We match them by name to nest them visually under their parent alpha/beta feature.
// ---------------------------------------------------------------------------
const CONCEPT_CHILDREN: Record<string, string[]> = {
   "asset-bank": ["Geração de Imagens por IA"],
};

// Icon per feature flag (optional enrichment)
const FEATURE_ICONS: Record<string, React.ElementType> = {
   "asset-bank": ImageIcon,
};

function FeaturePreviewsPage() {
   const { features, loaded, isEnrolled, updateEnrollment } = useEarlyAccess();

   // Separate alpha/beta features from concept-stage ones
   const parentFeatures = features.filter((f) => f.stage !== "concept");
   const conceptFeatures = features.filter((f) => f.stage === "concept");

   // Build a lookup: concept feature name → feature data
   const conceptByName = new Map(conceptFeatures.map((f) => [f.name, f]));

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Previas de Funcionalidades
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Experimente funcionalidades em fases iniciais antes do
               lançamento oficial. Funcionalidades em{" "}
               <span className="font-medium text-orange-600 dark:text-orange-400">
                  Alpha
               </span>{" "}
               são funcionais mas podem mudar.{" "}
               <span className="font-medium text-purple-600 dark:text-purple-400">
                  Conceitos
               </span>{" "}
               são ideias em exploração, ainda sem data.
            </p>
         </div>

         {!loaded && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
         )}

         {loaded && parentFeatures.length === 0 && (
            <p className="text-sm text-muted-foreground">
               Nenhuma funcionalidade em preview disponível no momento.
            </p>
         )}

         {loaded && parentFeatures.length > 0 && (
            <ItemGroup>
               {parentFeatures.map((feature) => {
                  if (!feature.flagKey) return null;
                  const enrolled = isEnrolled(feature.flagKey);
                  const Icon = FEATURE_ICONS[feature.flagKey] ?? FlaskConical;

                  // Find concept sub-features for this parent
                  const childNames = CONCEPT_CHILDREN[feature.flagKey] ?? [];
                  const children = childNames
                     .map((name) => conceptByName.get(name))
                     .filter(Boolean);

                  return (
                     <div key={feature.flagKey} className="flex flex-col">
                        {/* Parent feature item */}
                        <Item variant="muted">
                           <ItemMedia variant="icon">
                              <Icon className="size-4" />
                           </ItemMedia>
                           <ItemContent>
                              <div className="flex items-center gap-2">
                                 <ItemTitle>{feature.name}</ItemTitle>
                                 <FeatureStageBadge
                                    className="text-xs"
                                    stage={feature.stage}
                                 />
                              </div>
                              <ItemDescription>
                                 {feature.description}
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <Switch
                                 checked={enrolled}
                                 onCheckedChange={(checked) =>
                                    updateEnrollment(feature.flagKey!, checked)
                                 }
                              />
                           </ItemActions>
                        </Item>

                        {/* Concept sub-features nested below */}
                        {children.length > 0 && (
                           <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-dashed border-muted-foreground/20 pl-4 pb-2">
                              {children.map((child) => (
                                 <div
                                    key={child!.name}
                                    className="flex items-start gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground bg-muted/30"
                                 >
                                    <Lightbulb className="size-3.5 mt-0.5 shrink-0 text-purple-500" />
                                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                                       <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-foreground text-xs">
                                             {child!.name}
                                          </span>
                                          <FeatureStageBadge
                                             className="text-[10px] py-0 h-4"
                                             stage="concept"
                                             showIcon={false}
                                          />
                                       </div>
                                       <span className="text-xs leading-relaxed">
                                          {child!.description}
                                       </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5 italic">
                                       Em breve
                                    </span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  );
               })}
            </ItemGroup>
         )}
      </div>
   );
}
```

**Step 2: Verify**

```bash
bun run typecheck 2>&1 | grep feature-preview
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/'$slug'/'$teamSlug'/_dashboard/settings/feature-previews.tsx
git commit -m "feat(ui): update feature previews to show concept sub-features grouped under parent alpha features"
```

---

### Task 15: Gate Assets Route Behind Feature Flag

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx`

The assets page should only be accessible when the user is enrolled in the `asset-bank` early access feature (or in development mode).

**Step 1: Add flag check to the page**

At the top of `AssetsContent`, add:

```typescript
import { useFeatureFlag } from "@packages/posthog/client";

// Inside AssetsContent:
const { enabled: assetBankEnabled, loaded: flagLoaded } = useFeatureFlag("asset-bank");

if (flagLoaded && !assetBankEnabled) {
   return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
         <Sparkles className="size-10 text-orange-400" />
         <h2 className="text-lg font-semibold">Banco de Imagens — Alpha</h2>
         <p className="text-sm text-muted-foreground max-w-sm">
            Esta funcionalidade está em fase alpha e disponível por acesso antecipado.
            Ative-a em{" "}
            <a
               href="../settings/feature-previews"
               className="underline underline-offset-2"
            >
               Configurações → Prévia de Funcionalidades
            </a>
            .
         </p>
      </div>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/'$slug'/'$teamSlug'/_dashboard/assets/index.tsx
git commit -m "feat(ui): gate assets page behind asset-bank PostHog early access flag"
```

---

## Known Gaps / Follow-up Work

1. **MediaPlaceholderElement**: If `@platejs/media` doesn't export it directly, scaffold via `bunx shadcn@latest add https://platejs.org/r/media-placeholder-element` and move to `packages/ui`.

2. **Slash menu integration**: Add `/image` and `/image-from-bank` commands to the slash menu (requires `@platejs/suggestion` or `@platejs/slash-command` — check Plate.js v52 docs).

3. **Worker thumbnail job**: BullMQ job to generate 300×300 WebP thumbnail after upload. Creates `thumbnail_key` on the asset record. Low priority for Phase 1.

4. **PlateEditor `teamId` prop thread**: Ensure the parent route (`editor-page.tsx`) passes `teamId` down to `PlateEditor`. Check `apps/web/src/features/editor/ui/editor-page.tsx` and trace how `contentId` flows today — mirror that pattern for `teamId`.

5. **Agent tool update**: `insert-image-tool.ts` currently returns `{ success: true }` without touching the editor (it's a stub). For AI to actually insert images, the tool needs to communicate with the running Plate editor instance. This requires a shared signal mechanism (e.g., a Zustand store or React context that the editor subscribes to). Defer to a follow-up issue.

6. **Nav sidebar link**: Add "Assets" to the sidebar navigation pointing to `/[slug]/[teamSlug]/assets`.

7. **`db.query.assets` relation**: After adding the schema, verify `packages/database/src/client.ts` includes `assets` in the schema object so `db.query.assets.findFirst(...)` works.

---

## File Summary

| File | Action |
|------|--------|
| `packages/database/src/schemas/assets.ts` | Create |
| `packages/database/src/schema.ts` | Modify (add export) |
| `packages/database/src/repositories/asset-repository.ts` | Create |
| `packages/database/src/client.ts` | Modify (add schema) |
| `packages/events/src/assets.ts` | Create |
| `apps/web/src/integrations/orpc/router/assets.ts` | Create |
| `apps/web/src/integrations/orpc/router/index.ts` | Modify (register router) |
| `apps/web/src/features/editor/plate/hooks/use-editor-upload-file.ts` | Create |
| `apps/web/src/features/editor/plate/plugins/media-kit.tsx` | Create |
| `apps/web/src/features/editor/plate/plate-editor.tsx` | Modify (add MediaKit + teamId) |
| `apps/web/src/features/editor/plate/ui/image-element.tsx` | Create (scaffold) |
| `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx` | Create |
| `apps/web/src/features/file-upload/ui/asset-bank-modal.tsx` | Create |
