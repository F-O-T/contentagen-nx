import { useSurveys } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { CheckCircle, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { SURVEY_IDS } from "../constants";

type FeatureRequestFormProps = {
	onSuccess: () => void;
};

export function FeatureRequestForm({ onSuccess }: FeatureRequestFormProps) {
	const { captureSurveySent, captureSurveyShown } = useSurveys();
	const [feature, setFeature] = useState("");
	const [problem, setProblem] = useState("");
	const [priority, setPriority] = useState(0);
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		captureSurveyShown(SURVEY_IDS.FEATURE_REQUEST);
	}, [captureSurveyShown]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!feature.trim()) return;

		captureSurveySent(SURVEY_IDS.FEATURE_REQUEST, {
			$survey_response: feature,
			$survey_response_1: problem,
			$survey_response_2: priority,
		});

		setSubmitted(true);
		setTimeout(onSuccess, 2000);
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<CheckCircle className="size-10 text-green-500" />
				<p className="text-sm font-medium">Obrigado pela sugestão!</p>
				<p className="text-xs text-muted-foreground">
					Sua ideia foi registrada e será avaliada pela equipe.
				</p>
			</div>
		);
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label htmlFor="feature-description">
					Que feature você gostaria?
				</Label>
				<Textarea
					id="feature-description"
					onChange={(e) => setFeature(e.target.value)}
					placeholder="Descreva a funcionalidade que você precisa..."
					rows={3}
					value={feature}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="feature-problem">
					Qual problema ela resolveria?{" "}
					<span className="text-muted-foreground">(opcional)</span>
				</Label>
				<Textarea
					id="feature-problem"
					onChange={(e) => setProblem(e.target.value)}
					placeholder="Nos ajude a entender o contexto..."
					rows={2}
					value={problem}
				/>
			</div>

			<div className="space-y-2">
				<Label>Qual a prioridade para você?</Label>
				<div className="flex items-center gap-1">
					{[1, 2, 3, 4, 5].map((value) => (
						<button
							className="rounded-md p-1.5 transition-colors hover:bg-muted"
							key={`priority-${value}`}
							onClick={() => setPriority(value)}
							type="button"
						>
							<Star
								className={`size-6 ${
									value <= priority
										? "fill-amber-400 text-amber-400"
										: "text-muted-foreground"
								}`}
							/>
						</button>
					))}
				</div>
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>Seria legal</span>
					<span>Preciso muito</span>
				</div>
			</div>

			<Button
				className="w-full"
				disabled={!feature.trim()}
				type="submit"
			>
				Enviar sugestão
			</Button>
		</form>
	);
}
