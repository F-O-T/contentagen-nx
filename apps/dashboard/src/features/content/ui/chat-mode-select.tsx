import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { ListChecks, Pencil } from "lucide-react";
import {
	type ChatMode,
	setChatMode,
	useChatState,
} from "../context/chat-context";

const modes = [
	{
		value: "plan" as const,
		label: "Plan",
		icon: ListChecks,
		description: "Research & create plans",
	},
	{
		value: "writer" as const,
		label: "Writer",
		icon: Pencil,
		description: "Direct editing mode",
	},
] as const;

const defaultMode = modes[0];

export function ChatModeSelect() {
	const { mode, phase, executionState } = useChatState();
	const currentMode = modes.find((m) => m.value === mode) ?? defaultMode;
	const CurrentIcon = currentMode.icon;

	// Disable during streaming or execution
	const isDisabled = phase === "streaming" || executionState.isExecuting;

	const handleValueChange = (value: string) => {
		if (!value || isDisabled) return;
		setChatMode(value as ChatMode);
	};

	const selectContent = (
		<Select
			value={mode}
			onValueChange={handleValueChange}
			disabled={isDisabled}
		>
			<SelectTrigger 
				size="sm" 
				className="h-7 gap-1.5 text-xs"
			>
				<SelectValue>
					<CurrentIcon className="size-3.5" />
					{currentMode.label}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{modes.map(({ value, label, icon: Icon, description }) => (
					<SelectItem key={value} value={value} className="flex-col items-start">
						<div className="flex items-center gap-1.5">
							<Icon className="size-3.5" />
							<span>{label}</span>
						</div>
						<span className="text-[10px] text-muted-foreground">
							{description}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	// Wrap in tooltip when disabled to explain why
	if (isDisabled) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<div>{selectContent}</div>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<p>
						{executionState.isExecuting 
							? "Cannot switch modes during plan execution" 
							: "Cannot switch modes while agent is responding"}
					</p>
				</TooltipContent>
			</Tooltip>
		);
	}

	return selectContent;
}
