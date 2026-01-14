import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
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
import {
   Archive,
   Copy,
   Eye,
   FileSearch,
   FileText,
   Link2,
   LockKeyhole,
   PenLine,
   PenTool,
   Send,
   Share2,
   Trash2,
} from "lucide-react";
import { Fragment, useCallback, useMemo } from "react";
import { toast } from "sonner";
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
import { ContentMobileCard } from "./content-mobile-card";
import {
   type ContentItem,
   createContentColumns,
} from "./content-table-columns";

type ContentDataTableProps = {
   contents: ContentItem[];
   filters: {
      searchTerm: string;
      onSearchChange: (value: string) => void;
      statusFilter: string;
      onStatusFilterChange: (value: string) => void;
      hasActiveFilters: boolean;
      onClearFilters: () => void;
   };
   onDelete?: (contentId: string) => void;
   onBulkDelete?: (contentIds: string[]) => void;
   onPublish?: (contentId: string) => void;
   onArchive?: (contentId: string) => void;
   onMarkAsDraft?: (contentId: string) => void;
   onToggleShare?: (contentId: string, shared: boolean) => void;
};

export function ContentDataTableSkeleton() {
   return (
      <DataTableContainer
         searchBar={<Skeleton className="h-9 flex-1 sm:max-w-md" />}
      >
         <ItemGroup>
            {Array.from({ length: 5 }).map((_, index) => (
               <Fragment key={`content-skeleton-${index + 1}`}>
                  <div className="flex items-center p-4 gap-4">
                     <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                     </div>
                     <Skeleton className="h-6 w-6 rounded-full" />
                     <Skeleton className="h-6 w-16" />
                     <Skeleton className="h-4 w-20" />
                  </div>
                  {index !== 4 && <ItemSeparator />}
               </Fragment>
            ))}
         </ItemGroup>
      </DataTableContainer>
   );
}

