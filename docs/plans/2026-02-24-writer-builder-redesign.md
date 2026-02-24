# Writer Builder Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the writer builder with 3 tabs (Identidade, Memória, Conteúdo), real photo upload via MinIO presigned URLs, inline instruction form with good/bad guidance callout, and fix the silent bug where writer instructions are never passed to the streaming agent.

**Architecture:** Strip dead fields (tone/voice/complexity/writingGuidelines) from all layers. Restructure `WriterBuilder` into 3 tabs. Add `WriterPhotoUpload` as a self-contained component with its own presigned-URL upload flow. Redesign `WriterInstructionsSection` with an always-visible inline form and a guidance panel. Add `WriterContentSection` using data already returned by `getById`. Fix `aiCommandStream` to actually fetch and forward writer instructions.

**Tech Stack:** React + TypeScript, oRPC + TanStack Query, `@packages/ui` (Radix + Tailwind + CVA), MinIO presigned URLs, `useFileUpload` + `usePresignedUpload` hooks already in `apps/web/src/features/file-upload/lib/`.

---

## Context You Must Know

### The silent bug
`aiCommandStream` in `apps/web/src/integrations/orpc/router/agent.ts:215-231` sets `writerId` on the RequestContext but **never fetches the writer's instructions from the DB**. The agent receives an empty instruction set for every streaming generation. `executeUnifiedAgent` (non-streaming) does it correctly — copy that pattern.

### Dead fields
`tone`, `voice`, `complexity`, `writingGuidelines` are stored in `personaConfig.instructions` (JSONB) but **never injected into the agent's system prompt**. `getUnifiedAgentInstructions()` in `packages/agents/src/mastra/agents/unified-content-agent.ts` only uses `language` and `writerInstructions` (the JSONB instruction memories). All structured config fields are dead weight.

### Photo upload pattern
See `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx` (AvatarUploadSection) and `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/general.tsx` (LogoSection).
Flow: `useFileUpload` for validation + preview → `orpc.*.generateUploadUrl` for presigned URL → `usePresignedUpload.uploadToPresignedUrl(presignedUrl, file, contentType)` → save `publicUrl` to DB.

### Content already fetched
`orpc.writer.getById` already returns `recentContent` (last 10 items, `id + meta + status + createdAt`) and `contentCount`. No new procedures needed for the content tab.

### Tab visibility
The memory and content tabs require `writerId` to exist. On the "new writer" page (`/writers/new`), only the Identidade tab shows. Photo upload also requires `writerId`. After create, the user is navigated to `$writerId` where all tabs are available.

---

## Task 1: Fix `aiCommandStream` — fetch writer instructions

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/agent.ts:193-231`

**Step 1: Locate the gap**

Open `apps/web/src/integrations/orpc/router/agent.ts`. At line 214 the `createRequestContext()` call is missing `writerInstructions`. The import for `writer` schema is already at line 21.

**Step 2: Add the fetch before `createRequestContext`**

Replace lines 214–231 (the `createRequestContext` block):

```typescript
// Fetch writer instructions if a writerId is provided
let writerInstructions: InstructionMemoryItem[] | undefined;
if (input.writerId) {
   const writerRecord = await db.query.writer.findFirst({
      where: and(eq(writer.id, input.writerId), eq(writer.teamId, teamId)),
   });
   if (writerRecord?.instructionMemories) {
      writerInstructions = (writerRecord.instructionMemories as InstructionMemoryItem[]).slice(0, 10);
   }
}

// Create request context with settings, falling back to product defaults
const requestContext = createRequestContext({
   userId,
   contentId: input.contentId,
   writerId: input.writerId,
   writerInstructions,
   language:
      input.language ??
      aiDefaults.defaultLanguage ??
      getRequestLanguage(headers) ??
      "pt-BR",
   model: contentModelId,
   temperature:
      aiDefaults.contentTemperature ?? contentPreset.temperature,
   topP: contentPreset.topP,
   maxTokens: aiDefaults.contentMaxTokens ?? contentPreset.maxTokens,
   frequencyPenalty: contentPreset.frequencyPenalty,
   presencePenalty: contentPreset.presencePenalty,
} as CustomRequestContext);
```

**Step 3: Verify `and` + `eq` are already imported**

Check line 32: `import { and, eq } from "drizzle-orm";` — already there. `writer` schema is at line 21.

**Step 4: Typecheck**

```bash
bun run typecheck
```

Expected: no new errors.

**Step 5: Commit**

```bash
git add apps/web/src/integrations/orpc/router/agent.ts
git commit -m "fix(agent): fetch writer instructions in aiCommandStream"
```

---

## Task 2: Add `generatePhotoUploadUrl` oRPC procedure

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/writer.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts` (if procedure not auto-exported)

