import { Button } from "@packages/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { ArrowRight } from "lucide-react";
import { useEmailVerification } from "../lib/use-email-verification";

export function EmailVerificationPage() {
	const { handleResendEmail, handleSubmit, form } = useEmailVerification();

	return (
		<Card className="border shadow-xl transition-all duration-300 border-muted/50 bg-card backdrop-blur-xl animate-in fade-in-50 slide-in-from-bottom-6">
			<CardHeader>
				<CardTitle className="text-3xl font-bold tracking-tight text-center">
					Verificação de E-mail
				</CardTitle>
				<CardDescription className="text-base text-center text-muted-foreground/60">
					Insira o código de verificação enviado para seu e-mail.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					onSubmit={(e) => {
						handleSubmit(e);
					}}
				>
					<form.AppField name="otp">
						{(field) => (
							<field.FieldContainer className="flex flex-col items-center">
								<field.FieldLabel>Código de Verificação</field.FieldLabel>
								<InputOTP
									autoComplete="one-time-code"
									className="gap-2 "
									maxLength={6}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									value={field.state.value}
								>
									<InputOTPGroup>
										<InputOTPSlot index={0} />
										<InputOTPSlot index={1} />
									</InputOTPGroup>
									<InputOTPSeparator />
									<InputOTPGroup>
										<InputOTPSlot index={2} />
										<InputOTPSlot index={3} />
									</InputOTPGroup>
									<InputOTPSeparator />
									<InputOTPGroup>
										<InputOTPSlot index={4} />
										<InputOTPSlot index={5} />
									</InputOTPGroup>
								</InputOTP>
								<field.FieldMessage />
							</field.FieldContainer>
						)}
					</form.AppField>
					<form.Subscribe>
						{(formState) => (
							<Button
								className="w-full shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
								disabled={!formState.canSubmit || formState.isSubmitting}
								type="submit"
								variant="default"
							>
								Enviar código
								<ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
			<CardFooter>
				<Button
					className="w-full text-foreground  transition-all cursor-pointer duration-300 group   flex gap-2 items-center justify-center"
					onClick={handleResendEmail}
					variant="link"
				>
					Reenviar código de verificação
				</Button>
			</CardFooter>
		</Card>
	);
}
