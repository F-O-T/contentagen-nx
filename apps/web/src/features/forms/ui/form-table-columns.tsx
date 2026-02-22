import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import type { MobileCardRenderProps } from "@packages/ui/components/data-table";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, Edit, Trash2 } from "lucide-react";

export type FormRow = {
   id: string;
   name: string;
   description: string | null;
   fields: unknown[];
   isActive: boolean;
   createdAt: Date | string;
   submissionCount: number;
};

interface FormNavigationOptions {
   slug: string;
   teamSlug: string;
}

interface FormActionOptions extends FormNavigationOptions {
   onDelete: (form: FormRow) => void;
}

function RowExpandedContent({
   row,
   onDelete,
   slug,
   teamSlug,
}: { row: Row<FormRow> } & FormActionOptions) {
   const form = row.original;
   return (
      <div className="px-4 py-4 space-y-4">
         {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
         )}
         <div className="flex items-center gap-2 flex-wrap">
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{ slug, teamSlug, formId: form.id }}
                  to="/$slug/$teamSlug/forms/$formId"
               >
                  <Edit className="size-3 mr-2" />
                  Editar
               </Link>
            </Button>
            <Button
               className="text-destructive hover:text-destructive"
               onClick={(e) => {
                  e.stopPropagation();
                  onDelete(form);
               }}
               size="sm"
               variant="ghost"
            >
               <Trash2 className="size-3 mr-2" />
               Excluir
            </Button>
         </div>
      </div>
   );
}

export function createFormColumns({
   slug,
   teamSlug,
}: FormNavigationOptions): ColumnDef<FormRow>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => (
            <div className="min-w-0">
               <p className="font-medium truncate max-w-[280px]">
                  {row.original.name}
               </p>
               {row.original.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                     {row.original.description}
                  </p>
               )}
            </div>
         ),
         maxSize: 300,
      },
      {
         accessorKey: "fields",
         cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
               {row.original.fields.length}
            </span>
         ),
      },
      {
         accessorKey: "submissionCount",
         header: "Submissões",
         cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
               {row.original.submissionCount}
            </span>
         ),
      },
      {
         accessorKey: "isActive",
         header: "Status",
         cell: ({ row }) => (
            <Badge variant={row.original.isActive ? "default" : "secondary"}>
               {row.original.isActive ? "Ativo" : "Inativo"}
            </Badge>
         ),
      },
      {
         accessorKey: "createdAt",
         header: "Criado em",
         cell: ({ row }) => {
            const date =
               typeof row.original.createdAt === "string"
                  ? new Date(row.original.createdAt)
                  : row.original.createdAt;
            return (
               <span className="text-sm text-muted-foreground">
                  {format(date, "dd/MM/yyyy", { locale: ptBR })}
               </span>
            );
         },
      },
      {
         id: "actions",
         header: "",
         cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1">
               <Button
                  asChild
                  onClick={(e) => e.stopPropagation()}
                  size="icon"
                  variant="ghost"
               >
                  <Link
                     params={{ slug, teamSlug, formId: row.original.id }}
                     to="/$slug/$teamSlug/forms/$formId"
                  >
                     <Edit className="size-4" />
                     <span className="sr-only">Editar</span>
                  </Link>
               </Button>
            </div>
         ),
      },
   ];
}

export function createFormSubComponent({
   onDelete,
   slug,
   teamSlug,
}: FormActionOptions) {
   return function FormSubComponent({ row }: { row: Row<FormRow> }) {
      return (
         <RowExpandedContent
            onDelete={onDelete}
            row={row}
            slug={slug}
            teamSlug={teamSlug}
         />
      );
   };
}

export function FormMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   canExpand,
   slug,
   teamSlug,
}: MobileCardRenderProps<FormRow> & FormNavigationOptions) {
   const form = row.original;
   return (
      <Card>
         <CardContent className="p-4">
            <div className="flex items-start gap-3">
               <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{form.name}</p>
                  {form.description && (
                     <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {form.description}
                     </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                     <Badge
                        className="text-xs"
                        variant={form.isActive ? "default" : "secondary"}
                     >
                        {form.isActive ? "Ativo" : "Inativo"}
                     </Badge>
                     <span className="text-xs text-muted-foreground">
                        {form.fields.length}{" "}
                        {form.fields.length === 1 ? "campo" : "campos"}
                     </span>
                     <span className="text-xs text-muted-foreground">
                        {form.submissionCount}{" "}
                        {form.submissionCount === 1
                           ? "submissão"
                           : "submissões"}
                     </span>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  <Button
                     asChild
                     onClick={(e) => e.stopPropagation()}
                     size="icon"
                     variant="ghost"
                  >
                     <Link
                        params={{ slug, teamSlug, formId: form.id }}
                        to="/$slug/$teamSlug/forms/$formId"
                     >
                        <Edit className="size-4" />
                        <span className="sr-only">Editar</span>
                     </Link>
                  </Button>
                  {canExpand && (
                     <Button
                        onClick={toggleExpanded}
                        size="icon"
                        variant="ghost"
                     >
                        <ChevronDown
                           className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                        <span className="sr-only">
                           {isExpanded ? "Recolher" : "Expandir"}
                        </span>
                     </Button>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