**Step 1: Add imports at the top of `writer.ts`**

After the existing imports (after line 27), add:

```typescript
import { getMinioClient } from "@packages/files/client";
import { generatePresignedPutUrl } from "@packages/files/client";
import { serverEnv } from "@packages/environment/server";
```

**Step 2: Add the procedure (append after `toggleInstruction`, before end of file)**

```typescript
// =============================================================================
// Photo Upload Procedures
// =============================================================================

/**
 * Generate a presigned PUT URL for uploading a writer's profile photo.
 * The client uploads directly to MinIO using the presigned URL, then calls
 * writer.update({ profilePhotoUrl }) with the returned publicUrl.
 */
export const generatePhotoUploadUrl = protectedProcedure
   .input(z.object({
      writerId: z.string().uuid(),
      fileExtension: z.string().min(1).max(10),
      contentType: z.string().min(1),
   }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const writerRecord = await getWriterById(db, input.writerId);
      if (!writerRecord || writerRecord.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }

      const minioClient = getMinioClient(serverEnv);
      const fileName = `writer-${input.writerId}-${crypto.randomUUID()}.${input.fileExtension}`;

      const presignedUrl = await generatePresignedPutUrl(
         fileName,
         "writer-photos",
         minioClient,
         300, // 5 minutes
      );

      return {
         presignedUrl,
         fileName,
         publicUrl: `/api/files/writer-photos/${fileName}`,
      };
   });
```

**Step 3: Verify the import paths match existing patterns**

Check `apps/web/src/integrations/orpc/router/account.ts` — it imports from `@packages/files/client`. Use the same paths.

**Step 4: Check `index.ts` to confirm `generatePhotoUploadUrl` is exported**

Open `apps/web/src/integrations/orpc/router/index.ts`. Find the `writer` router export. If procedures are exported individually (not as a `router()` call), add `generatePhotoUploadUrl` to the list. If the router auto-exports all named exports from the file, nothing to add.

**Step 5: Typecheck**

```bash
bun run typecheck
```

**Step 6: Commit**

```bash
git add apps/web/src/integrations/orpc/router/writer.ts apps/web/src/integrations/orpc/router/index.ts
git commit -m "feat(writer): add generatePhotoUploadUrl oRPC procedure"
```

---

## Task 3: Create `WriterPhotoUpload` component

**Files:**
- Create: `apps/web/src/features/writers/ui/writer-photo-upload.tsx`

**Step 1: Write the component**

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { orpc } from "@/integrations/orpc/client";
import { useQueryClient } from "@tanstack/react-query";

function getInitials(name: string): string {
   return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
}

interface WriterPhotoUploadProps {
   writerId: string;
   currentPhotoUrl: string | null;
   writerName: string;
}

