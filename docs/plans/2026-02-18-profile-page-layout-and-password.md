# Profile Page Layout & Password Change Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite profile.tsx to mirror org general.tsx's layout pattern (separate `<section>` blocks with `<Separator />`) and implement a working ChangePasswordSheetContent using `authClient.changePassword()`.

**Architecture:** Profile sections are split into ProfileNameSection (inline input+save), ProfileEmailSection (item row + sheet), ProfilePasswordSection (item row + sheet), and AccountSummarySection (grid layout). The `ChangeNameSheetContent` component is removed in favor of inline editing. The new `ChangePasswordSheetContent` uses Better Auth's `authClient.changePassword()`.

**Tech Stack:** React, TanStack Query `useMutation`, Better Auth `authClient`, Lucide icons, `@packages/ui` components (`Input`, `Button`, `Item`, `Separator`, `Sheet*`), `sonner` toasts.

---

### Task 1: Add `ChangePasswordSheetContent` component

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

**Step 1: Add the ChangePasswordSheetContent component** (after the existing `ChangeEmailSheetContent`, before `ProfileSectionSkeleton`)

Add the following component:

```tsx
// ============================================
// Change Password Sheet Content
// ============================================

function ChangePasswordSheetContent({ onClose }: { onClose: () => void }) {
   const [currentPassword, setCurrentPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");

   const changeMutation = useMutation({
      mutationFn: async () => {
         return authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: false,
         });
      },
      onSuccess: () => {
         toast.success("Senha alterada com sucesso!");
         onClose();
      },
      onError: (error) => {
         const errorMessage =
            error instanceof Error ? error.message : "Erro ao alterar senha";
         toast.error(errorMessage);
      },
   });

   const isValid =
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      newPassword === confirmPassword;

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>Alterar Senha</SheetTitle>
            <SheetDescription>
               Digite sua senha atual e a nova senha desejada
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2">
               <Label htmlFor="current-password">Senha Atual</Label>
               <Input
                  id="current-password"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  value={currentPassword}
               />
            </div>

            <div className="space-y-2">
               <Label htmlFor="new-password">Nova Senha</Label>
               <Input
                  id="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  value={newPassword}
               />
               {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-sm text-destructive">
                     A senha deve ter pelo menos 8 caracteres
                  </p>
               )}
            </div>

            <div className="space-y-2">
               <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
               <Input
                  id="confirm-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
               />
               {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">
                     As senhas não coincidem
                  </p>
               )}
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button
               disabled={!isValid || changeMutation.isPending}
               onClick={() => changeMutation.mutate()}
            >
               {changeMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Alterar Senha
            </Button>
         </SheetFooter>
      </div>
   );
}
```

**Step 2: Verify no TypeScript errors in ChangePasswordSheetContent**

`authClient.changePassword` accepts `{ currentPassword, newPassword, revokeOtherSessions }` — all three fields are used.
`useState`, `useMutation`, `toast`, `authClient`, and all Sheet/Input/Button/Label components are already imported.

---

### Task 2: Replace `ProfileCard` with three separate inline sections

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

**Step 1: Add `ProfileNameSection` (inline edit, replaces sheet pattern)**

Replace the entire `ProfileCard` component (lines 310–422) with three new components:

```tsx
// ============================================
// Profile Name Section
// ============================================

function ProfileNameSection({ currentName }: { currentName: string }) {
   const [name, setName] = useState(currentName);

   const updateMutation = useMutation({
      mutationFn: async () => {
         return authClient.updateUser({ name });
      },
      onSuccess: () => {
         toast.success("Nome atualizado com sucesso!");
      },
      onError: () => {
         toast.error("Erro ao atualizar nome");
      },
   });

   const hasChanged = name.trim() !== currentName && name.trim().length > 0;

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Nome de exibição</h2>
            <p className="text-sm text-muted-foreground">
               O nome que aparecerá no seu perfil e em suas publicações.
            </p>
         </div>
         <div className="max-w-md space-y-3">
            <Input
               onChange={(e) => setName(e.target.value)}
               placeholder="João Silva"
               value={name}
            />
            <Button
               disabled={!hasChanged || updateMutation.isPending}
               onClick={() => updateMutation.mutate()}
               size="sm"
            >
               {updateMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar nome
            </Button>
         </div>
      </section>
   );
}

// ============================================
// Profile Email Section
// ============================================

function ProfileEmailSection({
   email,
   emailVerified,
   onChangeEmail,
}: {
   email: string;
   emailVerified: boolean;
   onChangeEmail: () => void;
}) {
   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Email</h2>
            <p className="text-sm text-muted-foreground">
               Seu endereço de email para login e notificações.
            </p>
         </div>
         <Item variant="muted" className="max-w-md">
            <ItemMedia variant="icon">
               <Mail className="size-4" />
            </ItemMedia>
            <ItemContent className="min-w-0">
               <div className="flex items-center gap-2">
                  <ItemTitle>Email</ItemTitle>
                  {emailVerified && (
                     <Badge
                        className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        variant="outline"
                     >
                        <ShieldCheck className="size-3 mr-1" />
                        Verificado
                     </Badge>
                  )}
               </div>
               <ItemDescription className="truncate">{email}</ItemDescription>
            </ItemContent>
            <ItemActions>
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        onClick={onChangeEmail}
                        size="icon"
                        variant="ghost"
                     >
                        <Pencil className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Alterar email</TooltipContent>
               </Tooltip>
            </ItemActions>
         </Item>
      </section>
   );
}

// ============================================
// Profile Password Section
// ============================================

function ProfilePasswordSection({ onChangePassword }: { onChangePassword: () => void }) {
   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Senha</h2>
            <p className="text-sm text-muted-foreground">
               Altere sua senha de acesso à conta.
            </p>
         </div>
         <Item variant="muted" className="max-w-md">
            <ItemMedia variant="icon">
               <Lock className="size-4" />
            </ItemMedia>
            <ItemContent className="min-w-0">
               <ItemTitle>Senha</ItemTitle>
               <ItemDescription>••••••••</ItemDescription>
            </ItemContent>
            <ItemActions>
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        onClick={onChangePassword}
                        size="icon"
                        variant="ghost"
                     >
                        <ChevronRight className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Alterar senha</TooltipContent>
               </Tooltip>
            </ItemActions>
         </Item>
      </section>
   );
}
```

