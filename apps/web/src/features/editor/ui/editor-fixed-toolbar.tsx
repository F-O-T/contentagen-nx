"use client";

import { Button } from "@packages/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Separator } from "@packages/ui/components/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { triggerFloatingLink } from "@platejs/link/react";
import {
	useMarkToolbarButton,
	useMarkToolbarButtonState,
} from "@platejs/utils/react";
import { useStore } from "@tanstack/react-store";
import {
	Archive,
	Bold,
	Check,
	ChevronDown,
	FileText,
	Globe,
	Info,
	Italic,
	Link2,
	Loader2,
	MessageSquare,
	Save,
	Underline,
} from "lucide-react";
import { useEditorRef } from "platejs/react";
import { contextPanelStore } from "@/features/context-panel/context-panel-store";
import {
	closeContextPanel,
	openContextPanel,
	setActiveTab,
} from "@/features/context-panel/use-context-panel";

type ContentStatus = "draft" | "published" | "archived";

interface EditorFixedToolbarProps {
	status?: ContentStatus;
	isSaving?: boolean;
	onSave?: () => void;
	onStatusChange?: (status: ContentStatus) => void;
}

const STATUS_CONFIG: Record<
	ContentStatus,
	{ label: string; text: string; Icon: React.ElementType }
> = {
	draft: {
		label: "Rascunho",
		text: "text-amber-600 dark:text-amber-400",
		Icon: FileText,
	},
	published: {
		label: "Publicado",
		text: "text-emerald-600 dark:text-emerald-400",
		Icon: Globe,
	},
	archived: {
		label: "Arquivado",
		text: "text-muted-foreground",
		Icon: Archive,
	},
};

// Static tabs always present in the context panel
const STATIC_TABS = [
	{ id: "info", icon: Info, label: "Informações" },
	{ id: "chat", icon: MessageSquare, label: "Chat IA" },
];

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
					className={cn(
						"size-8 rounded",
						state.pressed && "bg-accent text-accent-foreground",
					)}
					size="icon"
					type="button"
					variant="ghost"
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
	status = "draft",
	isSaving,
	onSave,
	onStatusChange,
}: EditorFixedToolbarProps) {
	const editor = useEditorRef();
	const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

	const { isOpen, activeTabId, dynamicTabs } = useStore(contextPanelStore);

	const handleLinkClick = () => {
		triggerFloatingLink(editor, { focused: true });
	};

	const handleTabClick = (tabId: string) => {
		if (isOpen && activeTabId === tabId) {
			closeContextPanel();
		} else {
			setActiveTab(tabId);
			openContextPanel();
		}
	};

	const allTabs = [
		...STATIC_TABS,
		...dynamicTabs
			.slice()
			.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
			.map((t) => ({ id: t.id, icon: t.icon, label: t.label })),
	];

	return (
		<TooltipProvider>
			<div className="flex h-12 items-center gap-1.5 border-b px-3 bg-background sticky top-0 z-10">
				{/* Formatting marks */}
				<div className="flex items-center gap-0.5">
					<MarkButton
						icon={<Bold className="size-4" />}
						nodeType="bold"
						tooltip="Negrito ⌘B"
					/>
					<MarkButton
						icon={<Italic className="size-4" />}
						nodeType="italic"
						tooltip="Itálico ⌘I"
					/>
					<MarkButton
						icon={<Underline className="size-4" />}
						nodeType="underline"
						tooltip="Sublinhado ⌘U"
					/>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="size-8 rounded"
								onClick={handleLinkClick}
								size="icon"
								type="button"
								variant="ghost"
							>
								<Link2 className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Link ⌘K</TooltipContent>
					</Tooltip>
				</div>

				{/* Spacer */}
				<div className="flex-1" />

				{/* Status */}
				{onStatusChange && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="h-8 gap-2 rounded px-3 text-sm font-medium"
								type="button"
								variant="ghost"
							>
								<cfg.Icon className={cn("size-3.5 shrink-0", cfg.text)} />
								<span className={cn(cfg.text)}>{cfg.label}</span>
								<ChevronDown className="size-3.5 text-muted-foreground" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							{(["draft", "published", "archived"] as ContentStatus[]).map(
								(s) => {
									const item = STATUS_CONFIG[s];
									return (
										<DropdownMenuItem
											className="gap-2.5 py-2 text-sm"
											key={s}
											onClick={() => onStatusChange(s)}
										>
											<item.Icon
												className={cn("size-4 shrink-0", item.text)}
											/>
											<span className={cn("flex-1", item.text)}>
												{item.label}
											</span>
											{status === s && (
												<Check className="size-3.5 text-muted-foreground" />
											)}
										</DropdownMenuItem>
									);
								},
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}

				<Separator className="mx-0.5 h-4" orientation="vertical" />

				{/* Save */}
				<Button
					className="h-8 gap-2 rounded px-4 text-sm"
					disabled={isSaving}
					onClick={onSave}
					size="sm"
					type="button"
					variant="default"
				>
					{isSaving ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Save className="size-4" />
					)}
					Salvar
				</Button>

				<Separator className="mx-0.5 h-4" orientation="vertical" />

				{/* Context panel tab buttons */}
				<div className="flex items-center gap-0.5">
					{allTabs.map((tab) => {
						const isActive = isOpen && activeTabId === tab.id;
						return (
							<Tooltip key={tab.id}>
								<TooltipTrigger asChild>
									<Button
										className={cn(
											"size-8 rounded",
											isActive && "bg-accent text-accent-foreground",
										)}
										onClick={() => handleTabClick(tab.id)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<tab.icon className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">{tab.label}</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</div>
		</TooltipProvider>
	);
}
