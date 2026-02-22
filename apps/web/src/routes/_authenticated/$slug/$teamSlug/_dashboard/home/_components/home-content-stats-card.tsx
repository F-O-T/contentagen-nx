import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   type ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { Archive, CheckCircle, FileText, PenLine } from "lucide-react";
import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { orpc } from "@/integrations/orpc/client";

const statusChartConfig = {
   draft: { label: "Rascunhos", color: "hsl(45 93% 47%)" },
   published: { label: "Publicados", color: "hsl(142 71% 45%)" },
   archived: { label: "Arquivados", color: "hsl(215 16% 47%)" },
} satisfies ChartConfig;

export function HomeContentStatsCard({ className }: { className?: string }) {
   const options = useMemo(
      () =>
         orpc.content.listAllContent.queryOptions({
            input: {
               limit: 100,
               page: 1,
               status: ["draft", "published", "archived"],
            },
         }),
      [],
   );

   const { data } = useSuspenseQuery(options);

   const stats = {
      archived: data.items.filter((item) => item.status === "archived").length,
      draft: data.items.filter((item) => item.status === "draft").length,
      published: data.items.filter((item) => item.status === "published")
         .length,
      total: data.total,
   };

   const statusData = [
      { status: "draft", count: stats.draft, fill: "var(--color-draft)" },
      {
         status: "published",
         count: stats.published,
         fill: "var(--color-published)",
      },
      {
         status: "archived",
         count: stats.archived,
         fill: "var(--color-archived)",
      },
   ];

   return (
      <Card className={cn("border-l-4 border-l-primary/80", className)}>
         <CardHeader className="pb-2">
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
               CONTENT OVERVIEW • ALL TIME
            </div>
            <CardTitle className="text-base font-semibold leading-tight mb-1">
               Visão Geral
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
               Seus conteúdos em resumo
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <ClientOnly
               fallback={<div className="mx-auto aspect-square h-[180px]" />}
            >
               <ChartContainer
                  className="mx-auto h-[180px] w-[180px] aspect-auto"
                  config={statusChartConfig}
               >
                  <PieChart>
                     <ChartTooltip
                        content={(props) => (
                           <ChartTooltipContent {...props} hideLabel />
                        )}
                     />
                     <Pie
                        data={statusData}
                        dataKey="count"
                        innerRadius={50}
                        nameKey="status"
                        outerRadius={75}
                        strokeWidth={2}
                     >
                        {statusData.map((entry) => (
                           <Cell fill={entry.fill} key={entry.status} />
                        ))}
                        <Label
                           content={({ viewBox }) => {
                              if (
                                 viewBox &&
                                 "cx" in viewBox &&
                                 "cy" in viewBox
                              ) {
                                 return (
                                    <text
                                       dominantBaseline="middle"
                                       textAnchor="middle"
                                       x={viewBox.cx}
                                       y={viewBox.cy}
                                    >
                                       <tspan
                                          className="fill-foreground text-2xl font-bold"
                                          x={viewBox.cx}
                                          y={viewBox.cy}
                                       >
                                          {stats.total}
                                       </tspan>
                                       <tspan
                                          className="fill-muted-foreground text-xs"
                                          x={viewBox.cx}
                                          y={(viewBox.cy || 0) + 18}
                                       >
                                          Total
                                       </tspan>
                                    </text>
                                 );
                              }
                           }}
                        />
                     </Pie>
                     <ChartLegend
                        content={<ChartLegendContent nameKey="status" />}
                     />
                  </PieChart>
               </ChartContainer>
            </ClientOnly>

            <div className="grid grid-cols-2 gap-3">
               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <FileText className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {stats.total}
                     </ItemTitle>
                     <ItemDescription>Total</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <PenLine className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {stats.draft}
                     </ItemTitle>
                     <ItemDescription>Rascunhos</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <CheckCircle className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {stats.published}
                     </ItemTitle>
                     <ItemDescription>Publicados</ItemDescription>
                  </ItemContent>
               </Item>

               <Item className="rounded-lg" size="sm" variant="muted">
                  <ItemMedia variant="icon">
                     <Archive className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="text-xl font-bold tabular-nums">
                        {stats.archived}
                     </ItemTitle>
                     <ItemDescription>Arquivados</ItemDescription>
                  </ItemContent>
               </Item>
            </div>
         </CardContent>
      </Card>
   );
}
