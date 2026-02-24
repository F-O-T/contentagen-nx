import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import type { MobileCardRenderProps } from "@packages/ui/components/data-table";
import { DataTable } from "@packages/ui/components/data-table";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";

export type WriterRow = {
   id: string;
   organizationId: string;
   teamId: string;
   personaConfig: {
      metadata: {
         name: string;
         description?: string;
         avatar?: string;
      };
   };
   profilePhotoUrl: string | null;
   lastGeneratedAt: Date | string | null;
   createdAt: Date | string;
   updatedAt: Date | string;
};

interface WritersTableProps {
   writers: WriterRow[];
   onEdit: (writer: WriterRow) => void;
   onDelete: (writer: WriterRow) => void;
}

function formatDate(value: Date | string | null) {
   if (!value) return "Nunca";
   const date = typeof value === "string" ? new Date(value) : value;
   return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
   });
}

function RowExpandedContent({
   row,
   onDelete,
}: {
   row: Row<WriterRow>;
   onDelete: (writer: WriterRow) => void;
}) {
   const writer = row.original;

   return (
      <div className="px-4 py-4">
         <div className="flex items-center gap-2 flex-wrap">
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => onDelete(writer)}
               size="sm"
               variant="ghost"
            >
               <Trash2 className="size-3" />
               Excluir
            </Button>
         </div>
      </div>
   );
}

function WriterMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   canExpand,
   onEdit,
   onDelete,
}: MobileCardRenderProps<WriterRow> & {
   onEdit: (writer: WriterRow) => void;
   onDelete: (writer: WriterRow) => void;
}) {
   const writer = row.original;
   const name = writer.personaConfig.metadata.name;
   const description = writer.personaConfig.metadata.description;
   const photoUrl =
      writer.profilePhotoUrl ?? writer.personaConfig.metadata.avatar;

   return (
      <div className="rounded-lg border bg-background p-4 space-y-3">
         <div className="flex items-start gap-3">
            <Avatar className="size-9 shrink-0">
               {photoUrl && <AvatarImage alt={name} src={photoUrl} />}
               <AvatarFallback className="text-xs">
                  {getInitials(name)}
               </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
               <p className="font-medium truncate">{name}</p>
               {description && (
                  <p className="text-xs text-muted-foreground truncate">
                     {description}
                  </p>
               )}
            </div>
            <div className="flex items-center gap-1">
               <Button
                  onClick={() => onEdit(writer)}
                  size="icon"
                  variant="ghost"
               >
                  <Pencil className="size-4" />
                  <span className="sr-only">Editar</span>
               </Button>
               {canExpand && (
                  <Button onClick={toggleExpanded} size="icon" variant="ghost">
                     <ChevronDown
                        className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                     />
                     <span className="sr-only">Expandir</span>
                  </Button>
               )}
            </div>
         </div>
         {isExpanded && (
            <div className="pt-2 border-t flex items-center gap-2">
               <Button
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(writer)}
                  size="sm"
                  variant="ghost"
               >
                  <Trash2 className="size-3" />
                  Excluir
               </Button>
            </div>
         )}
      </div>
   );
}

export function WritersTable({ writers, onEdit, onDelete }: WritersTableProps) {
   const columns = useMemo<ColumnDef<WriterRow>[]>(
      () => [
         {
            id: "writer",
            header: "Escritor",
            cell: ({ row }) => {
               const name = row.original.personaConfig.metadata.name;
               const description =
                  row.original.personaConfig.metadata.description;
               const photoUrl =
                  row.original.profilePhotoUrl ??
                  row.original.personaConfig.metadata.avatar;

               return (
                  <div className="flex items-center gap-3">
                     <Avatar className="size-8 shrink-0">
                        {photoUrl && <AvatarImage alt={name} src={photoUrl} />}
                        <AvatarFallback className="text-xs">
                           {getInitials(name)}
                        </AvatarFallback>
                     </Avatar>
                     <div className="min-w-0">
                        <p className="font-medium truncate">{name}</p>
                        {description && (
                           <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                              {description}
                           </p>
                        )}
                     </div>
                  </div>
               );
            },
         },
         {
            accessorKey: "lastGeneratedAt",
            header: "Última geração",
            cell: ({ row }) => (
               <span className="text-sm text-muted-foreground">
                  {formatDate(row.original.lastGeneratedAt)}
               </span>
            ),
         },
         {
            accessorKey: "createdAt",
            header: "Criado em",
            cell: ({ row }) => (
               <span className="text-sm text-muted-foreground">
                  {formatDate(row.original.createdAt)}
               </span>
            ),
         },
         {
            id: "actions",
            header: "",
            cell: ({ row }) => (
               // biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation wrapper for table row click
               <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
               >
                  <Button
                     onClick={(e) => {
                        e.stopPropagation();
                        onEdit(row.original);
                     }}
                     size="icon"
                     variant="ghost"
                  >
                     <Pencil className="size-4" />
                     <span className="sr-only">Editar</span>
                  </Button>
               </div>
            ),
         },
      ],
      [onEdit],
   );

   return (
      <DataTable
         columns={columns}
         data={writers}
         getRowId={(row) => row.id}
         renderMobileCard={(props) => (
            <WriterMobileCard onDelete={onDelete} onEdit={onEdit} {...props} />
         )}
         renderSubComponent={({ row }) => (
            <RowExpandedContent onDelete={onDelete} row={row} />
         )}
      />
   );
}

export function WritersTableSkeleton() {
   return (
      <div className="space-y-3">
         {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
               className="h-14 w-full"
               key={`writer-skeleton-${index + 1}`}
            />
         ))}
      </div>
   );
}
