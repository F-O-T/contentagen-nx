import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { AlertCircleIcon, CheckIcon, LoaderIcon, XCircleIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

const AgentCallToolImpl: ToolCallMessagePartComponent = ({
  toolName,
  status,
}) => {
  const config = getToolDisplay(toolName);
  const Icon = config?.icon;
  const label = config?.label ?? toolName;

  const statusType = status?.type ?? "complete";
  const isRunning = statusType === "running";
  const isCancelled =
    status?.type === "incomplete" && status.reason === "cancelled";

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-0.5 text-sm",
        isCancelled && "opacity-50",
      )}
    >
      {/* Status icon */}
      {isRunning && (
        <LoaderIcon className="size-3 shrink-0 animate-spin text-primary" />
      )}
      {statusType === "complete" && (
        <CheckIcon className="size-3 shrink-0 text-muted-foreground/50" />
      )}
      {isCancelled && (
        <XCircleIcon className="size-3 shrink-0 text-muted-foreground/50" />
      )}
      {status?.type === "incomplete" && !isCancelled && (
        <AlertCircleIcon className="size-3 shrink-0 text-destructive" />
      )}

      {/* Agent icon badge */}
      {Icon && (
        <div
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm",
            isRunning && "bg-primary/10 text-primary",
            !isRunning && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-2.5" />
        </div>
      )}

      {/* Label */}
      <span
        className={cn(
          "font-medium text-muted-foreground",
          isRunning && "text-foreground",
          isCancelled && "line-through",
        )}
      >
        {label}
      </span>
    </div>
  );
};

export const AgentCallTool = memo(
  AgentCallToolImpl,
) as ToolCallMessagePartComponent;

AgentCallTool.displayName = "AgentCallTool";
