import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, LoaderIcon } from "lucide-react";
import { memo } from "react";
import { getToolDisplay } from "./tool-display-config";

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
    const clean = text.replace(/^#+\s*/gm, "").replace(/\n+/g, " ").trim();
    return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean;
  } catch {
    return null;
  }
}

const EditorToolImpl: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  status,
}) => {
  const config = getToolDisplay(toolName);
  const label = config?.label ?? toolName;
  const preview = extractPreview(argsText);
  const isRunning = status?.type === "running";

  return (
    <div className="flex items-center gap-2 py-0.5 text-sm">
      {isRunning ? (
        <LoaderIcon className="size-3 shrink-0 animate-spin text-primary" />
      ) : (
        <CheckIcon className="size-3 shrink-0 text-muted-foreground/50" />
      )}
      <span
        className={cn("text-muted-foreground", isRunning && "text-foreground")}
      >
        {label}
      </span>
      {preview && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="min-w-0 flex-1 truncate text-xs italic text-muted-foreground/60">
            {preview}
          </span>
        </>
      )}
    </div>
  );
};

export const EditorTool = memo(EditorToolImpl) as ToolCallMessagePartComponent;
EditorTool.displayName = "EditorTool";
