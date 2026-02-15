# Separate Organization and Team Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the current mixed onboarding wizard into two independent flows: organization-level onboarding (workspace setup) and team/project-level onboarding (project setup).

**Architecture:** Create separate routes, wizards, and components for org and project onboarding. Organization onboarding happens first at `/$slug/onboarding`, then redirects to project onboarding at `/$slug/$teamId/onboarding`. Each flow is completely independent with its own state, steps, and completion tracking.

**Tech Stack:** TanStack Router (file-based), TanStack Query (useSuspenseQuery), oRPC procedures, React Suspense

---

## Current State Analysis

**Mixed Onboarding Issues:**
- Single wizard handles both org and project setup
- Confusing UX - unclear what's workspace vs project
- Hard to extend with more org-level steps (billing, team invites)
- Route structure doesn't reflect the two-level hierarchy

**Files Currently Involved:**
- `apps/web/src/routes/_authenticated/$slug/onboarding.tsx` - Mixed route
- `apps/web/src/features/onboarding/ui/onboarding-wizard.tsx` - Mixed wizard
- `apps/web/src/features/onboarding/ui/profile-setup-step.tsx` - Org step (mixed with project)
- `apps/web/src/features/onboarding/ui/project-setup-step.tsx` - Project step
- `apps/web/src/features/onboarding/ui/product-selection-step.tsx` - Project step
- `apps/web/src/features/onboarding/ui/sdk-install-step.tsx` - Project step

---

## Task 1: Create Organization Onboarding Route

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/onboarding/index.tsx`
- Archive: `apps/web/src/routes/_authenticated/$slug/onboarding.tsx` (will become index.tsx)

**Step 1: Create organization onboarding route file**

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { OrganizationOnboardingWizard } from "@/features/onboarding/ui/organization-onboarding-wizard";

export const Route = createFileRoute("/_authenticated/$slug/onboarding/")({
   beforeLoad: async ({ context, params }) => {
      const status = await context.queryClient.fetchQuery(
         context.orpc.onboarding.getOnboardingStatus.queryOptions(),
      );

      // If org onboarding is already complete, redirect to project onboarding
      if (status.organization.onboardingCompleted) {
         const teams = await context.queryClient.fetchQuery(
            context.orpc.organization.getOrganizationTeams.queryOptions(),
         );
         const fallbackTeam = teams[0];

         if (fallbackTeam) {
            throw redirect({
               to: "/$slug/$teamId/onboarding",
               params: { slug: params.slug, teamId: fallbackTeam.id },
            });
         }
      }
   },
   component: OrganizationOnboardingRoute,
});

function OrganizationOnboardingRoute() {
   return <OrganizationOnboardingWizard />;
}
```

**Step 2: Verify route is registered**

Run: `bun run dev`
Expected: No errors, route compiles successfully

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/onboarding/index.tsx
git commit -m "feat(onboarding): add organization onboarding route"
```

---

## Task 2: Create Project Onboarding Route

**Files:**
- Create: `apps/web/src/routes/_authenticated/$slug/$teamId/onboarding.tsx`

**Step 1: Create project onboarding route file**

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProjectOnboardingWizard } from "@/features/onboarding/ui/project-onboarding-wizard";

export const Route = createFileRoute("/_authenticated/$slug/$teamId/onboarding")({
   beforeLoad: async ({ context, params }) => {
      const status = await context.queryClient.fetchQuery(
         context.orpc.onboarding.getOnboardingStatus.queryOptions(),
      );

      // If org onboarding is not complete, redirect back to org onboarding
      if (!status.organization.onboardingCompleted) {
         throw redirect({
            to: "/$slug/onboarding",
            params: { slug: params.slug },
         });
      }

      // If project onboarding is complete, redirect to dashboard
      if (status.project.onboardingCompleted) {
         throw redirect({
            to: "/$slug/$teamId/home",
            params: { slug: params.slug, teamId: params.teamId },
         });
      }
   },
   component: ProjectOnboardingRoute,
});

function ProjectOnboardingRoute() {
   return <ProjectOnboardingWizard />;
}
```

**Step 2: Verify route is registered**

