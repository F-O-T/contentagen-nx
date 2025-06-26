import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/better-auth";

type codes = "USER_ALREADY_EXISTS" | "default";

export const useSignUp = () => {
	const router = useRouter();
	const schema = z
		.object({
			confirmPassword: z.string(),
			email: z.string().email("Please enter a valid email"),
			name: z.string().min(2, "Please enter a valid name"),
			password: z
				.string()
				.min(8, "Please enter a password with at least 8 characters"),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "Passwords do not match",
			path: ["confirmPassword"],
		});

	const getErrorMessage = useMemo(
		() => ({
			default: "Unknown error",
			USER_ALREADY_EXISTS: "This email is already registered",
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
							getErrorMessage[error.code as codes] || "Unknown error",
							{
								id: "sign-up-toast",
							},
						);
					},
					onRequest: () => {
						toast.loading("Signing up...", {
							id: "sign-up-toast",
						});
					},
					onSuccess: ({ data }) => {
						toast.success("Sign up successful", {
							description: `Welcome to Enduro for tri ${data.user.name}`,
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
