import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, LoaderIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

/**
 * Extract a short preview string from the tool args JSON.
 * For insertText: first 60 chars of args.text
 * For replaceText: first 60 chars of args.replaceWith
 * For others with text/content: first 60 chars of that field
 */
function extractPreview(argsText: string | undefined): string | null {
  if (!argsText) return null;
  try {
    const args = JSON.parse(argsText) as Record<string, unknown>;
    const text =
      typeof args.text === "string"
        ? args.text
        : typeof args.replaceWith === "string"
          ? args.replaceWith
          : typeof args.content === "string"
            ? args.content
            : typeof args.comment === "string"
              ? args.comment
              : typeof args.suggestion === "string"
                ? args.suggestion
                : null;
    if (!text) return null;
    const clean = text.replace(/#+\s*/g, "").replace(/\n+/g, " ").trim();
    return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean;
  } catch {
    return null;
  }
}

const EditorToolImpl: ToolCallMessagePartComponent = ({ toolName, argsText, status }) => {
  const config = getToolDisplay(toolName);
  const Icon = config?.icon;
  const label = config?.label ?? toolName;
  const preview = extractPreview(argsText);

  const isRunning = status?.type === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        isRunning && "border-primary/20 bg-primary/5",
        !isRunning && "border-border bg-muted/20",
      )}
    >
      {/* Status/icon */}
      {isRunning ? (
        <LoaderIcon className="size-3.5 shrink-0 animate-spin text-primary" />
      ) : (
        Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      )}

      {/* Label */}
      <span className={cn("shrink-0 font-medium", isRunning && "text-primary")}>
        {label}
      </span>

      {/* Preview */}
      {preview && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="min-w-0 truncate text-muted-foreground">{preview}</span>
        </>
      )}

      {/* Done checkmark */}
      {status?.type === "complete" && (
        <CheckIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
};

export const EditorTool = memo(EditorToolImpl) as ToolCallMessagePartComponent;
EditorTool.displayName = "EditorTool";
