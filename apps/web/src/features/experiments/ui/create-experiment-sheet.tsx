import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { orpc } from "@/integrations/orpc/client";

const createExperimentSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	hypothesis: z.string().optional(),
	targetType: z.enum(["content", "form", "cluster"]),
	goal: z.enum(["conversion", "ctr", "time_on_page", "form_submit"]),
});

interface CreateExperimentSheetProps {
	onSuccess: () => void;
}

export function CreateExperimentSheet({
	onSuccess,
}: CreateExperimentSheetProps) {
	const createMutation = useMutation(
		orpc.experiments.create.mutationOptions({
			onSuccess: () => {
				toast.success("Experimento criado!");
				onSuccess();
			},
			onError: (error) => {
				toast.error(error.message ?? "Erro ao criar experimento");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			hypothesis: "",
			targetType: "content" as "content" | "form" | "cluster",
			goal: "conversion" as
				| "conversion"
				| "ctr"
				| "time_on_page"
				| "form_submit",
		},
		validators: {
			onBlur: createExperimentSchema,
		},
		onSubmit: async ({ value }) => {
			await createMutation.mutateAsync({
				name: value.name,
				hypothesis: value.hypothesis || undefined,
				targetType: value.targetType,
				goal: value.goal,
			});
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="flex flex-col gap-4 p-4"
		>
			<form.Field name="name">
				{(field) => (
					<div className="flex flex-col gap-2">
						<Label htmlFor="exp-name">Nome do experimento</Label>
						<Input
							id="exp-name"
							placeholder="Ex: Título A vs Título B"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{String(field.state.meta.errors[0])}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field name="hypothesis">
				{(field) => (
					<div className="flex flex-col gap-2">
						<Label htmlFor="exp-hypothesis">Hipótese (opcional)</Label>
						<Textarea
							id="exp-hypothesis"
							placeholder="O que você espera aprender?"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							rows={3}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="targetType">
				{(field) => (
					<div className="flex flex-col gap-2">
						<Label htmlFor="exp-target">Tipo de alvo</Label>
						<Select
							value={field.state.value}
							onValueChange={(v) =>
								field.handleChange(v as "content" | "form" | "cluster")
							}
						>
							<SelectTrigger id="exp-target">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="content">Conteúdo</SelectItem>
								<SelectItem value="form">Formulário</SelectItem>
								<SelectItem value="cluster">Cluster</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</form.Field>

			<form.Field name="goal">
				{(field) => (
					<div className="flex flex-col gap-2">
						<Label htmlFor="exp-goal">Métrica principal</Label>
						<Select
							value={field.state.value}
							onValueChange={(v) =>
								field.handleChange(
									v as "conversion" | "ctr" | "time_on_page" | "form_submit",
								)
							}
						>
							<SelectTrigger id="exp-goal">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="conversion">Conversão</SelectItem>
								<SelectItem value="ctr">CTR</SelectItem>
								<SelectItem value="time_on_page">Tempo na página</SelectItem>
								<SelectItem value="form_submit">Envio de formulário</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</form.Field>

			<form.Subscribe>
				{(formState) => (
					<Button
						type="submit"
						disabled={!formState.canSubmit || createMutation.isPending}
					>
						{createMutation.isPending && (
							<Loader2 className="mr-2 size-4 animate-spin" />
						)}
						Criar experimento
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
