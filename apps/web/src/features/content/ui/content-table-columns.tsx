import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import {
   Archive,
   Check,
   Eye,
   FileText,
   Globe,
   MoreHorizontal,
   PenLine,
   Share2,
   Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

export type ContentItem = {
   id: string;
   meta: {
      title: string;
      description?: string;
      slug: string;
   };
   status: "draft" | "published" | "archived";
   shareStatus: "private" | "shared";
   draftOrigin?: "manual" | "ai_generated";
   createdAt: Date | string;
};

const STATUS_CONFIG: Record<
   ContentItem["status"],
   { label: string; className: string; icon: ReactNode }
> = {
   archived: {
      label: "Arquivado",
      className: "text-slate-500",
      icon: <Archive className="size-3" />,
   },
   draft: {
      label: "Rascunho",
      className: "text-amber-500",
      icon: <PenLine className="size-3" />,
   },
   published: {
      label: "Publicado",
      className: "text-green-500",
      icon: <Check className="size-3" />,
   },
};

interface CreateContentColumnsOptions {
   onView?: (content: ContentItem) => void;
   onPublish?: (content: ContentItem) => void;
   onArchive?: (content: ContentItem) => void;
   onDelete?: (content: ContentItem) => void;
   onToggleShare?: (content: ContentItem) => void;
}

export function createContentColumns(
   options: CreateContentColumnsOptions = {},
): ColumnDef<ContentItem>[] {
   const { onView, onPublish, onArchive, onDelete, onToggleShare } = options;

   return [
      {
         accessorKey: "title",
         header: "Título",
         cell: ({ row }) => {
            const content = row.original;

            return (
               <div className="min-w-0">
                  <p className="font-medium truncate max-w-[300px]">
                     {content.meta.title || "Sem título"}
                  </p>
                  {content.meta.description && (
                     <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {content.meta.description}
                     </p>
                  )}
               </div>
            );
         },
      },
      {
         accessorKey: "status",
         header: "Status",
         cell: ({ row }) => {
            const status = row.original.status;
            const shareStatus = row.original.shareStatus;
            const config = STATUS_CONFIG[status];

            return (
               <div className="flex items-center gap-2">
                  <Announcement className="w-fit">
                     <AnnouncementTag className={config.className}>
                        {config.icon}
                     </AnnouncementTag>
                     <AnnouncementTitle>{config.label}</AnnouncementTitle>
                  </Announcement>
                  {shareStatus === "shared" && (
                     <Tooltip>
                        <TooltipTrigger>
                           <Globe className="size-3.5 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                           Compartilhado publicamente
                        </TooltipContent>
                     </Tooltip>
                  )}
               </div>
            );
         },
      },
      {
         accessorKey: "createdAt",
         header: "Criado em",
         cell: ({ row }) => (
            <span className="text-muted-foreground text-sm">
               {new Date(row.original.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
               })}
            </span>
         ),
      },
      {
         id: "actions",
         header: "",
         cell: ({ row }) => {
            const content = row.original;
            const isDraft = content.status === "draft";
            const isPublished = content.status === "published";
            const isShared = content.shareStatus === "shared";

            return (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button
                        className="size-8"
                        onClick={(e) => e.stopPropagation()}
                        size="icon"
                        variant="ghost"
                     >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Abrir menu</span>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     {onView && (
                        <DropdownMenuItem onClick={() => onView(content)}>
                           <Eye className="mr-2 size-4" />
                           Ver detalhes
                        </DropdownMenuItem>
                     )}

                     {isDraft && onPublish && (
                        <DropdownMenuItem onClick={() => onPublish(content)}>
                           <FileText className="mr-2 size-4" />
                           Publicar
                        </DropdownMenuItem>
                     )}

                     {isPublished && onArchive && (
                        <DropdownMenuItem onClick={() => onArchive(content)}>
                           <Archive className="mr-2 size-4" />
                           Arquivar
                        </DropdownMenuItem>
                     )}

                     {onToggleShare && (
                        <DropdownMenuItem
                           onClick={() => onToggleShare(content)}
                        >
                           <Share2 className="mr-2 size-4" />
                           {isShared ? "Tornar privado" : "Compartilhar"}
                        </DropdownMenuItem>
                     )}

                     {onDelete && (
                        <>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete(content)}
                           >
                              <Trash2 className="mr-2 size-4" />
                              Excluir
                           </DropdownMenuItem>
                        </>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            );
         },
      },
   ];
}
