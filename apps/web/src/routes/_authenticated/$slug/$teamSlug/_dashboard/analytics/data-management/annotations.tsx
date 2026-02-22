import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import { Input } from "@packages/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StickyNote } from "lucide-react";
import { useMemo, useState } from "react";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/annotations",
)({
   component: AnnotationsPage,
});

type AnnotationEntry = {
   id: string;
   title: string;
   description: string | null;
   date: Date;
   scope: string;
   type: string;
   createdAt: Date;
};

const scopeColors: Record<string, string> = {
   global: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
   content: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
   forms: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
   ai: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const scopeLabels: Record<string, string> = {
   global: "Global",
   content: "Conteúdo",
   forms: "Formulários",
   ai: "IA",
};

const columns: ColumnDef<AnnotationEntry>[] = [
   {
      accessorKey: "title",
      header: "Anotação",
      cell: ({ row }) => (
         <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.title}</span>
            {row.original.description && (
               <span className="text-xs text-muted-foreground line-clamp-1">
                  {row.original.description}
               </span>
            )}
         </div>
      ),
   },
   {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.date), "dd MMM yyyy", {
               locale: ptBR,
            })}
         </span>
      ),
   },
   {
      accessorKey: "scope",
      header: "Escopo",
      cell: ({ row }) => (
         <Badge
            className={scopeColors[row.original.scope] ?? ""}
            variant="secondary"
         >
            {scopeLabels[row.original.scope] ?? row.original.scope}
         </Badge>
      ),
   },
   {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
         <Badge
            variant={row.original.type === "auto" ? "secondary" : "outline"}
         >
            {row.original.type === "auto" ? "Automático" : "Manual"}
         </Badge>
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

function AnnotationsPage() {
   const [search, setSearch] = useState("");
   const [scopeFilter, setScopeFilter] = useState<string | null>(null);

   const { data } = useQuery(
      orpc.annotations.list.queryOptions({ input: { page: 1, limit: 100 } }),
   );

   const annotations = data?.items ?? [];

   const scopes = useMemo(
      () => [...new Set(annotations.map((a) => a.scope))],
      [annotations],
   );

   const filtered = useMemo(() => {
      let result = annotations;
      if (search) {
         const q = search.toLowerCase();
         result = result.filter(
            (a) =>
               a.title.toLowerCase().includes(q) ||
               (a.description?.toLowerCase().includes(q) ?? false),
         );
      }
      if (scopeFilter) {
         result = result.filter((a) => a.scope === scopeFilter);
      }
      return result;
   }, [annotations, search, scopeFilter]);

   const stats = useMemo(() => {
      const total = annotations.length;
      const manual = annotations.filter((a) => a.type === "manual").length;
      const auto = total - manual;
      return { total, manual, auto };
   }, [annotations]);

   return (
      <div className="flex flex-col gap-6">
         <div>
            <h2 className="text-2xl font-bold tracking-tight">Anotações</h2>
            <p className="text-muted-foreground">
               Notas e marcadores associados a períodos de dados
            </p>
         </div>

         <div className="grid gap-4 sm:grid-cols-3">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Total
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.total}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Manuais
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.manual}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Automáticas
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{stats.auto}</p>
               </CardContent>
            </Card>
         </div>

         <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
               <span className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none flex items-center">
                  <svg
                     aria-hidden="true"
                     fill="none"
                     height="16"
                     stroke="currentColor"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth="2"
                     viewBox="0 0 24 24"
                     width="16"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                     <circle cx="11" cy="11" r="8" />
                     <path d="m21 21-4.3-4.3" />
                  </svg>
               </span>
               <Input
                  className="pl-8"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar anotações..."
                  value={search}
               />
            </div>
            <div className="flex gap-2 flex-wrap">
               <Badge
                  className="cursor-pointer"
                  onClick={() => setScopeFilter(null)}
                  variant={scopeFilter === null ? "default" : "outline"}
               >
                  Todos
               </Badge>
               {scopes.map((scope) => (
                  <Badge
                     className="cursor-pointer"
                     key={scope}
                     onClick={() => setScopeFilter(scope)}
                     variant={scopeFilter === scope ? "default" : "outline"}
                  >
                     {scopeLabels[scope] ?? scope}
                  </Badge>
               ))}
            </div>
         </div>

         {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <StickyNote className="size-12 text-muted-foreground mb-4" />
               <p className="text-muted-foreground">
                  Nenhuma anotação encontrada
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
