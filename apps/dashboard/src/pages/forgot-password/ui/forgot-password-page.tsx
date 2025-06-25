import { Button } from "@packages/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { Link } from "@tanstack/react-router";
import { useForgotPassword } from "../lib/use-forgot-password";

const steps = [
	{ id: "enter-email", title: "Digite seu email" },
	{ id: "enter-otp-password", title: "Código e nova senha" },
] as const;

const { Stepper, useStepper } = defineStepper(...steps);

export function ForgotPasswordPage() {
	const { next, prev, current, isFirst, isLast, when } = useStepper();
	const { form, sendOtp, handleSubmit, sendingOtp } = useForgotPassword();

	return (
		<Stepper.Provider>
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl font-bold tracking-tight text-center">
						Esqueci minha senha
					</CardTitle>
					<CardDescription className="text-base text-center text-muted-foreground/60">
						{current.id === "enter-email"
							? "Digite seu email para receber o código de recuperação."
							: "Digite o código recebido e sua nova senha."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Stepper.Navigation>
						{steps.map((step) => (
							<Stepper.Step key={step.id} of={step.id} />
						))}
					</Stepper.Navigation>
					<form className="space-y-4" onSubmit={handleSubmit}>
						{when("enter-email", () => (
							<form.AppField name="email">
								{(field) => (
									<field.FieldContainer>
										<field.FieldLabel>Email</field.FieldLabel>
										<Input
											value={field.state.value}
											id={field.name}
											name={field.name}
											type="email"
											placeholder="exemplo@email.com"
											autoComplete="email"
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										<field.FieldMessage />
									</field.FieldContainer>
								)}
							</form.AppField>
						))}
						{when("enter-otp-password", () => (
							<>
								<form.AppField name="otp">
									{(field) => (
										<field.FieldContainer className="flex flex-col items-center">
											<field.FieldLabel>Código</field.FieldLabel>
											<InputOTP
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={field.handleChange}
												maxLength={6}
												autoComplete="one-time-code"
												className="gap-2 "
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
								<form.AppField name="password">
									{(field) => (
										<field.FieldContainer>
											<field.FieldLabel>Nova senha</field.FieldLabel>
											<PasswordInput
												value={field.state.value}
												id={field.name}
												name={field.name}
												placeholder="Digite sua nova senha"
												autoComplete="new-password"
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											<field.FieldMessage />
										</field.FieldContainer>
									)}
								</form.AppField>
								<form.AppField name="confirmPassword">
									{(field) => (
										<field.FieldContainer>
											<field.FieldLabel>Confirme a nova senha</field.FieldLabel>
											<PasswordInput
												value={field.state.value}
												id={field.name}
												name={field.name}
												placeholder="Confirme sua nova senha"
												autoComplete="new-password"
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											<field.FieldMessage />
										</field.FieldContainer>
									)}
								</form.AppField>
							</>
						))}
						<Stepper.Controls className="flex w-full justify-between">
							<Button
								variant="outline"
								onClick={prev}
								disabled={isFirst}
								type="button"
							>
								Anterior
							</Button>
							{isLast ? (
								<form.Subscribe>
									{(formState) => (
										<Button
											disabled={!formState.canSubmit || formState.isSubmitting}
											variant="default"
											className="shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
											type="submit"
										>
											Redefinir senha
										</Button>
									)}
								</form.Subscribe>
							) : (
								<form.Subscribe
									selector={(state) => ({
										emailValue: state.values.email,
										fieldMeta: state.fieldMeta,
									})}
								>
									{({ emailValue, fieldMeta }) => {
										const emailErrors = fieldMeta?.email?.errors;
										const isEmailValid =
											emailValue?.trim() !== "" &&
											(!emailErrors || emailErrors.length === 0);
										return (
											<Button
												onClick={async () => {
													await sendOtp(emailValue);
													next();
												}}
												type="button"
												disabled={!isEmailValid || sendingOtp}
											>
												Próximo
											</Button>
										);
									}}
								</form.Subscribe>
							)}
						</Stepper.Controls>
					</form>
				</CardContent>
				<CardFooter className="flex items-center justify-center">
					<p className="text-sm text-center">
						Lembrou sua senha?
						<Link
							to="/auth/sign-in"
							className="ml-1 underline text-muted-foreground"
						>
							Entrar
						</Link>
					</p>
				</CardFooter>
			</Card>
		</Stepper.Provider>
	);
}
