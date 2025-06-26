import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/better-auth";
import brandConfig from "@packages/brand/index.json";
type codes = "INVALID_EMAIL_OR_PASSWORD" | "default";
export const useSignIn = () => {
	const schema = z.object({
		email: z.string().email("Insira um email válido"),
		password: z.string().min(8, "Insira uma senha com no mínimo 8 caracteres"),
	});
	const router = useRouter();
	const getErrorMessage = useMemo(
		() => ({
			default: "Erro desconhecido",
			INVALID_EMAIL_OR_PASSWORD: "Email ou senha inválidos",
		}),
		[],
	);
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
							getErrorMessage[error.code as codes] || "Erro desconhecido",
							{
								id: "sign-in-toast",
							},
						);
					},
					onRequest: () => {
						toast.loading("Realizando Login...", {
							id: "sign-in-toast",
						});
					},
					onSuccess: ({ data }) => {
						toast.success("Login realizado com sucesso", {
							description: `Bem vindo ao ${brandConfig.name} ${data.user.name}`,
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
	return { form, handleSubmit };
};
