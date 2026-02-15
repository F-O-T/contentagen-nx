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
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { type FormEvent, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { orpc } from "@/integrations/orpc/client";

const profileSchema = z.object({
	userName: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
	workspaceName: z
		.string()
		.min(2, "O nome do workspace deve ter no mínimo 2 caracteres."),
});

interface OrganizationProfileStepProps {
	onNext: (newSlug: string) => void;
}

export function OrganizationProfileStep({
	onNext,
}: OrganizationProfileStepProps) {
	const { data: session } = useSuspenseQuery(
		orpc.session.getSession.queryOptions({}),
	);
	const { data: org } = useSuspenseQuery(
		orpc.organization.getActiveOrganization.queryOptions({}),
	);

	const mutation = useMutation(
		orpc.onboarding.completeOrgSetup.mutationOptions({
			onSuccess: (data) => {
				toast.success("Workspace configurado com sucesso!");
				onNext(data.slug);
			},
			onError: (error) => {
				toast.error(error.message ?? "Erro ao configurar workspace.");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			userName: session?.user?.name ?? "",
			workspaceName: org?.name ?? "",
		},
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync(value);
		},
		validators: {
			onBlur: profileSchema,
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
					Configure seu workspace
				</h2>
				<p className="text-sm text-muted-foreground">
					O workspace é a sua organização. Você pode ter vários projetos dentro
					dele.
				</p>
			</div>

			<form className="space-y-4" onSubmit={handleSubmit}>
				<FieldGroup>
					<form.Field name="userName">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Seu Nome</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Ex: João Silva"
										aria-invalid={isInvalid}
										autoComplete="name"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="workspaceName">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Nome do Workspace
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Ex: Minha Empresa"
										aria-invalid={isInvalid}
										autoComplete="organization"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>

				<form.Subscribe>
					{(formState) => (
						<Button
							className="h-11 w-full"
							disabled={
								!formState.canSubmit ||
								formState.isSubmitting ||
								mutation.isPending
							}
							type="submit"
						>
							{mutation.isPending ? <Spinner className="size-4" /> : "Continuar"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
