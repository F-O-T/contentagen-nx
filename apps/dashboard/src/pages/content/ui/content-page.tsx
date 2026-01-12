import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Archive, Check, PenLine } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { DefaultHeader } from "@/default/default-header";
import {
   ContentDataTable,
   ContentDataTableSkeleton,
} from "@/features/content/ui/content-data-table";
import type { ContentItem } from "@/features/content/ui/content-table-columns";
import type { DataTableFilterChip } from "@/features/data-table/types";
import { DataTableHeaderFilters } from "@/features/data-table/ui/data-table-header-filters";
import { DataTableTypeFilterChips } from "@/features/data-table/ui/data-table-type-filter-chips";
import { useTRPC } from "@/integrations/clients";
import { ContentQuickActionsToolbar } from "./content-quick-actions-toolbar";

const STATUS_FILTER_CHIPS: DataTableFilterChip<string>[] = [
   {
      id: "draft",
      label: "Rascunho",
      shortLabel: "Rascunho",
      value: "draft",
      icon: <PenLine className="size-3.5" />,
   },
   {
      id: "published",
      label: "Publicado",
      shortLabel: "Publicado",
      value: "published",
      icon: <Check className="size-3.5" />,
   },
   {
      id: "archived",
      label: "Arquivado",
      shortLabel: "Arquivado",
      value: "archived",
      icon: <Archive className="size-3.5" />,
   },
];

interface ContentPageContentProps {
   statusFilter: string | null;
   onStatusFilterChange: (value: string | null) => void;
}

function ContentPageContent({
   statusFilter,
   onStatusFilterChange,
}: ContentPageContentProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const search = useSearch({ from: "/$slug/_dashboard/content/" });
   const [searchTerm, setSearchTerm] = useState("");

   const agentId = (search as { agentId?: string }).agentId;

   const { data } = useSuspenseQuery(
      trpc.content.listAllContent.queryOptions({
         limit: 100,
         page: 1,
         status: ["draft", "published", "archived"],
      }),
   );

   // Filter by agentId if provided in search params
   const filteredByAgent = agentId
      ? data.items.filter((item) => item.agentId === agentId)
      : data.items;

   // Transform items to include agent info from API response
   const contents: ContentItem[] = filteredByAgent.map((item) => ({
      id: item.id,
      agentId: item.agentId,
      meta: item.meta,
      status: item.status as "draft" | "published" | "archived",
      shareStatus: (item.shareStatus as "private" | "shared") || "private",
      createdAt: item.createdAt,
      agent: item.agent ?? undefined,
   }));

   const deleteMutation = useMutation(
      trpc.content.delete.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo excluído com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const publishMutation = useMutation(
      trpc.content.publish.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo publicado com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const archiveMutation = useMutation(
      trpc.content.archive.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo arquivado com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const markAsDraftMutation = useMutation(
      trpc.content.markAsDraft.mutationOptions({
         onSuccess: () => {
            toast.success("Conteúdo marcado como rascunho");
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const toggleShareMutation = useMutation(
      trpc.content.toggleShare.mutationOptions({
         onSuccess: (_, { shared }) => {
            toast.success(
               shared
                  ? "Conteúdo compartilhado publicamente"
                  : "Conteúdo tornado privado",
            );
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const handleDelete = (contentId: string) => {
      deleteMutation.mutate({ id: contentId });
   };

   const handleBulkDelete = (contentIds: string[]) => {
      for (const id of contentIds) {
         deleteMutation.mutate({ id });
      }
   };

   const handlePublish = (contentId: string) => {
      publishMutation.mutate({ id: contentId });
   };

   const handleArchive = (contentId: string) => {
      archiveMutation.mutate({ id: contentId });
   };

   const handleMarkAsDraft = (contentId: string) => {
      markAsDraftMutation.mutate({ id: contentId });
   };

   const handleToggleShare = (contentId: string, shared: boolean) => {
      toggleShareMutation.mutate({ id: contentId, shared });
   };

   const statusFilterValue = statusFilter || "all";
   const hasActiveFilters = searchTerm.length > 0 || statusFilter !== null;

   const handleClearFilters = () => {
      setSearchTerm("");
      onStatusFilterChange(null);
   };

   return (
      <ContentDataTable
         contents={contents}
         filters={{
            hasActiveFilters,
            onClearFilters: handleClearFilters,
            onSearchChange: setSearchTerm,
            onStatusFilterChange: (value) =>
               onStatusFilterChange(value === "all" ? null : value),
            searchTerm,
            statusFilter: statusFilterValue,
         }}
         onArchive={handleArchive}
         onBulkDelete={handleBulkDelete}
         onDelete={handleDelete}
         onMarkAsDraft={handleMarkAsDraft}
         onPublish={handlePublish}
         onToggleShare={handleToggleShare}
      />
   );
}

function ContentPageError({ error }: { error: Error }) {
   return (
      <div className="text-center py-8">
         <p className="text-muted-foreground">
            {"Ocorreu um erro. Por favor, tente novamente."}
         </p>
         <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </div>
   );
}

export function ContentPage() {
   const [statusFilter, setStatusFilter] = useState<string | null>(null);

   const hasActiveFilters = statusFilter !== null;
   const handleClearFilters = () => setStatusFilter(null);

   return (
      <main className="flex flex-col gap-6">
         <DefaultHeader
            actions={<ContentQuickActionsToolbar />}
            description={"Gerencie seus conteúdos criados pelos escritores IA."}
            secondaryActions={
               <DataTableHeaderFilters
                  additionalFilters={
                     <DataTableTypeFilterChips
                        chips={STATUS_FILTER_CHIPS}
                        onValueChange={setStatusFilter}
                        value={statusFilter}
                     />
                  }
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
               />
            }
            title={"Conteúdos"}
         />

         <ErrorBoundary FallbackComponent={ContentPageError}>
            <Suspense fallback={<ContentDataTableSkeleton />}>
               <ContentPageContent
                  onStatusFilterChange={setStatusFilter}
                  statusFilter={statusFilter}
               />
            </Suspense>
         </ErrorBoundary>
      </main>
   );
}