**Step 2: Note on imports**

`Item`, `ItemActions`, `ItemContent`, `ItemDescription`, `ItemMedia`, `ItemTitle` are already imported.
`ItemGroup` and `ItemSeparator` will no longer be needed — remove them from the import.
`Separator` must be added: `import { Separator } from "@packages/ui/components/separator";`

---

### Task 3: Update `AccountSummarySection` to use grid layout

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

Replace the `AccountSummarySection` body (the `ItemGroup` + two `Item` rows with `ItemSeparator`) with a `grid grid-cols-1 sm:grid-cols-2` layout matching `OrganizationDetailsSection`:

```tsx
function AccountSummarySection({
   user,
}: {
   user: {
      name: string | null;
      email: string;
      image: string | null;
      createdAt: Date;
   };
}) {
   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Resumo da Conta</h2>
            <p className="text-sm text-muted-foreground">
               Visão geral do seu perfil
            </p>
         </div>
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Item variant="muted">
               <ItemMedia>
                  <Avatar className="size-10">
                     <AvatarImage
                        alt={user.name || "Avatar"}
                        src={user.image || undefined}
                     />
                     <AvatarFallback>
                        {user.name ? (
                           getInitials(user.name)
                        ) : (
                           <User className="size-4" />
                        )}
                     </AvatarFallback>
                  </Avatar>
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>{user.name || "Usuário"}</ItemTitle>
                  <ItemDescription>{user.email}</ItemDescription>
               </ItemContent>
            </Item>

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Calendar className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Membro desde</ItemTitle>
                  <ItemDescription>{formatDate(user.createdAt)}</ItemDescription>
               </ItemContent>
            </Item>
         </div>
      </section>
   );
}
```

---

### Task 4: Update `ProfileSectionContent` — wire new sections, add Separators, switch to space-y-8

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

Replace the `ProfileSectionContent` return JSX with:

```tsx
return (
   <TooltipProvider>
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie suas informações pessoais e resumo da conta.
            </p>
         </div>

         <ProfileNameSection currentName={user.name || ""} />

         <Separator />

         <ProfileEmailSection
            email={user.email}
            emailVerified={user.emailVerified}
            onChangeEmail={handleChangeEmail}
         />

         <Separator />

         <ProfilePasswordSection onChangePassword={handleChangePassword} />

         <Separator />

         <AccountSummarySection
            user={{
               name: user.name,
               email: user.email,
               image: user.image,
               createdAt: user.createdAt,
            }}
         />
      </div>
   </TooltipProvider>
);
```

Also add `handleChangePassword` handler alongside the existing `handleChangeEmail`:

```tsx
const handleChangePassword = () => {
   openSheet({
      children: <ChangePasswordSheetContent onClose={closeSheet} />,
   });
};
```

And **remove** `handleChangeName` (no longer needed — inline editing in `ProfileNameSection`).

---

### Task 5: Update skeleton to match new section structure

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

Replace `ProfileSectionSkeleton` with one that reflects the new 4-section layout (name + email + password + account summary) separated by spacers:

```tsx
function ProfileSectionSkeleton() {
   return (
      <div className="space-y-8">
         <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-64 mt-1" />
         </div>
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-8 w-32" />
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-14 w-full max-w-md" />
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-14 w-full max-w-md" />
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
               <Skeleton className="h-14 w-full" />
               <Skeleton className="h-14 w-full" />
            </div>
         </div>
      </div>
   );
}
```

---

### Task 6: Clean up unused imports and components

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/settings/profile.tsx`

1. **Remove** `ChangeNameSheetContent` component entirely (inline editing replaces it)
2. **Remove** `ItemGroup` and `ItemSeparator` from the `@packages/ui/components/item` import (no longer used)
3. **Add** `Separator` import: `import { Separator } from "@packages/ui/components/separator";`
4. Verify remaining icons: `ChevronRight`, `Lock`, `Mail`, `Pencil`, `ShieldCheck`, `User`, `Calendar`, `Info`, `Loader2` are all still used — `Info` is used in `ChangeEmailSheetContent` (keep it)
5. Remove `Alert`, `AlertDescription`, `AlertTitle` imports if `ChangeNameSheetContent` was the only user — check: `ChangeEmailSheetContent` still uses them, so keep them

---

### Task 7: Final verification

**Step 1: Run typecheck**

```bash
bun run typecheck
```

Expected: No errors in profile.tsx

**Step 2: Manual smoke-test checklist**

- [ ] Name section shows current name in input; saving updates it inline
- [ ] Email section shows email + "Verificado" badge; pencil button opens sheet
- [ ] Password section shows "••••••••"; chevron button opens ChangePasswordSheetContent
- [ ] ChangePasswordSheetContent: validates all fields, saves button disabled until valid, calls authClient.changePassword
- [ ] Account Summary shows avatar + member-since in a 2-column grid
- [ ] Separators are visible between all sections
- [ ] Skeleton matches new layout (4 sections + 3 separator bars)

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_dashboard/settings/profile.tsx
git commit -m "feat(profile): refactor layout to match org general and implement password change"
```
