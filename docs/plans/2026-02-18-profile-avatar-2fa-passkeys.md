# Profile Avatar, 2FA & Passkeys Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add profile photo upload, fully functional 2FA (TOTP inline setup), and passkey management to the profile settings page.

**Architecture:** 2FA and passkeys use Better Auth's existing plugin system (`twoFactor` already wired server+client; `passkey` needs installation and schema migration). Profile photo follows the existing MinIO presigned-URL upload pattern (same as org logo). All three features are added as new inline sections in `profile.tsx` — no new routes or sheets.

**Tech Stack:** Better Auth `twoFactor` client methods, `@better-auth/passkey` server/client plugin, MinIO presigned URLs via oRPC, `react-qr-code` for TOTP QR, `useFileUpload` + `usePresignedUpload` hooks, TanStack Query `useMutation`/`useQuery`.

---

## Context & Prerequisites

**2FA — already wired, no package installation needed:**
- Server plugin: `twoFactor()` already in `packages/authentication/src/server.ts:222`
- Client plugin: `twoFactorClient()` already in `packages/authentication/src/client.ts:61`
- DB table `two_factor` already in `packages/database/src/schemas/auth.ts`
- `user.twoFactorEnabled: boolean` already on session user

**Available `authClient.twoFactor.*` methods:**
- `twoFactor.enable({ password })` → `{ data: { totpURI, backupCodes } }` — enables 2FA, returns QR URI + codes
- `twoFactor.verifyTotp({ code })` → completes 2FA activation
- `twoFactor.disable({ password })` → disables 2FA
- `twoFactor.generateBackupCodes({ password })` → regenerates backup codes
- `twoFactor.viewBackupCodes({ password })` → shows existing codes

**Passkeys — NOT installed, schema migration required:**
- `@better-auth/passkey` not in catalog or any package.json
- Must add to catalog, install in auth package + web app
- Must regenerate auth schema + push DB

**Available `authClient.passkey.*` methods (after install):**
- `passkey.addPasskey({ name? })` — WebAuthn browser registration flow
- `passkey.listUserPasskeys()` → `{ data: Passkey[] }` — list user's passkeys
- `passkey.deletePasskey({ id })` — removes a passkey
- `passkey.updatePasskey({ id, name })` — rename passkey

**Profile photo upload pattern (same as org logo, `apps/web/src/integrations/orpc/router/organization.ts:286`):**
- oRPC procedure generates MinIO presigned URL → `usePresignedUpload` uploads file → `authClient.updateUser({ image: publicUrl })` saves URL
- Bucket name to use: `user-avatars`
- File name pattern: `avatar-{userId}-{nanoid()}.{ext}`

---

### Task 1: Add `@better-auth/passkey` to catalog and install

**Files:**
- Modify: `package.json` (root) — add to `"auth"` catalog
- Modify: `packages/authentication/package.json` — add dependency
- Modify: `apps/web/package.json` — add dependency

**Step 1: Add to root catalog**

In `package.json` find the `"auth"` catalog block (around line 92-96) and add `@better-auth/passkey`:

```json
"auth": {
  "better-auth": "1.4.18",
  "@better-auth/stripe": "1.4.18",
  "@better-auth/oauth-provider": "1.4.18",
  "@better-auth/passkey": "1.4.18"
}
```

**Step 2: Add to `packages/authentication/package.json`**

In the `dependencies` section, add alongside the other `@better-auth/*` packages:
```json
"@better-auth/passkey": "catalog:auth"
```

**Step 3: Add to `apps/web/package.json`**

In the `dependencies` section, add:
```json
"@better-auth/passkey": "catalog:auth"
```

**Step 4: Install**

```bash
bun install
```

Expected: packages install without errors.

**Step 5: Commit**

```bash
git add package.json packages/authentication/package.json apps/web/package.json bun.lockb
git commit -m "feat(passkeys): add @better-auth/passkey to catalog and install"
```

---

### Task 2: Wire passkey plugin server-side + client-side

**Files:**
- Modify: `packages/authentication/src/server.ts`
- Modify: `packages/authentication/src/client.ts`

**Step 1: Add `passkey()` to server plugins**

In `packages/authentication/src/server.ts`, add import:
```typescript
import { passkey } from "@better-auth/passkey";
```

In the `plugins` array (after `twoFactor(...)` around line 233), add:
```typescript
passkey(),
```

