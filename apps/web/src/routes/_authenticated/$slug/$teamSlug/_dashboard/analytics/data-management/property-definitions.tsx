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
import { Braces, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/property-definitions",
)({
   component: PropertyDefinitionsPage,
});

type PropertyDefinitionEntry = {
   id: string;
   name: string;
   type: string;
   description: string | null;
   isNumerical: boolean | null;
   eventNames: string[] | null;
   tags: string[] | null;
   createdAt: Date;
};

const typeColors: Record<string, string> = {
   string: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
   number:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
   boolean: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
   datetime:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
   array: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const columns: ColumnDef<PropertyDefinitionEntry>[] = [
   {
      accessorKey: "name",
      header: "Propriedade",
      cell: ({ row }) => (
         <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
               <span className="text-xs text-muted-foreground">
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
            {row.original.type}
         </Badge>
      ),
   },
   {
      accessorKey: "isNumerical",
      header: "Numérico",
      cell: ({ row }) => (
         <Switch checked={row.original.isNumerical ?? false} disabled />
      ),
   },
   {
      accessorKey: "eventNames",
      header: "Eventos",
      cell: ({ row }) => {
         const names = row.original.eventNames ?? [];
         if (names.length === 0) {
            return <span className="text-sm text-muted-foreground">—</span>;
         }
         return (
            <div className="flex flex-wrap gap-1">
               {names.slice(0, 2).map((name) => (
                  <Badge
                     className="text-xs font-mono"
                     key={name}
                     variant="outline"
                  >
                     {name}
                  </Badge>
               ))}
               {names.length > 2 && (
                  <Badge className="text-xs" variant="outline">
                     +{names.length - 2}
                  </Badge>
               )}
            </div>
         );
      },
   },
   {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
         const tags = row.original.tags ?? [];
         if (tags.length === 0) {
            return <span className="text-sm text-muted-foreground">—</span>;
         }
         return (
            <div className="flex flex-wrap gap-1">
               {tags.map((tag) => (
                  <Badge className="text-xs" key={tag} variant="secondary">
                     {tag}
                  </Badge>
               ))}
            </div>
         );
      },
   },
];

function PropertyDefinitionsPage() {
   const [search, setSearch] = useState("");
   const [typeFilter, setTypeFilter] = useState<string | null>(null);

   const { data: definitions = [] } = useQuery(
      orpc.propertyDefinitions.list.queryOptions(),
   );

   const types = useMemo(
      () => [...new Set(definitions.map((d) => d.type))],
      [definitions],
   );

   const filtered = useMemo(() => {
      let result = definitions;
      if (search) {
         const q = search.toLowerCase();
         result = result.filter(
            (d) =>
               d.name.toLowerCase().includes(q) ||
               (d.description?.toLowerCase().includes(q) ?? false),
         );
      }
      if (typeFilter) {
         result = result.filter((d) => d.type === typeFilter);
      }
      return result;
   }, [definitions, search, typeFilter]);

   const stats = useMemo(() => {
      const total = definitions.length;
      const numerical = definitions.filter((d) => d.isNumerical).length;
      return { total, numerical, types: types.length };
   }, [definitions, types]);

   return (
      <div className="flex flex-col gap-6">
         <div>
            <h2 className="text-2xl font-bold tracking-tight">
               Definições de Propriedades
            </h2>
            <p className="text-muted-foreground">
               Propriedades customizadas associadas a eventos
            </p>
         </div>

         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Total de Propriedades
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.total}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Numéricas
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.numerical}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Tipos
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.types}</p>
               </CardContent>
            </Card>
         </div>

         <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
               <Input
                  className="pl-8"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar propriedades..."
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
                     {type}
                  </Badge>
               ))}
            </div>
         </div>

         {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <Braces className="size-12 text-muted-foreground mb-4" />
               <p className="text-muted-foreground">
                  Nenhuma propriedade encontrada
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
