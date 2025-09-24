import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";
import { translate } from "@packages/localization";

export function useForgotPassword() {
   const router = useRouter();
   const [sendingOtp, setSendingOtp] = useState(false);
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z
            .string()
            .email(translate("pages.forgot-password.validation.email-invalid")),
         otp: z
            .string()
            .min(6, translate("pages.forgot-password.validation.otp-length")),
         password: z
            .string()
            .min(
               8,
               translate(
                  "pages.forgot-password.validation.password-min-length",
               ),
            ),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: translate(
            "pages.forgot-password.validation.passwords-no-match",
         ),
         path: ["confirmPassword"],
      });

   const handleResetPassword = useCallback(
      async ({
         email,
         otp,
         password,
      }: {
         email: string;
         otp: string;
         password: string;
      }) => {
         await betterAuthClient.emailOtp.resetPassword(
            {
               email,
               otp,
               password,
            },
            {
               onError: () => {
                  toast.error(
                     translate("pages.forgot-password.messages.reset-error"),
                     {
                        id: "forgot-password-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(
                     translate("pages.forgot-password.messages.reset-loading"),
                     {
                        id: "forgot-password-toast",
                     },
                  );
               },
               onSuccess: () => {
                  toast.success(
                     translate("pages.forgot-password.messages.reset-success"),
                     {
                        id: "forgot-password-toast",
                     },
                  );
                  router.navigate({
                     to: "/auth/sign-in",
                  });
               },
            },
         );
      },
      [router],
   );
   const form = useAppForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         otp: "",
         password: "",
      },
      onSubmit: async ({ value }) => {
         await handleResetPassword(value);
      },
      validators: {
         onBlur: schema,
      },
   });

   const sendOtp = useCallback(async (email: string) => {
      await betterAuthClient.emailOtp.sendVerificationOtp(
         {
            email,
            type: "forget-password",
         },

         {
            onError: () => {
               setSendingOtp(false);
               toast.error(
                  translate("pages.forgot-password.messages.send-error"),
                  {
                     id: "send-otp-toast",
                  },
               );
            },
            onRequest: () => {
               setSendingOtp(true);
               toast.loading(
                  translate("pages.forgot-password.messages.send-loading"),
                  {
                     id: "send-otp-toast",
                  },
               );
            },
            onSuccess: () => {
               setSendingOtp(false);
               toast.success(
                  translate("pages.forgot-password.messages.send-success"),
                  {
                     id: "send-otp-toast",
                  },
               );
            },
         },
      );
   }, []);
   const handleSubmit = useCallback(
      (e: React.FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );
   return {
      form,
      handleSubmit,
      sendingOtp,
      sendOtp,
   };
}
