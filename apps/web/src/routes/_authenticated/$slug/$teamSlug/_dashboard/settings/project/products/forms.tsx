import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useEarlyAccess } from "@/hooks/use-early-access";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/products/forms",
)({
   component: ProductsFormsPage,
});

// ============================================
// Success Message Section
// ============================================

function SuccessMessageSection({ current }: { current: string | undefined }) {
   const MAX_CHARS = 200;
   const [message, setMessage] = useState(current ?? "");
   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateFormsDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Mensagem de sucesso atualizada!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar mensagem de sucesso");
         },
      }),
   );

   const hasChanged = message !== (current ?? "");
   const isOverLimit = message.length > MAX_CHARS;

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Mensagem de sucesso padrão</h2>
            <p className="text-sm text-muted-foreground">
               Mensagem exibida após o envio bem-sucedido de um formulário.
            </p>
         </div>
         <div className="space-y-2">
            <Textarea
               onChange={(e) => setMessage(e.target.value)}
               placeholder="Obrigado por enviar o formulário!"
               rows={3}
               value={message}
            />
            <div className="flex justify-between items-center">
               <p
                  className={`text-xs ${
                     isOverLimit ? "text-destructive" : "text-muted-foreground"
                  }`}
               >
                  {message.length} / {MAX_CHARS} caracteres
               </p>
            </div>
         </div>
         <Button
            disabled={!hasChanged || saveMutation.isPending || isOverLimit}
            onClick={() => saveMutation.mutate({ successMessage: message })}
            size="sm"
         >
            {saveMutation.isPending && (
               <Loader2 className="size-4 mr-2 animate-spin" />
            )}
            Salvar
         </Button>
      </section>
   );
}

// ============================================
// Redirect URL Section
// ============================================

function RedirectUrlSection({ current }: { current: string | undefined }) {
   const [url, setUrl] = useState(current ?? "");
   const [validationError, setValidationError] = useState<string | null>(null);
   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateFormsDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("URL de redirecionamento atualizada!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar URL de redirecionamento");
         },
      }),
   );

   const validateUrl = () => {
      if (!url.trim()) {
         setValidationError(null);
         return true;
      }

      try {
         z.string().url().parse(url);
         setValidationError(null);
         return true;
      } catch {
         setValidationError("URL inválida");
         return false;
      }
   };

   const handleBlur = () => {
      validateUrl();
   };

   const hasChanged = url !== (current ?? "");

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">URL de redirecionamento</h2>
            <p className="text-sm text-muted-foreground">
               Redireciona o usuário para esta URL após o envio do formulário.
            </p>
         </div>
         <div className="space-y-2">
            <Input
               onBlur={handleBlur}
               onChange={(e) => {
                  setUrl(e.target.value);
                  setValidationError(null);
               }}
               placeholder="https://exemplo.com/obrigado"
               type="url"
               value={url}
            />
            {validationError && (
               <p className="text-xs text-destructive">{validationError}</p>
            )}
         </div>
         <Button
            disabled={
               !hasChanged || saveMutation.isPending || validationError !== null
            }
            onClick={() =>
               saveMutation.mutate({
                  redirectUrl: url.trim() ? url.trim() : undefined,
               })
            }
            size="sm"
         >
            {saveMutation.isPending && (
               <Loader2 className="size-4 mr-2 animate-spin" />
            )}
            Salvar
         </Button>
      </section>
   );
}

// ============================================
// Email Notification Section
// ============================================

