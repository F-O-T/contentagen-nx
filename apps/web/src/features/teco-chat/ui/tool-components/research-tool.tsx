import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, LoaderIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

/**
 * Extract a short query/subject string from tool args JSON.
 * Tries common field names: query, keyword, url, topic, text
 */
function extractSubject(argsText: string | undefined): string | null {
  if (!argsText) return null;
  try {
    const args = JSON.parse(argsText) as Record<string, unknown>;
    const value =
      typeof args.query === "string"
        ? args.query
        : typeof args.keyword === "string"
          ? args.keyword
          : typeof args.url === "string"
            ? args.url
            : typeof args.topic === "string"
              ? args.topic
              : typeof args.text === "string"
                ? args.text
                : null;
    if (!value) return null;
    return value.length > 50 ? `${value.slice(0, 50)}…` : value;
  } catch {
    return null;
  }
}

const ResearchToolImpl: ToolCallMessagePartComponent = ({ toolName, argsText, status }) => {
  const config = getToolDisplay(toolName);
  const Icon = config?.icon;
  const label = config?.label ?? toolName;
  const subject = extractSubject(argsText);

  const isRunning = status?.type === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        isRunning && "border-amber-500/20 bg-amber-500/5",
        !isRunning && "border-border bg-muted/20",
      )}
    >
      {/* Status/icon */}
      {isRunning ? (
        <LoaderIcon className="size-3.5 shrink-0 animate-spin text-amber-600" />
      ) : (
        Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      )}

      {/* Label */}
      <span className={cn("shrink-0 font-medium", isRunning && "text-amber-600 dark:text-amber-500")}>
        {label}
      </span>

      {/* Subject/query preview */}
      {subject && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="min-w-0 truncate text-muted-foreground italic">{subject}</span>
        </>
      )}

      {/* Done checkmark */}
      {status?.type === "complete" && (
        <CheckIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
};

export const ResearchTool = memo(ResearchToolImpl) as ToolCallMessagePartComponent;
ResearchTool.displayName = "ResearchTool";
