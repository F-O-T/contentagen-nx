import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Edit, Eye, PenTool, Trash2 } from "lucide-react";
import { Fragment, useCallback, useMemo } from "react";
import { useDataTableSelection } from "@/features/data-table/hooks/use-data-table-selection";
import type {
   DataTableAction,
   DataTableBulkAction,
} from "@/features/data-table/types";
import { DataTableBulkBar } from "@/features/data-table/ui/data-table-bulk-bar";
import { DataTableContainer } from "@/features/data-table/ui/data-table-container";
import { DataTableExpandedActions } from "@/features/data-table/ui/data-table-expanded-actions";
import { DataTableSearchBar } from "@/features/data-table/ui/data-table-search-bar";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { ManageWriterForm } from "./manage-writer-form";
import { WritersMobileCard } from "./writers-mobile-card";
import { createWriterColumns, type Writer } from "./writers-table-columns";

type WritersDataTableProps = {
   writers: Writer[];
   filters: {
      searchTerm: string;
      onSearchChange: (value: string) => void;
      hasActiveFilters: boolean;
      onClearFilters: () => void;
   };
   onDelete?: (writerId: string) => void;
   onBulkDelete?: (writerIds: string[]) => void;
};

export function WritersDataTableSkeleton() {
   return (
      <DataTableContainer
         searchBar={<Skeleton className="h-9 flex-1 sm:max-w-md" />}
      >
         <ItemGroup>
            {Array.from({ length: 5 }).map((_, index) => (
               <Fragment key={`writer-skeleton-${index + 1}`}>
                  <div className="flex items-center p-4 gap-4">
                     <Skeleton className="size-10 rounded-full" />
                     <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                     </div>
                     <Skeleton className="h-4 w-12" />
                     <Skeleton className="h-4 w-20" />
                  </div>
                  {index !== 4 && <ItemSeparator />}
               </Fragment>
            ))}
         </ItemGroup>
      </DataTableContainer>
   );
}

export function WritersDataTable({
   writers,
   filters,
   onDelete,
   onBulkDelete,
}: WritersDataTableProps) {
   const { activeOrganization } = useActiveOrganization();
   const { openAlertDialog } = useAlertDialog();
   const { openSheet } = useSheet();
   const navigate = useNavigate();
   const { rowSelection, setRowSelection, selectionState, clearSelection } =
      useDataTableSelection<Writer>();

   const hasSearchTerm = filters.searchTerm.length > 0;

   const handleViewWriter = useCallback(
      (writer: Writer) => {
         navigate({
            to: "/$slug/writers/$writerId",
            params: {
               slug: activeOrganization.slug,
               writerId: writer.id,
            },
         });
      },
      [navigate, activeOrganization.slug],
   );

   const handleEditWriter = useCallback(
      (writer: Writer) => {
         openSheet({
            children: <ManageWriterForm writer={writer} />,
         });
      },
      [openSheet],
   );

   const handleDeleteWriter = useCallback(
      (writer: Writer) => {
         if (!onDelete) return;

         openAlertDialog({
            actionLabel: "Excluir",
            cancelLabel: "Cancelar",
            description: `Tem certeza que deseja excluir "${writer.personaConfig.metadata.name}"? Esta ação não pode ser desfeita.`,
            onAction: () => onDelete(writer.id),
            title: "Confirmar Exclusão",
            variant: "destructive",
         });
      },
      [onDelete, openAlertDialog],
   );

   // Expanded row actions
   const expandedActions: DataTableAction<Writer>[] = useMemo(
      () => [
         {
            id: "view",
            label: "Ver Detalhes",
            icon: <Eye className="size-4" />,
            onClick: handleViewWriter,
         },
         {
            id: "edit",
            label: "Editar",
            icon: <Edit className="size-4" />,
            onClick: handleEditWriter,
         },
         {
            id: "delete",
            label: "Excluir",
            icon: <Trash2 className="size-4" />,
            onClick: handleDeleteWriter,
            variant: "destructive",
            isVisible: () => onDelete !== undefined,
         },
      ],
      [handleViewWriter, handleEditWriter, handleDeleteWriter, onDelete],
   );

   // Bulk actions
   const bulkActions: DataTableBulkAction[] = useMemo(
      () =>
         onBulkDelete
            ? [
                 {
                    id: "delete",
                    label: "Excluir",
                    icon: <Trash2 className="size-3.5" />,
                    onClick: onBulkDelete,
                    variant: "destructive",
                    requiresConfirmation: true,
                    confirmationConfig: {
                       title: "Confirmar Exclusão",
                       description: `Tem certeza que deseja excluir ${selectionState.selectedCount} escritor(es)? Esta ação não pode ser desfeita.`,
                       actionLabel: "Excluir",
                    },
                 },
              ]
            : [],
      [onBulkDelete, selectionState.selectedCount],
   );

   // Filter writers based on search
   const filteredWriters = writers.filter((writer) => {
      if (filters.searchTerm === "") return true;

      const searchLower = filters.searchTerm.toLowerCase();
      const name = writer.personaConfig.metadata.name.toLowerCase();
      const description =
         writer.personaConfig.metadata.description?.toLowerCase() || "";

      return name.includes(searchLower) || description.includes(searchLower);
   });

   if (writers.length === 0 && !hasSearchTerm) {
      return (
         <DataTableContainer>
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <PenTool className="size-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>{"Nenhum escritor ainda"}</EmptyTitle>
                  <EmptyDescription>
                     {
                        "Crie seu primeiro escritor IA para começar a gerar conteúdo"
                     }
                  </EmptyDescription>
               </EmptyContent>
            </Empty>
         </DataTableContainer>
      );
   }

   return (
      <>
         <DataTableContainer
            searchBar={
               <DataTableSearchBar
                  hasActiveFilters={filters.hasActiveFilters}
                  onChange={filters.onSearchChange}
                  onClearFilters={filters.onClearFilters}
                  placeholder="Buscar escritores..."
                  value={filters.searchTerm}
               />
            }
         >
            {filteredWriters.length === 0 ? (
               <div className="py-8 text-center text-muted-foreground">
                  {"Nenhum escritor encontrado"}
               </div>
            ) : (
               <DataTable
                  columns={createWriterColumns(activeOrganization.slug)}
                  data={filteredWriters}
                  enableRowSelection
                  getRowId={(row) => row.id}
                  onRowSelectionChange={setRowSelection}
                  renderMobileCard={(props) => (
                     <WritersMobileCard
                        {...props}
                        actions={expandedActions}
                        slug={activeOrganization.slug}
                     />
                  )}
                  renderSubComponent={({ row }) => (
                     <DataTableExpandedActions
                        actions={expandedActions}
                        row={row.original}
                     />
                  )}
                  rowSelection={rowSelection}
               />
            )}
         </DataTableContainer>

         <DataTableBulkBar
            actions={bulkActions}
            onClearSelection={clearSelection}
            selectedIds={selectionState.selectedIds}
         />
      </>
   );
}