function EmailNotificationSection({
   currentEnabled,
   currentRecipients,
}: {
   currentEnabled: boolean | undefined;
   currentRecipients: string[] | undefined;
}) {
   const [enabled, setEnabled] = useState(currentEnabled ?? false);
   const [emailsInput, setEmailsInput] = useState(
      currentRecipients?.join(", ") ?? "",
   );
   const queryClient = useQueryClient();

   const saveMutation = useMutation(
      orpc.productSettings.updateFormsDefaults.mutationOptions({
         onSuccess: () => {
            toast.success("Notificações por email atualizadas!");
            queryClient.invalidateQueries({
               queryKey: orpc.productSettings.getSettings.queryOptions({
                  input: {},
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar notificações por email");
         },
      }),
   );

   const isValidEmail = (email: string) =>
      z.string().email().safeParse(email).success;
   const parsedEmails = emailsInput
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
   const allEmailsValid =
      parsedEmails.length === 0 || parsedEmails.every(isValidEmail);

   const hasChanged =
      enabled !== (currentEnabled ?? false) ||
      JSON.stringify(parsedEmails) !== JSON.stringify(currentRecipients ?? []);

   const handleSave = () => {
      saveMutation.mutate({
         sendEmailNotification: enabled,
         emailRecipients: enabled ? parsedEmails : [],
      });
   };

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Notificações por email</h2>
            <p className="text-sm text-muted-foreground">
               Envie notificações por email quando um formulário for enviado.
            </p>
         </div>
         <div className="flex items-center space-x-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>Ativar notificações por email</Label>
         </div>
         {enabled && (
            <div className="space-y-2">
               <Label>Destinatários (separados por vírgula)</Label>
               <Input
                  onChange={(e) => setEmailsInput(e.target.value)}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  type="text"
                  value={emailsInput}
               />
               <p className="text-xs text-muted-foreground">
                  Digite os emails separados por vírgula
               </p>
               {parsedEmails.length > 0 && !allEmailsValid && (
                  <p className="text-xs text-destructive">
                     Um ou mais emails são inválidos
                  </p>
               )}
            </div>
         )}
         <Button
            disabled={
               !hasChanged ||
               saveMutation.isPending ||
               (enabled && !allEmailsValid)
            }
            onClick={handleSave}
            size="sm"
         >
            {saveMutation.isPending && (
               <Loader2 className="size-4 mr-2 animate-spin" />
            )}
            Salvar
         </Button>
      </section>
   );
}

// ============================================
// Skeleton
// ============================================

function FormsProductSkeleton() {
   return (
      <div className="space-y-8">
         <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-80 mt-1" />
         </div>
         <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-20" />
         </div>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function FormsProductErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Formulários</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as configurações padrão dos formulários.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações de formulários
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Main Content
// ============================================

function FormsProductContent() {
   const { data: settings } = useSuspenseQuery(
      orpc.productSettings.getSettings.queryOptions({ input: {} }),
   );

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Formulários</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as configurações padrão dos formulários.
            </p>
         </div>

         <SuccessMessageSection
            current={settings?.formsDefaults?.successMessage}
         />

         <Separator />

         <RedirectUrlSection current={settings?.formsDefaults?.redirectUrl} />

         <Separator />

         <EmailNotificationSection
            currentEnabled={settings?.formsDefaults?.sendEmailNotification}
            currentRecipients={settings?.formsDefaults?.emailRecipients}
         />
      </div>
   );
}

// ============================================
// Page with Early Access Gate
// ============================================

function ProductsFormsPage() {
   const { isEnrolled, loaded } = useEarlyAccess();

   if (!loaded) {
      return <FormsProductSkeleton />;
   }

   if (!isEnrolled("forms-beta")) {
      return (
         <div className="space-y-6">
            <div>
               <h1 className="text-2xl font-semibold font-serif">
                  Formulários
               </h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie as configurações padrão dos formulários.
               </p>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <p className="text-sm text-muted-foreground mb-4">
                  Acesso negado. Cadastre-se no programa de acesso antecipado.
               </p>
            </div>
         </div>
      );
   }

   return (
      <ErrorBoundary FallbackComponent={FormsProductErrorFallback}>
         <Suspense fallback={<FormsProductSkeleton />}>
            <FormsProductContent />
         </Suspense>
      </ErrorBoundary>
   );
}
