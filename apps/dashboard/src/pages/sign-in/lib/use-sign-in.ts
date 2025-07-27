import brandConfig from "@packages/brand/index.json";
import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { betterAuthClient } from "@/integrations/clients";

type codes = "INVALID_EMAIL_OR_PASSWORD" | "default";
export const useSignIn = () => {
   const schema = z.object({
      email: z
         .string({
            required_error: "Email is required",
            invalid_type_error: "Email must be a string",
         })
         .email("Please enter a valid email address"),
      password: z
         .string({
            required_error: "Password is required",
            invalid_type_error: "Password must be a string",
         })
         .min(8, "Password must be at least 8 characters"),
   });
   const router = useRouter();
   const getErrorMessage = useMemo(
      () => ({
         default: "Unknown error",
         INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
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
