import { Badge } from "@packages/ui/components/badge";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";

interface ContentItem {
   id: string;
   meta: Record<string, unknown> | null;
   status: string | null;
   createdAt: Date | string | null;
}

interface WriterContentSectionProps {
   recentContent: ContentItem[];
   contentCount: number;
}

const STATUS_LABELS: Record<string, string> = {
   draft: "Rascunho",
   published: "Publicado",
   archived: "Arquivado",
   review: "Em revisão",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
   draft: "secondary",
   published: "default",
   archived: "outline",
   review: "secondary",
};

export function WriterContentSection({ recentContent, contentCount }: WriterContentSectionProps) {
   const { slug, teamSlug } = useParams({ from: "/_authenticated/$slug/$teamSlug/_dashboard" });
   const navigate = useNavigate();

   function handleRowClick(contentId: string) {
      navigate({
         to: "/$slug/$teamSlug/$contentId",
         params: { slug, teamSlug, contentId },
      });
   }

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
               {contentCount > 10 && " — mostrando os 10 mais recentes"}
            </p>
         </div>

         <div className="border rounded-lg overflow-hidden divide-y">
            {recentContent.map((item) => {
               const title = (item.meta as { title?: string } | null)?.title ?? "Sem título";
               const statusLabel = item.status ? (STATUS_LABELS[item.status] ?? item.status) : "—";
               const statusVariant = item.status ? (STATUS_VARIANTS[item.status] ?? "secondary") : "secondary";
               const formattedDate = item.createdAt
                  ? format(new Date(item.createdAt), "d MMM yyyy", { locale: ptBR })
                  : "—";

               return (
                  <div
                     className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                     key={item.id}
                     onClick={() => handleRowClick(item.id)}
                  >
                     <FileText className="size-4 text-muted-foreground shrink-0" />
                     <span className="flex-1 min-w-0 text-sm font-medium truncate">
                        {title}
                     </span>
                     <Badge className="shrink-0" variant={statusVariant}>
                        {statusLabel}
                     </Badge>
                     <span className="text-xs text-muted-foreground shrink-0">
                        {formattedDate}
                     </span>
                  </div>
               );
            })}
         </div>
      </div>
   );
}
