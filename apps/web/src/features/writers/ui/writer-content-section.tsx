import type {
   ContentMeta,
   ContentStatus,
} from "@packages/database/schemas/content";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import type { MobileCardRenderProps } from "@packages/ui/components/data-table";
import { DataTable } from "@packages/ui/components/data-table";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";
import { useMemo } from "react";

export interface ContentItem {
   id: string;
   meta: ContentMeta | null;
   status: ContentStatus | null;
   createdAt: Date | string | null;
}

interface WriterContentSectionProps {
   recentContent: ContentItem[];
   contentCount: number;
}

const STATUS_LABELS: Record<ContentStatus, string> = {
   draft: "Rascunho",
   published: "Publicado",
   archived: "Arquivado",
};

const STATUS_VARIANTS: Record<
   ContentStatus,
   "default" | "secondary" | "outline" | "destructive"
> = {
   draft: "secondary",
   published: "default",
   archived: "outline",
};

function formatDate(value: Date | string | null) {
   if (!value) return "—";
   return format(new Date(value), "d MMM yyyy", { locale: ptBR });
}

function ContentMobileCard({
   row,
   isExpanded: _isExpanded,
   toggleExpanded: _toggleExpanded,
   onRowClick,
}: MobileCardRenderProps<ContentItem> & {
   onRowClick: (id: string) => void;
}) {
   const item = row.original;
   const title = item.meta?.title ?? "Sem título";
   const statusLabel = item.status
      ? (STATUS_LABELS[item.status] ?? item.status)
      : "—";
   const statusVariant = item.status
      ? (STATUS_VARIANTS[item.status] ?? "secondary")
      : "secondary";

   return (
      <div className="rounded-lg border bg-background p-4">
         <div className="flex items-center gap-3">
            <FileText className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
               <p className="font-medium truncate text-sm">{title}</p>
               <p className="text-xs text-muted-foreground">
                  {formatDate(item.createdAt)}
               </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <Badge
                  variant={
                     statusVariant as
                        | "default"
                        | "secondary"
                        | "outline"
                        | "destructive"
                  }
               >
                  {statusLabel}
               </Badge>
               <Button
                  onClick={(e) => {
                     e.stopPropagation();
                     onRowClick(item.id);
                  }}
                  size="icon"
                  variant="ghost"
               >
                  <FileText className="size-4" />
                  <span className="sr-only">Ver conteúdo</span>
               </Button>
            </div>
         </div>
      </div>
   );
}

export function WriterContentSection({
   recentContent,
   contentCount,
}: WriterContentSectionProps) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const navigate = useNavigate();

   function handleRowClick(contentId: string) {
      navigate({
         to: "/$slug/$teamSlug/content/$contentId",
         params: { slug, teamSlug, contentId },
      });
   }

   const columns = useMemo<ColumnDef<ContentItem>[]>(
      () => [
         {
            id: "title",
            header: "Título",
            accessorFn: (row) => row.meta?.title ?? "Sem título",
            cell: ({ row }) => (
               <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">
                     {row.original.meta?.title ?? "Sem título"}
                  </span>
               </div>
            ),
         },
         {
            id: "status",
            header: "Status",
            accessorFn: (row) => row.status,
            cell: ({ row }) => {
               const status = row.original.status;
               if (!status)
                  return (
                     <span className="text-sm text-muted-foreground">—</span>
                  );
               return (
                  <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
                     {STATUS_LABELS[status] ?? status}
                  </Badge>
               );
            },
         },
         {
            id: "createdAt",
            header: "Data",
            accessorFn: (row) => row.createdAt,
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
                        handleRowClick(row.original.id);
                     }}
                     size="icon"
                     variant="ghost"
                  >
                     <FileText className="size-4" />
                     <span className="sr-only">Ver conteúdo</span>
                  </Button>
               </div>
            ),
         },
      ],
      [slug, teamSlug],
   );

   if (recentContent.length === 0) {
      return (
         <div className="space-y-4 py-4">
            <div className="space-y-0.5">
               <h2 className="text-base font-semibold">Conteúdos gerados</h2>
               <p className="text-sm text-muted-foreground">
                  Conteúdos criados com este escritor.
               </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
               <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="size-5" />
               </div>
               <div className="text-center space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                     Nenhum conteúdo ainda
                  </p>
                  <p className="text-xs text-muted-foreground">
                     Selecione este escritor ao criar um conteúdo para ele
                     aparecer aqui.
                  </p>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-4 py-4">
         <div className="space-y-0.5">
            <h2 className="text-base font-semibold">Conteúdos gerados</h2>
            <p className="text-sm text-muted-foreground">
               {contentCount} conteúdo{contentCount !== 1 ? "s" : ""} gerado
               {contentCount !== 1 ? "s" : ""} por este escritor
               {recentContent.length < contentCount &&
                  ` — mostrando os ${recentContent.length} mais recentes`}
            </p>
         </div>

         <DataTable
            columns={columns}
            data={recentContent}
            getRowId={(row) => row.id}
            renderMobileCard={(props) => (
               <ContentMobileCard onRowClick={handleRowClick} {...props} />
            )}
         />
      </div>
   );
}
