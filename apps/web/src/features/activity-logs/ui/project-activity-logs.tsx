import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import { Input } from "@packages/ui/components/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Filter, Search } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { orpc } from "@/integrations/orpc/client";

type ActivityLog = {
   id: string;
   action: string;
   resourceType: string;
   resourceId: string | null;
   resourceName: string | null;
   metadata: Record<string, unknown> | null;
   ipAddress: string | null;
   createdAt: Date;
   user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
   } | null;
};

const ACTION_LABELS: Record<string, string> = {
   created: "Criou",
   updated: "Atualizou",
   deleted: "Deletou",
   published: "Publicou",
   unpublished: "Despublicou",
};

const RESOURCE_LABELS: Record<string, string> = {
   content: "Conteúdo",
   form: "Formulário",
   dashboard: "Dashboard",
   insight: "Insight",
   integration: "Integração",
};

function formatDate(date: Date): string {
   return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
   }).format(date);
}

function ActivityLogsSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <Skeleton className="h-8 w-48" />
               <Skeleton className="h-4 w-96 mt-1" />
            </div>
            <Skeleton className="h-9 w-32" />
         </div>
         <div className="flex gap-3">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-40" />
         </div>
         <Skeleton className="h-[400px] w-full" />
      </div>
   );
}

function ActivityLogsErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Registro de Atividades
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Histórico completo de ações no projeto.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar o registro de atividades
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

function ActivityLogsContent({ teamId }: { teamId: string }) {
   const [page, setPage] = useState(1);
   const [actionFilter, setActionFilter] = useState<string>("");
   const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("");
   const [searchQuery, setSearchQuery] = useState("");
   const pageSize = 50;

   const { data: logsData } = useSuspenseQuery(
      orpc.activityLogs.getAll.queryOptions({
         input: {
            teamId,
            limit: pageSize,
            offset: (page - 1) * pageSize,
            action: actionFilter || undefined,
            resourceType: resourceTypeFilter || undefined,
         },
      }),
   );

   const { data: filters } = useSuspenseQuery(
      orpc.activityLogs.getFilters.queryOptions({
         input: { teamId },
      }),
   );

   const filteredLogs = useMemo(() => {
      if (!searchQuery.trim()) return logsData.logs;
      const query = searchQuery.toLowerCase();
      return logsData.logs.filter(
         (log) =>
            log.user?.name.toLowerCase().includes(query) ||
            log.user?.email.toLowerCase().includes(query) ||
            log.resourceName?.toLowerCase().includes(query),
      );
   }, [logsData.logs, searchQuery]);

   const columns: ColumnDef<ActivityLog>[] = useMemo(
      () => [
         {
            accessorKey: "createdAt",
            header: "Data/Hora",
            cell: ({ row }) => (
               <span className="text-sm text-muted-foreground">
                  {formatDate(new Date(row.original.createdAt))}
               </span>
            ),
         },
         {
            accessorKey: "user",
            header: "Usuário",
            cell: ({ row }) => {
               const user = row.original.user;
               if (!user) {
                  return (
                     <span className="text-sm text-muted-foreground">
                        Sistema
                     </span>
                  );
               }
               return (
                  <div className="flex items-center gap-2">
                     <Avatar className="size-6">
                        <AvatarImage
                           alt={user.name}
                           src={user.image || undefined}
                        />
                        <AvatarFallback className="text-xs">
                           {getInitials(user.name)}
                        </AvatarFallback>
                     </Avatar>
                     <span className="text-sm font-medium">{user.name}</span>
                  </div>
               );
            },
         },
         {
            accessorKey: "action",
            header: "Ação",
            cell: ({ row }) => (
               <Badge variant="outline">
                  {ACTION_LABELS[row.original.action] ?? row.original.action}
               </Badge>
            ),
         },
         {
            accessorKey: "resource",
            header: "Recurso",
            cell: ({ row }) => (
               <div className="flex flex-col">
                  <span className="text-sm font-medium">
                     {row.original.resourceName ?? "Sem nome"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                     {RESOURCE_LABELS[row.original.resourceType] ??
                        row.original.resourceType}
                  </span>
               </div>
            ),
         },
      ],
      [],
   );

   const totalPages = Math.ceil(logsData.total / pageSize);

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">
                  Registro de Atividades
               </h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Histórico completo de ações no projeto.
               </p>
            </div>
            <Button size="sm" variant="outline">
               <Download className="size-4 mr-2" />
               Exportar
            </Button>
         </div>

         <div className="flex gap-3">
            <div className="relative flex-1">
               <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
               <Input
                  className="pl-8 h-9"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por usuário ou recurso..."
                  value={searchQuery}
               />
            </div>

            <Select onValueChange={setActionFilter} value={actionFilter}>
               <SelectTrigger className="w-[180px] h-9">
                  <Filter className="size-4 mr-2" />
                  <SelectValue placeholder="Todas as ações" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="">Todas as ações</SelectItem>
                  {filters.actions.map((action) => (
                     <SelectItem key={action} value={action}>
                        {ACTION_LABELS[action] ?? action}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <Select
               onValueChange={setResourceTypeFilter}
               value={resourceTypeFilter}
            >
               <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Todos os recursos" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="">Todos os recursos</SelectItem>
                  {filters.resourceTypes.map((type) => (
                     <SelectItem key={type} value={type}>
                        {RESOURCE_LABELS[type] ?? type}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <DataTable
            columns={columns}
            data={filteredLogs}
            getRowId={(row) => row.id}
            pagination={{
               currentPage: page,
               totalPages,
               totalCount: logsData.total,
               pageSize,
               onPageChange: setPage,
            }}
         />
      </div>
   );
}

export function ProjectActivityLogs({ teamId }: { teamId: string }) {
   return (
      <ErrorBoundary FallbackComponent={ActivityLogsErrorFallback}>
         <Suspense fallback={<ActivityLogsSkeleton />}>
            <ActivityLogsContent teamId={teamId} />
         </Suspense>
      </ErrorBoundary>
   );
}