Run: `bun run dev`
Expected: No errors, route compiles successfully

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamId/onboarding.tsx
git commit -m "feat(onboarding): add project onboarding route"
```

---

## Task 3: Create Organization Onboarding Wizard

**Files:**
- Create: `apps/web/src/features/onboarding/ui/organization-onboarding-wizard.tsx`

**Step 1: Create org wizard component**

```typescript
import { defineStepper } from "@packages/ui/components/stepper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { OrganizationProfileStep } from "./organization-profile-step";

// Organization onboarding steps
const orgSteps = [{ id: "profile", title: "Workspace" }] as const;

const { Stepper } = defineStepper(...orgSteps);

export function OrganizationOnboardingWizard() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { slug } = useParams({ from: "/_authenticated/$slug/onboarding/" });
   const { data: teams } = useQuery(
      orpc.organization.getOrganizationTeams.queryOptions({}),
   );

   const completeMutation = useMutation(
      orpc.onboarding.completeOrgOnboarding.mutationOptions({
         onSuccess: () => {
            toast.success("Workspace configurado com sucesso!");
            const teamId = teams?.[0]?.id;
            if (teamId) {
               // Redirect to project onboarding
               navigate({
                  to: "/$slug/$teamId/onboarding",
                  params: { slug, teamId },
               });
            }
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao concluir configuração.");
         },
      }),
   );

   const handleComplete = useCallback(
      (newSlug: string) => {
         // Update URL if slug changed
         if (newSlug !== slug) {
            navigate({
               to: "/$slug/onboarding",
               params: { slug: newSlug },
               replace: true,
            });
         }
         // Complete org onboarding
         completeMutation.mutate({});
      },
      [completeMutation, navigate, slug],
   );

   return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
         <div className="w-full max-w-lg space-y-8">
            {/* Brand */}
            <div className="text-center">
               <h1 className="font-serif text-3xl font-bold tracking-tight">
                  Contentta
               </h1>
               <p className="mt-2 text-sm text-muted-foreground">
                  Configure seu workspace
               </p>
            </div>

            {/* Stepper */}
            <Stepper.Provider variant="line">
               {({ methods }) => (
                  <div className="space-y-6">
                     <Stepper.Navigation>
                        {orgSteps.map((step) => (
                           <Stepper.Step key={step.id} of={step.id} />
                        ))}
                     </Stepper.Navigation>

                     {methods.switch({
                        profile: () => <OrganizationProfileStep onNext={handleComplete} />,
                     })}
                  </div>
               )}
            </Stepper.Provider>
         </div>
      </div>
   );
}
```

**Step 2: Verify component compiles**

Run: `bun run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/src/features/onboarding/ui/organization-onboarding-wizard.tsx
git commit -m "feat(onboarding): add organization onboarding wizard"
```

---

## Task 4: Create Organization Profile Step Component

**Files:**
- Create: `apps/web/src/features/onboarding/ui/organization-profile-step.tsx`
- Reference: `apps/web/src/features/onboarding/ui/profile-setup-step.tsx` (for structure)

**Step 1: Create org profile step component**

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
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { orpc } from "@/integrations/orpc/client";

const profileSchema = z.object({
   userName: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
   workspaceName: z
      .string()
      .min(2, "O nome do workspace deve ter no mínimo 2 caracteres."),
});

interface OrganizationProfileStepProps {
   onNext: (newSlug: string) => void;
}

export function OrganizationProfileStep({ onNext }: OrganizationProfileStepProps) {
   const { data: session } = useSuspenseQuery(orpc.session.getSession.queryOptions({}));
   const { data: org } = useSuspenseQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   const mutation = useMutation(
      orpc.onboarding.completeOrgSetup.mutationOptions({
         onSuccess: (data) => {
            toast.success("Workspace configurado com sucesso!");
            onNext(data.slug);
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao configurar workspace.");
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         userName: session?.user?.name ?? "",
         workspaceName: org?.name ?? "",
      },
      onSubmit: async ({ value }) => {
         await mutation.mutateAsync(value);
      },
      validators: {
         onBlur: profileSchema,
      },
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
               Configure seu workspace
            </h2>
            <p className="text-sm text-muted-foreground">
               O workspace é a sua organização. Você pode ter vários projetos dentro dele.
            </p>
         </div>

         <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
               <form.Field name="userName">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>Seu Nome</FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Ex: João Silva"
                        />
                        <FieldError errors={field.state.meta.errors} />
                     </Field>
                  )}
               </form.Field>

               <form.Field name="workspaceName">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>Nome do Workspace</FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Ex: Minha Empresa"
                        />
                        <FieldError errors={field.state.meta.errors} />
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>

            <Button
               className="h-11 w-full"
               disabled={mutation.isPending}
               type="submit"
            >
               {mutation.isPending ? <Spinner className="size-4" /> : "Continuar"}
            </Button>
         </form>
      </div>
   );
}
```

