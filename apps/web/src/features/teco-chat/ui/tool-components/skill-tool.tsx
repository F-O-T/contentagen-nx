import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { BookOpen, CheckIcon, FolderOpen, LoaderIcon, SearchIcon } from "lucide-react";
import { memo } from "react";

/** Extract a human-readable skill name from a workspace path or search query */
function extractSkillLabel(
  _toolName: string,
  argsText: string | undefined,
): string | null {
  if (!argsText) return null;
  try {
    const args = JSON.parse(argsText) as Record<string, unknown>;

    // mastra_workspace_read_file: { path: "/skills/diretrizes-de-escrita/SKILL.md" }
    if (typeof args.path === "string") {
      const skillMatch = args.path.match(/\/skills\/([^/]+)/);
      if (skillMatch) {
        return skillMatch[1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
      // References file or other path — show the filename
      const filename = args.path.split("/").filter(Boolean).slice(-1)[0] ?? null;
      return filename ? filename.replace(/\.[^.]+$/, "").replace(/-/g, " ") : null;
    }

    // mastra_workspace_search: { query: "..." } or { searchTerm: "..." }
    if (typeof args.query === "string") return args.query;
    if (typeof args.searchTerm === "string") return args.searchTerm;

    return null;
  } catch {
    return null;
  }
}

const SkillToolImpl: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  status,
}) => {
  const isSearch = toolName === "mastra_workspace_search";
  const isListFiles = toolName === "mastra_workspace_list_files";
  const isRunning = status?.type === "running";
  const skillLabel = extractSkillLabel(toolName, argsText);

  const label = isSearch ? "Pesquisando skills" : isListFiles ? "Listando skills" : "Lendo skill";
  const Icon = isSearch ? SearchIcon : isListFiles ? FolderOpen : BookOpen;

  return (
    <div className="flex items-center gap-2 py-0.5 text-sm">
      {isRunning ? (
        <LoaderIcon className="size-3 shrink-0 animate-spin text-violet-400" />
      ) : (
        <CheckIcon className="size-3 shrink-0 text-muted-foreground/50" />
      )}
      <Icon
        className={cn(
          "size-3 shrink-0",
          isRunning ? "text-violet-400" : "text-muted-foreground/40",
        )}
      />
      <span
        className={cn("text-muted-foreground", isRunning && "text-foreground")}
      >
        {label}
      </span>
      {skillLabel && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="min-w-0 flex-1 truncate text-xs italic text-muted-foreground/60">
            {skillLabel}
          </span>
        </>
      )}
    </div>
  );
};

export const SkillTool = memo(SkillToolImpl) as ToolCallMessagePartComponent;
SkillTool.displayName = "SkillTool";
