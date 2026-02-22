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
import { Bolt, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/actions",
)({
   component: ActionsPage,
});

type ActionEntry = {
   id: string;
   name: string;
   description: string | null;
   eventPatterns: string[];
   matchType: string;
   isActive: boolean;
   createdAt: Date;
};

const matchTypeLabels: Record<string, string> = {
   any: "Qualquer",
   all: "Todos",
};

const columns: ColumnDef<ActionEntry>[] = [
   {
      accessorKey: "name",
      header: "Ação",
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
      accessorKey: "eventPatterns",
      header: "Padrões de Evento",
      cell: ({ row }) => {
         const patterns = row.original.eventPatterns;
         return (
            <div className="flex flex-wrap gap-1">
               {patterns.slice(0, 2).map((pattern) => (
                  <Badge
                     className="text-xs font-mono"
                     key={pattern}
                     variant="outline"
                  >
                     {pattern}
                  </Badge>
               ))}
               {patterns.length > 2 && (
                  <Badge className="text-xs" variant="outline">
                     +{patterns.length - 2}
                  </Badge>
               )}
            </div>
         );
      },
   },
   {
      accessorKey: "matchType",
      header: "Correspondência",
      cell: ({ row }) => (
         <Badge variant="secondary">
            {matchTypeLabels[row.original.matchType] ?? row.original.matchType}
         </Badge>
      ),
   },
   {
      accessorKey: "isActive",
      header: "Ativo",
      cell: ({ row }) => <Switch checked={row.original.isActive} disabled />,
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

function ActionsPage() {
   const [search, setSearch] = useState("");

   const { data: actions = [] } = useQuery(orpc.actions.list.queryOptions());

   const filtered = useMemo(() => {
      if (!search) return actions;
      const q = search.toLowerCase();
      return actions.filter(
         (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.description?.toLowerCase().includes(q) ?? false) ||
            a.eventPatterns.some((p) => p.toLowerCase().includes(q)),
      );
   }, [actions, search]);

   const stats = useMemo(() => {
      const total = actions.length;
      const active = actions.filter((a) => a.isActive).length;
      const totalPatterns = actions.reduce(
         (sum, a) => sum + a.eventPatterns.length,
         0,
      );
      return { total, active, totalPatterns };
   }, [actions]);

   return (
      <div className="flex flex-col gap-6">
         <div>
            <h2 className="text-2xl font-bold tracking-tight">Ações</h2>
            <p className="text-muted-foreground">
               Regras que disparam quando padrões de eventos são detectados
            </p>
         </div>

         <div className="grid gap-4 sm:grid-cols-3">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Total de Ações
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
                     Padrões Configurados
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.totalPatterns}</p>
               </CardContent>
            </Card>
         </div>

         <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
            <Input
               className="pl-8 max-w-sm"
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Pesquisar ações..."
               value={search}
            />
         </div>

         {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <Bolt className="size-12 text-muted-foreground mb-4" />
               <p className="text-muted-foreground">Nenhuma ação encontrada</p>
               <p className="text-sm text-muted-foreground mt-1">
                  Crie ações para automatizar processos com base em eventos
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
