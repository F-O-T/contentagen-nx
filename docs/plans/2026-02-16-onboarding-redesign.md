# Onboarding Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove auto-creation of organizations from auth hooks, replace with a unified onboarding wizard at `/_authenticated/onboarding` that uses Better Auth client exclusively for all mutations.

**Architecture:** Single onboarding route with no `$slug`/`$teamId` params. Wizard has 4 adaptive steps (profile, workspace, project, products). Auth hooks become passive — only set session IDs for existing memberships. All org/team creation and updates happen via `authClient.*` on the client side.

**Tech Stack:** TanStack Router, Better Auth client, `@tanstack/react-form`, existing Dropzone/useFileUpload for logo, defineStepper for wizard steps.

---

## Task 1: Remove Auto-Creation from Auth Hooks

**Files:**
- Modify: `packages/authentication/src/server.ts:402-489`

**Step 1: Modify `session.create.before` hook**

Replace lines 402-468 with:

```typescript
databaseHooks: {
   session: {
      create: {
         before: async (session) => {
            try {
               const member = await findMemberByUserId(db, session.userId);

               if (member?.organizationId) {
                  const defaultTeam = await ensureDefaultProject(
                     db,
                     member.organizationId,
                     session.userId,
                  );

                  return {
                     data: {
                        ...session,
                        activeOrganizationId: member.organizationId,
                        activeTeamId: defaultTeam?.id,
                     },
                  };
               }

               // No organization — session created without org context.
               // User will be redirected to onboarding by route guards.
               return { data: session };
            } catch (error) {
               console.error(
                  "Error in session create before hook:",
                  error,
               );
               return { data: session };
            }
         },
      },
   },
```

**Step 2: Modify `user.create.after` hook**

Replace lines 470-489 with:

```typescript
   user: {
      create: {
         after: async (_user) => {
            // Organization creation handled by onboarding flow.
            // No auto-creation — user starts with zero orgs.
         },
      },
   },
},
```

**Step 3: Verify build**

Run: `cd /home/yorizel/Documents/contentta-nx && npx nx typecheck authentication`
Expected: PASS (no type errors)

**Step 4: Commit**

```bash
git add packages/authentication/src/server.ts
git commit -m "refactor(auth): remove auto-creation of organizations from auth hooks"
```

---

## Task 2: Update Authenticated Layout Redirect Logic

**Files:**
- Modify: `apps/web/src/routes/_authenticated.tsx`

**Step 1: Add organization check and onboarding redirect**

Replace entire file with:

```typescript
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
   beforeLoad: async ({ context, location }) => {
      const session = await context.queryClient.fetchQuery(
         context.orpc.session.getSession.queryOptions({}),
      );

      if (!session?.user) {
         throw redirect({
            to: "/auth/sign-in",
            search: { redirect: location.href },
         });
      }

      // Check if user has any organizations
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const hasOrgs = organizations.length > 0;

      // If no orgs and not already on onboarding, redirect
      if (!hasOrgs && !location.pathname.startsWith("/onboarding")) {
         throw redirect({ to: "/onboarding" });
      }

      // If has orgs, check if active org needs onboarding
      if (hasOrgs) {
         const activeOrg = organizations.find(
            (org) => org.id === session.session.activeOrganizationId,
         ) ?? organizations[0];

         // Check onboardingCompleted on the active org
         if (
            activeOrg &&
            !activeOrg.onboardingCompleted &&
            !location.pathname.startsWith("/onboarding")
         ) {
            throw redirect({ to: "/onboarding" });
         }
      }

      return {
         session,
         userId: session.user.id,
      };
   },
   component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
   return <Outlet />;
}
```

**Important note:** This requires `getOrganizations` to return `onboardingCompleted`. Check if it already does — it currently returns `{ id, name, slug, logo, role }`. We may need to add `onboardingCompleted` to the select in the organization router.

**Step 2: Add `onboardingCompleted` to `getOrganizations` response**

In `apps/web/src/integrations/orpc/router/organization.ts`, find the `getOrganizations` procedure and add `onboardingCompleted` to the select:

```typescript
const memberships = await db
   .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      role: member.role,
      onboardingCompleted: organization.onboardingCompleted,
   })
   .from(member)
   .innerJoin(organization, eq(member.organizationId, organization.id))
   .where(eq(member.userId, userId));
```

**Step 3: Verify build**

