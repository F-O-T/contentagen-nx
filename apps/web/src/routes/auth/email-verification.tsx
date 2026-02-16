import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSeparator,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";

const searchParams = z.object({
   email: z.email(),
});

export const Route = createFileRoute("/auth/email-verification")({
   component: EmailVerificationPage,
   validateSearch: searchParams,
});

function EmailVerificationPage() {
   const { email } = Route.useSearch();
   const schema = z.object({
      otp: z.string().min(6, "O campo deve ter no minimo 6 caracteres.").max(6),
   });

   const router = useRouter();

   const handleResendEmail = useCallback(async () => {
      await authClient.emailOtp.sendVerificationOtp(
         {
            email,
            type: "email-verification",
         },
         {
            onError: ({ error }) => {
               toast.error(error.message);
            },
            onRequest: () => {
               toast.loading("Processando...");
            },
            onSuccess: () => {
               toast.success("E-mail reenviado!");
            },
         },
      );
   }, [email]);

   const handleVerifyEmail = useCallback(
      async (otp: string) => {
         await authClient.emailOtp.verifyEmail(
            {
               email,
               otp,
            },
            {
               onError: ({ error }) => {
                  toast.error(error.message);
               },
               onRequest: () => {
                  toast.loading("Verificando...");
               },
               onSuccess: () => {
                  toast.success("E-mail verificado!");
                  router.navigate({ to: "/auth/callback" });
               },
            },
         );
      },
      [email, router.navigate],
   );

   const form = useForm({
      defaultValues: {
         otp: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleVerifyEmail(value.otp);
         formApi.reset();
      },
      validators: {
         onBlur: schema,
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
      <section className="space-y-6 w-full">
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold font-serif">
               Verificacao de Email
            </h1>
            <p className="text-muted-foreground text-sm">
               Digite o codigo de verificacao enviado para seu email.
            </p>
         </div>

         <div className="space-y-6">
            <form
               className="space-y-4"
               onSubmit={(e) => {
                  handleSubmit(e);
               }}
            >
               <FieldGroup>
                  <form.Field name="otp">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field
                              className="flex flex-col items-center"
                              data-invalid={isInvalid}
                           >
                              <FieldLabel>Codigo OTP</FieldLabel>
                              <InputOTP
                                 aria-invalid={isInvalid}
                                 autoComplete="one-time-code"
                                 className="gap-2"
                                 maxLength={6}
                                 onBlur={field.handleBlur}
                                 onChange={field.handleChange}
                                 value={field.state.value}
                              >
                                 <div className="w-full flex gap-2 items-center justify-center">
                                    <InputOTPGroup>
                                       <InputOTPSlot index={0} />
                                       <InputOTPSlot index={1} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                       <InputOTPSlot index={2} />
                                       <InputOTPSlot index={3} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                       <InputOTPSlot index={4} />
                                       <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                 </div>
                              </InputOTP>
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
                        className="w-full"
                        disabled={
                           !formState.canSubmit || formState.isSubmitting
                        }
                        type="submit"
                     >
                        Enviar
                     </Button>
                  )}
               </form.Subscribe>
            </form>
         </div>

         <div className="text-sm text-center">
            <Button
               className="text-muted-foreground"
               onClick={handleResendEmail}
               variant="link"
            >
               Reenviar Codigo
            </Button>
         </div>
      </section>
   );
}
