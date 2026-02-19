import { generateQrCode } from "@f-o-t/qrcode";
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
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { PasswordInput } from "@packages/ui/components/password-input";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldCheck, User } from "lucide-react";
import type React from "react";
import { Suspense, useCallback, useMemo, useState, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
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
      maxSize: 5 * 1024 * 1024,
   });
   const presignedUpload = usePresignedUpload();
   const [isPending, startTransition] = useTransition();

   const handleSave = () => {
      if (!fileUpload.selectedFile) return;
      const file = fileUpload.selectedFile;
      startTransition(async () => {
         try {
            const fileExtension = file.name.split(".").pop() ?? "png";
            const contentType = file.type;

            const uploadData = await orpc.account.generateAvatarUploadUrl.call({
               fileExtension,
            });

            await presignedUpload.uploadToPresignedUrl(
               uploadData.presignedUrl,
               file,
               contentType,
            );

            const { error } = await authClient.updateUser({
               image: uploadData.publicUrl,
            });
            if (error) {
               toast.error(error.message ?? "Erro ao atualizar foto de perfil");
            } else {
               toast.success("Foto de perfil atualizada!");
               fileUpload.clearFile();
            }
         } catch {
            toast.error("Erro ao atualizar foto de perfil");
         }
      });
   };

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
                  {name ? getInitials(name) : <User className="size-6" />}
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
                  onDrop={(files) =>
                     fileUpload.handleFileSelect(files, () => {})
                  }
                  onError={(err) => fileUpload.setError(err.message)}
                  src={
                     fileUpload.selectedFile
                        ? [fileUpload.selectedFile]
                        : undefined
                  }
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
               disabled={isPending || presignedUpload.isUploading}
               onClick={handleSave}
               size="sm"
            >
               {(isPending || presignedUpload.isUploading) && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar foto
            </Button>
         )}
         {(fileUpload.error || presignedUpload.error) && (
            <p className="text-sm text-destructive">
               {fileUpload.error || presignedUpload.error}
            </p>
         )}
      </section>
   );
}

// ============================================
// Two-Factor Authentication Section
// ============================================

type TwoFactorStep =
   | "idle"
   | "enabling-confirm"
   | "show-qr"
   | "show-backup-codes"
   | "disabling-confirm";

