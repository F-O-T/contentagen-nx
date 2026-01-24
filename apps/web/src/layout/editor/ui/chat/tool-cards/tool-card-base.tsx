/**
 * Base Tool Card Component
 *
 * Shared wrapper for tool call visualizations with:
 * - Icon and title
 * - Status indicator (running/complete/error)
 * - Expandable args section
 * - Expandable results section
 */

import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import {
	ChevronDown,
	ChevronRight,
	Circle,
	CheckCircle2,
	XCircle,
	Loader2,
	type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

// =============================================================================
// Types
// =============================================================================

export type ToolStatus = "running" | "complete" | "error";

export interface ToolCardBaseProps {
	/**
	 * Tool name displayed in header
	 */
	title: string;

	/**
	 * Icon component for the tool
	 */
	icon: LucideIcon;

	/**
	 * Current status of the tool execution
	 */
	status: ToolStatus;

	/**
	 * Tool arguments (will be displayed in expandable section)
	 */
	args?: Record<string, unknown>;

	/**
	 * Tool result (will be displayed in expandable section)
	 */
	result?: unknown;

	/**
	 * Custom rendering for the result section
	 */
	resultRenderer?: (result: unknown) => ReactNode;

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Children rendered in the main content area
	 */
	children?: ReactNode;
}

// =============================================================================
// Main Component
// =============================================================================

export function ToolCardBase({
	title,
	icon: Icon,
	status,
	args,
	result,
	resultRenderer,
	className,
	children,
}: ToolCardBaseProps) {
	const [argsExpanded, setArgsExpanded] = useState(false);
	const [resultExpanded, setResultExpanded] = useState(true);

	// Determine status icon and color
	const statusConfig = {
		running: {
			icon: Loader2,
			color: "text-blue-500",
			bgColor: "bg-blue-500/10",
			animate: "animate-spin",
		},
		complete: {
			icon: CheckCircle2,
			color: "text-green-500",
			bgColor: "bg-green-500/10",
			animate: "",
		},
		error: {
			icon: XCircle,
			color: "text-red-500",
			bgColor: "bg-red-500/10",
			animate: "",
		},
	}[status];

	const StatusIcon = statusConfig.icon;

	return (
		<div
			className={cn(
				"rounded-lg border bg-card text-card-foreground shadow-sm p-3 space-y-2",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center gap-2">
				{/* Tool icon */}
				<div
					className={cn(
						"flex-shrink-0 size-8 rounded-md flex items-center justify-center",
						statusConfig.bgColor,
					)}
				>
					<Icon className={cn("size-4", statusConfig.color)} />
				</div>

				{/* Title */}
				<div className="flex-1 font-medium text-sm">{title}</div>

				{/* Status indicator */}
				<StatusIcon
					className={cn("size-4", statusConfig.color, statusConfig.animate)}
				/>
			</div>

			{/* Main content (custom children) */}
			{children && (
				<div className="text-sm text-muted-foreground">{children}</div>
			)}

			{/* Arguments section (expandable) */}
			{args && Object.keys(args).length > 0 && (
				<div className="border-t pt-2">
					<button
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
						onClick={() => setArgsExpanded(!argsExpanded)}
						type="button"
					>
						{argsExpanded ? (
							<ChevronDown className="size-3" />
						) : (
							<ChevronRight className="size-3" />
						)}
						<span>Argumentos</span>
					</button>
					{argsExpanded && (
						<div className="mt-2 p-2 rounded bg-muted text-xs font-mono overflow-x-auto">
							<pre>{JSON.stringify(args, null, 2)}</pre>
						</div>
					)}
				</div>
			)}

			{/* Results section (expandable, shown by default when complete) */}
			{result !== undefined && status === "complete" && (
				<div className="border-t pt-2">
					<button
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
						onClick={() => setResultExpanded(!resultExpanded)}
						type="button"
					>
						{resultExpanded ? (
							<ChevronDown className="size-3" />
						) : (
							<ChevronRight className="size-3" />
						)}
						<span>Resultado</span>
					</button>
					{resultExpanded && (
						<div className="mt-2">
							{resultRenderer ? (
								resultRenderer(result)
							) : (
								<div className="p-2 rounded bg-muted text-xs font-mono overflow-x-auto">
									<pre>{JSON.stringify(result, null, 2)}</pre>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
