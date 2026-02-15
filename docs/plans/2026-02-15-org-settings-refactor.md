# Organization Settings Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor all 6 organization settings pages (General, Members, Roles, Security, Authentication, Danger Zone) inspired by PostHog — with descriptive UI/UX, functional features, and addon-gated upsells.

**Architecture:** Pages use existing patterns (ErrorBoundary + Suspense + Content components). General page uses inline-edit + sheet mix. Members uses DataTable with search. Roles/Security/Auth use addon-gated with descriptive feature previews. All org mutations go through Better Auth's `authClient.organization.*` API.

**Tech Stack:** React, TanStack Router, TanStack Query, TanStack Table (via `@packages/ui/components/data-table`), Better Auth org plugin (`authClient.organization.*`), oRPC for read operations, `@packages/ui` components.

---

## Better Auth Organization API Reference

Available via `authClient.organization.*`:
- `update({ data: { name }, organizationId })` — rename org
- `inviteMember({ email, role, organizationId })` — invite user
- `removeMember({ memberIdOrEmail, organizationId })` — remove member
- `updateMemberRole({ memberId, role, organizationId })` — change role
- `cancelInvitation({ invitationId })` — cancel pending invite
- `getInvitation({ id })` — get invite details
- `listInvitations({ query: { organizationId } })` — list pending invites
- `deleteOrganization({ organizationId })` — delete org (danger zone)

Available via `auth.api.*` (server-side, used in oRPC routers):
- `getFullOrganization`, `listOrganizationTeams`, `listActiveSubscriptions`

---

### Task 1: Organization General Page — Full Refactor

**Files:**
- Rewrite: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/general.tsx`

**Goal:** PostHog-inspired general page with:
1. **Display name** section — Input field showing current name + "Rename organization" button (inline, not sheet)
2. **Logo** section — Current logo preview + upload dropzone + "Save logo" button
3. **Organization details** section — Slug (read-only, copy button), created date, member count, plan info

**Step 1: Rewrite the general page**

Replace entire file with:

```tsx
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Check, Copy, Loader2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/organization/general",
)({
   component: OrganizationGeneralPage,
});

function formatDate(date: Date | string | null): string {
   if (!date) return "-";
   const d = new Date(date);
   return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
   });
}

// ============================================
// Display Name Section
// ============================================

function DisplayNameSection({
   organizationId,
   currentName,
}: {
   organizationId: string;
   currentName: string;
}) {
   const [name, setName] = useState(currentName);
   const queryClient = useQueryClient();

   const renameMutation = useMutation({
      mutationFn: async () => {
         await authClient.organization.update({
            data: { name },
            organizationId,
         });
      },
      onSuccess: () => {
         toast.success("Organização renomeada com sucesso!");
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getActiveOrganization.queryOptions({}).queryKey,
         });
      },
      onError: () => {
         toast.error("Erro ao renomear organização");
      },
   });

   const hasChanged = name.trim() !== currentName && name.trim().length > 0;

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Nome de exibição</h2>
            <p className="text-sm text-muted-foreground">
               O nome público da sua organização. Visível para todos os membros.
            </p>
         </div>
         <div className="max-w-md space-y-3">
            <Input
               onChange={(e) => setName(e.target.value)}
               placeholder="Nome da organização"
               value={name}
            />
            <Button
               disabled={!hasChanged || renameMutation.isPending}
               onClick={() => renameMutation.mutate()}
               size="sm"
            >
               {renameMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Renomear organização
            </Button>
         </div>
      </section>
   );
}

// ============================================
// Logo Section
// ============================================

