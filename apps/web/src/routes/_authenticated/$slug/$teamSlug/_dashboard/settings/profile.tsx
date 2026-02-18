import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import {
   SheetClose,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { getInitials } from "@packages/utils/text";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   Calendar,
   ChevronRight,
   Info,
   Loader2,
   Lock,
   Mail,
   Pencil,
   ShieldCheck,
   User,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/profile",
)({
   component: ProfilePage,
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
// Change Email Sheet Content
// ============================================

function ChangeEmailSheetContent({
   currentEmail,
   onClose,
}: {
   currentEmail: string;
   onClose: () => void;
}) {
   const [email, setEmail] = useState("");
   const { openAlertDialog } = useAlertDialog();

   const changeMutation = useMutation({
      mutationFn: async () => {
         return authClient.changeEmail({
            newEmail: email,
            callbackURL: window.location.href,
         });
      },
      onSuccess: () => {
         toast.success("Email de verificação enviado para o novo endereço!");
         onClose();
      },
      onError: (error) => {
         const errorMessage =
            error instanceof Error ? error.message : "Erro ao alterar email";
         toast.error(errorMessage);
      },
   });

   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   const isValid =
      isValidEmail && email.toLowerCase() !== currentEmail.toLowerCase();

   const handleSubmit = () => {
      openAlertDialog({
         title: "Confirmar Alteração de Email",
         description:
            "Enviaremos um link de verificação para o novo endereço. Você precisará confirmá-lo para concluir a alteração.",
         onAction: async () => {
            await changeMutation.mutateAsync();
         },
         actionLabel: "Confirmar",
         cancelLabel: "Cancelar",
         variant: "default",
      });
   };

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>Alterar Email</SheetTitle>
            <SheetDescription>Atualize seu endereço de email</SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Alert>
               <Info className="size-4" />
               <AlertTitle>Verificação Necessária</AlertTitle>
               <AlertDescription>
                  Um link de verificação será enviado para o novo endereço de
                  email.
               </AlertDescription>
            </Alert>

            <div className="p-4 bg-secondary/50 rounded-lg">
               <p className="text-sm text-muted-foreground">
                  Email atual:{" "}
                  <span className="font-medium">{currentEmail}</span>
               </p>
            </div>

            <div className="space-y-2">
               <Label htmlFor="new-email">Novo Email</Label>
               <Input
                  id="new-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="novo@email.com"
                  type="email"
                  value={email}
               />
               {email && !isValidEmail && (
                  <p className="text-sm text-destructive">Email inválido</p>
               )}
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button
               disabled={!isValid || changeMutation.isPending}
               onClick={handleSubmit}
            >
               Enviar Verificação
            </Button>
         </SheetFooter>
      </div>
   );
}

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

// ============================================
// Skeleton
// ============================================

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

// ============================================
// Error Fallback
// ============================================

function ProfileSectionErrorFallback(props: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie suas informações pessoais.
            </p>
         </div>
         <Card>
            <CardContent className="py-8">
               {createErrorFallback({
                  errorDescription: "Não foi possível carregar seu perfil",
                  errorTitle: "Erro ao Carregar",
                  retryText: "Tentar novamente",
               })(props)}
            </CardContent>
         </Card>
      </div>
   );
}

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

// ============================================
// Account Summary Section Component
// ============================================

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

// ============================================
// Main Content Component
// ============================================

function ProfileSectionContent() {
   const { openSheet, closeSheet } = useSheet();
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const user = session?.user;

   if (!user) {
      return (
         <Card>
            <CardContent className="py-8 text-center">
               <p className="text-muted-foreground">
                  Não foi possível carregar as informações do usuário.
               </p>
            </CardContent>
         </Card>
      );
   }

   const handleChangeEmail = () => {
      openSheet({
         children: (
            <ChangeEmailSheetContent
               currentEmail={user.email}
               onClose={closeSheet}
            />
         ),
      });
   };

   const handleChangePassword = () => {
      openSheet({
         children: <ChangePasswordSheetContent onClose={closeSheet} />,
      });
   };

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
                  image: user.image ?? null,
                  createdAt: user.createdAt,
               }}
            />
         </div>
      </TooltipProvider>
   );
}

function ProfilePage() {
   return (
      <ErrorBoundary FallbackComponent={ProfileSectionErrorFallback}>
         <Suspense fallback={<ProfileSectionSkeleton />}>
            <ProfileSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
