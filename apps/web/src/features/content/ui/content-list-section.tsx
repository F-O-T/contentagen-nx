import { useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Input } from "@packages/ui/components/input";
import { useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { Row } from "@tanstack/react-table";
import { Archive, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import { useActiveTeam } from "@/hooks/use-active-team";
import { orpc } from "@/integrations/orpc/client";
import {
   createContentCollection,
   type ContentRow,
} from "../collections/content-collection";
import { ContentMobileCard } from "./content-mobile-card";
import type { ContentItem } from "./content-table-columns";
import { createContentColumns } from "./content-table-columns";

const STATUS_FILTER_OPTIONS = [
   { label: "Todos", value: "all" },
   { label: "Rascunho", value: "draft" },
   { label: "Publicado", value: "published" },
   { label: "Arquivado", value: "archived" },
] as const;

function mapContentRow(row: ContentRow): ContentItem {
   const meta = row.meta as {
      title?: string;
      description?: string;
      slug?: string;
   };
   return {
      id: row.id,
      status: row.status,
      shareStatus: row.share_status ?? "private",
      draftOrigin: row.draft_origin ?? "manual",
      meta: {
         title: meta.title ?? "",
         description: meta.description,
         slug: meta.slug ?? "",
      },
      createdAt: row.created_at,
   };
}

function ContentListSectionInner() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(20);

   // Get teamId from active team session
   const { activeTeamId } = useActiveTeam();
   const teamId = activeTeamId ?? "";

   // Electric live collection — stable reference per teamId
   const collection = useMemo(
      () => createContentCollection(teamId),
      [teamId],
   );

   // Live query — always called unconditionally (React rules of hooks)
   const { data: rawRows, isLoading } = useLiveQuery(
      (q) => (teamId && collection) ? q.from({ content: collection }) : null,
      [collection, teamId],
   );
   const rawItems: ContentRow[] = (rawRows ?? []) as unknown as ContentRow[];

   // Delete mutation
   const deleteMutation = useMutation(
      orpc.content.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo excluído com sucesso");
         },
         onError: () => {
            toast.error("Erro ao excluir conteúdo");
         },
      }),
   );

   // Publish mutation
   const publishMutation = useMutation(
      orpc.content.publish.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo publicado com sucesso");
         },
         onError: () => {
            toast.error("Erro ao publicar conteúdo");
         },
      }),
   );

   // Archive mutation
   const archiveMutation = useMutation(
      orpc.content.archive.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo arquivado com sucesso");
         },
         onError: () => {
            toast.error("Erro ao arquivar conteúdo");
         },
      }),
   );

   // Create content mutation
   const createContentMutation = useMutation(
      orpc.content.create.mutationOptions({
         onSuccess: (data) => {
            navigate({
               to: "/$slug/$teamSlug/content/$contentId",
               params: {
                  slug: slug ?? "",
                  teamSlug: teamSlug ?? "",
                  contentId: data.id,
               },
            });
         },
         onError: (error) => {
            console.error("Content creation error:", error);
            toast.error("Erro ao criar conteúdo");
         },
      }),
   );

   // Filter by status client-side
   const statusFilteredItems = useMemo(() => {
      if (statusFilter === "all") return rawItems;
      return rawItems.filter((row) => row.status === statusFilter);
   }, [rawItems, statusFilter]);

   // Map ContentRow (snake_case) to ContentItem (camelCase)
   const allItems = useMemo(
      () => statusFilteredItems.map(mapContentRow),
      [statusFilteredItems],
   );

   // Client-side search
   const filteredContent = useMemo(() => {
      if (!searchQuery.trim()) return allItems;
      const q = searchQuery.toLowerCase();
      return allItems.filter(
         (item) =>
            item.meta.title?.toLowerCase().includes(q) ||
            item.meta.description?.toLowerCase().includes(q),
      );
   }, [allItems, searchQuery]);

   // Action handlers
   const handleView = useCallback(
      (content: ContentItem) => {
         navigate({
            to: "/$slug/$teamSlug/content/$contentId",
            params: {
               slug: slug,
               teamSlug: teamSlug,
               contentId: content.id,
            },
         });
      },
      [navigate, slug, teamSlug],
   );

   const handlePublish = useCallback(
      (content: ContentItem) => {
         publishMutation.mutate({ id: content.id });
      },
      [publishMutation],
   );

   const handleArchive = useCallback(
      (content: ContentItem) => {
         archiveMutation.mutate({ id: content.id });
      },
      [archiveMutation],
   );

   const handleDelete = useCallback(
      (content: ContentItem) => {
         deleteMutation.mutate({ id: content.id });
      },
      [deleteMutation],
   );

   const handleCreateNew = () => {
      createContentMutation.mutate({
         title: "Sem título",
      });
   };

   useContextPanelInfo(
      <ContextPanel>
         <ContextPanelHeader>
            <ContextPanelTitle>Ações</ContextPanelTitle>
         </ContextPanelHeader>
         <ContextPanelContent>
            <ContextPanelAction
               icon={Plus}
               label="Novo conteúdo"
               onClick={handleCreateNew}
            />
         </ContextPanelContent>
      </ContextPanel>,
   );

   // Table columns
   const columns = useMemo(
      () =>
         createContentColumns({
            onView: handleView,
            onPublish: handlePublish,
            onArchive: handleArchive,
            onDelete: handleDelete,
         }),
      [handleView, handlePublish, handleArchive, handleDelete],
   );

   function ContentRowExpanded({ row }: { row: Row<ContentItem> }) {
      const content = row.original;
      const isDraft = content.status === "draft";
      const isPublished = content.status === "published";
      return (
         <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
               {isDraft && (
                  <Button
                     onClick={() => handlePublish(content)}
                     size="sm"
                     variant="outline"
                  >
                     <FileText className="size-3 mr-2" />
                     Publicar
                  </Button>
               )}
               {isPublished && (
                  <Button
                     onClick={() => handleArchive(content)}
                     size="sm"
                     variant="outline"
                  >
                     <Archive className="size-3 mr-2" />
                     Arquivar
                  </Button>
               )}
               <Button
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(content)}
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

   // Client-side pagination
   const pageStart = (currentPage - 1) * pageSize;
   const paginatedContent = filteredContent.slice(pageStart, pageStart + pageSize);
   const totalCount = filteredContent.length;
   const totalPages = Math.ceil(totalCount / pageSize);

   const hasContent = rawItems.length > 0;
   const isLoadingContent = isLoading && rawItems.length === 0;
   const hasFilteredContent = filteredContent.length > 0;

   if (isLoadingContent) {
      return null;
   }

   if (!hasContent) {
      return (
         <div className="space-y-4">
            <PageHeader
               actions={
                  <Button
                     disabled={createContentMutation.isPending}
                     onClick={handleCreateNew}
                  >
                     <Plus className="mr-2 size-4" />
                     Novo
                  </Button>
               }
               description="Gerencie e crie conteúdo para seu site"
               title="Conteúdo"
            />

            {/* Stats placeholder */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
               <Card>
                  <CardHeader className="pb-2">
                     <CardDescription>Total</CardDescription>
                     <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
               </Card>
               <Card>
                  <CardHeader className="pb-2">
                     <CardDescription>Rascunhos</CardDescription>
                     <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
               </Card>
               <Card>
                  <CardHeader className="pb-2">
                     <CardDescription>Publicados</CardDescription>
                     <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
               </Card>
               <Card>
                  <CardHeader className="pb-2">
                     <CardDescription>Arquivados</CardDescription>
                     <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
               </Card>
            </div>

            {/* Empty state */}
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <FileText className="size-12" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum Conteúdo Ainda</EmptyTitle>
                  <EmptyDescription>
                     Comece criando seu primeiro conteúdo com IA
                  </EmptyDescription>
                  <Button
                     className="mt-4"
                     disabled={createContentMutation.isPending}
                     onClick={handleCreateNew}
                  >
                     <Plus className="mr-2 size-4" />
                     Criar Conteúdo
                  </Button>
               </EmptyContent>
            </Empty>
         </div>
      );
   }

   // Calculate stats from full (unfiltered) collection
   const stats = {
      total: rawItems.length,
      draft: rawItems.filter((r) => r.status === "draft").length,
      published: rawItems.filter((r) => r.status === "published").length,
      archived: rawItems.filter((r) => r.status === "archived").length,
   };

   return (
      <div className="space-y-4">
         <PageHeader
            actions={
               <Button
                  disabled={createContentMutation.isPending}
                  onClick={handleCreateNew}
               >
                  <Plus className="mr-2 size-4" />
                  Novo
               </Button>
            }
            description="Gerencie e crie conteúdo para seu site"
            title="Conteúdo"
         />

         {/* Stats cards */}
         <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
               <CardHeader className="pb-2">
                  <CardDescription>Total</CardDescription>
                  <CardTitle className="text-2xl">{stats.total}</CardTitle>
               </CardHeader>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardDescription>Rascunhos</CardDescription>
                  <CardTitle className="text-2xl">{stats.draft}</CardTitle>
               </CardHeader>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardDescription>Publicados</CardDescription>
                  <CardTitle className="text-2xl">{stats.published}</CardTitle>
               </CardHeader>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardDescription>Arquivados</CardDescription>
                  <CardTitle className="text-2xl">{stats.archived}</CardTitle>
               </CardHeader>
            </Card>
         </div>

         {/* Filters and search */}
         <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
               <Input
                  className="pl-9"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por título ou descrição..."
                  value={searchQuery}
               />
            </div>

            <div className="flex gap-2">
               {STATUS_FILTER_OPTIONS.map((option) => (
                  <Button
                     key={option.value}
                     onClick={() => {
                        setStatusFilter(option.value);
                        setCurrentPage(1);
                     }}
                     size="sm"
                     variant={
                        statusFilter === option.value ? "default" : "outline"
                     }
                  >
                     {option.label}
                  </Button>
               ))}
            </div>
         </div>

         {/* Data table */}
         {hasFilteredContent ? (
            <DataTable
               columns={columns}
               data={paginatedContent}
               enableRowSelection={false}
               getRowId={(row) => row.id}
               pagination={{
                  currentPage,
                  onPageChange: setCurrentPage,
                  onPageSizeChange: setPageSize,
                  pageSize,
                  totalCount,
                  totalPages,
               }}
               renderMobileCard={({
                  row,
                  toggleExpanded,
                  isExpanded,
                  canExpand,
               }) => (
                  <ContentMobileCard
                     canExpand={canExpand}
                     content={row.original}
                     isExpanded={isExpanded}
                     onArchive={handleArchive}
                     onDelete={handleDelete}
                     onPublish={handlePublish}
                     onView={handleView}
                     toggleExpanded={toggleExpanded}
                  />
               )}
               renderSubComponent={({ row }) => (
                  <ContentRowExpanded row={row} />
               )}
            />
         ) : (
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Search className="size-12" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum Resultado Encontrado</EmptyTitle>
                  <EmptyDescription>
                     Tente ajustar seus filtros ou termos de busca
                  </EmptyDescription>
               </EmptyContent>
            </Empty>
         )}
      </div>
   );
}

/**
 * SSR-safe wrapper — useLiveQuery uses useSyncExternalStore without getServerSnapshot,
 * so it must not render on the server. Renders null until client hydration is complete.
 * See: https://github.com/TanStack/db/issues/1016
 */
export function ContentListSection() {
   const [mounted, setMounted] = useState(false);
   useIsomorphicLayoutEffect(() => {
      setMounted(true);
   }, []);
   if (!mounted) return null;
   return <ContentListSectionInner />;
}