**Step 2: Verify component compiles**

Run: `bun run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/src/features/onboarding/ui/organization-profile-step.tsx
git commit -m "feat(onboarding): add organization profile step"
```

---

## Task 5: Create Project Onboarding Wizard

**Files:**
- Create: `apps/web/src/features/onboarding/ui/project-onboarding-wizard.tsx`

**Step 1: Create project wizard component**

```typescript
import { defineStepper } from "@packages/ui/components/stepper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { ProjectSetupStep } from "./project-setup-step";
import { ProductSelectionStep } from "./product-selection-step";
import { SdkInstallStep } from "./sdk-install-step";

// Project onboarding steps
const projectSteps = [
   { id: "project-setup", title: "Projeto" },
   { id: "products", title: "Produtos" },
   { id: "sdk-install", title: "SDK" },
] as const;

const { Stepper } = defineStepper(...projectSteps);

export function ProjectOnboardingWizard() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { slug, teamId } = useParams({
      from: "/_authenticated/$slug/$teamId/onboarding",
   });

   const completeProjectMutation = useMutation(
      orpc.onboarding.completeProjectOnboarding.mutationOptions({
         onSuccess: () => {
            navigate({ to: "/$slug/$teamId/home", params: { slug, teamId } });
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao concluir onboarding.");
         },
      }),
   );

   const handleCompleteProject = useCallback(() => {
      completeProjectMutation.mutate({});
   }, [completeProjectMutation]);

   return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
         <div className="w-full max-w-lg space-y-8">
            {/* Brand */}
            <div className="text-center">
               <h1 className="font-serif text-3xl font-bold tracking-tight">
                  Contentta
               </h1>
               <p className="mt-2 text-sm text-muted-foreground">
                  Configure seu projeto
               </p>
            </div>

            {/* Stepper */}
            <Stepper.Provider variant="line">
               {({ methods }) => (
                  <div className="space-y-6">
                     <Stepper.Navigation>
                        {projectSteps.map((step) => (
                           <Stepper.Step key={step.id} of={step.id} />
                        ))}
                     </Stepper.Navigation>

                     {methods.switch({
                        "project-setup": () => (
                           <ProjectSetupStep onNext={() => methods.next()} />
                        ),
                        products: () => (
                           <ProductSelectionStep
                              onNext={() => methods.next()}
                              onSkipToEnd={handleCompleteProject}
                           />
                        ),
                        "sdk-install": () => <SdkInstallStep />,
                     })}
                  </div>
               )}
            </Stepper.Provider>
         </div>
      </div>
   );
}
```

**Step 2: Verify component compiles**

Run: `bun run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/src/features/onboarding/ui/project-onboarding-wizard.tsx
git commit -m "feat(onboarding): add project onboarding wizard"
```

---

## Task 6: Update Auth Callback Route

**Files:**
- Modify: `apps/web/src/routes/auth/callback.tsx`

**Step 1: Update callback to redirect to org onboarding**

