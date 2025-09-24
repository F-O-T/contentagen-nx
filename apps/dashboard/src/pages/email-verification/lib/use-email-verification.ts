import { useAppForm } from "@packages/ui/components/form";
import { useRouter, useSearch } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";
import { translate } from "@packages/localization";

type codes = "INVALID_OTP" | "default";

export const useEmailVerification = () => {
   const email = useSearch({
      from: "/auth/email-verification",
      select: (s) => s.email,
   });
   const schema = z.object({
      otp: z
         .string()
         .min(6, translate("pages.email-verification.validation.otp-length"))
         .max(6),
   });

   const getErrorMessage = useMemo(
      () => ({
         default: translate("pages.email-verification.messages.unknown-error"),
         INVALID_OTP: translate(
            "pages.email-verification.messages.invalid-otp",
         ),
      }),
      [],
   );
   const router = useRouter();
   const handleResendEmail = useCallback(async () => {
      await betterAuthClient.emailOtp.sendVerificationOtp(
         {
            email,

            type: "email-verification",
         },
         {
            onError: ({ error }) => {
               toast.error(
                  getErrorMessage[error.code as codes] ||
                     translate(
                        "pages.email-verification.messages.verification-error",
                     ),
                  {
                     id: "verification-code-toast",
                  },
               );
            },
            onRequest: () => {
               toast.loading(
                  translate("pages.email-verification.messages.loading-send"),
                  {
                     id: "verification-code-toast",
                  },
               );
            },
            onSuccess: () => {
               toast.success(
                  translate("pages.email-verification.messages.success-send"),
                  {
                     description: translate(
                        "pages.email-verification.messages.success-send-description",
                     ),
                     id: "verification-code-toast",
                  },
               );
            },
         },
      );
   }, [email, getErrorMessage]);
   const handleVerifyEmail = useCallback(
      async (value: z.infer<typeof schema>) => {
         await betterAuthClient.emailOtp.verifyEmail(
            {
               email,
               otp: value.otp,
            },
            {
               onError: ({ error }) => {
                  toast.error(
                     getErrorMessage[error.code as codes] ||
                        translate(
                           "pages.email-verification.messages.unknown-error",
                        ),
                     {
                        id: "email-verification-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(
                     translate(
                        "pages.email-verification.messages.loading-verify",
                     ),
                     {
                        id: "email-verification-toast",
                     },
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate(
                        "pages.email-verification.messages.success-verify",
                     ),
                     {
                        description: translate(
                           "pages.email-verification.messages.success-verify-description",
                        ),
                        id: "email-verification-toast",
                     },
                  );
                  router.navigate({
                     to: "/home",
                  });
               },
            },
         );
      },
      [email, router, getErrorMessage],
   );
   const form = useAppForm({
      defaultValues: {
         otp: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleVerifyEmail(value);
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

   return { form, handleResendEmail, handleSubmit };
};
