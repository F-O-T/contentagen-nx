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
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, Check, Eye, Globe, PenLine } from "lucide-react";
import type { ReactNode } from "react";

export type ContentItem = {
   id: string;
   writerId: string | null;
   meta: {
      title: string;
      description: string;
      slug: string;
   };
   status: "draft" | "published" | "archived";
   shareStatus: "private" | "shared";
   draftOrigin?: "manual" | "ai_generated";
   createdAt: Date | string;
   writer?: {
      id: string;
      name: string;
      profilePhotoUrl?: string | null;
   } | null;
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

export function createContentColumns(slug: string): ColumnDef<ContentItem>[] {
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

            return (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        asChild
                        className="size-8"
                        size="icon"
                        variant="ghost"
                     >
                        <Link
                           params={{ slug, contentId: content.id }}
                           to="/$slug/content/$contentId"
                        >
                           <Eye className="size-4" />
                        </Link>
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalhes</TooltipContent>
               </Tooltip>
            );
         },
      },
   ];
}