function LogoSection({
   organizationId,
   currentLogo,
   organizationName,
}: {
   organizationId: string;
   currentLogo: string | null;
   organizationName: string;
}) {
   const queryClient = useQueryClient();
   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

   const saveMutation = useMutation({
      mutationFn: async () => {
         // TODO: Upload file to storage first, then update org with URL
         await authClient.organization.update({
            data: { logo: fileUpload.filePreview || undefined },
            organizationId,
         });
      },
      onSuccess: () => {
         toast.success("Logo atualizado com sucesso!");
         fileUpload.clearFile();
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getActiveOrganization.queryOptions({}).queryKey,
         });
      },
      onError: () => {
         toast.error("Erro ao atualizar logo");
      },
   });

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Logo</h2>
            <p className="text-sm text-muted-foreground">
               A imagem da sua organização. Recomendamos 192x192 px ou maior.
            </p>
         </div>
         <div className="flex items-start gap-4">
            <Avatar className="size-16 rounded-lg">
               <AvatarImage
                  alt={organizationName}
                  src={fileUpload.filePreview || currentLogo || undefined}
               />
               <AvatarFallback className="rounded-lg">
                  <Building2 className="size-6" />
               </AvatarFallback>
            </Avatar>
            <div className="flex-1 max-w-xs">
               <Dropzone
                  accept={{
                     "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                  }}
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
               disabled={saveMutation.isPending}
               onClick={() => saveMutation.mutate()}
               size="sm"
            >
               {saveMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar logo
            </Button>
         )}
         {fileUpload.error && (
            <p className="text-sm text-destructive">{fileUpload.error}</p>
         )}
      </section>
   );
}

// ============================================
// Organization Details Section
// ============================================

function OrganizationDetailsSection({
   slug,
   memberCount,
   createdAt,
   plan,
}: {
   slug: string;
   memberCount: number;
   createdAt: Date | string | null;
   plan: string | null;
}) {
   const [copied, setCopied] = useState(false);

   const handleCopySlug = () => {
      navigator.clipboard.writeText(slug);
      setCopied(true);
      toast.success("Slug copiado!");
      setTimeout(() => setCopied(false), 2000);
   };

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Detalhes da organização</h2>
            <p className="text-sm text-muted-foreground">
               Informações gerais sobre sua organização.
            </p>
         </div>
         <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
               <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Slug
               </Label>
               <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                     {slug}
                  </code>
                  <Button
                     onClick={handleCopySlug}
                     size="icon"
                     variant="ghost"
                     className="size-7"
                  >
                     {copied ? (
                        <Check className="size-3.5" />
                     ) : (
                        <Copy className="size-3.5" />
                     )}
                  </Button>
               </div>
            </div>
            <div className="space-y-1">
               <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Membros
               </Label>
               <p className="text-sm">
                  {memberCount} {memberCount === 1 ? "membro" : "membros"}
               </p>
            </div>
            <div className="space-y-1">
               <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Criada em
               </Label>
               <p className="text-sm">{formatDate(createdAt)}</p>
            </div>
            {plan && (
               <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                     Plano
                  </Label>
                  <p className="text-sm capitalize">{plan}</p>
               </div>
            )}
         </div>
      </section>
   );
}

// ============================================
// Skeleton
// ============================================

function OrganizationGeneralSkeleton() {
   return (
      <div className="space-y-8">
         <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-64 mt-1" />
         </div>
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-8 w-48" />
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-4">
               <Skeleton className="size-16 rounded-lg" />
               <Skeleton className="h-20 w-64" />
            </div>
         </div>
         <Skeleton className="h-px w-full" />
         <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
         </div>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function OrganizationGeneralErrorFallback({
   resetErrorBoundary,
}: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Geral</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as informações da sua organização.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações da organização
            </p>
            <Button variant="outline" onClick={resetErrorBoundary}>
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Main Content
// ============================================

function OrganizationGeneralContent() {
   const { data: activeOrganization } = useSuspenseQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   if (!activeOrganization) {
      throw new Error("No active organization found");
   }

   const memberCount = activeOrganization.members?.length ?? 0;

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Geral</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as informações da sua organização.
            </p>
         </div>

         <DisplayNameSection
            currentName={activeOrganization.name}
            organizationId={activeOrganization.id}
         />

         <Separator />

         <LogoSection
            currentLogo={activeOrganization.logo}
            organizationId={activeOrganization.id}
            organizationName={activeOrganization.name}
         />

         <Separator />

         <OrganizationDetailsSection
            createdAt={activeOrganization.createdAt}
            memberCount={memberCount}
            plan={activeOrganization.activeSubscription?.plan ?? "free"}
            slug={activeOrganization.slug}
         />
      </div>
   );
}

// ============================================
// Page
// ============================================

function OrganizationGeneralPage() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationGeneralErrorFallback}>
         <Suspense fallback={<OrganizationGeneralSkeleton />}>
            <OrganizationGeneralContent />
         </Suspense>
      </ErrorBoundary>
   );
}
```

**Step 2: Verify it builds**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamId/_dashboard/settings/organization/general.tsx
git commit -m "feat(settings): refactor org general page — PostHog-inspired inline edit"
```

