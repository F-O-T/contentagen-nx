import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";

export function useForgotPassword() {
   const router = useRouter();
   const [sendingOtp, setSendingOtp] = useState(false);
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z.string().email("Enter a valid email"),
         otp: z.string().min(6, "The code must be 6 digits"),
         password: z
            .string()
            .min(8, "The password must be at least 8 characters"),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: "Passwords do not match",
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
                  toast.error("Error resetting password", {
                     id: "forgot-password-toast",
                  });
               },
               onRequest: () => {
                  toast.loading("Resetting password...", {
                     id: "forgot-password-toast",
                  });
               },
               onSuccess: () => {
                  toast.success("Password reset successfully!", {
                     id: "forgot-password-toast",
                  });
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
               toast.error("Error sending recovery code", {
                  id: "send-otp-toast",
               });
            },
            onRequest: () => {
               setSendingOtp(true);
               toast.loading("Sending recovery code...", {
                  id: "send-otp-toast",
               });
            },
            onSuccess: () => {
               setSendingOtp(false);
               toast.success("Code sent to your email.", {
                  id: "send-otp-toast",
               });
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
