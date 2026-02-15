import { Button } from "@packages/ui/components/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Spinner } from "@packages/ui/components/spinner";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { orpc } from "@/integrations/orpc/client";
import { useOnboardingStatus } from "../hooks/use-onboarding-status";

const projectSchema = z.object({
	projectName: z
		.string()
		.min(2, "O nome do projeto deve ter no mínimo 2 caracteres."),
});

interface ProjectSetupStepProps {
	onNext: () => void;
}

export function ProjectSetupStep({ onNext }: ProjectSetupStepProps) {
	const { data: status } = useOnboardingStatus();

	const mutation = useMutation(
		orpc.onboarding.completeProjectSetup.mutationOptions({
			onSuccess: () => {
				toast.success("Projeto configurado com sucesso!");
				onNext();
			},
			onError: (error) => {
				toast.error(error.message ?? "Erro ao configurar projeto.");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			projectName: status.project.name ?? "",
		},
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync(value);
		},
		validators: {
			onBlur: projectSchema,
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

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<h2 className="font-serif text-2xl font-semibold">
					Configure seu projeto
				</h2>
				<p className="text-sm text-muted-foreground">
					Dê um nome para o seu projeto. Você pode ter vários projetos no mesmo
					workspace.
				</p>
			</div>

			<form className="space-y-4" onSubmit={handleSubmit}>
				<FieldGroup>
					<form.Field name="projectName">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Nome do Projeto</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Ex: Blog da Empresa, Site Institucional"
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</FieldGroup>

				<Button
					className="h-11 w-full"
					disabled={mutation.isPending}
					type="submit"
				>
					{mutation.isPending ? <Spinner className="size-4" /> : "Continuar"}
				</Button>
			</form>
		</div>
	);
}
