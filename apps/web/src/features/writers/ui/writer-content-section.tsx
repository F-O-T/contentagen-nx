import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import type { MobileCardRenderProps } from "@packages/ui/components/data-table";
import { DataTable } from "@packages/ui/components/data-table";
import type { ContentMeta, ContentStatus } from "@packages/database/schemas/content";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";
import { useMemo } from "react";

interface ContentItem {
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

const STATUS_VARIANTS: Record<ContentStatus, "default" | "secondary" | "outline" | "destructive"> = {
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
   const statusLabel = item.status ? (STATUS_LABELS[item.status] ?? item.status) : "—";
   const statusVariant = item.status ? (STATUS_VARIANTS[item.status] ?? "secondary") : "secondary";

   return (
      <div className="rounded-lg border bg-background p-4">
         <div className="flex items-center gap-3">
            <FileText className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
               <p className="font-medium truncate text-sm">{title}</p>
               <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <Badge variant={statusVariant as "default" | "secondary" | "outline" | "destructive"}>
                  {statusLabel}
               </Badge>
               <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                     e.stopPropagation();
                     onRowClick(item.id);
                  }}
               >
                  <FileText className="size-4" />
                  <span className="sr-only">Ver conteúdo</span>
               </Button>
            </div>
         </div>
      </div>
   );
}

export function WriterContentSection({ recentContent, contentCount }: WriterContentSectionProps) {
   const { slug, teamSlug } = useParams({ from: "/_authenticated/$slug/$teamSlug/_dashboard" });
   const navigate = useNavigate();

   function handleRowClick(contentId: string) {
      navigate({
         to: "/$slug/$teamSlug/$contentId",
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
               if (!status) return <span className="text-sm text-muted-foreground">—</span>;
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
                     size="icon"
                     variant="ghost"
                     onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(row.original.id);
                     }}
                  >
                     <FileText className="size-4" />
                     <span className="sr-only">Ver conteúdo</span>
                  </Button>
               </div>
            ),
         },
      ],
      // biome-ignore lint/correctness/useExhaustiveDependencies: handleRowClick is stable within render
      [slug, teamSlug],
   );

   if (recentContent.length === 0) {
      return (
         <div className="space-y-4">
            <div>
               <h2 className="text-lg font-semibold">Conteúdos gerados</h2>
               <p className="text-sm text-muted-foreground">
                  Conteúdos criados com este escritor.
               </p>
            </div>
            <div className="border border-dashed rounded-lg p-8 text-center flex flex-col items-center gap-3">
               <FileText className="size-8 text-muted-foreground/50" />
               <p className="text-sm text-muted-foreground">
                  Nenhum conteúdo gerado por este escritor ainda.
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         <div>
            <h2 className="text-lg font-semibold">Conteúdos gerados</h2>
            <p className="text-sm text-muted-foreground">
               {contentCount} conteúdos gerados por este escritor
               {recentContent.length < contentCount && ` — mostrando os ${recentContent.length} mais recentes`}
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