function TwoFactorSection({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
   const [step, setStep] = useState<TwoFactorStep>("idle");
   const [password, setPassword] = useState("");
   const [totpCode, setTotpCode] = useState("");
   const [totpUri, setTotpUri] = useState("");
   const [backupCodes, setBackupCodes] = useState<string[]>([]);
   const [isPending, startTransition] = useTransition();

   const resetState = () => {
      setStep("idle");
      setPassword("");
      setTotpCode("");
      setTotpUri("");
      setBackupCodes([]);
   };

   const handleEnable = () => {
      startTransition(async () => {
         const { data, error } = await authClient.twoFactor.enable({
            password,
         });
         if (error) {
            toast.error(error.message ?? "Senha incorreta");
            return;
         }
         setTotpUri(data?.totpURI ?? "");
         setBackupCodes(data?.backupCodes ?? []);
         setPassword("");
         setStep("show-qr");
      });
   };

   const handleVerify = () => {
      startTransition(async () => {
         const { error } = await authClient.twoFactor.verifyTotp({
            code: totpCode,
         });
         if (error) {
            toast.error(error.message ?? "Código inválido");
            return;
         }
         setStep("show-backup-codes");
      });
   };

   const handleDisable = () => {
      startTransition(async () => {
         const { error } = await authClient.twoFactor.disable({ password });
         if (error) {
            toast.error(error.message ?? "Senha incorreta");
            return;
         }
         toast.success("2FA desativado com sucesso!");
         resetState();
      });
   };

   const qrSrc = useMemo(() => {
      if (!totpUri) return "";
      return `data:image/png;base64,${btoa(String.fromCharCode(...generateQrCode(totpUri, { size: 180 })))}`;
   }, [totpUri]);

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">
               Autenticação de dois fatores
            </h2>
            <p className="text-sm text-muted-foreground">
               Adicione uma camada extra de segurança usando um aplicativo
               autenticador.
            </p>
         </div>

         <div className="max-w-md space-y-4">
            {step === "idle" && (
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <span className="text-sm text-muted-foreground">
                        Status:
                     </span>
                     {twoFactorEnabled ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                           Ativado
                        </Badge>
                     ) : (
                        <Badge
                           className="text-muted-foreground"
                           variant="outline"
                        >
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
                        disabled={password.length === 0 || isPending}
                        onClick={handleEnable}
                        size="sm"
                     >
                        {isPending && (
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

            {step === "show-qr" && (
               <div className="space-y-4">
                  <div className="space-y-2">
                     <p className="text-sm font-medium">
                        1. Escaneie o QR code com seu aplicativo autenticador
                     </p>
                     <div className="p-4 bg-white rounded-lg inline-block">
                        <img
                           alt="QR Code"
                           className="rounded"
                           height={180}
                           src={qrSrc}
                           width={180}
                        />
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
                        disabled={totpCode.length !== 6 || isPending}
                        onClick={handleVerify}
                        size="sm"
                     >
                        {isPending && (
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

            {step === "show-backup-codes" && (
               <div className="space-y-3">
                  <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
                     <p className="text-sm font-medium">
                        2FA ativado! Guarde seus códigos de backup
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Use esses códigos se perder acesso ao seu aplicativo
                        autenticador. Cada código só pode ser usado uma vez.
                     </p>
                     <div className="grid grid-cols-2 gap-1 mt-2">
                        {backupCodes.map((code) => (
                           <code
                              className="text-xs font-mono bg-background border rounded px-2 py-1 text-center"
                              key={code}
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
                        disabled={password.length === 0 || isPending}
                        onClick={handleDisable}
                        size="sm"
                        variant="destructive"
                     >
                        {isPending && (
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
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-10 w-full max-w-md" />
         </div>
         <Skeleton className="h-px w-full" />
         <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-8 w-40" />
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

const nameSchema = z.object({
   name: z.string().min(1, "Nome é obrigatório"),
});

function ProfileNameSection({ currentName }: { currentName: string }) {
   const [isPending, startTransition] = useTransition();

   const form = useForm({
      defaultValues: { name: currentName },
      onSubmit: async ({ value }) => {
         const { error } = await authClient.updateUser({ name: value.name });
         if (error) {
            toast.error(error.message ?? "Erro ao atualizar nome");
            return;
         }
         toast.success("Nome atualizado com sucesso!");
      },
      validators: { onBlur: nameSchema },
   });

   const handleSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault();
         e.stopPropagation();
         startTransition(async () => {
            await form.handleSubmit();
         });
      },
      [form, startTransition],
   );

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Nome de exibição</h2>
            <p className="text-sm text-muted-foreground">
               O nome que aparecerá no seu perfil e em suas publicações.
            </p>
         </div>
         <form className="max-w-md space-y-3" onSubmit={handleSubmit}>
            <FieldGroup>
               <form.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                           <Input
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="João Silva"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={
                        !formState.isDirty || !formState.canSubmit || isPending
                     }
                     size="sm"
                     type="submit"
                  >
                     {isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     Salvar nome
                  </Button>
               )}
            </form.Subscribe>
         </form>
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
   const [isPending, startTransition] = useTransition();
   const { openAlertDialog } = useAlertDialog();

   const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   const hasChanged =
      isValidEmail && email.toLowerCase() !== currentEmail.toLowerCase();

   const handleConfirmSave = () => {
      startTransition(async () => {
         const { error } = await authClient.changeEmail({
            newEmail: email,
            callbackURL: window.location.href,
         });
         if (error) {
            toast.error(error.message ?? "Erro ao alterar email");
            return;
         }
         toast.success("Email de verificação enviado para o novo endereço!");
      });
   };

   const handleSave = () => {
      openAlertDialog({
         title: "Confirmar Alteração de Email",
         description:
            "Enviaremos um link de verificação para o novo endereço. Você precisará confirmá-lo para concluir a alteração.",
         onAction: handleConfirmSave,
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
            <FieldGroup>
               <Field data-invalid={email !== currentEmail && !isValidEmail}>
                  <div className="flex items-center gap-2">
                     <FieldLabel htmlFor="profile-email">Email</FieldLabel>
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
                     <FieldError errors={[{ message: "Email inválido" }]} />
                  )}
               </Field>
            </FieldGroup>
            <Button
               disabled={!hasChanged || isPending}
               onClick={handleSave}
               size="sm"
            >
               {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
               Salvar email
            </Button>
         </div>
      </section>
   );
}

// ============================================
// Profile Password Section
// ============================================

function ProfilePasswordSection({ hasPassword }: { hasPassword: boolean }) {
   const [isPending, startTransition] = useTransition();

   const setPasswordMutation = useMutation(
      orpc.account.setPassword.mutationOptions({
         onSuccess: () => toast.success("Senha definida com sucesso!"),
         onError: (error) =>
            toast.error(error.message ?? "Erro ao definir senha"),
      }),
   );

   const changePassword = useCallback(
      async (currentPassword: string, newPassword: string) => {
         const { error } = await authClient.changePassword(
            {
               currentPassword,
               newPassword,
               revokeOtherSessions: false,
            },
            {
               onSuccess: () => {
                  toast.success("Senha alterada com sucesso!");
               },
               onError: (ctx) => {
                  toast.error(ctx.error.message ?? "Erro ao alterar senha");
               },
            },
         );
         return error;
      },
      [],
   );

   const schema = z
      .object({
         currentPassword: hasPassword
            ? z.string().min(1, "Senha atual é obrigatória")
            : z.string(),
         newPassword: z
            .string()
            .min(8, "A senha deve ter pelo menos 8 caracteres"),
         confirmPassword: z.string(),
      })
      .refine((d) => d.newPassword === d.confirmPassword, {
         message: "As senhas não coincidem",
         path: ["confirmPassword"],
      });

   const form = useForm({
      defaultValues: {
         currentPassword: "",
         newPassword: "",
         confirmPassword: "",
      },
      onSubmit: async ({ value, formApi }) => {
         if (hasPassword) {
            const error = await changePassword(
               value.currentPassword,
               value.newPassword,
            );
            if (error) return;
            formApi.reset();
            return;
         }

         await setPasswordMutation.mutateAsync({
            newPassword: value.newPassword,
         });
         formApi.reset();
      },
      validators: { onBlur: schema },
   });

   const handleSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault();
         e.stopPropagation();
         startTransition(async () => {
            await form.handleSubmit();
         });
      },
      [form, startTransition],
   );

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Senha</h2>
            <p className="text-sm text-muted-foreground">
               {hasPassword
                  ? "Altere sua senha de acesso à conta."
                  : "Defina uma senha para acessar sua conta além do magic link."}
            </p>
         </div>
         <form className="max-w-md space-y-3" onSubmit={handleSubmit}>
            <FieldGroup>
               {hasPassword && (
                  <form.Field name="currentPassword">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Senha Atual
                              </FieldLabel>
                              <PasswordInput
                                 aria-invalid={isInvalid}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="••••••••"
                                 value={field.state.value}
                              />
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>
               )}
               <form.Field name="newPassword">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Nova Senha
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="••••••••"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
               <form.Field name="confirmPassword">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel htmlFor={field.name}>
                              Confirmar Nova Senha
                           </FieldLabel>
                           <PasswordInput
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="••••••••"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={!formState.canSubmit || isPending}
                     size="sm"
                     type="submit"
                  >
                     {isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     {hasPassword ? "Alterar senha" : "Definir senha"}
                  </Button>
               )}
            </form.Subscribe>
         </form>
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
   const { data: passwordStatus } = useSuspenseQuery(
      orpc.account.hasPassword.queryOptions({}),
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
               Gerencie suas informações pessoais.
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

         <ProfilePasswordSection hasPassword={passwordStatus.hasPassword} />

         <Separator />

         <TwoFactorSection twoFactorEnabled={user.twoFactorEnabled ?? false} />
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