export function WriterPhotoUpload({
   writerId,
   currentPhotoUrl,
   writerName,
}: WriterPhotoUploadProps) {
   const fileInputRef = useRef<HTMLInputElement>(null);
   const queryClient = useQueryClient();
   const fileUpload = useFileUpload({ acceptedTypes: ["image/*"], maxSize: 5 * 1024 * 1024 });
   const presignedUpload = usePresignedUpload();
   const [isPending, startTransition] = useTransition();

   const isUploading = isPending || presignedUpload.isUploading;
   const displayImage = fileUpload.filePreview ?? currentPhotoUrl ?? undefined;

   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const files = e.target.files;
      if (!files?.length) return;
      fileUpload.handleFileSelect(Array.from(files));
   }

   function handleSave() {
      const file = fileUpload.selectedFile;
      if (!file) return;

      startTransition(async () => {
         try {
            const ext = file.name.split(".").pop() ?? "jpg";
            const uploadData = await orpc.writer.generatePhotoUploadUrl.call({
               writerId,
               fileExtension: ext,
               contentType: file.type,
            });

            await presignedUpload.uploadToPresignedUrl(
               uploadData.presignedUrl,
               file,
               file.type,
            );

            await orpc.writer.update.call({
               id: writerId,
               profilePhotoUrl: uploadData.publicUrl,
            });

            queryClient.invalidateQueries({
               queryKey: orpc.writer.getById.queryOptions({ input: { id: writerId } }).queryKey,
            });

            toast.success("Foto atualizada");
            fileUpload.clearFile();
         } catch {
            toast.error("Erro ao fazer upload da foto");
         }
      });
   }

   function handleRemove() {
      startTransition(async () => {
         try {
            await orpc.writer.update.call({ id: writerId, profilePhotoUrl: null });
            queryClient.invalidateQueries({
               queryKey: orpc.writer.getById.queryOptions({ input: { id: writerId } }).queryKey,
            });
            toast.success("Foto removida");
            fileUpload.clearFile();
         } catch {
            toast.error("Erro ao remover foto");
         }
      });
   }

   return (
      <div className="flex items-center gap-6">
         <Avatar className="size-20 shrink-0">
            <AvatarImage src={displayImage} />
            <AvatarFallback className="text-lg font-medium">
               {getInitials(writerName || "?")}
            </AvatarFallback>
         </Avatar>

         <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <input
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
               />

               {fileUpload.selectedFile ? (
                  <Button
                     disabled={isUploading}
                     onClick={handleSave}
                     size="sm"
                     variant="default"
                  >
                     {isUploading ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     ) : (
                        <Upload className="size-4 mr-2" />
                     )}
                     {isUploading ? "Enviando..." : "Salvar foto"}
                  </Button>
               ) : (
                  <Button
                     disabled={isUploading}
                     onClick={() => fileInputRef.current?.click()}
                     size="sm"
                     variant="outline"
                  >
                     <Upload className="size-4 mr-2" />
                     Trocar foto
                  </Button>
               )}

               {(currentPhotoUrl || fileUpload.selectedFile) && (
                  <Button
                     disabled={isUploading}
                     onClick={fileUpload.selectedFile ? fileUpload.clearFile : handleRemove}
                     size="sm"
                     variant="ghost"
                  >
                     <X className="size-4 mr-2" />
                     {fileUpload.selectedFile ? "Cancelar" : "Remover"}
                  </Button>
               )}
            </div>

            <p className="text-xs text-muted-foreground">
               PNG, JPG, WEBP — máx. 5 MB
            </p>

            {fileUpload.error && (
               <p className="text-xs text-destructive">{fileUpload.error}</p>
            )}
         </div>
      </div>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add apps/web/src/features/writers/ui/writer-photo-upload.tsx
git commit -m "feat(writer): add WriterPhotoUpload component with MinIO presigned URL flow"
```

---

## Task 4: Create `WriterContentSection` component

**Files:**
- Create: `apps/web/src/features/writers/ui/writer-content-section.tsx`

This tab displays the content already returned by `orpc.writer.getById` — no new fetch needed.

**Step 1: Check the shape of `recentContent`**

From `writer.ts:80-85`, each item has: `id`, `meta` (JSONB — has `title?: string`), `status` (string), `createdAt` (timestamp).

**Step 2: Write the component**

```typescript
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { ExternalLink, FileText } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContentItem {
   id: string;
   meta: Record<string, unknown> | null;
   status: string | null;
   createdAt: Date | string | null;
}

interface WriterContentSectionProps {
   recentContent: ContentItem[];
   contentCount: number;
}

const STATUS_LABELS: Record<string, string> = {
   draft: "Rascunho",
   published: "Publicado",
   archived: "Arquivado",
   review: "Em revisão",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
   published: "default",
   draft: "secondary",
   review: "outline",
   archived: "secondary",
};

