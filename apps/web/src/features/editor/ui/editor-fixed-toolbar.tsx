import { triggerFloatingLink } from "@platejs/link/react";
import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import {
	useMarkToolbarButton,
	useMarkToolbarButtonState,
} from "@platejs/utils/react";
import {
	ArrowLeft,
	Bold,
	Italic,
	Link2,
	Loader2,
	Save,
	Underline,
} from "lucide-react";
import { useEditorRef } from "platejs/react";

interface EditorFixedToolbarProps {
	title?: string;
	status?: string;
	isSaving?: boolean;
	onSave?: () => void;
	onBack?: () => void;
}

function MarkButton({
	nodeType,
	icon,
	tooltip,
}: {
	nodeType: string;
	icon: React.ReactNode;
	tooltip: string;
}) {
	const state = useMarkToolbarButtonState({ nodeType });
	const { props } = useMarkToolbarButton(state);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						"size-8",
						state.pressed && "bg-accent text-accent-foreground",
					)}
					{...props}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
}

export function EditorFixedToolbar({
	title,
	status,
	isSaving,
	onSave,
	onBack,
}: EditorFixedToolbarProps) {
	const editor = useEditorRef();

	const handleLinkClick = () => {
		triggerFloatingLink(editor, { focused: true });
	};

	return (
		<TooltipProvider>
			<div className="flex items-center gap-2 border-b px-4 py-2 bg-background sticky top-0 z-10">
				{/* Back button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 shrink-0"
							onClick={onBack}
						>
							<ArrowLeft className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Voltar</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5" />

				{/* Title + status */}
				<div className="flex items-center gap-2 min-w-0 flex-1">
					{title && (
						<span className="truncate max-w-xs text-sm font-medium">
							{title}
						</span>
					)}
					{status && (
						<span className="text-xs text-muted-foreground shrink-0">
							{status}
						</span>
					)}
				</div>

				{/* Formatting marks + link */}
				<div className="flex items-center gap-0.5">
					<MarkButton
						nodeType="bold"
						icon={<Bold className="size-4" />}
						tooltip="Negrito Ctrl+B"
					/>
					<MarkButton
						nodeType="italic"
						icon={<Italic className="size-4" />}
						tooltip="Itálico Ctrl+I"
					/>
					<MarkButton
						nodeType="underline"
						icon={<Underline className="size-4" />}
						tooltip="Sublinhado Ctrl+U"
					/>

					{/* Link button */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={handleLinkClick}
							>
								<Link2 className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Inserir link Ctrl+K</TooltipContent>
					</Tooltip>
				</div>

				<Separator orientation="vertical" className="h-5" />

				{/* Save button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="default"
							size="sm"
							className="gap-1.5"
							onClick={onSave}
							disabled={isSaving}
						>
							{isSaving ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Save className="size-4" />
							)}
							Salvar
						</Button>
					</TooltipTrigger>
					<TooltipContent>Ctrl+S</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}