**Step 2: Add `passkeyClient()` to auth client**

In `packages/authentication/src/client.ts`, add import:
```typescript
import { passkeyClient } from "@better-auth/passkey/client";
```

In the `plugins` array, add `passkeyClient()` alongside the other clients:
```typescript
passkeyClient(),
```

**Step 3: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: no new errors from the passkey imports.

**Step 4: Commit**

```bash
git add packages/authentication/src/server.ts packages/authentication/src/client.ts
git commit -m "feat(passkeys): wire passkey() server plugin and passkeyClient() to auth"
```

---

### Task 3: Regenerate auth schema and push passkey table to DB

**Files:**
- Auto-modified: `packages/database/src/schemas/auth.ts` (by CLI)

**Step 1: Run the auth schema generator**

This command re-reads `server.ts` (with the new passkey plugin) and outputs the full Better Auth schema to `packages/database/src/schemas/auth.ts`:

```bash
cd packages/authentication && bun run auth-schema-generate
```

Expected: The script runs without error and `packages/database/src/schemas/auth.ts` gains a new `passkey` table definition.

**Step 2: Verify the schema was updated**

```bash
grep -n "passkey" packages/database/src/schemas/auth.ts
```

Expected: Lines showing `export const passkey = pgTable("passkey", ...)` or similar.

**Step 3: Push schema to database**

```bash
bun run db:push
```

Expected: Drizzle detects the new `passkey` table and creates it in the DB. Confirm with `y` if prompted.

**Step 4: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 5: Commit**

```bash
git add packages/database/src/schemas/auth.ts
git commit -m "feat(passkeys): add passkey table to DB schema"
```

---

### Task 4: Install `react-qr-code` for 2FA TOTP display

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install react-qr-code**

```bash
bun add react-qr-code --cwd apps/web
```

Expected: package added to `apps/web/package.json` dependencies and `bun.lockb` updated.

**Step 2: Verify import works**

In a quick test (no file needed — just run typecheck after step 3):
```typescript
import { QRCodeSVG } from "react-qr-code";
// Usage: <QRCodeSVG value="otpauth://totp/..." size={200} />
```

**Step 3: Commit**

```bash
git add apps/web/package.json bun.lockb
git commit -m "feat(2fa): install react-qr-code for TOTP QR display"
```

---

### Task 5: Add `generateAvatarUploadUrl` oRPC procedure

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/account.ts`

**Step 1: Add imports at the top of `account.ts`**

The file currently has no `ORPCError` import (check line 1). Add at the top:
```typescript
import { ORPCError } from "@orpc/server";
import { env as serverEnv } from "@packages/environment/server";
import {
   generatePresignedPutUrl,
   getMinioClient,
} from "@packages/files/client";
import { nanoid } from "nanoid";
import { z } from "zod";
```

Note: `nanoid` and `z` may already be imported — don't duplicate.

**Step 2: Add the procedure at the bottom of `account.ts`**

```typescript
/**
 * Generate presigned URL for user avatar upload
 */
export const generateAvatarUploadUrl = protectedProcedure
   .input(
      z.object({
         fileExtension: z.string(),
         contentType: z.string(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { userId } = context;

      try {
         const minioClient = getMinioClient(serverEnv);
         const bucketName = "user-avatars";
         const fileName = `avatar-${userId}-${nanoid()}.${input.fileExtension}`;

         const presignedUrl = await generatePresignedPutUrl(
            fileName,
            bucketName,
            minioClient,
            300, // 5 minutes
         );

         return {
            presignedUrl,
            fileName,
            publicUrl: `/api/files/${bucketName}/${fileName}`,
         };
      } catch (error) {
         console.error("Failed to generate avatar upload URL:", error);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to generate upload URL",
         });
      }
   });
```

**Step 3: Verify the procedure is exported from the router index**

Check `apps/web/src/integrations/orpc/router/index.ts` — the `account` router is already imported as `* as accountRouter`. Since we're exporting `generateAvatarUploadUrl` from `account.ts`, it will automatically be available as `orpc.account.generateAvatarUploadUrl`.

**Step 4: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 5: Commit**

```bash
git add apps/web/src/integrations/orpc/router/account.ts
git commit -m "feat(avatar): add generateAvatarUploadUrl oRPC procedure"
```

---

### Task 6: Avatar upload section UI

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

**Step 1: Add new imports to profile.tsx**

Add to the import block:
```typescript
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
```

**Step 2: Add `AvatarUploadSection` component**

Add this component BEFORE `ProfileSectionSkeleton` (after `formatDate`):

```tsx
// ============================================
// Avatar Upload Section
// ============================================

