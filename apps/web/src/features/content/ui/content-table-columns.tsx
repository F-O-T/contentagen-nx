import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, Check, Eye, Globe, PenLine } from "lucide-react";
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
   const { onView } = options;

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
            if (!onView) return null;
            return (
               // biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation wrapper for table row click
               <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
               >
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           onClick={() => onView(content)}
                           size="icon"
                           variant="ghost"
                        >
                           <Eye className="size-4" />
                           <span className="sr-only">Ver detalhes</span>
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Ver detalhes</TooltipContent>
                  </Tooltip>
               </div>
            );
         },
      },
   ];
}
