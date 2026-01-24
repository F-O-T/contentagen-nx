import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import type { MobileCardRenderProps } from "@packages/ui/components/data-table";
import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import type { DataTableAction } from "@/features/data-table/types";
import { DataTableMobileCard } from "@/features/data-table/ui/data-table-mobile-card";
import type { Writer } from "./writers-table-columns";

type WritersMobileCardProps = MobileCardRenderProps<Writer> & {
   slug: string;
   actions?: DataTableAction<Writer>[];
};

export function WritersMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   isSelected,
   toggleSelected,
   enableRowSelection,
   canExpand,
   slug,
   actions = [],
}: WritersMobileCardProps) {
   const writer = row.original;
   const name = writer.personaConfig.metadata.name;
   const initials = name
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
         row={writer}
         toggleExpanded={toggleExpanded}
         toggleSelected={toggleSelected}
      >
         <div className="flex items-start gap-3">
            <Avatar className="size-10 shrink-0">
               <AvatarImage
                  alt={name}
                  src={writer.profilePhotoUrl ?? undefined}
               />
               <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
               <Link
                  className="font-medium hover:underline truncate block"
                  params={{ slug, writerId: writer.id }}
                  to="/$slug/writers/$writerId"
               >
                  {name}
               </Link>
               {writer.personaConfig.metadata.description && (
                  <p className="text-sm text-muted-foreground truncate">
                     {writer.personaConfig.metadata.description}
                  </p>
               )}

               <div className="flex items-center gap-2 mt-2">
                  <Badge className="gap-1" variant="secondary">
                     <FileText className="size-3" />
                     {writer.contentCount} {"conteúdos"}
                  </Badge>
               </div>

               <p className="text-xs text-muted-foreground mt-2">
                  {"Criado em"}:{" "}
                  {new Date(writer.createdAt).toLocaleDateString("pt-BR", {
                     day: "2-digit",
                     month: "short",
                     year: "numeric",
                  })}
               </p>
            </div>
         </div>
      </DataTableMobileCard>
   );
}
