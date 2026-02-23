import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import { Input } from "@packages/ui/components/input";
import { Switch } from "@packages/ui/components/switch";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownToLine, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/sources",
)({
   component: SourcesPage,
});

type DataSourceEntry = {
   id: string;
   name: string;
   type: string;
   description: string | null;
   isActive: boolean;
   eventCount: number;
   lastEventAt: Date | null;
   createdAt: Date;
};

const typeColors: Record<string, string> = {
   sdk: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
   mcp: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
   webhook:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const typeLabels: Record<string, string> = {
   sdk: "SDK",
   mcp: "MCP",
   webhook: "Webhook",
};

const columns: ColumnDef<DataSourceEntry>[] = [
   {
      accessorKey: "name",
      header: "Fonte",
      cell: ({ row }) => (
         <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
               <span className="text-xs text-muted-foreground line-clamp-1">
                  {row.original.description}
               </span>
            )}
         </div>
      ),
   },
   {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
         <Badge
            className={typeColors[row.original.type] ?? ""}
            variant="secondary"
         >
            {typeLabels[row.original.type] ?? row.original.type}
         </Badge>
      ),
   },
   {
      accessorKey: "isActive",
      header: "Ativo",
      cell: ({ row }) => <Switch checked={row.original.isActive} disabled />,
   },
   {
      accessorKey: "eventCount",
      header: "Eventos",
      cell: ({ row }) => (
         <span className="text-sm font-medium tabular-nums">
            {row.original.eventCount.toLocaleString("pt-BR")}
         </span>
      ),
   },
   {
      accessorKey: "lastEventAt",
      header: "Último evento",
      cell: ({ row }) =>
         row.original.lastEventAt ? (
            <span className="text-sm text-muted-foreground">
               {format(new Date(row.original.lastEventAt), "dd MMM yyyy", {
                  locale: ptBR,
               })}
            </span>
         ) : (
            <span className="text-sm text-muted-foreground">—</span>
         ),
   },
   {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy", {
               locale: ptBR,
            })}
         </span>
      ),
   },
];

function SourcesPage() {
   const [search, setSearch] = useState("");
   const [typeFilter, setTypeFilter] = useState<string | null>(null);

   const { data: sources = [] } = useQuery(
      orpc.dataSources.list.queryOptions(),
   );

   const types = useMemo(
      () => [...new Set(sources.map((s) => s.type))],
      [sources],
   );

   const filtered = useMemo(() => {
      let result = sources;
      if (search) {
         const q = search.toLowerCase();
         result = result.filter(
            (s) =>
               s.name.toLowerCase().includes(q) ||
               (s.description?.toLowerCase().includes(q) ?? false),
         );
      }
      if (typeFilter) {
         result = result.filter((s) => s.type === typeFilter);
      }
      return result;
   }, [sources, search, typeFilter]);

   const stats = useMemo(() => {
      const total = sources.length;
      const active = sources.filter((s) => s.isActive).length;
      const totalEvents = sources.reduce((sum, s) => sum + s.eventCount, 0);
      return { total, active, totalEvents };
   }, [sources]);

   return (
      <div className="flex flex-col gap-6">
         <PageHeader
            description="Origens de dados que enviam eventos para o sistema"
            title="Fontes"
         />

         <div className="grid gap-4 sm:grid-cols-3">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Total de Fontes
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.total}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Ativas
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.active}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Total de Eventos
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">
                     {stats.totalEvents.toLocaleString("pt-BR")}
                  </p>
               </CardContent>
            </Card>
         </div>

         <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
               <Input
                  className="pl-8"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar fontes..."
                  value={search}
               />
            </div>
            <div className="flex gap-2 flex-wrap">
               <Badge
                  className="cursor-pointer"
                  onClick={() => setTypeFilter(null)}
                  variant={typeFilter === null ? "default" : "outline"}
               >
                  Todos
               </Badge>
               {types.map((type) => (
                  <Badge
                     className="cursor-pointer"
                     key={type}
                     onClick={() => setTypeFilter(type)}
                     variant={typeFilter === type ? "default" : "outline"}
                  >
                     {typeLabels[type] ?? type}
                  </Badge>
               ))}
            </div>
         </div>

         {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <ArrowDownToLine className="size-12 text-muted-foreground mb-4" />
               <p className="text-muted-foreground">Nenhuma fonte encontrada</p>
               <p className="text-sm text-muted-foreground mt-1">
                  Conecte o SDK ou configure um webhook para começar a receber
                  eventos
               </p>
            </div>
         ) : (
            <DataTable
               columns={columns}
               data={filtered}
               getRowId={(row) => row.id}
            />
         )}
      </div>
   );
}