function AvatarUploadSection({
   currentImage,
   name,
}: {
   currentImage: string | null;
   name: string | null;
}) {
   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024, // 5 MB
   });
   const presignedUpload = usePresignedUpload();

   const saveMutation = useMutation({
      mutationFn: async () => {
         if (!fileUpload.selectedFile) throw new Error("No file selected");

         const fileExtension =
            fileUpload.selectedFile.name.split(".").pop() ?? "png";
         const contentType = fileUpload.selectedFile.type;

         const uploadData = await orpc.account.generateAvatarUploadUrl.call({
            fileExtension,
            contentType,
         });

         await presignedUpload.uploadToPresignedUrl(
            uploadData.presignedUrl,
            fileUpload.selectedFile,
            contentType,
         );

         await authClient.updateUser({ image: uploadData.publicUrl });
      },
      onSuccess: () => {
         toast.success("Foto de perfil atualizada!");
         fileUpload.clearFile();
      },
      onError: () => {
         toast.error("Erro ao atualizar foto de perfil");
      },
   });

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Foto de perfil</h2>
            <p className="text-sm text-muted-foreground">
               Sua foto de perfil visível para outros membros.
            </p>
         </div>
         <div className="flex items-start gap-4">
            <Avatar className="size-16 rounded-lg">
               <AvatarImage
                  alt={name || "Avatar"}
                  src={fileUpload.filePreview || currentImage || undefined}
               />
               <AvatarFallback className="rounded-lg">
                  {name ? (
                     getInitials(name)
                  ) : (
                     <User className="size-6" />
                  )}
               </AvatarFallback>
            </Avatar>
            <div className="flex-1 max-w-xs">
               <Dropzone
                  accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
                  className="h-20"
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  onDrop={(files) => fileUpload.handleFileSelect(files, () => {})}
               >
                  <DropzoneEmptyState>
                     <p className="text-xs text-muted-foreground">
                        Clique ou arraste para enviar
                     </p>
                  </DropzoneEmptyState>
                  <DropzoneContent>
                     <p className="text-xs text-muted-foreground">
                        Imagem selecionada
                     </p>
                  </DropzoneContent>
               </Dropzone>
            </div>
         </div>
         {fileUpload.filePreview && (
            <Button
               disabled={saveMutation.isPending || presignedUpload.isUploading}
               onClick={() => saveMutation.mutate()}
               size="sm"
            >
               {(saveMutation.isPending || presignedUpload.isUploading) && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar foto
            </Button>
         )}
         {fileUpload.error && (
            <p className="text-sm text-destructive">{fileUpload.error}</p>
         )}
      </section>
   );
}
```

**Step 3: Wire into `ProfileSectionContent`**

In the `ProfileSectionContent` return JSX, add `AvatarUploadSection` as the FIRST section (before `ProfileNameSection`), with a `<Separator />` after it:

```tsx
<AvatarUploadSection
   currentImage={user.image ?? null}
   name={user.name}
/>

<Separator />

<ProfileNameSection currentName={user.name || ""} />
```

**Step 4: Update `ProfileSectionSkeleton`**

Add a skeleton for the avatar section at the top (before the name section skeleton):

```tsx
// Avatar section skeleton — before name section
<div className="space-y-3">
   <Skeleton className="h-6 w-36" />
   <div className="flex items-start gap-4">
      <Skeleton className="size-16 rounded-lg" />
      <Skeleton className="h-20 w-64" />
   </div>
</div>
<Skeleton className="h-px w-full" />
```

**Step 5: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 6: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/settings/profile.tsx
git commit -m "feat(avatar): add inline profile photo upload section"
```

---

### Task 7: 2FA section UI (inline multi-step setup)

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

**Step 1: Add `QRCodeSVG` import**

```typescript
import { QRCodeSVG } from "react-qr-code";
```

**Step 2: Add `TwoFactorSection` component**

The component manages a `step` state: `'idle' | 'enabling-confirm' | 'show-qr' | 'show-backup-codes' | 'disabling-confirm'`.

Add this component before `ProfileSectionSkeleton`:

