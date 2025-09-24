import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/clients";
import { translate } from "@packages/localization";

type codes = "USER_ALREADY_EXISTS" | "default";

export const useSignUp = () => {
   const router = useRouter();
   const schema = z
      .object({
         confirmPassword: z.string(),
         email: z
            .string()
            .email(translate("pages.sign-up.validation.email-invalid")),
         name: z
            .string()
            .min(2, translate("pages.sign-up.validation.name-min-length")),
         password: z
            .string()
            .min(8, translate("pages.sign-up.validation.password-min-length")),
      })
      .refine((data) => data.password === data.confirmPassword, {
         message: translate("pages.sign-up.validation.passwords-no-match"),
         path: ["confirmPassword"],
      });

   const getErrorMessage = useMemo(
      () => ({
         default: translate("pages.sign-up.errors.unknown"),
         USER_ALREADY_EXISTS: translate("pages.sign-up.errors.user-exists"),
      }),
      [],
   );

   const handleSignUp = useCallback(
      async ({ name, email, password }: z.infer<typeof schema>) => {
         await betterAuthClient.signUp.email(
            {
               email,
               name,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(
                     getErrorMessage[error.code as codes] ||
                        translate("pages.sign-up.errors.unknown"),
                     {
                        id: "sign-up-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(translate("pages.sign-up.messages.loading"), {
                     id: "sign-up-toast",
                  });
               },
               onSuccess: ({ data }) => {
                  toast.success(translate("pages.sign-up.messages.success"), {
                     description: translate("pages.sign-up.messages.welcome", {
                        name: data.user.name,
                     }),
                     id: "sign-up-toast",
                  });
                  router.navigate({
                     search: { email: data.user.email },
                     to: "/auth/email-verification",
                  });
               },
            },
         );
      },
      [getErrorMessage, router],
   );

   const form = useAppForm({
      defaultValues: {
         confirmPassword: "",
         email: "",
         name: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleSignUp(value);
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

   return { form, handleSubmit };
};
