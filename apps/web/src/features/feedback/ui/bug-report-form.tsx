import { useSurveys } from "@packages/posthog/client";
import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SURVEY_IDS } from "../constants";

type BugReportFormProps = {
	onSuccess: () => void;
};

export function BugReportForm({ onSuccess }: BugReportFormProps) {
	const { captureSurveySent, captureSurveyShown } = useSurveys();
	const [description, setDescription] = useState("");
	const [severity, setSeverity] = useState("");
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		captureSurveyShown(SURVEY_IDS.BUG_REPORT);
	}, [captureSurveyShown]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!description.trim()) return;

		captureSurveySent(SURVEY_IDS.BUG_REPORT, {
			$survey_response: description,
			$survey_response_1: severity,
		});

		setSubmitted(true);
		setTimeout(onSuccess, 2000);
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<CheckCircle className="size-10 text-green-500" />
				<p className="text-sm font-medium">Obrigado pelo relato!</p>
				<p className="text-xs text-muted-foreground">
					Vamos investigar e corrigir o mais rápido possível.
				</p>
			</div>
		);
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label htmlFor="bug-description">O que aconteceu?</Label>
				<Textarea
					id="bug-description"
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Descreva o problema que você encontrou..."
					rows={4}
					value={description}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="bug-severity">Qual a gravidade?</Label>
				<Select onValueChange={setSeverity} value={severity}>
					<SelectTrigger id="bug-severity">
						<SelectValue placeholder="Selecione..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Bloqueante — não consigo usar">
							Bloqueante — não consigo usar
						</SelectItem>
						<SelectItem value="Importante — atrapalha mas consigo contornar">
							Importante — atrapalha mas consigo contornar
						</SelectItem>
						<SelectItem value="Menor — incômodo pequeno">
							Menor — incômodo pequeno
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Button
				className="w-full"
				disabled={!description.trim()}
				type="submit"
			>
				Enviar relato
			</Button>
		</form>
	);
}