export function ContentDataTable({
   contents,
   filters,
   onDelete,
   onBulkDelete,
   onPublish,
   onArchive,
   onMarkAsDraft,
   onToggleShare,
}: ContentDataTableProps) {
   const { activeOrganization } = useActiveOrganization();
   const { openAlertDialog } = useAlertDialog();
   const navigate = useNavigate();
   const { rowSelection, setRowSelection, selectionState, clearSelection } =
      useDataTableSelection<ContentItem>();

   const hasSearchTerm = filters.searchTerm.length > 0;
   const hasStatusFilter = filters.statusFilter !== "all";

   const handleViewContent = useCallback(
      (content: ContentItem) => {
         navigate({
            to: "/$slug/content/$contentId",
            params: {
               slug: activeOrganization.slug,
               contentId: content.id,
            },
         });
      },
      [navigate, activeOrganization.slug],
   );

   const handleCopyLink = useCallback(
      (content: ContentItem) => {
         const url = `${window.location.origin}/${activeOrganization.slug}/content/${content.id}`;
         navigator.clipboard.writeText(url);
         toast.success("Link copiado!");
      },
      [activeOrganization.slug],
   );

   const handlePreview = useCallback((content: ContentItem) => {
      window.open(`/share/${content.id}`, "_blank");
   }, []);

   const handleToggleShare = useCallback(
      (content: ContentItem) => {
         if (!onToggleShare) return;

         if (content.shareStatus === "shared") {
            // Unshare
            onToggleShare(content.id, false);
         } else {
            // Share and copy link
            const shareUrl = `${window.location.origin}/share/${content.id}`;
            navigator.clipboard.writeText(shareUrl);
            onToggleShare(content.id, true);
            toast.success("Link público copiado!");
         }
      },
      [onToggleShare],
   );

   const handleMarkAsDraft = useCallback(
      (content: ContentItem) => {
         if (!onMarkAsDraft) return;
         onMarkAsDraft(content.id);
      },
      [onMarkAsDraft],
   );

   const handleDeleteContent = useCallback(
      (content: ContentItem) => {
         if (!onDelete) return;

         openAlertDialog({
            actionLabel: "Excluir",
            cancelLabel: "Cancelar",
            description: `Tem certeza que deseja excluir "${content.meta.title}"? Esta ação não pode ser desfeita.`,
            onAction: () => onDelete(content.id),
            title: "Confirmar Exclusão",
            variant: "destructive",
         });
      },
      [onDelete, openAlertDialog],
   );

   const handlePublishContent = useCallback(
      (content: ContentItem) => {
         if (!onPublish) return;
         onPublish(content.id);
      },
      [onPublish],
   );

   const handleArchiveContent = useCallback(
      (content: ContentItem) => {
         if (!onArchive) return;
         onArchive(content.id);
      },
      [onArchive],
   );

   // Expanded row actions
   const expandedActions: DataTableAction<ContentItem>[] = useMemo(
      () => [
         {
            id: "view",
            label: "Ver Detalhes",
            icon: <Eye className="size-4" />,
            onClick: handleViewContent,
         },
         {
            id: "copy-link",
            label: "Copiar Link",
            icon: <Link2 className="size-4" />,
            onClick: handleCopyLink,
         },
         {
            id: "preview",
            label: "Visualizar",
            icon: <FileSearch className="size-4" />,
            onClick: handlePreview,
            isVisible: (content) => content.status === "published",
         },
         {
            id: "share",
            label: "Compartilhar",
            icon: <Share2 className="size-4" />,
            onClick: handleToggleShare,
            isVisible: (content) =>
               content.status === "published" &&
               content.shareStatus !== "shared" &&
               onToggleShare !== undefined,
         },
         {
            id: "unshare",
            label: "Tornar Privado",
            icon: <LockKeyhole className="size-4" />,
            onClick: handleToggleShare,
            isVisible: (content) =>
               content.shareStatus === "shared" && onToggleShare !== undefined,
         },
         {
            id: "duplicate",
            label: "Duplicar",
            icon: <Copy className="size-4" />,
            onClick: () => {}, // TODO: implement duplicate
            isVisible: () => false, // Hide for now
         },
         {
            id: "mark-draft",
            label: "Marcar como Rascunho",
            icon: <PenLine className="size-4" />,
            onClick: handleMarkAsDraft,
            isVisible: (content) =>
               content.status !== "draft" && onMarkAsDraft !== undefined,
         },
         {
            id: "publish",
            label: "Publicar",
            icon: <Send className="size-4" />,
            onClick: handlePublishContent,
            isVisible: (content) =>
               content.status === "draft" && onPublish !== undefined,
         },
         {
            id: "archive",
            label: "Arquivar",
            icon: <Archive className="size-4" />,
            onClick: handleArchiveContent,
            isVisible: (content) =>
               content.status !== "archived" && onArchive !== undefined,
         },
         {
            id: "delete",
            label: "Excluir",
            icon: <Trash2 className="size-4" />,
            onClick: handleDeleteContent,
            variant: "destructive",
            isVisible: () => onDelete !== undefined,
         },
      ],
      [
         onDelete,
         onPublish,
         onArchive,
         onMarkAsDraft,
         onToggleShare,
         handleViewContent,
         handleCopyLink,
         handlePreview,
         handleToggleShare,
         handleMarkAsDraft,
         handleDeleteContent,
         handlePublishContent,
         handleArchiveContent,
      ],
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
                       description: `Tem certeza que deseja excluir ${selectionState.selectedCount} conteúdo(s)? Esta ação não pode ser desfeita.`,
                       actionLabel: "Excluir",
                    },
                 },
              ]
            : [],
      [onBulkDelete, selectionState.selectedCount],
   );

   // Filter contents based on search and status
   const filteredContents = contents.filter((content) => {
      const matchesSearch =
         filters.searchTerm === "" ||
         content.meta.title
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
         content.meta.description
            ?.toLowerCase()
            .includes(filters.searchTerm.toLowerCase());

      const matchesStatus =
         filters.statusFilter === "all" ||
         content.status === filters.statusFilter;

      return matchesSearch && matchesStatus;
   });

   if (contents.length === 0 && !hasSearchTerm && !hasStatusFilter) {
      return (
         <DataTableContainer>
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <FileText className="size-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>{"Nenhum conteúdo ainda"}</EmptyTitle>
                  <EmptyDescription>
                     {"Crie seu primeiro conteúdo para começar"}
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
                  placeholder="Buscar conteúdos..."
                  value={filters.searchTerm}
               />
            }
         >
            {filteredContents.length === 0 ? (
               <div className="py-8 text-center text-muted-foreground">
                  {"Nenhum conteúdo encontrado"}
               </div>
            ) : (
               <DataTable
                  columns={createContentColumns(activeOrganization.slug)}
                  data={filteredContents}
                  enableRowSelection
                  getRowId={(row) => row.id}
                  onRowSelectionChange={setRowSelection}
                  renderMobileCard={(props) => (
                     <ContentMobileCard
                        {...props}
                        actions={expandedActions}
                        slug={activeOrganization.slug}
                     />
                  )}
                  renderSubComponent={({ row }) => {
                     const content = row.original;
                     const agent = content.writer;

                     return (
                        <DataTableExpandedActions
                           actions={expandedActions}
                           metadata={
                              agent && (
                                 <Announcement className="w-fit">
                                    <AnnouncementTag>
                                       <PenTool className="size-3" />
                                    </AnnouncementTag>
                                    <AnnouncementTitle>
                                       Escrito por {agent.name}
                                    </AnnouncementTitle>
                                 </Announcement>
                              )
                           }
                           row={row.original}
                        />
                     );
                  }}
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
