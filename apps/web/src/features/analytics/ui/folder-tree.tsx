import type { FolderWithChildren } from "@packages/database/repositories/folder-repository";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { cn } from "@packages/ui/lib/utils";
import { ChevronRight, Folder } from "lucide-react";

interface FolderTreeProps {
   folders: FolderWithChildren[];
   className?: string;
   renderFolderActions?: (folder: FolderWithChildren) => React.ReactNode;
   onFolderClick?: (folder: FolderWithChildren) => void;
}

export function FolderTree({
   folders,
   className,
   renderFolderActions,
   onFolderClick,
}: FolderTreeProps) {
   if (folders.length === 0) return null;

   return (
      <ul className={cn("flex flex-col gap-0.5", className)}>
         {folders.map((folder) => (
            <FolderTreeItem
               key={folder.id}
               folder={folder}
               depth={0}
               renderFolderActions={renderFolderActions}
               onFolderClick={onFolderClick}
            />
         ))}
      </ul>
   );
}

function FolderTreeItem({
   folder,
   depth,
   renderFolderActions,
   onFolderClick,
}: {
   folder: FolderWithChildren;
   depth: number;
   renderFolderActions?: (folder: FolderWithChildren) => React.ReactNode;
   onFolderClick?: (folder: FolderWithChildren) => void;
}) {
   const hasChildren = folder.children.length > 0;

   return (
      <li>
         <Collapsible defaultOpen>
            <div
               className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  "text-foreground hover:bg-accent",
               )}
               style={{ paddingLeft: `${8 + depth * 12}px` }}
            >
               {hasChildren ? (
                  <CollapsibleTrigger asChild>
                     <button
                        type="button"
                        className="group flex size-5 shrink-0 items-center justify-center rounded hover:bg-accent/80"
                        aria-label="Expandir ou recolher"
                     >
                        <ChevronRight className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                     </button>
                  </CollapsibleTrigger>
               ) : (
                  <span className="size-5 shrink-0" />
               )}
               <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onFolderClick?.(folder)}
               >
                  <Folder
                     className="size-4 shrink-0 opacity-70"
                     style={folder.color ? { color: folder.color } : undefined}
                  />
                  <span className="truncate">{folder.name}</span>
               </button>
               {renderFolderActions?.(folder)}
            </div>
            <CollapsibleContent>
               {hasChildren && (
                  <ul className="flex flex-col gap-0.5">
                     {folder.children.map((child) => (
                        <FolderTreeItem
                           key={child.id}
                           depth={depth + 1}
                           folder={child}
                           renderFolderActions={renderFolderActions}
                           onFolderClick={onFolderClick}
                        />
                     ))}
                  </ul>
               )}
            </CollapsibleContent>
         </Collapsible>
      </li>
   );
}
