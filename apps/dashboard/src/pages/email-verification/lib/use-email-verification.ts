import { useAppForm } from "@packages/ui/components/form";
import { useRouter, useSearch } from "@tanstack/react-router";
import { type FormEvent, useCallback, useMemo } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/better-auth";

type codes = "INVALID_OTP" | "default";

export const useEmailVerification = () => {
	const email = useSearch({
		from: "/auth/email-verification",
		select: (s) => s.email,
	});
	const schema = z.object({
		otp: z.string().min(6, "Insira um código de 6 dígitos").max(6),
	});

	const getErrorMessage = useMemo(
		() => ({
			default: "Erro desconhecido",
			INVALID_OTP: "Código de verificação inválido",
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
						"Ocorreu um erro ao verificar o email",
						{
							id: "verification-code-toast",
						},
					);
				},
				onRequest: () => {
					toast.loading("Aguarde enquanto enviamos o código...", {
						id: "verification-code-toast",
					});
				},
				onSuccess: () => {
					toast.success("Código enviado com sucesso", {
						description: "Verifique seu email para continuar.",
						id: "verification-code-toast",
					});
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
							getErrorMessage[error.code as codes] || "Erro desconhecido",
							{
								id: "email-verification-toast",
							},
						);
					},
					onRequest: () => {
						toast.loading("Validando o código, por favor aguarde...", {
							id: "email-verification-toast",
						});
					},
					onSuccess: () => {
						toast.success("Email verificado com sucesso", {
							description: "Você será redirecionado para o login.",
							id: "email-verification-toast",
						});
						router.navigate({
							to: "/agents",
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
