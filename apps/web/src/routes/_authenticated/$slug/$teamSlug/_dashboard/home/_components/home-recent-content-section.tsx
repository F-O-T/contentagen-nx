import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Fragment, useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";

const STATUS_LABELS: Record<string, string> = {
   archived: "Arquivado",
   draft: "Rascunho",
   published: "Publicado",
};

const STATUS_COLORS: Record<string, string> = {
   archived: "bg-slate-500/10 text-slate-600 border-slate-200",
   draft: "bg-amber-500/10 text-amber-600 border-amber-200",
   published: "bg-green-500/10 text-green-600 border-green-200",
};

export function HomeRecentContentSection() {
   const options = useMemo(
      () =>
         orpc.content.listAllContent.queryOptions({
            input: {
               limit: 5,
               page: 1,
               status: ["draft", "published", "archived"],
            },
         }),
      [],
   );

   const { data } = useSuspenseQuery(options);

   const contents = data?.items || [];
   const hasContent = contents.length > 0;

   return (
      <Card className="w-full">
         <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle>Conteúdos Recentes</CardTitle>
               <CardDescription>
                  Sua atividade recente de conteúdo
               </CardDescription>
            </div>
         </CardHeader>
         <CardContent>
            {hasContent ? (
               <ItemGroup>
                  {contents.map((content, index) => (
                     <Fragment key={content.id}>
                        <Item size="sm">
                           <ItemContent>
                              <ItemTitle>
                                 {content.meta?.title || "Sem título"}
                              </ItemTitle>
                              <ItemDescription>
                                 {new Date(
                                    content.createdAt,
                                 ).toLocaleDateString("pt-BR")}
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <Badge
                                 className={
                                    STATUS_COLORS[content.status || "draft"]
                                 }
                                 variant="outline"
                              >
                                 {STATUS_LABELS[content.status || "draft"]}
                              </Badge>
                           </ItemActions>
                        </Item>
                        {index !== contents.length - 1 && <ItemSeparator />}
                     </Fragment>
                  ))}
               </ItemGroup>
            ) : (
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Sparkles className="size-6" />
                     </EmptyMedia>
                     <EmptyTitle>Nenhum Conteúdo Ainda</EmptyTitle>
                     <EmptyDescription>
                        Comece a criar seu primeiro conteúdo com IA
                     </EmptyDescription>
                  </EmptyContent>
               </Empty>
            )}
         </CardContent>
      </Card>
   );
}