---

### Task 2: Organization Members Page — Data Table + Invite + Role Management

**Files:**
- Rewrite: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/members.tsx`

**Goal:** PostHog-inspired members page with:
1. **Pending invites** table with cancel action
2. **Invite team member** button → sheet form
3. **Organization members** data table with columns: Name, Email, Level/Role, 2FA status, Joined, Last logged in, Actions (3-dot menu → change role, remove)
4. Search bar for filtering members

**Step 1: Rewrite the members page**

Full data table with search, invite flow, pending invites, role management, and member removal. Uses `DataTable` from `@packages/ui/components/data-table`, `authClient.organization.inviteMember()`, `authClient.organization.removeMember()`, `authClient.organization.updateMemberRole()`.

Key sections:
- `InviteMemberSheetContent` — form with email + role select, calls `authClient.organization.inviteMember()`
- `PendingInvitesSection` — table showing pending invites with cancel button
- `MembersDataTable` — sortable columns: Name (avatar+name), Email, Role (badge), Joined date, Actions (DropdownMenu → change role, remove)
- Search input that filters `globalFilter` on the table

**Step 2: Verify build**

**Step 3: Commit**

```bash
git commit -m "feat(settings): refactor org members — data table with invite/role/remove"
```

---

### Task 3: Add oRPC Procedures for Invites and Member Management

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/organization.ts`

**Goal:** Add server-side procedures that the Members page needs:
- `listInvitations` — returns pending invites for the org
- `inviteMember` — wraps Better Auth invite API
- `cancelInvitation` — cancel a pending invite
- `removeMember` — remove a member from org
- `updateMemberRole` — change a member's role

All these call `auth.api.*` server-side. The client-side `authClient.organization.*` calls also work but using oRPC keeps the pattern consistent and allows server-side validation.

**Step 1: Add invitation and member management procedures**

Add to organization.ts:
```typescript
import { z } from "zod";
import { ORPCError } from "@orpc/server";

export const listInvitations = protectedProcedure
   .handler(async ({ context }) => {
      const { auth, headers, organizationId } = context;
      const invitations = await auth.api.listOrganizationInvitations({
         headers,
         query: { organizationId },
      });
      return invitations;
   });

export const inviteMember = protectedProcedure
   .input(z.object({
      email: z.string().email(),
      role: z.enum(["member", "admin", "owner"]),
   }))
   .handler(async ({ context, input }) => {
      const { auth, headers, organizationId } = context;
      await auth.api.createInvitation({
         headers,
         body: {
            email: input.email,
            role: input.role,
            organizationId,
         },
      });
   });

export const cancelInvitation = protectedProcedure
   .input(z.object({ invitationId: z.string() }))
   .handler(async ({ context, input }) => {
      const { auth, headers } = context;
      await auth.api.cancelInvitation({
         headers,
         body: { invitationId: input.invitationId },
      });
   });

export const removeMember = protectedProcedure
   .input(z.object({ memberId: z.string() }))
   .handler(async ({ context, input }) => {
      const { auth, headers, organizationId } = context;
      await auth.api.removeMember({
         headers,
         body: {
            memberIdOrEmail: input.memberId,
            organizationId,
         },
      });
   });

export const updateMemberRole = protectedProcedure
   .input(z.object({
      memberId: z.string(),
      role: z.enum(["member", "admin", "owner"]),
   }))
   .handler(async ({ context, input }) => {
      const { auth, headers, organizationId } = context;
      await auth.api.updateMemberRole({
         headers,
         body: {
            memberId: input.memberId,
            role: input.role,
            organizationId,
         },
      });
   });
```

**Step 2: Register procedures in the router**

Find where organization procedures are registered and add the new ones.

**Step 3: Verify build + commit**

---

### Task 4: Organization Roles Page — Feature Preview with Addon Upsell

