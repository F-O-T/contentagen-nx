import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Input } from "@packages/ui/components/input";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { FileText, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { ContentMobileCard } from "./content-mobile-card";
import type { ContentItem } from "./content-table-columns";
import { createContentColumns } from "./content-table-columns";

const STATUS_FILTER_OPTIONS = [
   { label: "Todos", value: "all" },
   { label: "Rascunho", value: "draft" },
   { label: "Publicado", value: "published" },
   { label: "Arquivado", value: "archived" },
] as const;

export function ContentListSection() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug?: string;
      teamSlug?: string;
   };
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(20);

   // Prepare query input
   const queryInput = useMemo(() => {
      const input: {
         limit: number;
         page: number;
         status?: ("draft" | "published" | "archived")[];
      } = {
         limit: pageSize,
         page: currentPage,
      };

      if (statusFilter !== "all") {
         input.status = [statusFilter as "draft" | "published" | "archived"];
      }

      return input;
   }, [pageSize, currentPage, statusFilter]);

   // Fetch content list
   const queryOptions = useMemo(
      () => orpc.content.listAllContent.queryOptions({ input: queryInput }),
      [queryInput],
   );

   const { data, refetch } = useSuspenseQuery(queryOptions);

   // Delete mutation
   const deleteMutation = useMutation(
      orpc.content.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo excluído com sucesso");
            refetch();
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
            refetch();
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
            refetch();
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
               to: "/$slug/$teamSlug/$contentId",
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

   // Filter content by search query
   const filteredContent = useMemo(() => {
      if (!searchQuery.trim()) {
         return data.items;
      }

      const query = searchQuery.toLowerCase();
      return data.items.filter(
         (item) =>
            item.meta.title?.toLowerCase().includes(query) ||
            item.meta.description?.toLowerCase().includes(query),
      );
   }, [data.items, searchQuery]);

   // Action handlers
   const handleView = (content: ContentItem) => {
      navigate({
         to: "/$slug/$teamSlug/$contentId",
         params: {
            slug: slug ?? "",
            teamSlug: teamSlug ?? "",
            contentId: content.id,
         },
      });
   };

   const handlePublish = (content: ContentItem) => {
      publishMutation.mutate({ id: content.id });
   };

   const handleArchive = (content: ContentItem) => {
      archiveMutation.mutate({ id: content.id });
   };

   const handleDelete = (content: ContentItem) => {
      deleteMutation.mutate({ id: content.id });
   };

   // biome-ignore lint/correctness/noUnusedFunctionParameters: Will be implemented when share API is ready
   const handleToggleShare = (content: ContentItem) => {
      // TODO: Implement share toggle when API is ready
      toast.info("Compartilhamento em breve");
   };

   const handleCreateNew = () => {
      createContentMutation.mutate({
         meta: {
            description: "Sem descricao",
            title: "Sem titulo",
            slug: "sem-slug",
         },
      });
   };

   // Table columns
   const columns = useMemo(
      () =>
         createContentColumns({
            onView: handleView,
            onPublish: handlePublish,
            onArchive: handleArchive,
            onDelete: handleDelete,
            onToggleShare: handleToggleShare,
         }),
      [],
   );

   const hasContent = data.items.length > 0;
   const hasFilteredContent = filteredContent.length > 0;

   if (!hasContent) {
      return (
         <div className="space-y-4">
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
            <Card>
               <CardContent className="py-12">
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
               </CardContent>
            </Card>
         </div>
      );
   }

   // Calculate stats
   const stats = {
      total: data.total,
      draft: data.items.filter((item) => item.status === "draft").length,
      published: data.items.filter((item) => item.status === "published")
         .length,
      archived: data.items.filter((item) => item.status === "archived").length,
   };

   return (
      <div className="space-y-4">
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

            <Button
               disabled={createContentMutation.isPending}
               onClick={handleCreateNew}
            >
               <Plus className="mr-2 size-4" />
               Novo
            </Button>
         </div>

         {/* Data table */}
         <Card>
            <CardContent className="p-6">
               {hasFilteredContent ? (
                  <DataTable
                     columns={columns}
                     data={filteredContent}
                     enableRowSelection={false}
                     getRowId={(row) => row.id}
                     pagination={{
                        currentPage,
                        onPageChange: setCurrentPage,
                        onPageSizeChange: setPageSize,
                        pageSize,
                        totalCount: data.total,
                        totalPages: data.totalPages,
                     }}
                     renderMobileCard={({ row }) => (
                        <ContentMobileCard
                           content={row.original}
                           onArchive={handleArchive}
                           onDelete={handleDelete}
                           onPublish={handlePublish}
                           onToggleShare={handleToggleShare}
                           onView={handleView}
                        />
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
            </CardContent>
         </Card>
      </div>
   );
}
