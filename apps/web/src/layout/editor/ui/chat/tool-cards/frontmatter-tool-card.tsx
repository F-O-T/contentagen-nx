/**
 * Frontmatter Tool Card
 *
 * Visualizes metadata updates with before/after diff
 */

import type { LucideIcon } from "lucide-react";
import { FileText, FileType, Link as LinkIcon, Tag } from "lucide-react";
import { ToolCardBase, type ToolStatus } from "./tool-card-base";

// =============================================================================
// Types
// =============================================================================

export interface FrontmatterToolCardProps {
   /**
    * Tool name (e.g., "editTitle", "editDescription")
    */
   toolName: string;

   /**
    * Tool arguments
    */
   args: Record<string, unknown>;

   /**
    * Tool result
    */
   result?: unknown;

   /**
    * Current status
    */
   status: ToolStatus;
}

// =============================================================================
// Tool Icon Mapping
// =============================================================================

const TOOL_ICONS: Record<string, LucideIcon> = {
   editTitle: FileText,
   editDescription: FileType,
   editSlug: LinkIcon,
   editKeywords: Tag,
};

const TOOL_TITLES: Record<string, string> = {
   editTitle: "Editar Título",
   editDescription: "Editar Descrição",
   editSlug: "Editar Slug",
   editKeywords: "Editar Palavras-chave",
};

// =============================================================================
// Main Component
// =============================================================================

export function FrontmatterToolCard({
   toolName,
   args,
   result,
   status,
}: FrontmatterToolCardProps) {
   const icon = TOOL_ICONS[toolName] || FileText;
   const title = TOOL_TITLES[toolName] || toolName;

   // Extract new value from args
   const newValue = extractNewValue(toolName, args);

   return (
      <ToolCardBase
         args={args}
         icon={icon}
         result={result}
         resultRenderer={(result) => {
            // Custom result renderer showing success message
            if (typeof result === "object" && result !== null) {
               const resultObj = result as { success?: boolean };
               if (resultObj.success) {
                  return (
                     <div className="text-xs text-green-600 dark:text-green-400">
                        ✓ Metadados atualizados com sucesso
                     </div>
                  );
               }
            }
            return (
               <div className="p-2 rounded bg-muted text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
               </div>
            );
         }}
         status={status}
         title={title}
      >
         {newValue && (
            <div className="space-y-1">
               <div className="text-xs font-medium text-muted-foreground">
                  Novo valor:
               </div>
               <div className="p-2 rounded bg-muted/50 text-xs">
                  {toolName === "editKeywords" ? (
                     <div className="flex flex-wrap gap-1">
                        {Array.isArray(newValue) &&
                           newValue.map((keyword, i) => (
                              <span
                                 className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]"
                                 // biome-ignore lint/suspicious/noArrayIndexKey: Static list with no reordering
                                 key={i}
                              >
                                 {keyword}
                              </span>
                           ))}
                     </div>
                  ) : (
                     <div className="line-clamp-3">{String(newValue)}</div>
                  )}
               </div>
            </div>
         )}
      </ToolCardBase>
   );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract new value from tool arguments
 */
function extractNewValue(
   toolName: string,
   args: Record<string, unknown>,
): unknown {
   switch (toolName) {
      case "editTitle":
         return args.title;
      case "editDescription":
         return args.description;
      case "editSlug":
         return args.slug;
      case "editKeywords":
         return args.keywords;
      default:
         return null;
   }
}
