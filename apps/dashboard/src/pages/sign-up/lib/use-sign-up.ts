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
			name: z.string().min(2, "Insira um nome válido"),
			email: z.string().email("Insira um email válido"),
			password: z.string().min(8, "Insira uma senha com no mínimo 8 caracteres"),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "As senhas não coincidem",
			path: ["confirmPassword"],
		});

	const getErrorMessage = useMemo(
		() => ({
			USER_ALREADY_EXISTS: "Este email já está cadastrado",
			default: "Erro desconhecido",
		}),
		[],
	);

	const handleSignUp = useCallback(
		async ({ name, email, password }: z.infer<typeof schema>) => {
			await betterAuthClient.signUp.email(
				{
					name,
					email,
					password,
				},
				{
					onSuccess: ({ data }) => {
						toast.success("Cadastro realizado com sucesso", {
							description: `Bem vindo ao Enduro for tri ${data.user.name}`,
							id: "sign-up-toast",
						});
						router.navigate({
							to: "/auth/email-verification",
							search: { email: data.user.email },
						});
					},
					onError: ({ error }) => {
						toast.error(getErrorMessage[error.code as codes] || "Erro desconhecido", {
							id: "sign-up-toast",
						});
					},
					onRequest: () => {
						toast.loading("Realizando cadastro...", {
							id: "sign-up-toast",
						});
					},
				},
			);
		},
		[getErrorMessage, router],
	);

	const form = useAppForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
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

	return { handleSubmit, form };
};
