import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import {
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import type { FC, FormEvent } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { z } from "zod";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type ManageContentFormProps = {
	agentId?: string;
};

function ManageContentErrorFallback() {
	return (
		<Alert variant="destructive">
			<AlertTriangle className="h-4 w-4" />
			<AlertDescription>
				{"Ocorreu um erro. Por favor, tente novamente."}
			</AlertDescription>
		</Alert>
	);
}

function ManageContentSkeleton() {
	return (
		<div className="grid gap-4 px-4">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-20 w-full" />
			<div className="flex gap-2 pt-4">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}

function ManageContentFormContent({ agentId }: ManageContentFormProps) {
	const { closeSheet } = useSheet();
	const navigate = useNavigate();
	const { activeOrganization } = useActiveOrganization();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: writersData } = useSuspenseQuery(
		trpc.agent.list.queryOptions({ limit: 100, page: 1 }),
	);

	const writers = writersData.items;

	const createMutation = useMutation(
		trpc.content.create.mutationOptions({
			onSuccess: (data) => {
				toast.success("Conteúdo criado com sucesso");
				queryClient.invalidateQueries({
					queryKey: trpc.content.listAllContent.queryKey(),
				});
				closeSheet();
				// Redirect to the content detail page
				if (data?.id) {
					navigate({
						to: "/$slug/content/$contentId",
						params: { 
							slug: activeOrganization.slug,
							contentId: data.id,
						},
					});
				}
			},
			onError: (error) => {
				toast.error(error.message || "Ocorreu um erro. Por favor, tente novamente.");
			},
		}),
	);

	const isPending = createMutation.isPending;

	const schema = z.object({
		agentId: z.string().uuid("O escritor é obrigatório"),
	});

	const form = useForm({
		defaultValues: {
			agentId: agentId ?? "",
		},
		onSubmit: async ({ value }) => {
			createMutation.mutate({
				agentId: value.agentId,
			});
		},
		validators: {
			onBlur: schema as unknown as undefined,
		},
	});

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		form.handleSubmit();
	};

	return (
		<>
			<form className="grid gap-4 px-4 overflow-y-auto" onSubmit={handleSubmit}>
				<form.Field name="agentId">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{"Escritor"}
								</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={field.handleChange}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={"Selecione um escritor"}
										/>
									</SelectTrigger>
									<SelectContent>
										{writers.map((writer) => (
											<SelectItem key={writer.id} value={writer.id}>
												{writer.personaConfig.metadata.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<p className="text-sm text-muted-foreground">
					{"A IA vai te ajudar a planejar e escrever seu conteúdo. Você poderá revisar e editar tudo depois."}
				</p>
			</form>

			<SheetFooter>
				<Button onClick={closeSheet} type="button" variant="outline">
					{"Cancelar"}
				</Button>
				<form.Subscribe>
					{(formState) => (
						<Button
							disabled={!formState.canSubmit || formState.isSubmitting || isPending}
							onClick={() => form.handleSubmit()}
							type="submit"
						>
							{isPending
								? "Criando..."
								: "Começar"}
						</Button>
					)}
				</form.Subscribe>
			</SheetFooter>
		</>
	);
}

export const ManageContentForm: FC<ManageContentFormProps> = ({ agentId }) => {
	return (
		<>
			<SheetHeader>
				<SheetTitle>
					{"Novo Conteúdo"}
				</SheetTitle>
				<SheetDescription>
					{"Selecione um escritor para começar a criar seu conteúdo com ajuda da IA."}
				</SheetDescription>
			</SheetHeader>
			<ErrorBoundary FallbackComponent={ManageContentErrorFallback}>
				<Suspense fallback={<ManageContentSkeleton />}>
					<ManageContentFormContent agentId={agentId} />
				</Suspense>
			</ErrorBoundary>
		</>
	);
};