```tsx
// ============================================
// Two-Factor Authentication Section
// ============================================

type TwoFactorStep =
   | "idle"
   | "enabling-confirm"
   | "show-qr"
   | "show-backup-codes"
   | "disabling-confirm";

function TwoFactorSection({
   twoFactorEnabled,
}: {
   twoFactorEnabled: boolean;
}) {
   const [step, setStep] = useState<TwoFactorStep>("idle");
   const [password, setPassword] = useState("");
   const [totpCode, setTotpCode] = useState("");
   const [totpUri, setTotpUri] = useState("");
   const [backupCodes, setBackupCodes] = useState<string[]>([]);

   const resetState = () => {
      setStep("idle");
      setPassword("");
      setTotpCode("");
      setTotpUri("");
      setBackupCodes([]);
   };

   // Step 1: Call enable with password, get back totpURI + backupCodes
   const enableMutation = useMutation({
      mutationFn: async () => {
         const result = await authClient.twoFactor.enable({ password });
         if (result.error) throw new Error(result.error.message);
         return result.data;
      },
      onSuccess: (data) => {
         setTotpUri(data?.totpURI ?? "");
         setBackupCodes(data?.backupCodes ?? []);
         setPassword("");
         setStep("show-qr");
      },
      onError: (error) => {
         toast.error(
            error instanceof Error ? error.message : "Senha incorreta",
         );
      },
   });

   // Step 2: Verify TOTP code to complete activation
   const verifyMutation = useMutation({
      mutationFn: async () => {
         const result = await authClient.twoFactor.verifyTotp({ code: totpCode });
         if (result.error) throw new Error(result.error.message);
         return result.data;
      },
      onSuccess: () => {
         setStep("show-backup-codes");
      },
      onError: (error) => {
         toast.error(
            error instanceof Error ? error.message : "Código inválido",
         );
      },
   });

   // Disable 2FA
   const disableMutation = useMutation({
      mutationFn: async () => {
         const result = await authClient.twoFactor.disable({ password });
         if (result.error) throw new Error(result.error.message);
         return result.data;
      },
      onSuccess: () => {
         toast.success("2FA desativado com sucesso!");
         resetState();
      },
      onError: (error) => {
         toast.error(
            error instanceof Error ? error.message : "Senha incorreta",
         );
      },
   });

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Autenticação de dois fatores</h2>
            <p className="text-sm text-muted-foreground">
               Adicione uma camada extra de segurança usando um aplicativo autenticador.
            </p>
         </div>

         <div className="max-w-md space-y-4">
            {/* Idle state — show status + action button */}
            {step === "idle" && (
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <span className="text-sm text-muted-foreground">Status:</span>
                     {twoFactorEnabled ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                           Ativado
                        </Badge>
                     ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                           Desativado
                        </Badge>
                     )}
                  </div>
                  {twoFactorEnabled ? (
                     <Button
                        onClick={() => setStep("disabling-confirm")}
                        size="sm"
                        variant="destructive"
                     >
                        Desativar 2FA
                     </Button>
                  ) : (
                     <Button
                        onClick={() => setStep("enabling-confirm")}
                        size="sm"
                     >
                        Ativar 2FA
                     </Button>
                  )}
               </div>
            )}

            {/* Step: confirm password to enable */}
            {step === "enabling-confirm" && (
               <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                     Confirme sua senha para continuar.
                  </p>
                  <div className="space-y-1.5">
                     <Label htmlFor="2fa-enable-password">Senha</Label>
                     <PasswordInput
                        id="2fa-enable-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        value={password}
                     />
                  </div>
                  <div className="flex gap-2">
                     <Button
                        disabled={password.length === 0 || enableMutation.isPending}
                        onClick={() => enableMutation.mutate()}
                        size="sm"
                     >
                        {enableMutation.isPending && (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        Continuar
                     </Button>
                     <Button onClick={resetState} size="sm" variant="outline">
                        Cancelar
                     </Button>
                  </div>
               </div>
            )}

            {/* Step: show QR code + verify code */}
            {step === "show-qr" && (
               <div className="space-y-4">
                  <div className="space-y-2">
                     <p className="text-sm font-medium">
                        1. Escaneie o QR code com seu aplicativo autenticador
                     </p>
                     <div className="p-4 bg-white rounded-lg inline-block">
                        <QRCodeSVG value={totpUri} size={180} />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label htmlFor="totp-code">
                        2. Digite o código gerado pelo aplicativo
                     </Label>
                     <Input
                        id="totp-code"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder="000000"
                        value={totpCode}
                     />
                  </div>
                  <div className="flex gap-2">
                     <Button
                        disabled={totpCode.length !== 6 || verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate()}
                        size="sm"
                     >
                        {verifyMutation.isPending && (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        Verificar
                     </Button>
                     <Button onClick={resetState} size="sm" variant="outline">
                        Cancelar
                     </Button>
                  </div>
               </div>
            )}

            {/* Step: show backup codes */}
            {step === "show-backup-codes" && (
               <div className="space-y-3">
                  <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
                     <p className="text-sm font-medium">
                        2FA ativado! Guarde seus códigos de backup
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Use esses códigos se perder acesso ao seu aplicativo autenticador.
                        Cada código só pode ser usado uma vez.
                     </p>
                     <div className="grid grid-cols-2 gap-1 mt-2">
                        {backupCodes.map((code) => (
                           <code
                              key={code}
                              className="text-xs font-mono bg-background border rounded px-2 py-1 text-center"
                           >
                              {code}
                           </code>
                        ))}
                     </div>
                  </div>
                  <Button onClick={resetState} size="sm">
                     Concluído
                  </Button>
               </div>
            )}

            {/* Step: confirm password to disable */}
            {step === "disabling-confirm" && (
               <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                     Confirme sua senha para desativar o 2FA.
                  </p>
                  <div className="space-y-1.5">
                     <Label htmlFor="2fa-disable-password">Senha</Label>
                     <PasswordInput
                        id="2fa-disable-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        value={password}
                     />
                  </div>
                  <div className="flex gap-2">
                     <Button
                        disabled={password.length === 0 || disableMutation.isPending}
                        onClick={() => disableMutation.mutate()}
                        size="sm"
                        variant="destructive"
                     >
                        {disableMutation.isPending && (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        Desativar
                     </Button>
                     <Button onClick={resetState} size="sm" variant="outline">
                        Cancelar
                     </Button>
                  </div>
               </div>
            )}
         </div>
      </section>
   );
}
```

