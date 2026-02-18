import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Label } from "@packages/ui/components/label";
import { PasswordInput } from "@packages/ui/components/password-input";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   Calendar,
   Loader2,
   ShieldCheck,
   User,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
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
            <Skeleton className="h-6 w-36" />
            <div className="flex items-start gap-4">
               <Skeleton className="size-16 rounded-lg" />
               <Skeleton className="h-20 w-64" />
            </div>
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-8 w-32" />
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-8 w-32" />
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
   currentEmail,
   emailVerified,
}: {
   currentEmail: string;
   emailVerified: boolean;
}) {
   const [email, setEmail] = useState(currentEmail);
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
      },
      onError: (error) => {
         const errorMessage =
            error instanceof Error ? error.message : "Erro ao alterar email";
         toast.error(errorMessage);
      },
   });

   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   const hasChanged = isValidEmail && email.toLowerCase() !== currentEmail.toLowerCase();

   const handleSave = () => {
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
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Email</h2>
            <p className="text-sm text-muted-foreground">
               Seu endereço de email para login e notificações.
            </p>
         </div>
         <div className="max-w-md space-y-3">
            <div className="space-y-1.5">
               <div className="flex items-center gap-2">
                  <Label htmlFor="profile-email">Email</Label>
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
               <Input
                  id="profile-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
               />
               {email !== currentEmail && !isValidEmail && (
                  <p className="text-sm text-destructive">Email inválido</p>
               )}
            </div>
            <Button
               disabled={!hasChanged || changeMutation.isPending}
               onClick={handleSave}
               size="sm"
            >
               {changeMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar email
            </Button>
         </div>
      </section>
   );
}

// ============================================
// Profile Password Section
// ============================================

function ProfilePasswordSection() {
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
         setCurrentPassword("");
         setNewPassword("");
         setConfirmPassword("");
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
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Senha</h2>
            <p className="text-sm text-muted-foreground">
               Altere sua senha de acesso à conta.
            </p>
         </div>
         <div className="max-w-md space-y-3">
            <div className="space-y-1.5">
               <Label htmlFor="current-password">Senha Atual</Label>
               <PasswordInput
                  id="current-password"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  value={currentPassword}
               />
               {(newPassword.length > 0 || confirmPassword.length > 0) &&
                  currentPassword.length === 0 && (
                     <p className="text-sm text-destructive">
                        Senha atual é obrigatória
                     </p>
                  )}
            </div>
            <div className="space-y-1.5">
               <Label htmlFor="new-password">Nova Senha</Label>
               <PasswordInput
                  id="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  value={newPassword}
               />
               {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-sm text-destructive">
                     A senha deve ter pelo menos 8 caracteres
                  </p>
               )}
            </div>
            <div className="space-y-1.5">
               <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
               <PasswordInput
                  id="confirm-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  value={confirmPassword}
               />
               {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">
                     As senhas não coincidem
                  </p>
               )}
            </div>
            <Button
               disabled={!isValid || changeMutation.isPending}
               onClick={() => changeMutation.mutate()}
               size="sm"
            >
               {changeMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Alterar senha
            </Button>
         </div>
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

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie suas informações pessoais e resumo da conta.
            </p>
         </div>

         <AvatarUploadSection
            currentImage={user.image ?? null}
            name={user.name}
         />

         <Separator />

         <ProfileNameSection currentName={user.name || ""} />

         <Separator />

         <ProfileEmailSection
            currentEmail={user.email}
            emailVerified={user.emailVerified}
         />

         <Separator />

         <ProfilePasswordSection />

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
