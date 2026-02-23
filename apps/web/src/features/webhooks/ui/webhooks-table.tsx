import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Edit, Trash2, Zap } from "lucide-react";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";
import { WebhookDeliveriesTable } from "./webhook-deliveries-table";

export type WebhookEndpoint = {
   id: string;
   url: string;
   description: string | null;
   eventPatterns: string[];
   signingSecret: string;
   isActive: boolean;
   failureCount: number;
   lastSuccessAt?: Date | string | null;
   lastFailureAt?: Date | string | null;
   organizationId: string;
   teamId: string;
   apiKeyId?: string | null;
   createdAt: Date | string;
   updatedAt: Date | string;
};

interface WebhooksTableProps {
   webhooks: WebhookEndpoint[];
   isLoading?: boolean;
   onEdit: (webhook: WebhookEndpoint) => void;
   onDelete: (webhook: WebhookEndpoint) => void;
}

function formatTimestamp(value?: Date | string | null) {
   if (!value) return "-";
   const date = typeof value === "string" ? new Date(value) : value;
   return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
   });
}

function buildEventSummary(events: string[]) {
   if (events.length === 0) return "Nenhum";
   if (events.length === 1) return "1 evento";
   return `${events.length} eventos`;
}

function WebhookMobileCard({
   webhook,
   onEdit,
   onDelete,
   onToggleDeliveries,
   isExpanded,
}: {
   webhook: WebhookEndpoint;
   onEdit: (webhook: WebhookEndpoint) => void;
   onDelete: (webhook: WebhookEndpoint) => void;
   onToggleDeliveries: () => void;
   isExpanded: boolean;
}) {
   return (
      <div className="rounded-lg border bg-background p-4 space-y-3">
         <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
               <p className="font-medium truncate">{webhook.url}</p>
               {webhook.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                     {webhook.description}
                  </p>
               )}
            </div>
            <Badge variant={webhook.isActive ? "default" : "secondary"}>
               {webhook.isActive ? "Ativo" : "Inativo"}
            </Badge>
         </div>
         <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
               <Zap className="size-3" /> {webhook.eventPatterns.length} eventos
            </span>
            <span className="flex items-center gap-1">
               <Activity className="size-3" />
               {webhook.lastSuccessAt ? "Sucesso" : "Sem entregas"}
            </span>
         </div>
         <div className="flex items-center gap-2">
            <Button onClick={() => onEdit(webhook)} size="sm" variant="outline">
               <Edit className="size-3 mr-2" />
               Editar
            </Button>
            <Button onClick={onToggleDeliveries} size="sm" variant="ghost">
               <Activity className="size-3 mr-2" />
               {isExpanded ? "Ocultar" : "Entregas"}
            </Button>
            <Button
               className="text-destructive"
               onClick={() => onDelete(webhook)}
               size="sm"
               variant="ghost"
            >
               <Trash2 className="size-3 mr-2" />
               Excluir
            </Button>
         </div>
      </div>
   );
}

export function WebhooksTable({
   webhooks,
   isLoading,
   onEdit,
   onDelete,
}: WebhooksTableProps) {
   const columns = useMemo<ColumnDef<WebhookEndpoint>[]>(
      () => [
         {
            accessorKey: "url",
            header: "URL",
            cell: ({ row }) => (
               <div className="min-w-0">
                  <p className="font-medium truncate max-w-[320px]">
                     {row.original.url}
                  </p>
                  {row.original.description && (
                     <p className="text-xs text-muted-foreground truncate max-w-[320px]">
                        {row.original.description}
                     </p>
                  )}
               </div>
            ),
            maxSize: 340,
         },
         {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
               <Badge variant={row.original.isActive ? "default" : "secondary"}>
                  {row.original.isActive ? "Ativo" : "Inativo"}
               </Badge>
            ),
         },
         {
            accessorKey: "eventPatterns",
            header: "Eventos",
            cell: ({ row }) => (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <span className="text-sm text-muted-foreground cursor-help">
                        {buildEventSummary(row.original.eventPatterns)}
                     </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[320px]">
                     <div className="space-y-1">
                        {row.original.eventPatterns.map((event) => (
                           <div className="font-mono text-xs" key={event}>
                              {event}
                           </div>
                        ))}
                     </div>
                  </TooltipContent>
               </Tooltip>
            ),
         },
         {
            accessorKey: "lastSuccessAt",
            header: "Último sucesso",
            cell: ({ row }) => (
               <span className="text-sm text-muted-foreground">
                  {formatTimestamp(row.original.lastSuccessAt)}
               </span>
            ),
         },
         {
            accessorKey: "lastFailureAt",
            header: "Última falha",
            cell: ({ row }) => (
               <span
                  className={cn(
                     "text-sm",
                     !row.original.lastFailureAt && "text-muted-foreground",
                  )}
               >
                  {formatTimestamp(row.original.lastFailureAt)}
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
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           onClick={() => onEdit(row.original)}
                           size="icon"
                           variant="ghost"
                        >
                           <Edit className="size-4" />
                           <span className="sr-only">Editar</span>
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
               </div>
            ),
         },
      ],
      [onDelete, onEdit],
   );

   if (isLoading) {
      return (
         <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
               <Skeleton
                  className="h-12 w-full"
                  key={`webhook-skeleton-${index + 1}`}
               />
            ))}
         </div>
      );
   }

   return (
      <DataTable
         columns={columns}
         data={webhooks}
         getRowId={(row) => row.id}
         renderMobileCard={({ row, toggleExpanded, isExpanded }) => (
            <div className="space-y-2">
               <WebhookMobileCard
                  isExpanded={isExpanded}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onToggleDeliveries={toggleExpanded}
                  webhook={row.original}
               />
            </div>
         )}
         renderSubComponent={({ row }) => (
            <div className="space-y-4">
               <div className="px-4 pt-4 flex items-center gap-2 flex-wrap border-b pb-4">
                  <Button
                     className="text-destructive hover:text-destructive"
                     onClick={() => onDelete(row.original)}
                     size="sm"
                     variant="ghost"
                  >
                     <Trash2 className="size-3 mr-2" />
                     Excluir
                  </Button>
               </div>
               <WebhookDeliveriesPanel
                  isExpanded={row.getIsExpanded()}
                  webhookId={row.original.id}
               />
            </div>
         )}
      />
   );
}

function WebhookDeliveriesPanel({
   webhookId,
   isExpanded,
}: {
   webhookId: string;
   isExpanded: boolean;
}) {
   const { data, isLoading } = useQuery({
      ...orpc.webhooks.deliveries.queryOptions({
         input: { webhookId, page: 1, limit: 10 },
      }),
      enabled: isExpanded,
   });

   if (isLoading) {
      return (
         <div className="p-4">
            <div className="space-y-2">
               {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                     className="h-8 w-full"
                     key={`delivery-skeleton-${index + 1}`}
                  />
               ))}
            </div>
         </div>
      );
   }

   return <WebhookDeliveriesTable deliveries={data?.items ?? []} />;
}