Run: `npx nx typecheck web`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated.tsx apps/web/src/integrations/orpc/router/organization.ts
git commit -m "feat(routes): redirect to /onboarding when user has no org or org not onboarded"
```

---

## Task 3: Update `$slug.tsx` Layout — Remove Fallback Auto-Creation

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug.tsx`

**Step 1: Replace redirect-to-sign-in with redirect-to-onboarding**

Replace entire file with:

```typescript
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$slug")({
   beforeLoad: async ({ context, params }) => {
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      // No organizations — redirect to onboarding
      if (organizations.length === 0) {
         throw redirect({ to: "/onboarding" });
      }

      const currentOrganization = organizations.find(
         (org) => org.slug === params.slug,
      );

      if (!currentOrganization) {
         const firstOrg = organizations[0];
         if (firstOrg) {
            const teams = await context.queryClient.fetchQuery(
               context.orpc.organization.getOrganizationTeams.queryOptions(),
            );
            const fallbackTeam = teams[0];

            if (fallbackTeam) {
               throw redirect({
                  to: "/$slug/$teamId/home",
                  params: { slug: firstOrg.slug, teamId: fallbackTeam.id },
               });
            }

            // Org exists but no teams — redirect to onboarding
            throw redirect({ to: "/onboarding" });
         }
      }

      return {
         organizations,
         currentOrganization,
         organizationId: currentOrganization!.id,
      };
   },
   component: OrganizationLayout,
});

function OrganizationLayout() {
   return <Outlet />;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug.tsx
git commit -m "refactor(routes): redirect to /onboarding instead of /auth/sign-in when no org"
```

---

## Task 4: Slim Down oRPC Onboarding Router

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/onboarding.ts`
- Modify: `apps/web/src/integrations/orpc/router/index.ts` (if exports changed)

**Step 1: Remove all mutation procedures, keep only read + checklist**

Replace entire `onboarding.ts` with:

```typescript
import { ORPCError } from "@orpc/server";
import type { DatabaseInstance } from "@packages/database/client";
import { organization, team } from "@packages/database/schemas/auth";
import { content } from "@packages/database/schemas/content";
import { dashboards } from "@packages/database/schemas/dashboards";
import { forms } from "@packages/database/schemas/forms";
import { insights } from "@packages/database/schemas/insights";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Procedures
// =============================================================================

/**
 * Get the current onboarding status for both organization and project.
 * Used by the post-onboarding checklist on /home to auto-detect completed tasks.
 */
