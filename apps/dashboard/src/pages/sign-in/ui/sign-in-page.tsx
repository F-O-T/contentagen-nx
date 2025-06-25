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
import { PasswordInput } from "@packages/ui/components/password-input";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useSignIn } from "../lib/use-sign-in";
export function SignInPage() {
	const { handleSubmit, form } = useSignIn();
	return (
		<Card className="border shadow-xl transition-all duration-300 border-muted/50 bg-card backdrop-blur-xl animate-in fade-in-50 slide-in-from-bottom-6">
			<CardHeader>
				<CardTitle className="text-3xl font-bold tracking-tight text-center ">
					Login
				</CardTitle>
				<CardDescription className="text-base text-center text-muted-foreground/60">
					Insira seus dados para acessar sua conta.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="space-y-4 " onSubmit={(e) => handleSubmit(e)}>
					<form.AppField name="email">
						{(field) => (
							<field.FieldContainer>
								<field.FieldLabel>E-mail</field.FieldLabel>
								<Input
									autoComplete="email"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter your email"
									type="email"
									value={field.state.value}
								/>
								<field.FieldMessage />
							</field.FieldContainer>
						)}
					</form.AppField>
					<form.AppField name="password">
						{(field) => (
							<field.FieldContainer>
								<field.FieldLabel>Senha</field.FieldLabel>
								<PasswordInput
									autoComplete="current-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter your password"
									value={field.state.value}
								/>
								<field.FieldMessage />
							</field.FieldContainer>
						)}
					</form.AppField>
					<form.Subscribe>
						{(formState) => (
							<Button
								className=" w-full shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
								disabled={!formState.canSubmit || formState.isSubmitting}
								type="submit"
								variant="default"
							>
								Entrar
								<ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
			<CardFooter className="space-y-4 flex flex-col justify-center items-center">
				<Link
					className="text-sm block underline text-muted-foreground text-center"
					to="/auth/forgot-password"
				>
					Esqueceu sua senha
				</Link>
				<p className="text-sm text-center">
					Não tem uma conta?
					<Link
						className="ml-1 underline text-muted-foreground"
						to="/auth/sign-up"
					>
						Criar conta
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
