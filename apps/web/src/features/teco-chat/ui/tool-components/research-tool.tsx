import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, Globe, LoaderIcon, SearchIcon } from "lucide-react";
import { memo, useState } from "react";
import { getToolDisplay } from "./tool-display-config";

/** Extract query/keyword strings from tool args for chip display */
function extractQueryChips(argsText: string | undefined): string[] {
  if (!argsText) return [];
  try {
    const args = JSON.parse(argsText) as Record<string, unknown>;
    if (typeof args.query === "string") return [args.query];
    if (typeof args.keyword === "string") return [args.keyword];
    if (typeof args.url === "string") return [args.url];
    if (typeof args.topic === "string") return [args.topic];
    if (Array.isArray(args.queries)) {
      return (args.queries as unknown[])
        .filter((q): q is string => typeof q === "string")
        .slice(0, 3);
    }
    return [];
  } catch {
    return [];
  }
}

/** Extract source list from tool result for "Revisando fontes" section */
function extractSources(
  result: unknown,
): Array<{ title: string; url: string }> {
  if (!result || typeof result !== "object") return [];
  const r = result as Record<string, unknown>;

  // webSearch: { results: [{title, url}] }
  if (Array.isArray(r.results)) {
    return (r.results as unknown[])
      .filter(
        (item): item is { title: string; url: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).url === "string" &&
          typeof (item as Record<string, unknown>).title === "string",
      )
      .slice(0, 6);
  }

  // serpAnalysis: { topResults: [{title, url}] }
  if (Array.isArray(r.topResults)) {
    return (r.topResults as unknown[])
      .filter(
        (item): item is { title: string; url: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).url === "string" &&
          typeof (item as Record<string, unknown>).title === "string",
      )
      .slice(0, 6);
  }

  // Single source with url + title
  if (typeof r.url === "string" && typeof r.title === "string") {
    return [{ url: r.url, title: r.title }];
  }

  return [];
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SourceCard({ title, url }: { title: string; url: string }) {
  const domain = extractDomain(url);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5 text-xs">
      <div className="size-4 shrink-0 overflow-hidden rounded-sm">
        {!imgError ? (
          <img
            alt=""
            className="size-4 object-contain"
            onError={() => setImgError(true)}
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
          />
        ) : (
          <Globe className="size-3.5 text-muted-foreground" />
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-foreground/80">{title}</span>
      <span className="shrink-0 text-muted-foreground">{domain}</span>
    </div>
  );
}

const ResearchToolImpl: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const config = getToolDisplay(toolName);
  const label = config?.label ?? toolName;
  const isRunning = status?.type === "running";

  const queries = extractQueryChips(argsText);
  const sources = status?.type === "complete" ? extractSources(result) : [];

  return (
    <div className="flex flex-col gap-1.5 py-0.5">
      {/* Step description */}
      <div className="flex items-center gap-2 text-sm">
        {isRunning ? (
          <LoaderIcon className="size-3 shrink-0 animate-spin text-amber-500" />
        ) : (
          <CheckIcon className="size-3 shrink-0 text-muted-foreground/50" />
        )}
        <span
          className={cn(
            "text-muted-foreground",
            isRunning && "text-foreground",
          )}
        >
          {label}
        </span>
      </div>

      {/* Searching chips */}
      {queries.length > 0 && (
        <div className="ml-5 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground/50">Pesquisando</p>
          <div className="flex flex-wrap gap-1">
            {queries.map((q) => (
              <span
                className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
                key={q}
              >
                <SearchIcon className="size-2.5 shrink-0" />
                <span className="max-w-52 truncate">{q}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source cards */}
      {sources.length > 0 && (
        <div className="ml-5 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground/50">Revisando fontes</p>
          <div className="flex flex-col gap-1">
            {sources.map((s) => (
              <SourceCard key={s.url} title={s.title} url={s.url} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ResearchTool = memo(ResearchToolImpl) as ToolCallMessagePartComponent;
ResearchTool.displayName = "ResearchTool";