export const getOnboardingStatus = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId, teamId } = context;

      const org = await db.query.organization.findFirst({
         where: (o, { eq }) => eq(o.id, organizationId),
      });

      if (!org) {
         throw new ORPCError("NOT_FOUND", {
            message: "Organization not found",
         });
      }

      const currentTeam = await db.query.team.findFirst({
         where: (t, { eq }) => eq(t.id, teamId),
      });

      if (!currentTeam) {
         throw new ORPCError("NOT_FOUND", {
            message: "Team not found",
         });
      }

      const [
         contentCount,
         publishedContentCount,
         formCount,
         insightCount,
         dashboardCount,
      ] = await Promise.all([
         db
            .select({ count: sql<number>`count(*)` })
            .from(content)
            .where(eq(content.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(content)
            .where(
               and(
                  eq(content.organizationId, organizationId),
                  eq(content.status, "published"),
               ),
            )
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(forms)
            .where(eq(forms.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(insights)
            .where(eq(insights.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
         db
            .select({ count: sql<number>`count(*)` })
            .from(dashboards)
            .where(eq(dashboards.organizationId, organizationId))
            .then((rows) => Number(rows[0]?.count ?? 0)),
      ]);

      const storedTasks = currentTeam.onboardingTasks ?? {};
      const autoDetected: Record<string, boolean> = {};

      if (contentCount > 0) autoDetected.create_content = true;
      if (publishedContentCount > 0) autoDetected.publish_content = true;
      if (formCount > 0) autoDetected.create_form = true;
      if (insightCount > 0) autoDetected.create_insight = true;
      if (dashboardCount > 0) autoDetected.create_dashboard = true;

      const tasks = { ...storedTasks, ...autoDetected };

      return {
         organization: {
            onboardingCompleted: org.onboardingCompleted ?? false,
            name: org.name,
            slug: org.slug,
         },
         project: {
            onboardingCompleted: currentTeam.onboardingCompleted ?? false,
            onboardingProducts: currentTeam.onboardingProducts ?? null,
            tasks: Object.keys(tasks).length > 0 ? tasks : null,
            name: currentTeam.name,
         },
      };
   },
);

/**
 * Atomically merge a task ID into the team's onboardingTasks jsonb.
 */
async function markTaskDone(
   db: DatabaseInstance,
   teamId: string,
   taskId: string,
) {
   await db
      .update(team)
      .set({
         onboardingTasks: sql`COALESCE(${team.onboardingTasks}, '{}'::jsonb) || ${JSON.stringify({ [taskId]: true })}::jsonb`,
      })
      .where(eq(team.id, teamId));
}

/**
 * Mark a specific onboarding task as completed.
 */
export const completeTask = protectedProcedure
   .input(z.object({ taskId: z.string().min(1).max(100) }))
   .handler(async ({ context, input }) => {
      await markTaskDone(context.db, context.teamId, input.taskId);
      return { success: true };
   });

/**
 * Skip a specific onboarding task.
 */
export const skipTask = protectedProcedure
   .input(z.object({ taskId: z.string().min(1).max(100) }))
   .handler(async ({ context, input }) => {
      await markTaskDone(context.db, context.teamId, input.taskId);
      return { success: true };
   });
```

**Step 2: Verify the router index still works**

Check that `apps/web/src/integrations/orpc/router/index.ts` imports match the remaining exports. The `import * as onboardingRouter from "./onboarding"` should still work since we're exporting the same names minus the deleted ones. Search for any client-side references to the deleted procedures.

Run: `grep -r "completeOrgSetup\|completeProjectSetup\|selectProducts\|completeOrgOnboarding\|completeProjectOnboarding\|completeProfileSetup\|completeOnboarding" apps/web/src/ --include="*.ts" --include="*.tsx" -l`

Fix any references found (they'll be in the old wizard components which we're deleting in Task 6).

**Step 3: Commit**

```bash
git add apps/web/src/integrations/orpc/router/onboarding.ts
git commit -m "refactor(orpc): remove mutation procedures from onboarding router, keep checklist only"
```

---

## Task 5: Create New Onboarding Route

**Files:**
- Create: `apps/web/src/routes/_authenticated/onboarding.tsx`

**Step 1: Create the route file**

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";

export const Route = createFileRoute("/_authenticated/onboarding")({
   beforeLoad: async ({ context }) => {
      const session = await context.queryClient.fetchQuery(
         context.orpc.session.getSession.queryOptions({}),
      );

      if (!session?.user) {
         throw redirect({ to: "/auth/sign-in" });
      }

      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      // Find active org or first org
      const activeOrg = organizations.find(
         (org) => org.id === session.session.activeOrganizationId,
      ) ?? organizations[0];

      // If user has a fully onboarded org, don't show onboarding
      if (activeOrg?.onboardingCompleted) {
         // Find teams for this org
         throw redirect({
            to: "/$slug",
            params: { slug: activeOrg.slug },
         });
      }

      return {
         session,
         organizations,
         activeOrg: activeOrg ?? null,
      };
   },
   component: OnboardingPage,
});

function OnboardingPage() {
   const { session, organizations, activeOrg } = Route.useRouteContext();

   return (
      <OnboardingWizard
         activeOrg={activeOrg}
         organizations={organizations}
         session={session}
      />
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/onboarding.tsx
git commit -m "feat(routes): add unified onboarding route at /_authenticated/onboarding"
```

---

## Task 6: Create Unified Onboarding Wizard

**Files:**
- Create: `apps/web/src/features/onboarding/ui/onboarding-wizard.tsx` (replace legacy file)
- Create: `apps/web/src/features/onboarding/ui/profile-step.tsx`
- Create: `apps/web/src/features/onboarding/ui/workspace-step.tsx`
- Create: `apps/web/src/features/onboarding/ui/project-step.tsx`
- Create: `apps/web/src/features/onboarding/ui/products-step.tsx`

**Step 1: Create `profile-step.tsx`**

```typescript
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";

const profileSchema = z.object({
   userName: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
});

interface ProfileStepProps {
   defaultName: string;
   onNext: () => void;
}

export function ProfileStep({ defaultName, onNext }: ProfileStepProps) {
   const [isPending, setIsPending] = useState(false);

   const form = useForm({
      defaultValues: { userName: defaultName },
      onSubmit: async ({ value }) => {
         try {
            setIsPending(true);
            await authClient.updateUser({ name: value.userName });
            toast.success("Nome atualizado!");
            onNext();
         } catch (error) {
            toast.error(
               error instanceof Error
                  ? error.message
                  : "Erro ao atualizar nome.",
            );
         } finally {
            setIsPending(false);
         }
      },
      validators: { onBlur: profileSchema },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   return (
      <div className="space-y-6">
         <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl font-semibold">
               Como podemos te chamar?
            </h2>
            <p className="text-sm text-muted-foreground">
               Precisamos do seu nome para personalizar sua experiência.
            </p>
         </div>

         <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
               <form.Field name="userName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Seu Nome
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="name"
                              autoFocus
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Ex: João Silva"
                              value={field.state.value}
                              disabled={isPending}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <Button
               className="h-11 w-full"
               disabled={isPending}
               type="submit"
            >
               {isPending ? <Spinner className="size-4" /> : "Continuar"}
            </Button>
         </form>
      </div>
   );
}
```

**Step 2: Create `workspace-step.tsx`**

```typescript
import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { Building } from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { authClient } from "@/integrations/better-auth/auth-client";

const workspaceSchema = z.object({
   workspaceName: z
      .string()
      .min(2, "O nome do workspace deve ter no mínimo 2 caracteres."),
});

interface WorkspaceStepProps {
   onNext: (org: { id: string; slug: string }) => void;
   onBack?: () => void;
}

export function WorkspaceStep({ onNext, onBack }: WorkspaceStepProps) {
   const [isPending, setIsPending] = useState(false);

   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

   const handleFileSelect = (acceptedFiles: File[]) => {
      fileUpload.handleFileSelect(acceptedFiles, (file) => {
         form.setFieldValue("logo", file);
      });
   };

   const form = useForm({
      defaultValues: {
         workspaceName: "",
         logo: null as File | null,
      },
      onSubmit: async ({ value }) => {
         try {
            setIsPending(true);
            const slug = createSlug(value.workspaceName);

            const result = await authClient.organization.create({
               name: value.workspaceName,
               slug,
            });

            if (!result.data?.id) {
               throw new Error("Failed to create organization");
            }

            const orgId = result.data.id;
            const orgSlug = result.data.slug ?? slug;

            // Set as active organization
            await authClient.organization.setActive({
               organizationId: orgId,
            });

            // TODO: Upload logo to MinIO and update org with logo URL
            // For now, logo file is collected but not uploaded

            toast.success("Workspace criado com sucesso!");
            onNext({ id: orgId, slug: orgSlug });
         } catch (error) {
            toast.error(
               error instanceof Error
                  ? error.message
                  : "Erro ao criar workspace.",
            );
         } finally {
            setIsPending(false);
         }
      },
      validators: { onBlur: workspaceSchema },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   return (
      <div className="space-y-6">
         <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl font-semibold">
               Crie seu workspace
            </h2>
            <p className="text-sm text-muted-foreground">
               O workspace é a sua organização. Você pode ter vários projetos
               dentro dele.
            </p>
         </div>

         <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
               <form.Field name="logo">
                  {(field) => (
                     <Field>
                        <FieldLabel>Logo (opcional)</FieldLabel>
                        <Dropzone
                           accept={{
                              "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                           }}
                           className="h-44"
                           disabled={isPending}
                           maxFiles={1}
                           maxSize={5 * 1024 * 1024}
                           onDrop={handleFileSelect}
                           src={field.state.value ? [field.state.value] : undefined}
                        >
                           <DropzoneEmptyState>
                              <Building className="size-8 text-muted-foreground" />
                           </DropzoneEmptyState>
                           <DropzoneContent>
                              {fileUpload.filePreview && (
                                 <img
                                    alt="Logo preview"
                                    className="h-full w-full object-contain rounded-md"
                                    src={fileUpload.filePreview}
                                 />
                              )}
                           </DropzoneContent>
                        </Dropzone>
                        {fileUpload.error && (
                           <p className="text-sm text-destructive">
                              {fileUpload.error}
                           </p>
                        )}
                     </Field>
                  )}
               </form.Field>

               <form.Field name="workspaceName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Nome do Workspace
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoComplete="organization"
                              autoFocus
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Ex: Minha Empresa"
                              value={field.state.value}
                              disabled={isPending}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <div className="flex gap-3">
               {onBack && (
                  <Button
                     className="h-11"
                     disabled={isPending}
                     onClick={onBack}
                     type="button"
                     variant="outline"
                  >
                     Voltar
                  </Button>
               )}
               <Button
                  className="h-11 flex-1"
                  disabled={isPending}
                  type="submit"
               >
                  {isPending ? <Spinner className="size-4" /> : "Continuar"}
               </Button>
            </div>
         </form>
      </div>
   );
}
```

**Step 3: Create `project-step.tsx`**

```typescript
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";

const projectSchema = z.object({
   projectName: z
      .string()
      .min(2, "O nome do projeto deve ter no mínimo 2 caracteres."),
});

interface ProjectStepProps {
   organizationId: string;
   onNext: (team: { id: string }) => void;
   onBack: () => void;
}

export function ProjectStep({
   organizationId,
   onNext,
   onBack,
}: ProjectStepProps) {
   const [isPending, setIsPending] = useState(false);

   const form = useForm({
      defaultValues: { projectName: "" },
      onSubmit: async ({ value }) => {
         try {
            setIsPending(true);

            const result = await authClient.organization.createTeam({
               name: value.projectName,
               organizationId,
            });

            if (!result.data?.id) {
               throw new Error("Failed to create project");
            }

            await authClient.organization.setActiveTeam({
               teamId: result.data.id,
            });

            toast.success("Projeto criado com sucesso!");
            onNext({ id: result.data.id });
         } catch (error) {
            toast.error(
               error instanceof Error
                  ? error.message
                  : "Erro ao criar projeto.",
            );
         } finally {
            setIsPending(false);
         }
      },
      validators: { onBlur: projectSchema },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   return (
      <div className="space-y-6">
         <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl font-semibold">
               Crie seu primeiro projeto
            </h2>
            <p className="text-sm text-muted-foreground">
               Dê um nome para o seu projeto. Você pode ter vários projetos no
               mesmo workspace.
            </p>
         </div>

         <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
               <form.Field name="projectName">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Nome do Projeto
                           </FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              autoFocus
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Ex: Blog da Empresa, Site Institucional"
                              value={field.state.value}
                              disabled={isPending}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <div className="flex gap-3">
               <Button
                  className="h-11"
                  disabled={isPending}
                  onClick={onBack}
                  type="button"
                  variant="outline"
               >
                  Voltar
               </Button>
               <Button
                  className="h-11 flex-1"
                  disabled={isPending}
                  type="submit"
               >
                  {isPending ? <Spinner className="size-4" /> : "Continuar"}
               </Button>
            </div>
         </form>
      </div>
   );
}
```

**Step 4: Create `products-step.tsx`**

```typescript
import { Button } from "@packages/ui/components/button";
import { Spinner } from "@packages/ui/components/spinner";
import { cn } from "@packages/ui/lib/utils";
import { ClipboardList, FileText, LayoutDashboard } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useEarlyAccess } from "@/hooks/use-early-access";
import { authClient } from "@/integrations/better-auth/auth-client";

type Product = "content" | "forms" | "analytics";

interface ProductCard {
   id: Product;
   title: string;
   description: string;
   icon: React.ComponentType<{ className?: string }>;
   earlyAccessFlag?: string;
}

const products: ProductCard[] = [
   {
      id: "content",
      title: "Criar e publicar conteúdo",
      description: "Crie, edite e publique conteúdo com ajuda de IA",
      icon: FileText,
   },
   {
      id: "forms",
      title: "Coletar leads com formulários",
      description: "Crie formulários e colete respostas no seu site",
      icon: ClipboardList,
      earlyAccessFlag: "forms-beta",
   },
   {
      id: "analytics",
      title: "Acompanhar performance do conteúdo",
      description: "Analise métricas e crie dashboards personalizados",
      icon: LayoutDashboard,
   },
];

interface ProductsStepProps {
   organizationId: string;
   teamId: string;
   onComplete: (slug: string, teamId: string) => void;
   onBack: () => void;
}

export function ProductsStep({
   organizationId,
   teamId,
   onComplete,
   onBack,
}: ProductsStepProps) {
   const { isEnrolled } = useEarlyAccess();
   const [selected, setSelected] = useState<Product[]>([]);
   const [isPending, setIsPending] = useState(false);

   const visibleProducts = products.filter((product) => {
      if (!product.earlyAccessFlag) return true;
      return isEnrolled(product.earlyAccessFlag);
   });

   const toggleProduct = useCallback((productId: Product) => {
      setSelected((prev) =>
         prev.includes(productId)
            ? prev.filter((p) => p !== productId)
            : [...prev, productId],
      );
   }, []);

   const handleComplete = useCallback(async () => {
      try {
         setIsPending(true);

         // Save selected products on the team
         await authClient.organization.updateTeam({
            teamId,
            data: { onboardingProducts: selected },
         });

         // Mark both org and team onboarding as complete
         await authClient.organization.update({
            organizationId,
            data: { onboardingCompleted: true },
         });

         await authClient.organization.updateTeam({
            teamId,
            data: { onboardingCompleted: true },
         });

         // Get the org slug for navigation
         const orgs = await authClient.organization.list();
         const currentOrg = orgs.data?.find((o) => o.id === organizationId);

         toast.success("Onboarding concluído!");
         onComplete(currentOrg?.slug ?? "", teamId);
      } catch (error) {
         toast.error(
            error instanceof Error
               ? error.message
               : "Erro ao concluir onboarding.",
         );
      } finally {
         setIsPending(false);
      }
   }, [selected, organizationId, teamId, onComplete]);

   return (
      <div className="space-y-6">
         <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl font-semibold">
               O que você quer fazer?
            </h2>
            <p className="text-sm text-muted-foreground">
               Selecione os produtos que deseja usar. Você pode mudar depois.
            </p>
         </div>

         <div className="space-y-3">
            {visibleProducts.map((product) => {
               const isSelected = selected.includes(product.id);
               const Icon = product.icon;

               return (
                  <button
                     className={cn(
                        "flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                        isSelected
                           ? "border-primary bg-primary/5"
                           : "border-border hover:border-muted-foreground/30",
                     )}
                     key={product.id}
                     onClick={() => toggleProduct(product.id)}
                     type="button"
                     disabled={isPending}
                  >
                     <div
                        className={cn(
                           "flex size-10 shrink-0 items-center justify-center rounded-lg",
                           isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                        )}
                     >
                        <Icon className="size-5" />
                     </div>
                     <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{product.title}</p>
                        <p className="text-muted-foreground text-xs">
                           {product.description}
                        </p>
                     </div>
                     <div
                        className={cn(
                           "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                           isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30",
                        )}
                     >
                        {isSelected && (
                           <svg
                              className="size-3 text-primary-foreground"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                           >
                              <title>Selecionado</title>
                              <path
                                 d="M5 13l4 4L19 7"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                              />
                           </svg>
                        )}
                     </div>
                  </button>
               );
            })}
         </div>

         <div className="flex gap-3">
            <Button
               className="h-11"
               disabled={isPending}
               onClick={onBack}
               type="button"
               variant="outline"
            >
               Voltar
            </Button>
            <Button
               className="h-11 flex-1"
               disabled={selected.length === 0 || isPending}
               onClick={handleComplete}
            >
               {isPending ? <Spinner className="size-4" /> : "Concluir"}
            </Button>
         </div>
      </div>
   );
}
```

**Step 5: Create unified `onboarding-wizard.tsx`**

This is the main orchestrator. It manages wizard state and step transitions.

```typescript
import { defineStepper } from "@packages/ui/components/stepper";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import type { Session } from "@/integrations/better-auth/auth-client";
import { ProductsStep } from "./products-step";
import { ProfileStep } from "./profile-step";
import { ProjectStep } from "./project-step";
import { WorkspaceStep } from "./workspace-step";

type Organization = {
   id: string;
   name: string;
   slug: string;
   logo: string | null;
   role: string;
   onboardingCompleted: boolean | null;
};

interface OnboardingWizardProps {
   session: NonNullable<Session>;
   organizations: Organization[];
   activeOrg: Organization | null;
}

type WizardState = {
   organizationId: string | null;
   organizationSlug: string | null;
   teamId: string | null;
};

export function OnboardingWizard({
   session,
   organizations,
   activeOrg,
}: OnboardingWizardProps) {
   const navigate = useNavigate();

   // Determine which steps to show based on context
   const needsProfile = !session.user.name;
   const needsWorkspace = !activeOrg;
   // If org exists but has no teams, need project step
   // If org + team exist but team not onboarded, skip to products

   const steps = useMemo(() => {
      const s: { id: string; title: string }[] = [];
      if (needsProfile) s.push({ id: "profile", title: "Perfil" });
      if (needsWorkspace) s.push({ id: "workspace", title: "Workspace" });
      s.push({ id: "project", title: "Projeto" });
      s.push({ id: "products", title: "Produtos" });
      return s;
   }, [needsProfile, needsWorkspace]);

   const { Stepper } = useMemo(() => defineStepper(...steps), [steps]);

   const [wizardState, setWizardState] = useState<WizardState>({
      organizationId: activeOrg?.id ?? null,
      organizationSlug: activeOrg?.slug ?? null,
      teamId: null,
   });

   const handleProfileComplete = useCallback(
      (methods: { navigation: { next: () => void } }) => {
         methods.navigation.next();
      },
      [],
   );

   const handleWorkspaceComplete = useCallback(
      (
         org: { id: string; slug: string },
         methods: { navigation: { next: () => void } },
      ) => {
         setWizardState((prev) => ({
            ...prev,
            organizationId: org.id,
            organizationSlug: org.slug,
         }));
         methods.navigation.next();
      },
      [],
   );

   const handleProjectComplete = useCallback(
      (
         team: { id: string },
         methods: { navigation: { next: () => void } },
      ) => {
         setWizardState((prev) => ({ ...prev, teamId: team.id }));
         methods.navigation.next();
      },
      [],
   );

   const handleOnboardingComplete = useCallback(
      (slug: string, teamId: string) => {
         navigate({
            to: "/$slug/$teamId/home",
            params: { slug, teamId },
         });
      },
      [navigate],
   );

   return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
         <div className="w-full max-w-lg space-y-8">
            <div className="text-center">
               <h1 className="font-serif text-3xl font-bold tracking-tight">
                  Contentta
               </h1>
               <p className="mt-2 text-sm text-muted-foreground">
                  Configure sua conta
               </p>
            </div>

            <Stepper.Provider variant="line">
               {({ methods }) => (
                  <div className="space-y-6">
                     <Stepper.Navigation>
                        {steps.map((step) => (
                           <Stepper.Step key={step.id} of={step.id} />
                        ))}
                     </Stepper.Navigation>

                     {methods.flow.switch({
                        ...(needsProfile
                           ? {
                                profile: () => (
                                   <ProfileStep
                                      defaultName={session.user.name ?? ""}
                                      onNext={() =>
                                         handleProfileComplete(methods)
                                      }
                                   />
                                ),
                             }
                           : {}),
                        ...(needsWorkspace
                           ? {
                                workspace: () => (
                                   <WorkspaceStep
                                      onNext={(org) =>
                                         handleWorkspaceComplete(org, methods)
                                      }
                                      onBack={
                                         needsProfile
                                            ? () => methods.navigation.prev()
                                            : undefined
                                      }
                                   />
                                ),
                             }
                           : {}),
                        project: () => (
                           <ProjectStep
                              organizationId={
                                 wizardState.organizationId ?? ""
                              }
                              onNext={(team) =>
                                 handleProjectComplete(team, methods)
                              }
                              onBack={() => methods.navigation.prev()}
                           />
                        ),
                        products: () => (
                           <ProductsStep
                              organizationId={
                                 wizardState.organizationId ?? ""
                              }
                              teamId={wizardState.teamId ?? ""}
                              onComplete={handleOnboardingComplete}
                              onBack={() => methods.navigation.prev()}
                           />
                        ),
                     })}
                  </div>
               )}
            </Stepper.Provider>
         </div>
      </div>
   );
}
```

**Step 6: Verify build**

Run: `npx nx typecheck web`
Expected: May have type errors from imports — fix any issues with Better Auth client method signatures.

**Step 7: Commit**

```bash
git add apps/web/src/features/onboarding/ui/onboarding-wizard.tsx apps/web/src/features/onboarding/ui/profile-step.tsx apps/web/src/features/onboarding/ui/workspace-step.tsx apps/web/src/features/onboarding/ui/project-step.tsx apps/web/src/features/onboarding/ui/products-step.tsx
git commit -m "feat(onboarding): create unified onboarding wizard with 4 adaptive steps"
```

---

## Task 7: Delete Old Onboarding Files

**Files:**
- Delete: `apps/web/src/routes/_authenticated/$slug/onboarding.tsx`
- Delete: `apps/web/src/routes/_authenticated/$slug/$teamId/onboarding.tsx`
- Delete: `apps/web/src/features/onboarding/ui/organization-onboarding-wizard.tsx`
- Delete: `apps/web/src/features/onboarding/ui/project-onboarding-wizard.tsx`
- Delete: `apps/web/src/features/onboarding/ui/organization-profile-step.tsx`
- Delete: `apps/web/src/features/onboarding/ui/project-setup-step.tsx`
- Delete: `apps/web/src/features/onboarding/ui/product-selection-step.tsx`
- Delete: `apps/web/src/features/onboarding/ui/sdk-install-step.tsx`
- Delete: `apps/web/src/features/onboarding/ui/profile-setup-step.tsx` (legacy)

**Step 1: Delete all old files**

```bash
rm apps/web/src/routes/_authenticated/\$slug/onboarding.tsx
rm apps/web/src/routes/_authenticated/\$slug/\$teamId/onboarding.tsx
rm apps/web/src/features/onboarding/ui/organization-onboarding-wizard.tsx
rm apps/web/src/features/onboarding/ui/project-onboarding-wizard.tsx
rm apps/web/src/features/onboarding/ui/organization-profile-step.tsx
rm apps/web/src/features/onboarding/ui/project-setup-step.tsx
rm apps/web/src/features/onboarding/ui/product-selection-step.tsx
rm apps/web/src/features/onboarding/ui/sdk-install-step.tsx
rm apps/web/src/features/onboarding/ui/profile-setup-step.tsx
```

**Step 2: Search for dangling imports**

Run: `grep -r "organization-onboarding-wizard\|project-onboarding-wizard\|organization-profile-step\|project-setup-step\|product-selection-step\|sdk-install-step\|profile-setup-step" apps/web/src/ --include="*.ts" --include="*.tsx" -l`

Fix any files that still import deleted modules.

**Step 3: Verify build**

Run: `npx nx typecheck web`
Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(onboarding): delete old split onboarding wizard files"
```

---

## Task 8: Update `use-onboarding-status.ts` Hook

**Files:**
- Modify: `apps/web/src/features/onboarding/hooks/use-onboarding-status.ts`

**Step 1: Keep the hook as-is**

The hook uses `getOnboardingStatus` which still exists in the slimmed router. It's used by the post-onboarding checklist (`quick-start-checklist.tsx`). No changes needed — it works with the `protectedProcedure` which requires an active org/team, and the checklist only renders when those exist.

No commit needed for this task.

---

## Task 9: Verify Better Auth Client Methods Exist

**This is a research/verification task, not a code change.**

Before the code works, verify these `authClient` methods exist and accept the expected signatures:

1. `authClient.updateUser({ name })` — update user name
2. `authClient.organization.create({ name, slug })` — create org
3. `authClient.organization.setActive({ organizationId })` — set active org
4. `authClient.organization.createTeam({ name, organizationId })` — create team
5. `authClient.organization.setActiveTeam({ teamId })` — set active team
6. `authClient.organization.update({ organizationId, data: { onboardingCompleted: true } })` — update org
7. `authClient.organization.updateTeam({ teamId, data: { onboardingProducts, onboardingCompleted } })` — update team
8. `authClient.organization.list()` — list user's orgs

If any method doesn't exist or has a different signature, adjust the step components accordingly. Check Better Auth docs or the `@packages/authentication/client` export.

Run: `grep -r "authClient\." apps/web/src/ --include="*.ts" --include="*.tsx" | grep -oP "authClient\.\S+\(" | sort -u`

This will show all `authClient` method calls currently used in the codebase, confirming which methods are available.

---

## Task 10: Full Integration Test

**Step 1: Run typecheck**

Run: `npx nx typecheck web`
Expected: PASS

**Step 2: Run typecheck on auth package**

Run: `npx nx typecheck authentication`
Expected: PASS

**Step 3: Run dev server**

Run: `bun dev`
Expected: Starts without errors

**Step 4: Manual test scenarios**

1. Sign up new account → should see `/onboarding` with all 4 steps
2. Sign in as magic link user (no name) → should see profile step first
3. Sign in as email/password user (has name) → should skip profile step
4. Complete full wizard → should land on `/$slug/$teamId/home`
5. Existing user with completed org → should NOT see onboarding
6. Invited user → should skip onboarding entirely

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(onboarding): complete onboarding redesign — unified wizard with Better Auth client"
```