```typescript
export const Route = createFileRoute("/auth/callback")({
   beforeLoad: async ({ context }) => {
      // Fetch onboarding status to determine where to redirect
      const status = await context.queryClient.fetchQuery(
         context.orpc.onboarding.getOnboardingStatus.queryOptions(),
      );

      // Fetch user's organizations to get the correct slug
      const organizations = await context.queryClient.fetchQuery(
         context.orpc.organization.getOrganizations.queryOptions(),
      );

      const firstOrg = organizations[0];

      if (firstOrg) {
         // Fetch teams to find the first team
         const teams = await context.queryClient.fetchQuery(
            context.orpc.organization.getOrganizationTeams.queryOptions(),
         );
         const fallbackTeam = teams[0];

         // Check if both org and project onboarding are complete
         const bothComplete =
            status.organization.onboardingCompleted &&
            status.project.onboardingCompleted;

         if (fallbackTeam && bothComplete) {
            // Both complete → go to dashboard
            throw redirect({
               to: "/$slug/$teamId/home",
               params: { slug: firstOrg.slug, teamId: fallbackTeam.id },
            });
         }

         if (status.organization.onboardingCompleted && fallbackTeam) {
            // Org complete but project incomplete → go to project onboarding
            throw redirect({
               to: "/$slug/$teamId/onboarding",
               params: { slug: firstOrg.slug, teamId: fallbackTeam.id },
            });
         }

         // Org not complete → go to org onboarding
         throw redirect({
            to: "/$slug/onboarding",
            params: { slug: firstOrg.slug },
         });
      }

      // No organization exists — sign out
      await authClient.signOut();
      context.queryClient.removeQueries({
         queryKey: context.orpc.session.getSession.queryOptions().queryKey,
      });

      throw redirect({ to: "/auth/sign-in" });
   },
   component: () => null,
});
```

**Step 2: Test callback redirect logic**

Run: `bun run dev`
Test: Sign out and sign in, verify redirect to org onboarding
Expected: Redirects to `/$slug/onboarding`

**Step 3: Commit**

```bash
git add apps/web/src/routes/auth/callback.tsx
git commit -m "feat(onboarding): update auth callback to redirect to org onboarding first"
```

---

## Task 7: Update ProjectSetupStep to Use Suspense

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/project-setup-step.tsx`

**Step 1: Replace useQuery with useSuspenseQuery**

```typescript
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

export function ProjectSetupStep({ onNext }: ProjectSetupStepProps) {
   const { data: status } = useSuspenseQuery(
      orpc.onboarding.getOnboardingStatus.queryOptions({}),
   );

   // ... rest of component
}
```

**Step 2: Verify type safety**

Run: `bun run typecheck`
Expected: No errors, `status` is no longer `undefined`

**Step 3: Commit**

```bash
git add apps/web/src/features/onboarding/ui/project-setup-step.tsx
git commit -m "refactor(onboarding): use useSuspenseQuery in ProjectSetupStep"
```

---

## Task 8: Add Suspense Boundaries to Routes

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/onboarding/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/onboarding.tsx`

**Step 1: Add Suspense to org onboarding route**

```typescript
import { Suspense } from "react";
import { Spinner } from "@packages/ui/components/spinner";

function OrganizationOnboardingRoute() {
   return (
      <Suspense
         fallback={
            <div className="flex min-h-screen items-center justify-center">
               <Spinner className="size-8" />
            </div>
         }
      >
         <OrganizationOnboardingWizard />
      </Suspense>
   );
}
```

**Step 2: Add Suspense to project onboarding route**

```typescript
import { Suspense } from "react";
import { Spinner } from "@packages/ui/components/spinner";

function ProjectOnboardingRoute() {
   return (
      <Suspense
         fallback={
            <div className="flex min-h-screen items-center justify-center">
               <Spinner className="size-8" />
            </div>
         }
      >
         <ProjectOnboardingWizard />
      </Suspense>
   );
}
```

**Step 3: Verify Suspense works**

Run: `bun run dev`
Test: Navigate to onboarding, verify spinner shows during loading
Expected: Brief spinner, then wizard content

**Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/onboarding/index.tsx \
        apps/web/src/routes/_authenticated/\$slug/\$teamId/onboarding.tsx
git commit -m "feat(onboarding): add Suspense boundaries to onboarding routes"
```

---

## Task 9: Clean Up Old Mixed Wizard

**Files:**
- Delete: `apps/web/src/features/onboarding/ui/onboarding-wizard.tsx`
- Delete: `apps/web/src/features/onboarding/ui/profile-setup-step.tsx`

**Step 1: Delete old wizard file**

```bash
rm apps/web/src/features/onboarding/ui/onboarding-wizard.tsx
```

**Step 2: Delete old profile step**

```bash
rm apps/web/src/features/onboarding/ui/profile-setup-step.tsx
```

**Step 3: Verify no imports reference deleted files**

Run: `bun run typecheck`
Expected: No errors about missing modules

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(onboarding): remove old mixed onboarding wizard"
```

---

## Task 10: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update onboarding system section**

