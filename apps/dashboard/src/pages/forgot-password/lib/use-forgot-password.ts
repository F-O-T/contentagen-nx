import { useAppForm } from "@packages/ui/components/form";
import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { betterAuthClient } from "@/integrations/better-auth";

export function useForgotPassword() {
	const router = useRouter();
	const [sendingOtp, setSendingOtp] = useState(false);
	const schema = z
		.object({
			email: z.string().email("Insira um email válido"),
			otp: z.string().min(6, "O código deve ter 6 dígitos"),
			password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "As senhas não coincidem",
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
					onSuccess: () => {
						toast.success("Senha redefinida com sucesso!", {
							id: "forgot-password-toast",
						});
						router.navigate({
							to: "/auth/sign-in",
						});
					},
					onError: () => {
						toast.error("Erro ao redefinir senha", {
							id: "forgot-password-toast",
						});
					},
					onRequest: () => {
						toast.loading("Redefinindo senha...", {
							id: "forgot-password-toast",
						});
					},
				},
			);
		},
		[router],
	);
	const form = useAppForm({
		defaultValues: {
			email: "",
			otp: "",
			password: "",
			confirmPassword: "",
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
				onSuccess: () => {
					setSendingOtp(false);
					toast.success("Código enviado para seu email.", {
						id: "send-otp-toast",
					});
				},
				onError: () => {
					setSendingOtp(false);
					toast.error("Erro ao enviar código de recuperação", {
						id: "send-otp-toast",
					});
				},
				onRequest: () => {
					setSendingOtp(true);
					toast.loading("Enviando código de recuperação...", {
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
		sendOtp,
		handleSubmit,
		sendingOtp,
	};
}
