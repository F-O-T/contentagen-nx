import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { AlertCircleIcon, CheckIcon, LoaderIcon, XCircleIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

const AgentCallToolImpl: ToolCallMessagePartComponent = ({ toolName, status }) => {
  const config = getToolDisplay(toolName);
  const Icon = config?.icon;
  const label = config?.label ?? toolName;

  const statusType = status?.type ?? "complete";
  const isRunning = statusType === "running";
  const isCancelled = status?.type === "incomplete" && status.reason === "cancelled";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
        isRunning && "border-primary/20 bg-primary/5",
        !isRunning && !isCancelled && "border-border bg-muted/30",
        isCancelled && "border-muted-foreground/20 bg-muted/20 opacity-60",
      )}
    >
      {/* Agent icon */}
      {Icon && (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            isRunning && "bg-primary/10 text-primary",
            !isRunning && !isCancelled && "bg-muted text-muted-foreground",
            isCancelled && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
      )}

      {/* Label */}
      <div className="relative min-w-0 grow">
        <span
          className={cn(
            "font-medium",
            isCancelled && "line-through text-muted-foreground",
          )}
        >
          {label}
        </span>
        {isRunning && (
          <span
            aria-hidden
            className="shimmer pointer-events-none absolute inset-0 font-medium motion-reduce:animate-none"
          >
            {label}
          </span>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {isRunning && (
          <LoaderIcon className="size-4 animate-spin text-primary" />
        )}
        {statusType === "complete" && !isCancelled && (
          <CheckIcon className="size-4 text-muted-foreground" />
        )}
        {isCancelled && (
          <XCircleIcon className="size-4 text-muted-foreground" />
        )}
        {status?.type === "incomplete" && !isCancelled && (
          <AlertCircleIcon className="size-4 text-destructive" />
        )}
      </div>
    </div>
  );
};

export const AgentCallTool = memo(
  AgentCallToolImpl,
) as ToolCallMessagePartComponent;

AgentCallTool.displayName = "AgentCallTool";