**Step 3: Wire `TwoFactorSection` into `ProfileSectionContent`**

In the `ProfileSectionContent` return JSX, add after `AccountSummarySection` (which is last):

```tsx
<Separator />

<TwoFactorSection twoFactorEnabled={user.twoFactorEnabled ?? false} />
```

Note: `user.twoFactorEnabled` comes from the session — it's on the user object since `twoFactorEnabled` is in the user table. Check the session type if TypeScript complains; it may be at `user.twoFactorEnabled`.

**Step 4: Update skeleton**

Add two more skeleton blocks at the bottom of `ProfileSectionSkeleton`:

```tsx
<Skeleton className="h-px w-full" />
<div className="space-y-3">
   <Skeleton className="h-6 w-56" />
   <Skeleton className="h-4 w-80" />
   <Skeleton className="h-10 w-full max-w-md" />
</div>
```

**Step 5: Typecheck**

```bash
bun run typecheck
```

Expected: no errors. If `user.twoFactorEnabled` causes a type error, check what the session type includes — it may be `user.twoFactorEnabled` from `inferAdditionalFields<AuthInstance>()`. The field is added by the `twoFactor` plugin to the user type.

**Step 6: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/settings/profile.tsx
git commit -m "feat(2fa): add inline 2FA section with TOTP QR setup and backup codes"
```

---

### Task 8: Passkeys section UI

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

**Step 1: Add Trash2 to lucide imports**

In the lucide import block, add `Trash2`:
```typescript
import { ..., Trash2 } from "lucide-react";
```

Also add `useQueryClient` to the TanStack Query import:
```typescript
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
```

**Step 2: Add `PasskeysSection` component**

Add before `ProfileSectionSkeleton`:

```tsx
// ============================================
// Passkeys Section
// ============================================

