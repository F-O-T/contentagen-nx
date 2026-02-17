import { useSurveys } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SURVEY_IDS } from "../constants";

const EMOJI_SCALE = ["😡", "😕", "😐", "🙂", "🤩"];

type FeatureFeedbackFormProps = {
	featureName: string;
	onSuccess: () => void;
};

export function FeatureFeedbackForm({
	featureName,
	onSuccess,
}: FeatureFeedbackFormProps) {
	const { captureSurveySent, captureSurveyShown } = useSurveys();
	const [rating, setRating] = useState(0);
	const [improvement, setImprovement] = useState("");
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		captureSurveyShown(SURVEY_IDS.FEATURE_FEEDBACK);
	}, [captureSurveyShown]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (rating === 0) return;

		captureSurveySent(SURVEY_IDS.FEATURE_FEEDBACK, {
			$survey_response: rating,
			$survey_response_1: improvement,
			feature_name: featureName,
		});

		setSubmitted(true);
		setTimeout(onSuccess, 2000);
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-3 py-6 text-center">
				<CheckCircle className="size-8 text-green-500" />
				<p className="text-sm font-medium">Obrigado pelo feedback!</p>
				<p className="text-xs text-muted-foreground">
					Seu retorno nos ajuda a melhorar essa funcionalidade.
				</p>
			</div>
		);
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label>Como está sendo a experiência?</Label>
				<div className="flex items-center justify-between gap-1">
					{EMOJI_SCALE.map((emoji, index) => (
						<button
							className={`rounded-lg p-2 text-2xl transition-all ${
								rating === index + 1
									? "bg-muted ring-2 ring-primary scale-110"
									: "hover:bg-muted/50"
							}`}
							key={`emoji-${index + 1}`}
							onClick={() => setRating(index + 1)}
							type="button"
						>
							{emoji}
						</button>
					))}
				</div>
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>Péssima</span>
					<span>Excelente</span>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="feature-improvement">
					O que poderia melhorar?{" "}
					<span className="text-muted-foreground">(opcional)</span>
				</Label>
				<Textarea
					id="feature-improvement"
					onChange={(e) => setImprovement(e.target.value)}
					placeholder="Conte o que falta ou o que te incomoda..."
					rows={3}
					value={improvement}
				/>
			</div>

			<Button
				className="w-full"
				disabled={rating === 0}
				type="submit"
			>
				Enviar feedback
			</Button>
		</form>
	);
}
