import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import type { MobileCardRenderProps } from "@packages/ui/components/data-table";
import { Link } from "@tanstack/react-router";
import { Archive, Check, PenLine } from "lucide-react";
import type { ReactNode } from "react";
import type { DataTableAction } from "@/features/data-table/types";
import { DataTableMobileCard } from "@/features/data-table/ui/data-table-mobile-card";
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

type ContentMobileCardProps = MobileCardRenderProps<ContentItem> & {
   slug: string;
   actions?: DataTableAction<ContentItem>[];
};

export function ContentMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   isSelected,
   toggleSelected,
   enableRowSelection,
   canExpand,
   slug,
   actions = [],
}: ContentMobileCardProps) {
   const content = row.original;
   const agent = content.writer;

   const initials = agent?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

   return (
      <DataTableMobileCard
         actions={actions}
         canExpand={canExpand}
         enableRowSelection={enableRowSelection}
         isExpanded={isExpanded}
         isSelected={isSelected}
         row={content}
         toggleExpanded={toggleExpanded}
         toggleSelected={toggleSelected}
      >
         {/* Main content */}
         <div className="min-w-0">
            <Link
               className="font-medium hover:underline truncate block"
               params={{ slug, contentId: content.id }}
               to="/$slug/content/$contentId"
            >
               {content.meta.title || "Sem título"}
            </Link>
            <p className="text-sm text-muted-foreground truncate">
               {content.meta.description}
            </p>

            <div className="flex items-center gap-2 mt-2">
               <Announcement className="w-fit">
                  <AnnouncementTag
                     className={STATUS_CONFIG[content.status].className}
                  >
                     {STATUS_CONFIG[content.status].icon}
                  </AnnouncementTag>
                  <AnnouncementTitle>
                     {STATUS_CONFIG[content.status].label}
                  </AnnouncementTitle>
               </Announcement>
               {agent && (
                  <div className="flex items-center gap-1">
                     <Avatar className="size-4">
                        <AvatarImage
                           alt={agent.name}
                           src={agent.profilePhotoUrl ?? undefined}
                        />
                        <AvatarFallback className="text-[8px]">
                           {initials}
                        </AvatarFallback>
                     </Avatar>
                     <span className="text-xs text-muted-foreground">
                        {agent.name}
                     </span>
                  </div>
               )}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
               {new Date(content.createdAt).toLocaleDateString()}
            </p>
         </div>
      </DataTableMobileCard>
   );
}
