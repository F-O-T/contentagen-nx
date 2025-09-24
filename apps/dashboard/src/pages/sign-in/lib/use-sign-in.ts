import brandConfig from "@packages/brand/index.json";
import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";
import { translate } from "@packages/localization";

type codes = "INVALID_EMAIL_OR_PASSWORD" | "default";
export const useSignIn = () => {
   const schema = z.object({
      email: z.email(translate("pages.sign-in.validation.email-invalid")),
      password: z
         .string()
         .min(8, translate("pages.sign-in.validation.password-min-length")),
   });
   const router = useRouter();
   const getErrorMessage = useMemo(
      () => ({
         default: translate("pages.sign-in.errors.unknown"),
         INVALID_EMAIL_OR_PASSWORD: translate(
            "pages.sign-in.errors.invalid-credentials",
         ),
      }),
      [],
   );
   const handleGoogleSignIn = useCallback(async () => {
      await betterAuthClient.signIn.social(
         {
            provider: "google",
            callbackURL: `${window.location.origin}/home`,
         },
         {
            onError: ({ error }) => {
               toast.error(
                  getErrorMessage[error.code as codes] ||
                     translate("pages.sign-in.errors.unknown"),
                  {
                     id: "sign-in-toast",
                  },
               );
            },
            onRequest: () => {
               toast.loading(translate("pages.sign-in.messages.loading"), {
                  id: "sign-in-toast",
               });
            },
         },
      );
   }, [getErrorMessage]);
   const handleSignIn = useCallback(
      async ({ email, password }: z.infer<typeof schema>) => {
         await betterAuthClient.signIn.email(
            {
               email,
               password,
            },
            {
               onError: ({ error }) => {
                  toast.error(
                     getErrorMessage[error.code as codes] ||
                        translate("pages.sign-in.errors.unknown"),
                     {
                        id: "sign-in-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading(translate("pages.sign-in.messages.loading"), {
                     id: "sign-in-toast",
                  });
               },
               onSuccess: ({ data }) => {
                  toast.success(translate("pages.sign-in.messages.success"), {
                     description: translate("pages.sign-in.messages.welcome", {
                        brand: brandConfig.name,
                        name: data.user.name,
                     }),
                     id: "sign-in-toast",
                  });
                  router.navigate({
                     to: "/home",
                  });
               },
            },
         );
      },
      [getErrorMessage, router],
   );

   const form = useAppForm({
      defaultValues: {
         email: "",
         password: "",
      },
      onSubmit: async ({ value, formApi }) => {
         await handleSignIn(value);
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
   return { form, handleSubmit, handleGoogleSignIn };
};
