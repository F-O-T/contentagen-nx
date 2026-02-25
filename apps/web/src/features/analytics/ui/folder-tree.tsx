import type { FolderWithChildren } from "@packages/database/repositories/folder-repository";
import {
   TreeExpander,
   TreeIcon,
   TreeLabel,
   TreeNode,
   TreeNodeContent,
   TreeNodeTrigger,
   TreeProvider,
   TreeView,
} from "@packages/ui/components/kibo-ui/tree";
import { Folder } from "lucide-react";

interface FolderTreeProps {
   folders: FolderWithChildren[];
   className?: string;
   renderFolderActions?: (folder: FolderWithChildren) => React.ReactNode;
   onFolderClick?: (folder: FolderWithChildren) => void;
}

function collectIds(folders: FolderWithChildren[]): string[] {
   return folders.flatMap((f) => [f.id, ...collectIds(f.children)]);
}

export function FolderTree({
   folders,
   className,
   renderFolderActions,
   onFolderClick,
}: FolderTreeProps) {
   if (folders.length === 0) return null;

   return (
      <TreeProvider
         defaultExpandedIds={collectIds(folders)}
         selectable={false}
         className={className}
      >
         <TreeView className="p-0">
            {folders.map((folder, i) => (
               <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  isLast={i === folders.length - 1}
                  parentPath={[]}
                  renderFolderActions={renderFolderActions}
                  onFolderClick={onFolderClick}
               />
            ))}
         </TreeView>
      </TreeProvider>
   );
}

function FolderTreeItem({
   folder,
   level,
   isLast,
   parentPath,
   renderFolderActions,
   onFolderClick,
}: {
   folder: FolderWithChildren;
   level: number;
   isLast: boolean;
   parentPath: boolean[];
   renderFolderActions?: (folder: FolderWithChildren) => React.ReactNode;
   onFolderClick?: (folder: FolderWithChildren) => void;
}) {
   const hasChildren = folder.children.length > 0;

   return (
      <TreeNode nodeId={folder.id} level={level} isLast={isLast} parentPath={parentPath}>
         <TreeNodeTrigger onClick={() => onFolderClick?.(folder)}>
            <TreeExpander hasChildren={hasChildren} />
            <TreeIcon
               hasChildren={hasChildren}
               icon={
                  <Folder
                     className="size-4"
                     style={folder.color ? { color: folder.color } : undefined}
                  />
               }
            />
            <TreeLabel>{folder.name}</TreeLabel>
            {renderFolderActions?.(folder)}
         </TreeNodeTrigger>
         <TreeNodeContent hasChildren={hasChildren}>
            {folder.children.map((child, i) => (
               <FolderTreeItem
                  key={child.id}
                  folder={child}
                  level={level + 1}
                  isLast={i === folder.children.length - 1}
                  parentPath={[...parentPath, isLast]}
                  renderFolderActions={renderFolderActions}
                  onFolderClick={onFolderClick}
               />
            ))}
         </TreeNodeContent>
      </TreeNode>
   );
}
