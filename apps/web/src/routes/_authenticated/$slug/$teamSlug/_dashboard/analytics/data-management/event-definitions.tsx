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
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/event-definitions",
)({
   component: EventDefinitionsPage,
});

type EventEntry = {
   id: string;
   eventName: string;
   category: string;
   displayName: string;
   description: string | null;
   pricePerEvent: string;
   freeTierLimit: number;
   isBillable: boolean;
   isActive: boolean;
};

const categoryColors: Record<string, string> = {
   content: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
   ai: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
   platform:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
   forms: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const columns: ColumnDef<EventEntry>[] = [
   {
      accessorKey: "displayName",
      header: "Evento",
      cell: ({ row }) => (
         <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.displayName}</span>
            <span className="text-xs text-muted-foreground font-mono">
               {row.original.eventName}
            </span>
         </div>
      ),
   },
   {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => (
         <Badge
            className={categoryColors[row.original.category] ?? ""}
            variant="secondary"
         >
            {row.original.category}
         </Badge>
      ),
   },
   {
      accessorKey: "pricePerEvent",
      header: "Preço/Evento",
      cell: ({ row }) => (
         <span className="font-mono text-sm">
            R$ {row.original.pricePerEvent}
         </span>
      ),
   },
   {
      accessorKey: "freeTierLimit",
      header: "Limite Free",
      cell: ({ row }) => (
         <span className="text-sm">
            {row.original.freeTierLimit.toLocaleString("pt-BR")}
         </span>
      ),
   },
   {
      accessorKey: "isBillable",
      header: "Faturável",
      cell: ({ row }) => (
         <Badge variant={row.original.isBillable ? "default" : "secondary"}>
            {row.original.isBillable ? "Sim" : "Não"}
         </Badge>
      ),
   },
   {
      accessorKey: "isActive",
      header: "Ativo",
      cell: ({ row }) => <Switch checked={row.original.isActive} disabled />,
   },
];

function EventDefinitionsPage() {
   const [search, setSearch] = useState("");
   const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

   const { data: events = [] } = useQuery(
      orpc.eventCatalog.list.queryOptions(),
   );

   const categories = useMemo(
      () => [...new Set(events.map((e) => e.category))],
      [events],
   );

   const filtered = useMemo(() => {
      let result = events;
      if (search) {
         const q = search.toLowerCase();
         result = result.filter(
            (e) =>
               e.displayName.toLowerCase().includes(q) ||
               e.eventName.toLowerCase().includes(q),
         );
      }
      if (categoryFilter) {
         result = result.filter((e) => e.category === categoryFilter);
      }
      return result;
   }, [events, search, categoryFilter]);

   const stats = useMemo(() => {
      const total = events.length;
      const billable = events.filter((e) => e.isBillable).length;
      const free = total - billable;
      return { total, billable, free, categories: categories.length };
   }, [events, categories]);

   return (
      <div className="flex flex-col gap-6">
         <div>
            <h2 className="text-2xl font-bold tracking-tight">
               Definições de Eventos
            </h2>
            <p className="text-muted-foreground">
               Catálogo de eventos do sistema com preços e limites
            </p>
         </div>

         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Total de Eventos
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.total}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Faturáveis
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.billable}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Gratuitos
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.free}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Categorias
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.categories}</p>
               </CardContent>
            </Card>
         </div>

         <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
               <Input
                  className="pl-8"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar eventos..."
                  value={search}
               />
            </div>
            <div className="flex gap-2 flex-wrap">
               <Badge
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter(null)}
                  variant={categoryFilter === null ? "default" : "outline"}
               >
                  Todos
               </Badge>
               {categories.map((cat) => (
                  <Badge
                     className="cursor-pointer"
                     key={cat}
                     onClick={() => setCategoryFilter(cat)}
                     variant={categoryFilter === cat ? "default" : "outline"}
                  >
                     {cat}
                  </Badge>
               ))}
            </div>
         </div>

         {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <BookOpen className="size-12 text-muted-foreground mb-4" />
               <p className="text-muted-foreground">Nenhum evento encontrado</p>
            </div>
         ) : (
            <DataTable columns={columns} data={filtered} />
         )}
      </div>
   );
}