function PasskeysSection() {
   const queryClient = useQueryClient();

   const { data: passkeys = [] } = useQuery({
      queryKey: ["passkeys"],
      queryFn: async () => {
         const result = await authClient.passkey.listUserPasskeys();
         return result.data ?? [];
      },
   });

   const addMutation = useMutation({
      mutationFn: async () => {
         const result = await authClient.passkey.addPasskey();
         if (result?.error) throw new Error(result.error.message);
         return result?.data;
      },
      onSuccess: () => {
         toast.success("Passkey adicionada com sucesso!");
         queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      },
      onError: (error) => {
         toast.error(
            error instanceof Error ? error.message : "Erro ao adicionar passkey",
         );
      },
   });

   const deleteMutation = useMutation({
      mutationFn: async (id: string) => {
         const result = await authClient.passkey.deletePasskey({ id });
         if (result?.error) throw new Error(result.error.message);
         return result?.data;
      },
      onSuccess: () => {
         toast.success("Passkey removida!");
         queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      },
      onError: (error) => {
         toast.error(
            error instanceof Error ? error.message : "Erro ao remover passkey",
         );
      },
   });

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Passkeys</h2>
            <p className="text-sm text-muted-foreground">
               Gerencie suas passkeys para login sem senha usando biometria ou chave de segurança.
            </p>
         </div>

         <div className="max-w-md space-y-3">
            {passkeys.length === 0 ? (
               <p className="text-sm text-muted-foreground">
                  Nenhuma passkey cadastrada.
               </p>
            ) : (
               <div className="space-y-2">
                  {passkeys.map((passkey) => (
                     <div
                        key={passkey.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                     >
                        <div className="min-w-0">
                           <p className="text-sm font-medium truncate">
                              {passkey.name || "Passkey"}
                           </p>
                           {passkey.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                 Adicionada em{" "}
                                 {new Date(passkey.createdAt).toLocaleDateString(
                                    "pt-BR",
                                 )}
                              </p>
                           )}
                        </div>
                        <Button
                           disabled={deleteMutation.isPending}
                           onClick={() => deleteMutation.mutate(passkey.id)}
                           size="icon"
                           variant="ghost"
                           className="text-destructive hover:text-destructive shrink-0"
                        >
                           <Trash2 className="size-4" />
                        </Button>
                     </div>
                  ))}
               </div>
            )}

            <Button
               disabled={addMutation.isPending}
               onClick={() => addMutation.mutate()}
               size="sm"
               variant="outline"
            >
               {addMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Adicionar passkey
            </Button>
         </div>
      </section>
   );
}
```

**Note on passkey type:** `authClient.passkey.listUserPasskeys()` returns passkeys with `id`, `name`, `createdAt`, and other WebAuthn fields. The exact type depends on the plugin — use the inferred type, and if TypeScript complains about missing fields, access only `passkey.id`, `passkey.name`, `passkey.createdAt`.

**Step 3: Wire `PasskeysSection` into `ProfileSectionContent`**

After `TwoFactorSection`, add:

```tsx
<Separator />

<PasskeysSection />
```

**Step 4: Update skeleton**

Add at the end of `ProfileSectionSkeleton`:

```tsx
<Skeleton className="h-px w-full" />
<div className="space-y-3">
   <Skeleton className="h-6 w-28" />
   <Skeleton className="h-4 w-80" />
   <Skeleton className="h-8 w-40" />
</div>
```

**Step 5: Typecheck**

```bash
bun run typecheck
```

Fix any type issues. If `authClient.passkey.*` methods are not typed, check that `passkeyClient()` is in the client plugins and that `@better-auth/passkey` is installed.

**Step 6: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/settings/profile.tsx
git commit -m "feat(passkeys): add passkeys management section to profile page"
```

---

### Task 9: Final typecheck and smoke-test checklist

**Step 1: Run full typecheck**

```bash
bun run typecheck
```

Expected: `NX Successfully ran target typecheck for 22 projects` with no errors.

**Step 2: Manual smoke-test checklist**

Profile page sections (top to bottom):
- [ ] **Avatar**: dropzone shows, selecting image shows preview + "Salvar foto" button, saving uploads to MinIO and updates user image
- [ ] **Name**: inline input works as before
- [ ] **Email**: inline input works as before
- [ ] **Password**: three PasswordInput fields work as before
- [ ] **Account Summary**: grid shows avatar + member-since
- [ ] **2FA (disabled user)**: shows "Desativado" badge + "Ativar 2FA" button → password confirm → QR code → verify code → backup codes shown
- [ ] **2FA (enabled user)**: shows "Ativado" badge + "Desativar 2FA" button → password confirm → disabled
- [ ] **Passkeys**: shows empty state or list, "Adicionar passkey" triggers WebAuthn browser prompt, passkeys can be deleted

**Step 3: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix(profile): typecheck and smoke-test fixes for avatar/2fa/passkeys"
```
