import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@packages/ui/components/popover";
import {
	Bug,
	ExternalLink,
	Lightbulb,
	MessageSquarePlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useApiErrorTracker } from "../hooks/use-api-error-tracker";
import { BugReportForm } from "./bug-report-form";
import { FeatureRequestForm } from "./feature-request-form";

const DOCS_URL = "https://docs.contentta.com";

export function FeedbackFab() {
	const [open, setOpen] = useState(false);
	const { openSheet, closeSheet } = useSheet();
	const { shouldShowBugReport, dismiss } = useApiErrorTracker();

	const openBugReport = () => {
		setOpen(false);
		openSheet({
			children: (
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-semibold">Reportar Bug</h3>
						<p className="text-sm text-muted-foreground">
							Nos ajude a melhorar reportando problemas.
						</p>
					</div>
					<BugReportForm
						onSuccess={() => {
							dismiss();
							closeSheet();
						}}
					/>
				</div>
			),
		});
	};

	const openFeatureRequest = () => {
		setOpen(false);
		openSheet({
			children: (
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-semibold">Sugerir Feature</h3>
						<p className="text-sm text-muted-foreground">
							Compartilhe suas ideias para novas funcionalidades.
						</p>
					</div>
					<FeatureRequestForm onSuccess={closeSheet} />
				</div>
			),
		});
	};

	// Auto-trigger bug report on too many API errors
	useEffect(() => {
		if (shouldShowBugReport) {
			openBugReport();
		}
	}, [shouldShowBugReport]);

	return (
		<div className="fixed bottom-6 right-6 z-50">
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<button
						className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
						type="button"
					>
						<MessageSquarePlus className="size-5" />
					</button>
				</PopoverTrigger>
				<PopoverContent
					align="end"
					className="w-56 p-2"
					side="top"
					sideOffset={8}
				>
					<div className="flex flex-col gap-1">
						<button
							className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted text-left"
							onClick={openBugReport}
							type="button"
						>
							<Bug className="size-4 text-red-500" />
							<span>Reportar Bug</span>
						</button>
						<button
							className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted text-left"
							onClick={openFeatureRequest}
							type="button"
						>
							<Lightbulb className="size-4 text-amber-500" />
							<span>Sugerir Feature</span>
						</button>
						<a
							className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
							href={DOCS_URL}
							rel="noopener noreferrer"
							target="_blank"
						>
							<ExternalLink className="size-4 text-blue-500" />
							<span>Documentação</span>
						</a>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
