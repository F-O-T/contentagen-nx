import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
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
import type { ContentItem } from "./content-table-columns";

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

interface ContentMobileCardProps {
   content: ContentItem;
   onView?: (content: ContentItem) => void;
   onPublish?: (content: ContentItem) => void;
   onArchive?: (content: ContentItem) => void;
   onDelete?: (content: ContentItem) => void;
   onToggleShare?: (content: ContentItem) => void;
}

export function ContentMobileCard({
   content,
   onView,
   onPublish,
   onArchive,
   onDelete,
   onToggleShare,
}: ContentMobileCardProps) {
   const config = STATUS_CONFIG[content.status];
   const isDraft = content.status === "draft";
   const isPublished = content.status === "published";
   const isShared = content.shareStatus === "shared";

   return (
      <Card>
         <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0 space-y-2">
                  <div>
                     <h3 className="font-medium truncate">
                        {content.meta.title || "Sem título"}
                     </h3>
                     {content.meta.description && (
                        <p className="text-sm text-muted-foreground truncate">
                           {content.meta.description}
                        </p>
                     )}
                  </div>

                  <div className="flex items-center gap-2">
                     <Announcement className="w-fit">
                        <AnnouncementTag className={config.className}>
                           {config.icon}
                        </AnnouncementTag>
                        <AnnouncementTitle>{config.label}</AnnouncementTitle>
                     </Announcement>
                     {isShared && <Globe className="size-3.5 text-blue-500" />}
                  </div>

                  <p className="text-xs text-muted-foreground">
                     {new Date(content.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                     })}
                  </p>
               </div>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button
                        className="size-8 flex-shrink-0"
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
            </div>
         </CardContent>
      </Card>
   );
}