export function WriterContentSection({
   recentContent,
   contentCount,
}: WriterContentSectionProps) {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   if (recentContent.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground border border-dashed rounded-lg">
            <FileText className="size-8 opacity-40" />
            <p className="text-sm">Nenhum conteúdo gerado por este escritor ainda.</p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
               {contentCount} conteúdo{contentCount !== 1 ? "s" : ""} gerado{contentCount !== 1 ? "s" : ""} por este escritor
               {contentCount > 10 ? ` — mostrando os 10 mais recentes` : ""}
            </p>
         </div>

         <div className="divide-y rounded-lg border">
            {recentContent.map((item) => {
               const title =
                  (item.meta as { title?: string } | null)?.title ?? "Sem título";
               const status = item.status ?? "draft";
               const date = item.createdAt
                  ? format(new Date(item.createdAt), "d MMM yyyy", { locale: ptBR })
                  : "—";

               return (
                  <div
                     className="flex items-center justify-between px-4 py-3 gap-4 hover:bg-muted/40 transition-colors cursor-pointer"
                     key={item.id}
                     onClick={() =>
                        navigate({
                           to: "/$slug/$teamSlug/content/$contentId",
                           params: { slug, teamSlug, contentId: item.id },
                        })
                     }
                  >
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">{date}</p>
                     </div>
                     <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
                           {STATUS_LABELS[status] ?? status}
                        </Badge>
                        <Button asChild size="icon" variant="ghost" className="size-7">
                           <span>
                              <ExternalLink className="size-3.5" />
                           </span>
                        </Button>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}
```

> **Note:** Check the actual content route path. If the route to a single content piece is different from `/$slug/$teamSlug/content/$contentId`, adjust accordingly. Search for `content.$contentId` in `apps/web/src/routes/` to confirm.

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/features/writers/ui/writer-content-section.tsx
git commit -m "feat(writer): add WriterContentSection component"
```

---

## Task 5: Redesign `WriterInstructionsSection`

**Files:**
- Modify: `apps/web/src/features/writers/ui/writer-instructions-section.tsx` (full rewrite)

**Goal:** Replace the Dialog-based add form with an always-visible inline form at the top. Add a guidance callout teaching users what makes a good instruction. Improve instruction cards with dropdown menu actions.

**Step 1: Full rewrite**

```typescript
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MoreHorizontal, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

// ---------------------------------------------------------------------------
// Guidance callout — always visible, teaches good instruction writing
// ---------------------------------------------------------------------------
function InstructionGuide() {
   return (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
         <p className="text-sm font-medium text-foreground">Como escrever boas instruções</p>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
               <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Específica e acionável
               </div>
               <ul className="space-y-1 text-xs text-muted-foreground pl-5 list-none">
                  <li>"Use sempre <strong>Contentta</strong> com dois t's"</li>
                  <li>"Inclua um CTA no final de cada artigo"</li>
                  <li>"Nunca mencione concorrentes pelo nome"</li>
                  <li>"Escreva parágrafos com no máximo 3 linhas"</li>
               </ul>
            </div>
            <div className="space-y-2">
               <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <XCircle className="size-3.5" />
                  Vaga ou óbvia
               </div>
               <ul className="space-y-1 text-xs text-muted-foreground pl-5 list-none">
                  <li>"Escreva bem" — o agente não sabe o que isso significa</li>
                  <li>"Seja criativo" — sem ação clara</li>
                  <li>"Use um bom tom" — o que é 'bom'?</li>
               </ul>
            </div>
         </div>
         <p className="text-xs text-muted-foreground border-t pt-3 mt-1">
            <strong>Regra de ouro:</strong> se você explicasse isso a um redator humano que nunca viu seu produto, ele saberia exatamente o que fazer?
         </p>
      </div>
   );
}

// ---------------------------------------------------------------------------
// Inline add form — always visible at the top
// ---------------------------------------------------------------------------
interface AddInstructionFormProps {
   writerId: string;
}

function AddInstructionForm({ writerId }: AddInstructionFormProps) {
   const queryClient = useQueryClient();
   const [title, setTitle] = useState("");
   const [content, setContent] = useState("");

   const mutation = useMutation(
      orpc.writer.addInstruction.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.writer.getById.queryOptions({ input: { id: writerId } }).queryKey,
            });
            toast.success("Instrução adicionada");
            setTitle("");
            setContent("");
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao adicionar instrução");
         },
      }),
   );

   function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!title.trim() || !content.trim()) return;
      mutation.mutate({ writerId, instruction: { title: title.trim(), content: content.trim(), enabled: true } });
   }

   const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !mutation.isPending;

   return (
      <Card>
         <CardContent className="p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
               <div className="space-y-1.5">
                  <Label htmlFor="instruction-title">Título</Label>
                  <Input
                     id="instruction-title"
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder='Ex: "Regra de marca", "CTA obrigatório"'
                     value={title}
                  />
               </div>
               <div className="space-y-1.5">
                  <Label htmlFor="instruction-content">Instrução</Label>
                  <Textarea
                     className="min-h-[100px] resize-none"
                     id="instruction-content"
                     onChange={(e) => setContent(e.target.value)}
                     placeholder="Cole sua instrução aqui em linguagem natural. Seja específico e acionável."
                     value={content}
                  />
               </div>
               <div className="flex justify-end">
                  <Button disabled={!canSubmit} size="sm" type="submit">
                     {mutation.isPending ? "Adicionando..." : "Adicionar instrução"}
                  </Button>
               </div>
            </form>
         </CardContent>
      </Card>
   );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------
interface WriterInstructionsSectionProps {
   writerId: string;
   instructions: InstructionMemoryItem[];
}

export function WriterInstructionsSection({
   writerId,
   instructions,
}: WriterInstructionsSectionProps) {
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();

   const toggleMutation = useMutation(
      orpc.writer.toggleInstruction.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.writer.getById.queryOptions({ input: { id: writerId } }).queryKey,
            });
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao atualizar instrução");
         },
      }),
   );

   const deleteMutation = useMutation(
      orpc.writer.deleteInstruction.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.writer.getById.queryOptions({ input: { id: writerId } }).queryKey,
            });
            toast.success("Instrução removida");
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao remover instrução");
         },
      }),
   );

   function handleDelete(instruction: InstructionMemoryItem) {
      openAlertDialog({
         title: "Remover instrução",
         description: `Tem certeza que deseja remover "${instruction.title}"?`,
         actionLabel: "Remover",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync({ writerId, instructionId: instruction.id });
         },
      });
   }

   const sorted = [...instructions].sort((a, b) => a.order - b.order);
   const activeCount = sorted.filter((i) => i.enabled).length;

   return (
      <div className="space-y-6">
         {/* Header */}
         <div>
            <h2 className="text-base font-semibold">Instruções fixas</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
               Sempre ativas em toda geração. São injetadas diretamente no sistema do agente.
            </p>
         </div>

         {/* Guide */}
         <InstructionGuide />

         {/* Add form */}
         <AddInstructionForm writerId={writerId} />

         {/* List */}
         {sorted.length > 0 && (
            <div className="space-y-3">
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {activeCount} ativa{activeCount !== 1 ? "s" : ""} · {sorted.length} total
               </p>
               <div className="space-y-2">
                  {sorted.map((instruction) => (
                     <div
                        className="flex items-start gap-3 rounded-lg border bg-background px-4 py-3"
                        key={instruction.id}
                     >
                        <Switch
                           checked={instruction.enabled}
                           className="mt-0.5 shrink-0"
                           disabled={toggleMutation.isPending}
                           onCheckedChange={() =>
                              toggleMutation.mutate({ writerId, instructionId: instruction.id })
                           }
                        />
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{instruction.title}</p>
                              <Badge
                                 className="text-[10px] px-1.5 py-0"
                                 variant={instruction.enabled ? "default" : "secondary"}
                              >
                                 {instruction.enabled ? "ativa" : "inativa"}
                              </Badge>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {instruction.content}
                           </p>
                        </div>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button
                                 className="size-7 shrink-0"
                                 size="icon"
                                 variant="ghost"
                              >
                                 <MoreHorizontal className="size-3.5" />
                                 <span className="sr-only">Ações</span>
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 disabled={deleteMutation.isPending}
                                 onClick={() => handleDelete(instruction)}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 Remover
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground border border-dashed rounded-lg">
               <p className="text-sm">Nenhuma instrução adicionada ainda.</p>
               <p className="text-xs">Use o formulário acima para criar a primeira.</p>
            </div>
         )}
      </div>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add apps/web/src/features/writers/ui/writer-instructions-section.tsx
git commit -m "feat(writer): redesign WriterInstructionsSection with inline form and guidance callout"
```

---

## Task 6: Redesign `WriterBuilder` — 3-tab layout, remove dead fields

**Files:**
- Modify: `apps/web/src/features/writers/ui/writer-builder.tsx` (full rewrite)

**Step 1: Full rewrite**

```typescript
import { Card, CardContent } from "@packages/ui/components/card";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { Button } from "@packages/ui/components/button";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { useState } from "react";
import { WriterHeader } from "./writer-header";
import { WriterInstructionsSection } from "./writer-instructions-section";
import { WriterPhotoUpload } from "./writer-photo-upload";
import { WriterContentSection } from "./writer-content-section";

type WriterTab = "identidade" | "memoria" | "conteudo";

interface ContentItem {
   id: string;
   meta: Record<string, unknown> | null;
   status: string | null;
   createdAt: Date | string | null;
}

interface WriterBuilderProps {
   name: string;
   onNameChange: (name: string) => void;
   description: string;
   onDescriptionChange: (description: string) => void;
   profilePhotoUrl: string | null;
   onSave: () => void;
   isSaving: boolean;
   onDelete?: () => void;
   writerId?: string;
   instructions?: InstructionMemoryItem[];
   recentContent?: ContentItem[];
   contentCount?: number;
}

export function WriterBuilder({
   name,
   onNameChange,
   description,
   onDescriptionChange,
   profilePhotoUrl,
   onSave,
   isSaving,
   onDelete,
   writerId,
   instructions,
   recentContent,
   contentCount,
}: WriterBuilderProps) {
   const [activeTab, setActiveTab] = useState<WriterTab>("identidade");
   const hasWriter = !!writerId;

   const tabs: { id: WriterTab; label: string }[] = [
      { id: "identidade", label: "Identidade" },
      ...(hasWriter ? [
         { id: "memoria" as WriterTab, label: "Memória" },
         { id: "conteudo" as WriterTab, label: "Conteúdo" },
      ] : []),
   ];

   return (
      <main className="flex flex-col gap-0">
         <WriterHeader
            description={description}
            isSaving={isSaving}
            name={name}
            onDelete={onDelete}
            onDescriptionChange={onDescriptionChange}
            onNameChange={onNameChange}
            onSave={onSave}
         />

         {/* Tab bar */}
         <div className="flex items-center border-t border-b py-1">
            {tabs.map((tab) => (
               <Button
                  className={cn(
                     "px-4 py-2 h-auto rounded-none border-b-2 text-sm font-medium",
                     activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                  )}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant="ghost"
               >
                  {tab.label}
               </Button>
            ))}
         </div>

         {/* Tab content */}
         <div className="pt-6">
            {activeTab === "identidade" && (
               <div className="max-w-2xl space-y-6">
                  {/* Photo — only when editing */}
                  {writerId && (
                     <Card>
                        <CardContent className="p-6">
                           <div className="space-y-4">
                              <div>
                                 <p className="text-sm font-medium">Foto de perfil</p>
                                 <p className="text-xs text-muted-foreground mt-0.5">
                                    Aparece nos seletores de escritor. PNG, JPG, WEBP — máx. 5 MB.
                                 </p>
                              </div>
                              <WriterPhotoUpload
                                 currentPhotoUrl={profilePhotoUrl}
                                 writerId={writerId}
                                 writerName={name}
                              />
                           </div>
                        </CardContent>
                     </Card>
                  )}

                  {/* Identity fields */}
                  <Card>
                     <CardContent className="p-6 space-y-5">
                        <div className="space-y-1.5">
                           <Label htmlFor="writer-name">Nome</Label>
                           <Input
                              id="writer-name"
                              onChange={(e) => onNameChange(e.target.value)}
                              placeholder="Ex: Rafael Técnico"
                              value={name}
                           />
                        </div>

                        <div className="space-y-1.5">
                           <Label htmlFor="writer-description">Persona</Label>
                           <p className="text-xs text-muted-foreground">
                              Descreva quem é este escritor: audiência, expertise, estilo, o que ele evita.
                              Esta descrição é injetada em cada geração como contexto de identidade.
                           </p>
                           <Textarea
                              className="min-h-[140px] resize-none"
                              id="writer-description"
                              onChange={(e) => onDescriptionChange(e.target.value)}
                              placeholder="Ex: Rafael é um DevRel sênior escrevendo para desenvolvedores intermediários. Usa exemplos em TypeScript. Prefere frases curtas e nunca usa voz passiva. Cita documentação oficial quando possível."
                              value={description}
                           />
                        </div>
                     </CardContent>
                  </Card>
               </div>
            )}

            {activeTab === "memoria" && writerId && (
               <div className="max-w-2xl">
                  <WriterInstructionsSection
                     instructions={instructions ?? []}
                     writerId={writerId}
                  />
               </div>
            )}

            {activeTab === "conteudo" && writerId && (
               <WriterContentSection
                  contentCount={contentCount ?? 0}
                  recentContent={recentContent ?? []}
               />
            )}
         </div>
      </main>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add apps/web/src/features/writers/ui/writer-builder.tsx
git commit -m "feat(writer): restructure WriterBuilder into 3-tab layout, remove dead fields"
```

---

## Task 7: Clean up route files

### 7a — Edit writer route (`$writerId.tsx`)

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/writers/$writerId.tsx`

**Step 1: Remove dead state, simplify `handleSave`, pass new props**

Replace the full file content. Key changes:
- Remove state: `tone`, `voice`, `complexity`, `writingGuidelines`
- Remove the `useEffect` reading those fields from `writer.personaConfig.instructions`
- Simplify `handleSave` to only send `metadata` (name + description)
- Pass `recentContent` and `contentCount` to `WriterBuilder`
- `profilePhotoUrl` is now read-only (managed by `WriterPhotoUpload` internally), but still needed for display — read it from `writer` directly rather than local state

```typescript
import { Skeleton } from "@packages/ui/components/skeleton";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { WriterBuilder } from "@/features/writers/ui/writer-builder";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/writers/$writerId",
)({
   component: EditWriterPage,
});

function EditWriterPage() {
   const { writerId, slug, teamSlug } = Route.useParams();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();

   const {
      data: writer,
      isLoading,
      error,
   } = useQuery(
      orpc.writer.getById.queryOptions({ input: { id: writerId } }),
   );

   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [initialized, setInitialized] = useState(false);

   useEffect(() => {
      if (writer && !initialized) {
         setName(writer.personaConfig.metadata.name);
         setDescription(writer.personaConfig.metadata.description ?? "");
         setInitialized(true);
      }
   }, [writer, initialized]);

   const updateMutation = useMutation(
      orpc.writer.update.mutationOptions({
         onSuccess: () => {
            toast.success("Escritor atualizado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.writer.getById.queryOptions({ input: { id: writerId } }).queryKey,
            });
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar escritor");
         },
      }),
   );

   const deleteMutation = useMutation(
      orpc.writer.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Escritor excluído");
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
            navigate({ to: "/$slug/$teamSlug/writers", params: { slug, teamSlug } });
         },
         onError: () => {
            toast.error("Erro ao excluir escritor");
         },
      }),
   );

   const handleSave = useCallback(() => {
      if (!name.trim()) {
         toast.error("O nome do escritor é obrigatório");
         return;
      }
      updateMutation.mutate({
         id: writerId,
         personaConfig: {
            metadata: {
               name: name.trim(),
               ...(description.trim() ? { description: description.trim() } : {}),
            },
         },
      });
   }, [writerId, name, description, updateMutation]);

   const handleDelete = useCallback(() => {
      openAlertDialog({
         title: "Excluir escritor",
         description: `Tem certeza que deseja excluir o escritor "${name}"? Esta ação não pode ser desfeita.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: () => deleteMutation.mutate({ id: writerId }),
      });
   }, [writerId, name, deleteMutation, openAlertDialog]);

   if (isLoading) {
      return (
         <main className="flex flex-col gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-full max-w-md" />
            <div className="flex gap-6 mt-4">
               <Skeleton className="h-[300px] w-80" />
               <Skeleton className="h-[300px] flex-1" />
            </div>
         </main>
      );
   }

   if (error) {
      return (
         <main className="flex flex-col items-center justify-center gap-3 h-64 text-muted-foreground">
            <AlertCircle className="size-8 text-destructive/60" />
            <p className="text-sm text-center max-w-xs">
               Erro ao carregar escritor: {error.message}
            </p>
         </main>
      );
   }

   if (!writer) return null;

   const instructions = (writer.instructionMemories ?? []) as InstructionMemoryItem[];

   return (
      <WriterBuilder
         contentCount={writer.contentCount}
         description={description}
         instructions={instructions}
         isSaving={updateMutation.isPending}
         name={name}
         onDelete={handleDelete}
         onDescriptionChange={setDescription}
         onNameChange={setName}
         onSave={handleSave}
         profilePhotoUrl={writer.profilePhotoUrl ?? null}
         recentContent={writer.recentContent}
         writerId={writerId}
      />
   );
}
```

### 7b — New writer route (`new.tsx`)

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/writers/new.tsx`

Remove dead state (tone, voice, complexity, writingGuidelines). Simplify `handleSave`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { WriterBuilder } from "@/features/writers/ui/writer-builder";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/writers/new",
)({
   component: NewWriterPage,
});

function NewWriterPage() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({ from: "/_authenticated/$slug/$teamSlug/_dashboard" });
   const queryClient = useQueryClient();

   const [name, setName] = useState("");
   const [description, setDescription] = useState("");

   const createMutation = useMutation(
      orpc.writer.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Escritor criado com sucesso");
            queryClient.invalidateQueries({ queryKey: orpc.writer.list.queryOptions({}).queryKey });
            navigate({ to: "/$slug/$teamSlug/writers/$writerId", params: { slug, teamSlug, writerId: data.id } });
         },
         onError: () => {
            toast.error("Erro ao criar escritor");
         },
      }),
   );

   const handleSave = useCallback(() => {
      if (!name.trim()) {
         toast.error("O nome do escritor é obrigatório");
         return;
      }
      createMutation.mutate({
         personaConfig: {
            metadata: {
               name: name.trim(),
               ...(description.trim() ? { description: description.trim() } : {}),
            },
         },
      });
   }, [name, description, createMutation]);

   return (
      <WriterBuilder
         description={description}
         isSaving={createMutation.isPending}
         name={name}
         onDescriptionChange={setDescription}
         onNameChange={setName}
         onSave={handleSave}
         profilePhotoUrl={null}
      />
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/writers/\$writerId.tsx
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/writers/new.tsx
git commit -m "refactor(writer): remove dead state from route files, pass new props to WriterBuilder"
```

---

## Task 8: Clean up `WriterForm` (settings sheet)

**Files:**
- Modify: `apps/web/src/features/writers/ui/writer-form.tsx`

**Goal:** Remove tone/voice/complexity/writingGuidelines from the sheet form in settings. Keep: name, description, photo URL (text input — presigned upload not needed in the simplified sheet).

**Step 1: Open the file**

Read `apps/web/src/features/writers/ui/writer-form.tsx`. Remove:
- The `TONE_OPTIONS`, `VOICE_OPTIONS`, `COMPLEXITY_OPTIONS` arrays
- The `tone`, `voice`, `complexity`, `writingGuidelines` state variables
- The `WritingStyle` section from the JSX
- Those fields from the mutation payloads (keep `ragIntegration: true` etc in the create call if they have defaults in the schema, otherwise remove entirely)
- The corresponding imports (Select, SelectContent, etc.) if no longer used

Keep: name field, description field, photo URL text input (acceptable in the settings sheet; full upload UX lives in the builder).

**Step 2: Verify the `personaConfig.instructions` payload**

After removing the style fields, the `instructions` object in create/update mutations will be empty or only contain feature flags. If the schema allows `instructions` to be optional (it does — `WriterConfigSchema.optional()`), omit it entirely:

```typescript
personaConfig: {
   metadata: { name: name.trim(), description: description.trim() || undefined },
},
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/features/writers/ui/writer-form.tsx
git commit -m "refactor(writer): remove dead style fields from WriterForm settings sheet"
```

---

## Task 9: Verify end-to-end

**Step 1: Run typecheck**

```bash
bun run typecheck
```

All errors must be resolved before proceeding.

**Step 2: Start dev server**

```bash
bun dev
```

**Step 3: Manual checklist**

- [ ] Create a new writer — only name + description fields, no tone/voice/complexity
- [ ] After create, navigate to edit page — all 3 tabs visible
- [ ] **Identidade tab**: photo upload works (file picker → preview → "Salvar foto" → avatar updates)
- [ ] **Identidade tab**: photo remove works
- [ ] **Memória tab**: guidance callout visible with good/bad examples
- [ ] **Memória tab**: inline add form works — add an instruction → appears in list
- [ ] **Memória tab**: toggle switch enables/disables instruction
- [ ] **Memória tab**: `...` dropdown → Remover → alert dialog → instruction deleted
- [ ] **Conteúdo tab**: shows list of content (or empty state if none)
- [ ] Clicking a content row navigates to the content page
- [ ] Settings sheet (project settings → writers): create/edit still works without style fields

**Step 4: Final commit if any loose fixes**

```bash
git add -p
git commit -m "fix(writer): post-integration cleanup"
```

---

## Files Changed Summary

| File | Action |
|------|--------|
| `apps/web/src/integrations/orpc/router/agent.ts` | Fix: fetch writer instructions in `aiCommandStream` |
| `apps/web/src/integrations/orpc/router/writer.ts` | Add: `generatePhotoUploadUrl` procedure |
| `apps/web/src/integrations/orpc/router/index.ts` | Verify export (likely no change needed) |
| `apps/web/src/features/writers/ui/writer-photo-upload.tsx` | **New**: photo upload component |
| `apps/web/src/features/writers/ui/writer-content-section.tsx` | **New**: linked content tab |
| `apps/web/src/features/writers/ui/writer-instructions-section.tsx` | Rewrite: inline form + guidance callout |
| `apps/web/src/features/writers/ui/writer-builder.tsx` | Rewrite: 3-tab layout, remove dead props |
| `apps/web/src/features/writers/ui/writer-form.tsx` | Clean: remove dead style fields |
| `apps/web/src/routes/...writers/$writerId.tsx` | Clean: remove dead state, pass new props |
| `apps/web/src/routes/...writers/new.tsx` | Clean: remove dead state |

**No DB schema changes.** `personaConfig.metadata.description` is already `string | undefined` — no migration needed.
