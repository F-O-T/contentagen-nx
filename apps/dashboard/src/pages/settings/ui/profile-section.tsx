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
import {
   CredenzaBody,
   CredenzaClose,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Input } from "@packages/ui/components/input";
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
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
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import {
   SheetClose,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { defineStepper } from "@packages/ui/components/stepper";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { getInitials } from "@packages/utils/text";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
   AlertTriangle,
   Calendar,
   Camera,
   ChevronRight,
   Copy,
   Download,
   Info,
   Key,
   Link2,
   Link2Off,
   Loader2,
   Lock,
   Mail,
   Pencil,
   Shield,
   ShieldCheck,
   ShieldOff,
   Smartphone,
   Trash2,
   Upload,
   User,
} from "lucide-react";
import { Suspense, useRef, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import {
   compressImage,
   getCompressedFileName,
} from "@/features/file-upload/lib/image-compression";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { useSheet } from "@/hooks/use-sheet";
import { betterAuthClient, trpc, useTRPC } from "@/integrations/clients";

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
         return betterAuthClient.updateUser({ name });
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
            <SheetTitle>{"Alterar Nome"}</SheetTitle>
            <SheetDescription>
               {"Atualize seu nome de exibição"}
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Alert>
               <Info className="size-4" />
               <AlertTitle>{"Display Name"}</AlertTitle>
               <AlertDescription>{"Display Name Info"}</AlertDescription>
            </Alert>

            <div className="space-y-2">
               <Label htmlFor="new-name">{"Nome"}</Label>
               <Input
                  id="new-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder={"Placeholder"}
                  value={name}
               />
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">{"Cancelar"}</Button>
            </SheetClose>
            <Button
               disabled={!isValid || updateMutation.isPending}
               onClick={() => updateMutation.mutate()}
            >
               {updateMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               {"Salvar"}
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
         return betterAuthClient.changeEmail({
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
         title: "Confirm Title",
         description: "Confirm Description",
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
            <SheetTitle>{"Alterar Email"}</SheetTitle>
            <SheetDescription>{"Seu e-mail"}</SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Alert>
               <Info className="size-4" />
               <AlertTitle>{"Verification Required"}</AlertTitle>
               <AlertDescription>{"Verification Info"}</AlertDescription>
            </Alert>

            <div className="p-4 bg-secondary/50 rounded-lg">
               <p className="text-sm text-muted-foreground">
                  {"Current Email"}{" "}
                  <span className="font-medium">{currentEmail}</span>
               </p>
            </div>

            <div className="space-y-2">
               <Label htmlFor="new-email">{"New Email"}</Label>
               <Input
                  id="new-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={"Placeholder"}
                  type="email"
                  value={email}
               />
               {email && !isValidEmail && (
                  <p className="text-sm text-destructive">{"Invalid Email"}</p>
               )}
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">{"Cancelar"}</Button>
            </SheetClose>
            <Button
               disabled={!isValid || changeMutation.isPending}
               onClick={handleSubmit}
            >
               {"Send Verification"}
            </Button>
         </SheetFooter>
      </div>
   );
}

// ============================================
// Change Avatar Credenza Content
// ============================================

function ChangeAvatarCredenzaContent({
   currentImage,
   onClose,
}: {
   currentImage: string | null | undefined;
   onClose: () => void;
}) {
   const trpc = useTRPC();
   const fileInputRef = useRef<HTMLInputElement>(null);
   const fileUpload = useFileUpload({
      acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
      maxSize: 5 * 1024 * 1024,
   });
   const { uploadToPresignedUrl, isUploading: isUploadingToS3 } =
      usePresignedUpload();

   const requestUploadUrlMutation = useMutation(
      trpc.account.requestAvatarUploadUrl.mutationOptions(),
   );
   const confirmUploadMutation = useMutation(
      trpc.account.confirmAvatarUpload.mutationOptions({
         onSuccess: () => {
            toast.success("Avatar atualizado com sucesso!");
            onClose();
         },
         onError: () => {
            toast.error("Erro ao atualizar avatar");
         },
      }),
   );
   const cancelUploadMutation = useMutation(
      trpc.account.cancelAvatarUpload.mutationOptions(),
   );

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
         fileUpload.handleFileSelect(Array.from(files));
      }
   };

   const handleUpload = async () => {
      if (!fileUpload.selectedFile) return;

      fileUpload.setUploading(true);
      let storageKey: string | null = null;

      try {
         // Compress the image
         const compressed = await compressImage(fileUpload.selectedFile, {
            format: "webp",
            quality: 0.8,
            maxWidth: 512,
            maxHeight: 512,
         });

         const compressedFileName = getCompressedFileName(
            fileUpload.selectedFile.name,
            "webp",
         );

         // Request presigned URL
         const { presignedUrl, storageKey: key } =
            await requestUploadUrlMutation.mutateAsync({
               contentType: "image/webp",
               fileName: compressedFileName,
               fileSize: compressed.size,
            });

         storageKey = key;

         // Upload to S3
         await uploadToPresignedUrl(presignedUrl, compressed, "image/webp");

         // Confirm upload
         await confirmUploadMutation.mutateAsync({ storageKey: key });
      } catch (error) {
         console.error("Avatar upload error:", error);
         if (storageKey) {
            await cancelUploadMutation.mutateAsync({ storageKey });
         }
         toast.error("Erro ao fazer upload do avatar");
      } finally {
         fileUpload.setUploading(false);
      }
   };

   const isUploading =
      fileUpload.isUploading ||
      isUploadingToS3 ||
      requestUploadUrlMutation.isPending ||
      confirmUploadMutation.isPending;

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Alterar Avatar"}</CredenzaTitle>
            <CredenzaDescription>{"Sua foto de perfil"}</CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {/* Current/Preview Avatar */}
            <div className="flex justify-center">
               <Avatar className="size-24">
                  <AvatarImage
                     alt="Avatar preview"
                     src={fileUpload.filePreview || currentImage || undefined}
                  />
                  <AvatarFallback className="text-2xl">
                     <User className="size-8" />
                  </AvatarFallback>
               </Avatar>
            </div>

            {/* File Input */}
            <input
               accept="image/jpeg,image/png,image/webp,image/avif"
               className="hidden"
               onChange={handleFileSelect}
               ref={fileInputRef}
               type="file"
            />

            {/* Upload Button */}
            <Button
               className="w-full"
               disabled={isUploading}
               onClick={() => fileInputRef.current?.click()}
               variant="outline"
            >
               <Upload className="size-4 mr-2" />
               {"Choose Image"}
            </Button>

            {fileUpload.selectedFile && (
               <p className="text-sm text-muted-foreground text-center">
                  {fileUpload.selectedFile.name}
               </p>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            <CredenzaClose asChild>
               <Button variant="outline">{"Cancelar"}</Button>
            </CredenzaClose>
            <Button
               disabled={!fileUpload.selectedFile || isUploading}
               onClick={handleUpload}
            >
               {isUploading && <Loader2 className="size-4 mr-2 animate-spin" />}
               {"Salvar"}
            </Button>
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Change Password Sheet Content (Stepped Form)
// ============================================

const passwordSteps = [
   { id: "verify", title: "verify" },
   { id: "change", title: "change" },
] as const;

const { Stepper: PasswordStepper, useStepper: usePasswordStepper } =
   defineStepper(...passwordSteps);

function ChangePasswordSheetContent({ onClose }: { onClose: () => void }) {
   return (
      <PasswordStepper.Provider>
         {({ methods }) => (
            <ChangePasswordStepperContent methods={methods} onClose={onClose} />
         )}
      </PasswordStepper.Provider>
   );
}

function ChangePasswordStepperContent({
   methods,
   onClose,
}: {
   methods: ReturnType<typeof usePasswordStepper>;
   onClose: () => void;
}) {
   const trpc = useTRPC();
   const { openAlertDialog } = useAlertDialog();
   const [currentPassword, setCurrentPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [passwordError, setPasswordError] = useState(false);

   // Step 1: Verify current password
   const verifyMutation = useMutation(
      trpc.account.verifyPassword.mutationOptions({
         onSuccess: (result) => {
            if (result.valid) {
               setPasswordError(false);
               methods.next();
            } else {
               setPasswordError(true);
            }
         },
         onError: () => {
            setPasswordError(true);
         },
      }),
   );

   // Step 2: Change password
   const changeMutation = useMutation({
      mutationFn: async () => {
         return betterAuthClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
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

   const handleVerify = () => {
      setPasswordError(false);
      verifyMutation.mutate({ password: currentPassword });
   };

   const handleSubmit = () => {
      openAlertDialog({
         title: "Confirm Title",
         description: "Confirm Description",
         onAction: async () => {
            await changeMutation.mutateAsync();
         },
         actionLabel: "Confirmar",
         cancelLabel: "Cancelar",
         variant: "default",
      });
   };

   const handleBack = () => {
      methods.prev();
      setNewPassword("");
      setConfirmPassword("");
   };

   const isNewPasswordValid =
      newPassword.length >= 8 && newPassword === confirmPassword;

   const isVerifyStep = methods.current.id === "verify";

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>{"Alterar Senha"}</SheetTitle>
            <SheetDescription>
               {isVerifyStep ? "Step Verify" : "Step Change"}
            </SheetDescription>
         </SheetHeader>

         {/* Step Indicator using defineStepper */}
         <div className="px-4 py-2">
            <PasswordStepper.Navigation>
               {passwordSteps.map((step) => (
                  <PasswordStepper.Step key={step.id} of={step.id} />
               ))}
            </PasswordStepper.Navigation>
         </div>

         <div className="flex-1 px-4 pb-4 space-y-4 overflow-y-auto">
            {methods.switch({
               verify: () => (
                  <>
                     <Alert>
                        <Info className="size-4" />
                        <AlertTitle>{"Identity Verification"}</AlertTitle>
                        <AlertDescription>
                           {"Identity Verification Info"}
                        </AlertDescription>
                     </Alert>

                     <div className="space-y-2">
                        <Label htmlFor="current-password">
                           {"Current Password"}
                        </Label>
                        <Input
                           id="current-password"
                           onChange={(e) => {
                              setCurrentPassword(e.target.value);
                              setPasswordError(false);
                           }}
                           placeholder={"Current Password Placeholder"}
                           type="password"
                           value={currentPassword}
                        />
                     </div>

                     {passwordError && (
                        <Alert variant="destructive">
                           <AlertTriangle className="size-4" />
                           <AlertTitle>{"Incorrect Password"}</AlertTitle>
                           <AlertDescription>
                              {"Incorrect Password Info"}
                           </AlertDescription>
                        </Alert>
                     )}
                  </>
               ),
               change: () => (
                  <>
                     <Alert>
                        <Info className="size-4" />
                        <AlertTitle>{"Account Security"}</AlertTitle>
                        <AlertDescription>
                           {"Account Security Info"}
                        </AlertDescription>
                     </Alert>

                     <div className="space-y-2">
                        <Label htmlFor="new-password">{"New Password"}</Label>
                        <Input
                           id="new-password"
                           onChange={(e) => setNewPassword(e.target.value)}
                           placeholder={"New Password Placeholder"}
                           type="password"
                           value={newPassword}
                        />
                        {newPassword && newPassword.length < 8 && (
                           <p className="text-sm text-destructive">
                              {"Min Length Error"}
                           </p>
                        )}
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">
                           {"Confirm Password"}
                        </Label>
                        <Input
                           id="confirm-new-password"
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           placeholder={"Confirm Password Placeholder"}
                           type="password"
                           value={confirmPassword}
                        />
                        {newPassword &&
                           confirmPassword &&
                           newPassword !== confirmPassword && (
                              <p className="text-sm text-destructive">
                                 {"Passwords Not Match"}
                              </p>
                           )}
                     </div>
                  </>
               ),
            })}
         </div>

         <SheetFooter>
            {isVerifyStep ? (
               <>
                  <SheetClose asChild>
                     <Button variant="outline">{"Cancelar"}</Button>
                  </SheetClose>
                  <Button
                     disabled={!currentPassword || verifyMutation.isPending}
                     onClick={handleVerify}
                  >
                     {verifyMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     {"Verify And Continue"}
                  </Button>
               </>
            ) : (
               <>
                  <Button onClick={handleBack} variant="outline">
                     {"Voltar"}
                  </Button>
                  <Button
                     disabled={!isNewPasswordValid || changeMutation.isPending}
                     onClick={handleSubmit}
                  >
                     {"Title"}
                  </Button>
               </>
            )}
         </SheetFooter>
      </div>
   );
}

function ProfileSectionErrorFallback(props: FallbackProps) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>{"Perfil"}</CardTitle>
            <CardDescription>{"Suas informações pessoais."}</CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: "Erro ao carregar informações",
               errorTitle: "Erro",
               retryText: "Tentar novamente",
            })(props)}
         </CardContent>
      </Card>
   );
}

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
                  <CardContent className="space-y-4 md:space-y-6">
                     <div className="flex justify-center">
                        <Skeleton className="size-16 md:size-20 rounded-full" />
                     </div>
                     <div className="space-y-1">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
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
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <div className="rounded-lg bg-secondary/50 p-4">
                     <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                     <Skeleton className="h-8 w-2/3 mx-auto" />
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Second Row Skeleton */}
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                     </div>
                  </CardContent>
               </Card>
            </div>
            <Card className="h-full">
               <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
               </CardHeader>
               <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

// ============================================
// Profile Card Component
// ============================================

function ProfileCard({
   session,
   hasPassword,
   onPasswordSet,
}: {
   session: {
      user?: {
         name?: string | null;
         email?: string | null;
         image?: string | null;
      } | null;
   } | null;
   hasPassword: boolean;
   onPasswordSet: () => void;
}) {
   const { openCredenza, closeCredenza } = useCredenza();
   const { openSheet, closeSheet } = useSheet();

   const handleChangeName = () => {
      openSheet({
         children: (
            <ChangeNameSheetContent
               currentName={session?.user?.name || ""}
               onClose={closeSheet}
            />
         ),
      });
   };

   const handleChangeEmail = () => {
      openSheet({
         children: (
            <ChangeEmailSheetContent
               currentEmail={session?.user?.email || ""}
               onClose={closeSheet}
            />
         ),
      });
   };

   const handleChangeAvatar = () => {
      openCredenza({
         children: (
            <ChangeAvatarCredenzaContent
               currentImage={session?.user?.image}
               onClose={closeCredenza}
            />
         ),
      });
   };

   const handleChangePassword = () => {
      openSheet({
         children: <ChangePasswordSheetContent onClose={closeSheet} />,
      });
   };

   const handleSetPassword = () => {
      openCredenza({
         children: (
            <SetPasswordCredenzaContent
               onSuccess={() => {
                  closeCredenza();
                  onPasswordSet();
               }}
            />
         ),
      });
   };

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>{"Perfil"}</CardTitle>
            <CardDescription>
               {"Visualize e gerencie as informações do seu perfil pessoal"}
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4 md:space-y-6">
            {/* Avatar Section with Edit Overlay */}
            <div className="flex justify-center">
               <div className="relative group">
                  <Avatar className="size-16 md:size-20">
                     <AvatarImage
                        alt={session?.user?.name || "Profile picture"}
                        src={session?.user?.image || undefined}
                     />
                     <AvatarFallback className="text-lg md:text-xl">
                        {getInitials(
                           session?.user?.name || "",
                           session?.user?.email || "",
                        )}
                     </AvatarFallback>
                  </Avatar>
                  <button
                     className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer"
                     onClick={handleChangeAvatar}
                     type="button"
                  >
                     <Camera className="size-5 text-white" />
                  </button>
               </div>
            </div>

            {/* Profile Details */}
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <User className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{"Name"}</ItemTitle>
                     <ItemDescription>
                        {session?.user?.name || "-"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={handleChangeName}
                              size="icon"
                              variant="ghost"
                           >
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>{"Edit Tooltip"}</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Mail className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{"Email"}</ItemTitle>
                     <ItemDescription>
                        {session?.user?.email || "-"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              onClick={handleChangeEmail}
                              size="icon"
                              variant="ghost"
                           >
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>{"Edit Tooltip"}</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Lock className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{"Label"}</ItemTitle>
                     <ItemDescription>
                        {hasPassword
                           ? "Description Has Password"
                           : "Description No Password"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {hasPassword ? (
                        <Button
                           onClick={handleChangePassword}
                           size="sm"
                           variant="outline"
                        >
                           {"Alterar"}
                        </Button>
                     ) : (
                        <Button
                           onClick={handleSetPassword}
                           size="sm"
                           variant="outline"
                        >
                           {"Definir"}
                        </Button>
                     )}
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
   session,
}: {
   session: {
      user?: {
         createdAt?: Date | string | null;
         emailVerified?: boolean;
      } | null;
   } | null;
}) {
   const isEmailVerified = session?.user?.emailVerified;
   const createdAt = session?.user?.createdAt;

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>{"Title"}</CardTitle>
            <CardDescription>{"Description"}</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Calendar className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{"Member Since"}</ItemTitle>
                     <ItemDescription>
                        {formatDate(createdAt ?? null)}
                     </ItemDescription>
                  </ItemContent>
               </Item>
            </ItemGroup>

            <div className="rounded-lg bg-secondary/50 p-4 text-center">
               <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  {"Account Status"}
               </p>
               <div className="flex items-center justify-center gap-2">
                  {isEmailVerified ? (
                     <>
                        <Shield className="size-5 text-green-500" />
                        <span className="text-lg font-semibold text-green-500">
                           {"Verified"}
                        </span>
                     </>
                  ) : (
                     <>
                        <Shield className="size-5 text-muted-foreground" />
                        <span className="text-lg font-semibold text-muted-foreground">
                           {"Not Verified"}
                        </span>
                     </>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   );
}

// ============================================
// Two Factor Setup Credenza Content
// ============================================

function TwoFactorSetupCredenzaContent({ onClose }: { onClose: () => void }) {
   const [step, setStep] = useState<
      "password" | "qrcode" | "verify" | "backup"
   >("password");
   const [password, setPassword] = useState("");
   const [totpUri, setTotpUri] = useState("");
   const [verifyCode, setVerifyCode] = useState("");
   const [backupCodes, setBackupCodes] = useState<string[]>([]);

   const enableMutation = useMutation({
      mutationFn: async () => {
         const result = await betterAuthClient.twoFactor.enable({
            password,
         });
         return result;
      },
      onSuccess: async () => {
         // Get TOTP URI for QR code
         const uriResult = await betterAuthClient.twoFactor.getTotpUri({
            password,
         });
         if (uriResult.data?.totpURI) {
            setTotpUri(uriResult.data.totpURI);
            setStep("qrcode");
         }
      },
      onError: () => {
         toast.error("Incorrect Password");
      },
   });

   const verifyMutation = useMutation({
      mutationFn: async () => {
         const result = await betterAuthClient.twoFactor.verifyTotp({
            code: verifyCode,
         });
         return result;
      },
      onSuccess: async () => {
         // Generate backup codes
         const codesResult =
            await betterAuthClient.twoFactor.generateBackupCodes({
               password,
            });
         if (codesResult.data?.backupCodes) {
            setBackupCodes(codesResult.data.backupCodes);
            setStep("backup");
         }
         toast.success("Success");
      },
      onError: () => {
         toast.error("Invalid Code");
      },
   });

   const copyBackupCodes = () => {
      navigator.clipboard.writeText(backupCodes.join("\n"));
      toast.success("Codes Copied");
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Title"}</CredenzaTitle>
            <CredenzaDescription>
               {step === "password" && "Step Password"}
               {step === "qrcode" && "Step Qrcode"}
               {step === "verify" && "Step Verify"}
               {step === "backup" && "Step Backup"}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {step === "password" && (
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="2fa-password">{"Password Label"}</Label>
                     <Input
                        id="2fa-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={"Password Placeholder"}
                        type="password"
                        value={password}
                     />
                  </div>
               </div>
            )}

            {step === "qrcode" && (
               <div className="space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                     {/* QR Code would be rendered here using a library like qrcode.react */}
                     <div className="size-48 bg-gray-100 flex items-center justify-center rounded border">
                        <Smartphone className="size-12 text-muted-foreground" />
                     </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                     {"Qr Instruction"}
                  </p>
                  <div className="p-3 bg-secondary rounded-lg">
                     <p className="text-xs text-muted-foreground mb-1">
                        {"Manual Entry"}
                     </p>
                     <code className="text-xs break-all">{totpUri}</code>
                  </div>
                  <Button className="w-full" onClick={() => setStep("verify")}>
                     {"Continuar"}
                  </Button>
               </div>
            )}

            {step === "verify" && (
               <div className="space-y-4">
                  <div className="flex justify-center">
                     <InputOTP
                        maxLength={6}
                        onChange={setVerifyCode}
                        value={verifyCode}
                     >
                        <InputOTPGroup>
                           <InputOTPSlot index={0} />
                           <InputOTPSlot index={1} />
                           <InputOTPSlot index={2} />
                           <InputOTPSlot index={3} />
                           <InputOTPSlot index={4} />
                           <InputOTPSlot index={5} />
                        </InputOTPGroup>
                     </InputOTP>
                  </div>
               </div>
            )}

            {step === "backup" && (
               <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-lg">
                     <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code) => (
                           <code
                              className="text-sm font-mono p-2 bg-background rounded"
                              key={code}
                           >
                              {code}
                           </code>
                        ))}
                     </div>
                  </div>
                  <Button
                     className="w-full"
                     onClick={copyBackupCodes}
                     variant="outline"
                  >
                     <Copy className="size-4 mr-2" />
                     {"Copy Codes"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                     {"Codes Info"}
                  </p>
               </div>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            {step === "password" && (
               <>
                  <CredenzaClose asChild>
                     <Button variant="outline">{"Cancelar"}</Button>
                  </CredenzaClose>
                  <Button
                     disabled={!password || enableMutation.isPending}
                     onClick={() => enableMutation.mutate()}
                  >
                     {enableMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     {"Continuar"}
                  </Button>
               </>
            )}

            {step === "verify" && (
               <>
                  <Button onClick={() => setStep("qrcode")} variant="outline">
                     {"Voltar"}
                  </Button>
                  <Button
                     disabled={
                        verifyCode.length !== 6 || verifyMutation.isPending
                     }
                     onClick={() => verifyMutation.mutate()}
                  >
                     {verifyMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     {"Verificar"}
                  </Button>
               </>
            )}

            {step === "backup" && (
               <Button className="w-full" onClick={onClose}>
                  {"Concluir"}
               </Button>
            )}
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Set Password Credenza Content (for OAuth users)
// ============================================

function SetPasswordCredenzaContent({ onSuccess }: { onSuccess: () => void }) {
   const trpc = useTRPC();
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");

   const setPasswordMutation = useMutation(
      trpc.account.setPassword.mutationOptions({
         onSuccess: () => {
            toast.success("Success");
            onSuccess();
         },
         onError: () => {
            toast.error("Error");
         },
      }),
   );

   const isValid = password.length >= 8 && password === confirmPassword;

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Title"}</CredenzaTitle>
            <CredenzaDescription>{"Description"}</CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
               <p className="text-sm text-muted-foreground">{"Oauth Info"}</p>
            </div>

            <div className="space-y-2">
               <Label htmlFor="new-password">{"New Password"}</Label>
               <Input
                  id="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={"New Password Placeholder"}
                  type="password"
                  value={password}
               />
            </div>

            <div className="space-y-2">
               <Label htmlFor="confirm-password">{"Confirm Password"}</Label>
               <Input
                  id="confirm-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={"Confirm Password Placeholder"}
                  type="password"
                  value={confirmPassword}
               />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
               <p className="text-sm text-destructive">
                  {"Passwords Not Match"}
               </p>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            <CredenzaClose asChild>
               <Button variant="outline">{"Cancelar"}</Button>
            </CredenzaClose>
            <Button
               disabled={!isValid || setPasswordMutation.isPending}
               onClick={() =>
                  setPasswordMutation.mutate({ newPassword: password })
               }
            >
               {setPasswordMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               {"Title"}
            </Button>
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Two Factor Card Component
// ============================================

function TwoFactorCard({
   session,
   hasPassword,
   onPasswordSet,
}: {
   session: {
      user?: {
         twoFactorEnabled?: boolean | null;
      } | null;
   } | null;
   hasPassword: boolean;
   onPasswordSet: () => void;
}) {
   const { openCredenza, closeCredenza } = useCredenza();
   const isTwoFactorEnabled = session?.user?.twoFactorEnabled ?? false;

   const disableMutation = useMutation({
      mutationFn: async (password: string) => {
         return betterAuthClient.twoFactor.disable({ password });
      },
      onSuccess: () => {
         toast.success("Success");
         closeCredenza();
      },
      onError: () => {
         toast.error("Error");
      },
   });

   const handleSetup2FA = () => {
      openCredenza({
         children: <TwoFactorSetupCredenzaContent onClose={closeCredenza} />,
      });
   };

   const handleSetPassword = () => {
      openCredenza({
         children: (
            <SetPasswordCredenzaContent
               onSuccess={() => {
                  closeCredenza();
                  onPasswordSet();
               }}
            />
         ),
      });
   };

   const handleDisable2FA = () => {
      openCredenza({
         children: (
            <DisableTwoFactorCredenzaContent
               isPending={disableMutation.isPending}
               onConfirm={(password) => disableMutation.mutate(password)}
            />
         ),
      });
   };

   const handleViewBackupCodes = () => {
      openCredenza({
         children: <ViewBackupCodesCredenzaContent onClose={closeCredenza} />,
      });
   };

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>{"Autenticação em Duas Etapas"}</CardTitle>
            <CardDescription>{"Description"}</CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     {isTwoFactorEnabled ? (
                        <ShieldCheck className="size-4 text-green-500" />
                     ) : (
                        <ShieldOff className="size-4" />
                     )}
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{"Status"}</ItemTitle>
                     <ItemDescription>
                        {isTwoFactorEnabled
                           ? "Enabled Description"
                           : "Disabled Description"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Badge
                        variant={isTwoFactorEnabled ? "default" : "secondary"}
                     >
                        {isTwoFactorEnabled ? "Active" : "Inactive"}
                     </Badge>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* OAuth user without password */}
               {!hasPassword && !isTwoFactorEnabled && (
                  <div className="p-4 bg-amber-500/10 rounded-lg">
                     <div className="flex items-start gap-3">
                        <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                           <p className="text-sm font-medium">
                              {"Oauth Warning Title"}
                           </p>
                           <p className="text-sm text-muted-foreground">
                              {"Oauth Warning Description"}
                           </p>
                           <Button
                              onClick={handleSetPassword}
                              size="sm"
                              variant="outline"
                           >
                              <Key className="size-4 mr-2" />
                              {"Title"}
                           </Button>
                        </div>
                     </div>
                  </div>
               )}

               {isTwoFactorEnabled ? (
                  <>
                     <Item
                        className="cursor-pointer"
                        onClick={handleViewBackupCodes}
                        variant="muted"
                     >
                        <ItemMedia variant="icon">
                           <Key className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>{"Title"}</ItemTitle>
                           <ItemDescription>{"Description"}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ChevronRight className="size-4 text-muted-foreground" />
                        </ItemActions>
                     </Item>

                     <ItemSeparator />

                     <Item
                        className="cursor-pointer"
                        onClick={handleDisable2FA}
                        variant="muted"
                     >
                        <ItemMedia variant="icon">
                           <Lock className="size-4 text-destructive" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="text-destructive">
                              {"Remove Title"}
                           </ItemTitle>
                           <ItemDescription>
                              {"Remove Description"}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ChevronRight className="size-4 text-muted-foreground" />
                        </ItemActions>
                     </Item>
                  </>
               ) : (
                  hasPassword && (
                     <Item
                        className="cursor-pointer"
                        onClick={handleSetup2FA}
                        variant="muted"
                     >
                        <ItemMedia variant="icon">
                           <Smartphone className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>{"Configure"}</ItemTitle>
                           <ItemDescription>
                              {"Configure Description"}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ChevronRight className="size-4 text-muted-foreground" />
                        </ItemActions>
                     </Item>
                  )
               )}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// View Backup Codes Credenza Content
// ============================================

function ViewBackupCodesCredenzaContent({ onClose }: { onClose: () => void }) {
   const [password, setPassword] = useState("");
   const [codes, setCodes] = useState<string[]>([]);
   const [step, setStep] = useState<"password" | "codes">("password");

   const viewMutation = useMutation({
      mutationFn: async () => {
         const result = await betterAuthClient.twoFactor.generateBackupCodes({
            password,
         });
         return result;
      },
      onSuccess: (result) => {
         if (result.data?.backupCodes) {
            setCodes(result.data.backupCodes);
            setStep("codes");
         }
      },
      onError: () => {
         toast.error("Incorrect Password");
      },
   });

   const copyBackupCodes = () => {
      navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Codes Copied");
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Title"}</CredenzaTitle>
            <CredenzaDescription>
               {step === "password" ? "Step Password" : "Step Codes"}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {step === "password" && (
               <div className="space-y-2">
                  <Label htmlFor="backup-password">{"Password Label"}</Label>
                  <Input
                     id="backup-password"
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder={"Password Placeholder"}
                     type="password"
                     value={password}
                  />
               </div>
            )}

            {step === "codes" && (
               <>
                  <div className="p-4 bg-secondary rounded-lg">
                     <div className="grid grid-cols-2 gap-2">
                        {codes.map((code) => (
                           <code
                              className="text-sm font-mono p-2 bg-background rounded"
                              key={code}
                           >
                              {code}
                           </code>
                        ))}
                     </div>
                  </div>
                  <Button
                     className="w-full"
                     onClick={copyBackupCodes}
                     variant="outline"
                  >
                     <Copy className="size-4 mr-2" />
                     {"Copy Codes"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                     {"Codes Invalidated"}
                  </p>
               </>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            {step === "password" && (
               <>
                  <CredenzaClose asChild>
                     <Button variant="outline">{"Cancelar"}</Button>
                  </CredenzaClose>
                  <Button
                     disabled={!password || viewMutation.isPending}
                     onClick={() => viewMutation.mutate()}
                  >
                     {viewMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     {"View Codes"}
                  </Button>
               </>
            )}

            {step === "codes" && (
               <Button className="w-full" onClick={onClose}>
                  {"Concluir"}
               </Button>
            )}
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Disable Two Factor Credenza Content
// ============================================

function DisableTwoFactorCredenzaContent({
   onConfirm,
   isPending,
}: {
   onConfirm: (password: string) => void;
   isPending: boolean;
}) {
   const [password, setPassword] = useState("");

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Title"}</CredenzaTitle>
            <CredenzaDescription>{"Description"}</CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg flex items-start gap-3">
               <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
               <p className="text-sm text-destructive">{"Warning"}</p>
            </div>
            <div className="space-y-2">
               <Label htmlFor="disable-password">{"Password Label"}</Label>
               <Input
                  id="disable-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={"Password Placeholder"}
                  type="password"
                  value={password}
               />
            </div>
         </CredenzaBody>

         <CredenzaFooter>
            <CredenzaClose asChild>
               <Button variant="outline">{"Cancelar"}</Button>
            </CredenzaClose>
            <Button
               disabled={!password || isPending}
               onClick={() => onConfirm(password)}
               variant="destructive"
            >
               {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
               {"Button"}
            </Button>
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Data & Account Card Component
// ============================================

function DataAccountCard() {
   const { openCredenza, closeCredenza } = useCredenza();
   const trpc = useTRPC();

   const exportMutation = useMutation(
      trpc.account.exportUserData.mutationOptions(),
   );

   const handleExportData = async () => {
      try {
         const data = await exportMutation.mutateAsync();
         const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
         });
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `contentta-export-${new Date().toISOString().split("T")[0]}.json`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
         toast.success("Export Success");
      } catch {
         toast.error("Export Error");
      }
   };

   const handleDeleteAccount = () => {
      openCredenza({
         children: <DeleteAccountCredenzaContent onClose={closeCredenza} />,
      });
   };

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>{"Title"}</CardTitle>
            <CardDescription>{"Description"}</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <Button
               className="w-full"
               disabled={exportMutation.isPending}
               onClick={handleExportData}
               variant="outline"
            >
               {exportMutation.isPending ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               ) : (
                  <Download className="size-4 mr-2" />
               )}
               {"Export Button"}
            </Button>

            <Button
               className="w-full"
               onClick={handleDeleteAccount}
               variant="destructive"
            >
               <Trash2 className="size-4 mr-2" />
               {"Delete Button"}
            </Button>
         </CardContent>
      </Card>
   );
}

// ============================================
// Delete Account Credenza Content
// ============================================

function DeleteAccountCredenzaContent({ onClose }: { onClose: () => void }) {
   const [step, setStep] = useState<"options" | "confirm">("options");
   const [deletionType, setDeletionType] = useState<
      "immediate" | "grace_period"
   >("grace_period");
   const [password, setPassword] = useState("");

   const deleteMutation = useMutation(
      trpc.accountDeletion.requestDeletion.mutationOptions({
         onSuccess: (data) => {
            if (data.type === "immediate") {
               toast.success("Success Immediate");
               window.location.href = "/auth/sign-in";
            } else if (data.scheduledDeletionAt) {
               const scheduledDate = new Date(data.scheduledDeletionAt);
               toast.success(
                  `Exclusão agendada para ${scheduledDate.toLocaleDateString()}`,
               );
               onClose();
            }
         },
         onError: (error) => {
            if (error.message === "Invalid password") {
               toast.error("Error Invalid Password");
            } else {
               toast.error("Error Generic");
            }
         },
      }),
   );

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Title"}</CredenzaTitle>
            <CredenzaDescription>
               {step === "options"
                  ? "Options Description"
                  : "Confirm Description"}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {step === "options" && (
               <>
                  <div className="p-4 bg-destructive/10 rounded-lg flex items-start gap-3">
                     <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                     <p className="text-sm text-destructive">{"Warning"}</p>
                  </div>

                  <RadioGroup
                     onValueChange={(v) =>
                        setDeletionType(v as "immediate" | "grace_period")
                     }
                     value={deletionType}
                  >
                     <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem
                           id="grace_period"
                           value="grace_period"
                        />
                        <div className="space-y-1">
                           <Label htmlFor="grace_period">
                              {"Grace Period Title"}
                           </Label>
                           <p className="text-sm text-muted-foreground">
                              {"Grace Period Description"}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-start space-x-3 p-4 border rounded-lg border-destructive/50">
                        <RadioGroupItem id="immediate" value="immediate" />
                        <div className="space-y-1">
                           <Label
                              className="text-destructive"
                              htmlFor="immediate"
                           >
                              {"Immediate Title"}
                           </Label>
                           <p className="text-sm text-muted-foreground">
                              {"Immediate Description"}
                           </p>
                        </div>
                     </div>
                  </RadioGroup>
               </>
            )}

            {step === "confirm" && (
               <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                     {deletionType === "immediate"
                        ? "Password Prompt Immediate"
                        : "Password Prompt Grace"}
                  </p>
                  <div className="space-y-2">
                     <Label htmlFor="delete-password">{"Password Label"}</Label>
                     <Input
                        id="delete-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={"Password Placeholder"}
                        type="password"
                        value={password}
                     />
                  </div>
               </div>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            {step === "options" && (
               <>
                  <CredenzaClose asChild>
                     <Button variant="outline">{"Cancelar"}</Button>
                  </CredenzaClose>
                  <Button
                     onClick={() => setStep("confirm")}
                     variant="destructive"
                  >
                     {"Continuar"}
                  </Button>
               </>
            )}

            {step === "confirm" && (
               <>
                  <Button onClick={() => setStep("options")} variant="outline">
                     {"Voltar"}
                  </Button>
                  <Button
                     disabled={!password || deleteMutation.isPending}
                     onClick={() =>
                        deleteMutation.mutate({ type: deletionType, password })
                     }
                     variant="destructive"
                  >
                     {deleteMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     {deletionType === "immediate"
                        ? "Delete Now"
                        : "Schedule Deletion"}
                  </Button>
               </>
            )}
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Linked Accounts Card Component
// ============================================

function LinkedAccountsCard({
   accounts,
   hasPassword,
   onRefetch,
}: {
   accounts: {
      id: string;
      providerId: string;
      accountId: string;
      createdAt: Date;
   }[];
   hasPassword: boolean;
   onRefetch: () => void;
}) {
   const { openCredenza, closeCredenza } = useCredenza();

   const unlinkMutation = useMutation({
      mutationFn: async (providerId: string) => {
         return betterAuthClient.unlinkAccount({ providerId });
      },
      onSuccess: () => {
         toast.success("Unlink Success");
         onRefetch();
      },
      onError: () => {
         toast.error("Unlink Error");
      },
   });

   const handleLinkGoogle = async () => {
      try {
         await betterAuthClient.linkSocial({
            provider: "google",
            callbackURL: window.location.href,
         });
      } catch {
         toast.error("Link Google Error");
      }
   };

   const handleSetPassword = () => {
      openCredenza({
         children: (
            <SetPasswordCredenzaContent
               onSuccess={() => {
                  closeCredenza();
                  onRefetch();
               }}
            />
         ),
      });
   };

   const canUnlink = accounts.length > 1;
   const hasGoogleLinked = accounts.some((a) => a.providerId === "google");

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>{"Title"}</CardTitle>
            <CardDescription>{"Description"}</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <ItemGroup>
               {/* Password Account */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Key className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{"Label"}</ItemTitle>
                     <ItemDescription>
                        {hasPassword
                           ? "Password Configured"
                           : "Password Not Configured"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {hasPassword ? (
                        <Badge variant="default">{"Active"}</Badge>
                     ) : (
                        <Button
                           onClick={handleSetPassword}
                           size="sm"
                           variant="outline"
                        >
                           {"Definir"}
                        </Button>
                     )}
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Google Account */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Mail className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Google</ItemTitle>
                     <ItemDescription>
                        {hasGoogleLinked
                           ? "Google Linked"
                           : "Google Not Linked"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {hasGoogleLinked ? (
                        <div className="flex items-center gap-2">
                           <Badge variant="default">{"Active"}</Badge>
                           {canUnlink && (
                              <Tooltip>
                                 <TooltipTrigger asChild>
                                    <Button
                                       disabled={unlinkMutation.isPending}
                                       onClick={() =>
                                          unlinkMutation.mutate("google")
                                       }
                                       size="icon"
                                       variant="ghost"
                                    >
                                       {unlinkMutation.isPending ? (
                                          <Loader2 className="size-4 animate-spin" />
                                       ) : (
                                          <Link2Off className="size-4 text-destructive" />
                                       )}
                                    </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                    {"Desvincular"}
                                 </TooltipContent>
                              </Tooltip>
                           )}
                        </div>
                     ) : (
                        <Button
                           onClick={handleLinkGoogle}
                           size="sm"
                           variant="outline"
                        >
                           <Link2 className="size-4 mr-2" />
                           {"Vincular"}
                        </Button>
                     )}
                  </ItemActions>
               </Item>
            </ItemGroup>

            {!canUnlink && (
               <p className="text-xs text-muted-foreground text-center">
                  {"Min One Access"}
               </p>
            )}
         </CardContent>
      </Card>
   );
}

// ============================================
// Main Content Component
// ============================================

function ProfileSectionContent() {
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );
   const { data: hasPasswordData, refetch: refetchHasPassword } =
      useSuspenseQuery(trpc.account.hasPassword.queryOptions());
   const { data: linkedAccounts, refetch: refetchLinkedAccounts } =
      useSuspenseQuery(trpc.account.getLinkedAccounts.queryOptions());

   const handleRefetch = () => {
      refetchHasPassword();
      refetchLinkedAccounts();
   };

   return (
      <TooltipProvider>
         <div className="space-y-4 md:space-y-6">
            {/* Row 1: Profile + Account Summary */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
               <div className="md:col-span-2 lg:col-span-2">
                  <ProfileCard
                     hasPassword={hasPasswordData.hasPassword}
                     onPasswordSet={handleRefetch}
                     session={session}
                  />
               </div>
               <AccountSummaryCard session={session} />
            </div>

            {/* Row 2: 2FA + Data & Account */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
               <div className="md:col-span-2 lg:col-span-2">
                  <TwoFactorCard
                     hasPassword={hasPasswordData.hasPassword}
                     onPasswordSet={handleRefetch}
                     session={session}
                  />
               </div>
               <DataAccountCard />
            </div>

            {/* Row 3: Linked Accounts */}
            <LinkedAccountsCard
               accounts={linkedAccounts}
               hasPassword={hasPasswordData.hasPassword}
               onRefetch={handleRefetch}
            />
         </div>
      </TooltipProvider>
   );
}

export function ProfileSection() {
   return (
      <ErrorBoundary FallbackComponent={ProfileSectionErrorFallback}>
         <Suspense fallback={<ProfileSectionSkeleton />}>
            <ProfileSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
