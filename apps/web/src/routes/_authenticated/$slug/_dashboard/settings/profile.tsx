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
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Label } from "@packages/ui/components/label";
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
   Key,
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
   "/_authenticated/$slug/_dashboard/settings/profile",
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
// Change Name Sheet Content
// ============================================

function ChangeNameSheetContent({
   currentName,
   onClose,
}: {
   currentName: string;
   onClose: () => void;
}) {
   const [name, setName] = useState(currentName);

   const updateMutation = useMutation({
      mutationFn: async () => {
         return authClient.updateUser({ name });
      },
      onSuccess: () => {
         toast.success("Nome atualizado com sucesso!");
         onClose();
      },
      onError: () => {
         toast.error("Erro ao atualizar nome");
      },
   });

   const isValid = name.trim().length > 0 && name !== currentName;

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>Alterar Nome</SheetTitle>
            <SheetDescription>Atualize seu nome de exibição</SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Alert>
               <Info className="size-4" />
               <AlertTitle>Nome de Exibição</AlertTitle>
               <AlertDescription>
                  Este é o nome que aparecerá no seu perfil e em suas
                  publicações.
               </AlertDescription>
            </Alert>

            <div className="space-y-2">
               <Label htmlFor="new-name">Nome</Label>
               <Input
                  id="new-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  value={name}
               />
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button
               disabled={!isValid || updateMutation.isPending}
               onClick={() => updateMutation.mutate()}
            >
               {updateMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar
            </Button>
         </SheetFooter>
      </div>
   );
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
// Skeleton
// ============================================

function ProfileSectionSkeleton() {
   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Profile Card Skeleton */}
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Account Summary Skeleton */}
            <Card className="h-full">
               <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                     <Skeleton className="h-20 w-20 rounded-full" />
                     <Skeleton className="h-5 w-32 mt-3" />
                     <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function ProfileSectionErrorFallback(props: FallbackProps) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
               Gerencie suas informações pessoais.
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: "Não foi possível carregar seu perfil",
               errorTitle: "Erro ao Carregar",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

// ============================================
// Profile Card Component
// ============================================

function ProfileCard({
   user,
   onChangeName,
   onChangeEmail,
}: {
   user: {
      name: string | null;
      email: string;
      image: string | null;
      emailVerified: boolean;
   };
   onChangeName: () => void;
   onChangeEmail: () => void;
}) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
               Gerencie seu nome, email e foto de perfil
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <User className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Nome</ItemTitle>
                     <ItemDescription className="truncate">
                        {user.name || "Não definido"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={onChangeName}
                              size="icon"
                              variant="ghost"
                           >
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar nome</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Mail className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <div className="flex items-center gap-2">
                        <ItemTitle>Email</ItemTitle>
                        {user.emailVerified && (
                           <Badge
                              className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              variant="outline"
                           >
                              <ShieldCheck className="size-3 mr-1" />
                              Verificado
                           </Badge>
                        )}
                     </div>
                     <ItemDescription className="truncate">
                        {user.email}
                     </ItemDescription>
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

               <ItemSeparator />

               <Item variant="muted">
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
                           <Button size="icon" variant="ghost" disabled>
                              <ChevronRight className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Em breve</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// Account Summary Card Component
// ============================================

function AccountSummaryCard({
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
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Resumo da Conta</CardTitle>
            <CardDescription>Visão geral do seu perfil</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
               <Avatar className="size-20">
                  <AvatarImage alt={user.name || "Avatar"} src={user.image || undefined} />
                  <AvatarFallback className="text-xl">
                     {user.name ? getInitials(user.name) : <User className="size-8" />}
                  </AvatarFallback>
               </Avatar>
               <h3 className="mt-3 font-semibold">{user.name || "Usuário"}</h3>
               <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Calendar className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Membro desde</ItemTitle>
                     <ItemDescription>
                        {formatDate(user.createdAt)}
                     </ItemDescription>
                  </ItemContent>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
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

   const handleChangeName = () => {
      openSheet({
         children: (
            <ChangeNameSheetContent
               currentName={user.name || ""}
               onClose={closeSheet}
            />
         ),
      });
   };

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

   return (
      <TooltipProvider>
         <div className="space-y-4 md:space-y-6">
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
               <div className="md:col-span-2 lg:col-span-2">
                  <ProfileCard
                     onChangeEmail={handleChangeEmail}
                     onChangeName={handleChangeName}
                     user={{
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        emailVerified: user.emailVerified,
                     }}
                  />
               </div>
               <AccountSummaryCard
                  user={{
                     name: user.name,
                     email: user.email,
                     image: user.image,
                     createdAt: user.createdAt,
                  }}
               />
            </div>
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
