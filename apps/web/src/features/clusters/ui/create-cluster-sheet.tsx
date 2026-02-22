import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import { useBatchGenerate } from "../hooks/use-batch-generate";

interface SatelliteEntry {
	title: string;
	description: string;
}

interface Props {
	onSuccess?: (pillarId: string) => void;
}

export function CreateClusterSheet({ onSuccess }: Props) {
	const { closeSheet } = useSheet();
	const [step, setStep] = useState<"describe" | "confirm">("describe");
	const [description, setDescription] = useState("");
	const [pillarTitle, setPillarTitle] = useState("");
	const [mode, setMode] = useState("");
	const [embedEnabled, setEmbedEnabled] = useState(false);
	const [satellites, setSatellites] = useState<SatelliteEntry[]>([]);

	const suggestMutation = useMutation(
		orpc.clusters.suggestStructure.mutationOptions({
			onSuccess: (data) => {
				setPillarTitle(data.pillarTitle);
				setMode(data.mode);
				setEmbedEnabled(data.embedEnabled);
				setSatellites(data.satellites);
				setStep("confirm");
			},
			onError: () => toast.error("Erro ao gerar sugestão. Tente novamente."),
		}),
	);

	const createMutation = useBatchGenerate();

	const handleSuggest = () => {
		if (!description.trim()) return;
		suggestMutation.mutate({ description });
	};

	const handleCreate = () => {
		createMutation.mutate(
			{
				pillarTitle,
				mode,
				embedEnabled,
				satellites: satellites.map((s) => ({ title: s.title })),
			},
			{
				onSuccess: (data) => {
					closeSheet();
					onSuccess?.(data.pillar.id);
				},
			},
		);
	};

	const removeSatellite = (index: number) => {
		setSatellites((prev) => prev.filter((_, i) => i !== index));
	};

	if (step === "describe") {
		return (
			<div className="space-y-6 p-6">
				<div>
					<h2 className="text-lg font-semibold">Novo Cluster</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Descreva seu objetivo e a IA vai sugerir a estrutura do cluster.
					</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="cluster-description">Objetivo do cluster</Label>
					<textarea
						id="cluster-description"
						className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
						placeholder="Ex: Quero documentar atualizações do produto para meus usuários"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div className="flex gap-2">
					<Button
						disabled={!description.trim() || suggestMutation.isPending}
						onClick={handleSuggest}
						className="flex-1"
					>
						{suggestMutation.isPending ? (
							<Loader2 className="size-4 mr-2 animate-spin" />
						) : (
							<Sparkles className="size-4 mr-2" />
						)}
						Sugerir estrutura
					</Button>
					<Button variant="outline" onClick={closeSheet}>
						Cancelar
					</Button>
				</div>
				<Separator />
				<p className="text-xs text-muted-foreground">
					Prefere criar manualmente?{" "}
					<button
						type="button"
						className="underline"
						onClick={() => setStep("confirm")}
					>
						Pular sugestão
					</button>
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h2 className="text-lg font-semibold">Confirmar estrutura</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Revise e edite antes de criar.
				</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor="pillar-title">Título do post pillar</Label>
				<Input
					id="pillar-title"
					value={pillarTitle}
					onChange={(e) => setPillarTitle(e.target.value)}
					placeholder="Título principal"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="cluster-mode">Tipo de cluster</Label>
				<Input
					id="cluster-mode"
					value={mode}
					onChange={(e) => setMode(e.target.value)}
					placeholder="ex: changelog, seo, series"
				/>
			</div>
			<div className="space-y-2">
				<p className="text-sm font-medium">Posts satélite ({satellites.length})</p>
				{satellites.map((s, i) => (
					<div key={`sat-${i + 1}`} className="flex items-start gap-2 p-2 border rounded-md">
						<div className="flex-1 space-y-1">
							<Input
								value={s.title}
								onChange={(e) => {
									const next = [...satellites];
									next[i] = { ...next[i], title: e.target.value };
									setSatellites(next);
								}}
								placeholder="Título do satélite"
								className="text-sm"
							/>
							<p className="text-xs text-muted-foreground px-1">{s.description}</p>
						</div>
						<button
							type="button"
							onClick={() => removeSatellite(i)}
							className="text-muted-foreground hover:text-destructive mt-1"
						>
							<X className="size-4" />
						</button>
					</div>
				))}
				<Button
					variant="outline"
					size="sm"
					onClick={() =>
						setSatellites((prev) => [...prev, { title: "", description: "" }])
					}
				>
					+ Adicionar satélite
				</Button>
			</div>
			<div className="flex gap-2">
				<Button
					disabled={!pillarTitle.trim() || createMutation.isPending}
					onClick={handleCreate}
					className="flex-1"
				>
					{createMutation.isPending && (
						<Loader2 className="size-4 mr-2 animate-spin" />
					)}
					Criar cluster
				</Button>
				<Button variant="outline" onClick={() => setStep("describe")}>
					Voltar
				</Button>
			</div>
		</div>
	);
}
