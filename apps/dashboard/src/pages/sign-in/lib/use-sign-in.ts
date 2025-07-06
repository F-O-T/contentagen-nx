import brandConfig from "@packages/brand/index.json";
import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/better-auth";

type codes = "INVALID_EMAIL_OR_PASSWORD" | "default";
export const useSignIn = () => {
   const schema = z.object({
      email: z.string().email("Enter a valid email"),
      password: z
         .string()
         .min(8, "Enter a password with at least 8 characters"),
   });
   const router = useRouter();
   const getErrorMessage = useMemo(
      () => ({
         default: "Unknown error",
         INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
      }),
      [],
   );
   //TODO: setar a url certa em prod
   const handleGoogleSignIn = useCallback(async () => {
      await betterAuthClient.signIn.social(
         {
            provider: "google",
            callbackURL: `http://localhost:3000/agents`,
         },
         {
            onError: ({ error }) => {
               toast.error(
                  getErrorMessage[error.code as codes] || "Unknown error",
                  {
                     id: "sign-in-toast",
                  },
               );
            },
            onRequest: () => {
               toast.loading("Signing in...", {
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
                     getErrorMessage[error.code as codes] || "Unknown error",
                     {
                        id: "sign-in-toast",
                     },
                  );
               },
               onRequest: () => {
                  toast.loading("Signing in...", {
                     id: "sign-in-toast",
                  });
               },
               onSuccess: ({ data }) => {
                  toast.success("Sign in successful", {
                     description: `Welcome to ${brandConfig.name} ${data.user.name}`,
                     id: "sign-in-toast",
                  });
                  router.navigate({
                     to: "/agents",
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