**Files:**
- Rewrite: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/roles.tsx`
- Improve: `apps/web/src/layout/dashboard/ui/settings-addon-gated-page.tsx`

**Goal:** More descriptive addon-gated page that:
1. Shows a preview of what the feature looks like (table wireframe of roles)
2. Describes what the addon includes (not just "locked" text)
3. Has a clear CTA to the billing page
4. Lists feature benefits

**Step 1: Improve the SettingsAddonGatedPage component**

Add support for:
- `features` prop — array of { title, description } for feature list
- `previewContent` prop — optional React node for showing a preview wireframe
- Better layout with gradient overlay on preview

```tsx
interface SettingsAddonGatedPageProps {
   title: string;
   description: string;
   lockedText: string;
   addonName: string;
   icon: LucideIcon;
   features?: { title: string; description: string }[];
   previewContent?: React.ReactNode;
}
```

**Step 2: Rewrite the Roles page with feature preview**

Show a blurred/disabled wireframe of what custom roles would look like:
- Roles table (Role name, Members count)
- "Add a role" button
- "Default role for new members" dropdown
- Feature list: "Create custom roles", "Assign permissions per role", "Auto-assign roles to new members"

**Step 3: Verify build + commit**

---

### Task 5: Organization Security Page — Functional Implementation

**Files:**
- Rewrite: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/security.tsx`

**Goal:** Make security settings functional with addon-gating for advanced features:
1. **Two-factor authentication** section — "Enforce 2FA" toggle. This is a free feature that uses Better Auth's 2FA enforcement.
2. **Notification preferences** section — "Email all current members when a new member joins" toggle (free feature)
3. **Session timeout** — addon-gated (Boost)
4. **IP allowlist** — addon-gated (Boost)

For free features, use `authClient.organization.update()` to persist settings (or a new oRPC procedure if Better Auth doesn't support these org-level flags natively).

For addon-gated features, show them with a lock icon + upsell badge inline (not a separate page — the free features should still be accessible).

**Step 1: Rewrite security page**

Sections:
- "Autenticação de dois fatores" — switch + descriptive text
- "Preferências de notificação" — switch
- "Timeout de sessão" — locked section with inline addon badge
- "IPs permitidos" — locked section with inline addon badge

**Step 2: Verify build + commit**

---

### Task 6: Organization Authentication (SSO) Page — Improved Addon Upsell

**Files:**
- Rewrite: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/authentication.tsx`

**Goal:** Better addon-gated page with SSO feature preview:
1. Shows what SSO configuration would look like (domain verification, provider selection)
2. Lists features: "SAML SSO", "Verified auth domains", "Automatic member provisioning"
3. Clear pricing / addon name + link to billing

**Step 1: Rewrite with improved SettingsAddonGatedPage**

Use the improved component from Task 4 with SSO-specific preview content and feature list.

**Step 2: Verify build + commit**

---

### Task 7: Organization Danger Zone — Functional Delete

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/organization/danger-zone.tsx`

**Goal:** Make the delete organization button actually work:
1. Confirmation dialog with org name typed to confirm (PostHog pattern)
2. Calls `authClient.organization.delete({ organizationId })`
3. Redirects to org selector or home after deletion
4. Owner-only (check role, disable for non-owners)

**Step 1: Rewrite danger zone with functional delete**

- Add a confirmation input that requires typing the org name
- Use `authClient.organization.delete()` or an oRPC procedure
- After deletion, navigate away
- Show warning about what gets deleted (all projects, members, data)

**Step 2: Verify build + commit**

---

## Execution Order

Tasks should be executed in this order:
1. **Task 3** (oRPC procedures) — backend first, needed by Task 2
2. **Task 1** (General page) — independent, can start after 3
3. **Task 2** (Members page) — depends on Task 3
4. **Task 4** (Roles + improved addon component) — independent
5. **Task 5** (Security page) — independent
6. **Task 6** (Authentication/SSO page) — depends on Task 4's improved component
7. **Task 7** (Danger Zone) — independent

Parallelizable groups:
- Group A: Task 3 → Task 2
- Group B: Task 1
- Group C: Task 4 → Task 6
- Group D: Task 5
- Group E: Task 7

---

## Testing Strategy

Since the codebase doesn't have extensive frontend tests, validation is:
1. TypeScript compilation (`npx tsc --noEmit`)
2. Biome lint/format (`bun run check`)
3. Manual verification: each page loads, forms submit, mutations work
4. Error states: each page has ErrorBoundary + Suspense skeleton
