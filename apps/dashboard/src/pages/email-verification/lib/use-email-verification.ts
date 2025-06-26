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
		otp: z.string().min(6, "Enter a 6-digit code").max(6),
	});

	const getErrorMessage = useMemo(
		() => ({
			default: "Unknown error",
			INVALID_OTP: "Invalid verification code",
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
						"An error occurred while verifying the email",
						{
							id: "verification-code-toast",
						},
					);
				},
				onRequest: () => {
					toast.loading("Please wait while we send the code...", {
						id: "verification-code-toast",
					});
				},
				onSuccess: () => {
					toast.success("Code sent successfully", {
						description: "Check your email to continue.",
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
							getErrorMessage[error.code as codes] || "Unknown error",
							{
								id: "email-verification-toast",
							},
						);
					},
					onRequest: () => {
						toast.loading("Validating the code, please wait...", {
							id: "email-verification-toast",
						});
					},
					onSuccess: () => {
						toast.success("Email verified successfully", {
							description: "You will be redirected to login.",
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
