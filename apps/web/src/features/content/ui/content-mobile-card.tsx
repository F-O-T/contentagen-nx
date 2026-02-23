import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { Archive, Check, ChevronDown, Eye, Globe, PenLine } from "lucide-react";
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
   canExpand?: boolean;
   isExpanded?: boolean;
   toggleExpanded?: () => void;
}

export function ContentMobileCard({
   content,
   onView,
   canExpand,
   isExpanded,
   toggleExpanded,
}: ContentMobileCardProps) {
   const config = STATUS_CONFIG[content.status];
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

               <div className="flex items-center gap-1">
                  {onView && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              className="flex-shrink-0"
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
                  )}
                  {canExpand && toggleExpanded && (
                     <Button
                        onClick={toggleExpanded}
                        size="icon"
                        variant="ghost"
                     >
                        <ChevronDown
                           className={`size-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                           }`}
                        />
                     </Button>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