Find the "## Onboarding System" section and update it:

```markdown
## Onboarding System

The application has **two separate, independent onboarding flows**:

### 1. Organization Onboarding (Workspace Level)

**Route:** `/$slug/onboarding`

**Purpose:** One-time setup for the company/workspace
**Tracked by:** `organization.onboardingCompleted`
**Scope:** Applies to the entire organization

**Steps:**
1. Workspace name + User name

**Completion:** Redirects to `/$slug/$teamId/onboarding` (project onboarding)

**Procedures:**
- `completeOrgSetup({ userName, workspaceName })` - Set workspace and user name
- `completeOrgOnboarding()` - Mark organization onboarding as complete

### 2. Project Onboarding (Team/Project Level)

**Route:** `/$slug/$teamId/onboarding`

**Purpose:** Per-project setup (can have multiple projects in one organization)
**Tracked by:** `team.onboardingCompleted`, `team.onboardingProducts`, `team.onboardingTasks`
**Scope:** Applies to a specific team/project

**Steps:**
1. Project name
2. Product selection (content, forms, analytics)
3. SDK installation (if forms or analytics selected)

**Completion:** Redirects to `/$slug/$teamId/home` (dashboard)

**Procedures:**
- `completeProjectSetup({ projectName })` - Set project name
- `selectProducts({ products: [...] })` - Choose products
- `completeTask({ taskId })` / `skipTask({ taskId })` - Track tasks
- `completeProjectOnboarding()` - Mark project onboarding as complete

### Flow Diagram

```
Auth Callback
     ↓
Is org complete? → NO → /$slug/onboarding (org)
     ↓ YES                        ↓
Is project complete? → NO → /$slug/$teamId/onboarding (project)
     ↓ YES                        ↓
Dashboard                    Complete → /$slug/$teamId/onboarding
```

### Route Guards

- **Org Onboarding Route:** Redirects to project onboarding if org already complete
- **Project Onboarding Route:** Redirects to org onboarding if org incomplete, redirects to dashboard if project complete
- **Auth Callback:** Routes to org → project → dashboard based on completion status
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update onboarding system documentation"
```

---

## Task 11: Manual Testing Checklist

**Test Scenario 1: Fresh User**
1. Clear all cookies and local storage
2. Sign up with new account
3. ✅ Should redirect to `/$slug/onboarding` (org onboarding)
4. Fill in workspace name and user name
5. Click "Continuar"
6. ✅ Should redirect to `/$slug/$teamId/onboarding` (project onboarding)
7. Fill in project name
8. Select products
9. See SDK install step
10. ✅ Should redirect to `/$slug/$teamId/home` (dashboard)

**Test Scenario 2: User with Org Complete**
1. Complete org onboarding
2. Refresh page or navigate away
3. Visit `/$slug/onboarding`
4. ✅ Should auto-redirect to `/$slug/$teamId/onboarding`

**Test Scenario 3: User with Both Complete**
1. Complete both onboardings
2. Visit `/$slug/onboarding`
3. ✅ Should redirect to dashboard
4. Visit `/$slug/$teamId/onboarding`
5. ✅ Should redirect to dashboard

**Test Scenario 4: Direct URL Access**
1. User with incomplete org onboarding
2. Try to visit `/$slug/$teamId/onboarding` directly
3. ✅ Should redirect to `/$slug/onboarding` first

---

## Success Criteria

- [ ] Organization onboarding route exists at `/$slug/onboarding`
- [ ] Project onboarding route exists at `/$slug/$teamId/onboarding`
- [ ] Each route has independent wizard with own steps
- [ ] Auth callback correctly routes to org → project → dashboard
- [ ] Route guards prevent accessing wrong onboarding stage
- [ ] No redirect loops
- [ ] All components use `useSuspenseQuery`
- [ ] Proper Suspense boundaries at route level
- [ ] Old mixed wizard is removed
- [ ] Documentation is updated
- [ ] All manual test scenarios pass

---

## Future Enhancements

After this implementation, consider adding:
- **Org onboarding steps:** Team invites, billing setup, integrations
- **Project templates:** Pre-configure projects based on use case
- **Skip options:** Allow skipping certain steps for power users
- **Progress indicators:** Show overall onboarding progress
- **Onboarding restart:** Allow users to re-run onboarding

---
