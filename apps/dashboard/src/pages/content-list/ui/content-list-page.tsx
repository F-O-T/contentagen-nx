import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ContentRequestCard } from "./content-card";
import { LoadingContentCard } from "./loading-content-card";
import { ContentListToolbar } from "./content-list-toolbar";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useMemo, useEffect } from "react";
import { CreateContentCredenza } from "../features/create-content-credenza";
import { useState, useCallback } from "react";
import { useSearch } from "@tanstack/react-router";

const getStatusDisplay = (status: string | null) => {
   if (!status)
      return { label: "Unknown", progress: 0, variant: "secondary" as const };

   const statusConfig = {
      pending: { label: "Pending", progress: 0, variant: "secondary" as const },
      planning: {
         label: "Planning",
         progress: 15,
         variant: "default" as const,
      },
      researching: {
         label: "Researching",
         progress: 35,
         variant: "default" as const,
      },
      writing: { label: "Writing", progress: 60, variant: "default" as const },
      editing: { label: "Editing", progress: 80, variant: "default" as const },
      analyzing: {
         label: "Analyzing",
         progress: 95,
         variant: "default" as const,
      },
      draft: { label: "Draft", progress: 100, variant: "default" as const },
      approved: {
         label: "Approved",
         progress: 100,
         variant: "destructive" as const,
      },
   };

   return (
      statusConfig[status as keyof typeof statusConfig] || {
         label: status,
         progress: 0,
         variant: "secondary" as const,
      }
   );
};
//TODO: criar um component padrao para paginacao + toolbar, bulk actions de aprovar, deletar ou rejeitar
export function ContentListPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { agentId } = useSearch({ from: "/_dashboard/content/" });
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(8);
   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
      "draft",
      "approved",
      "pending",
      "planning",
      "researching",
      "writing",
      "editing",
      "analyzing",
      "grammar_checking",
   ]);
   const [selectedAgents, setSelectedAgents] = useState<string[]>(
      agentId ? [agentId] : [],
   );
   const [selectedItems, setSelectedItems] = useState<string[]>([]);

   // Update selectedAgents when agentId from URL changes
   useEffect(() => {
      if (agentId) {
         setSelectedAgents([agentId]);
      }
   }, [agentId]);

   // Get available agents for filtering
   const { data: agentsData } = useSuspenseQuery(
      trpc.agent.list.queryOptions(),
   );

   const availableAgents = useMemo(() => {
      return (
         agentsData?.map((agent) => ({
            id: agent.id,
            name: agent.personaConfig.metadata.name,
         })) || []
      );
   }, [agentsData]);

   const { data } = useSuspenseQuery(
      trpc.content.listAllContent.queryOptions({
         status:
            selectedStatuses.length > 0
               ? (selectedStatuses as any)
               : [
                    "draft",
                    "approved",
                    "pending",
                    "planning",
                    "researching",
                    "writing",
                    "editing",
                    "analyzing",
                    "grammar_checking",
                 ],
         page,
         limit,
      }),
   );

   // Filter content by selected agents on client side since API doesn't support it
   const filteredContent = useMemo(() => {
      if (selectedAgents.length === 0) return data;
      return {
         ...data,
         items: data.items.filter((item) =>
            selectedAgents.includes(item.agent.id),
         ),
         total: data.items.filter((item) =>
            selectedAgents.includes(item.agent.id),
         ).length,
      };
   }, [data, selectedAgents]);

   const hasGeneratingContent = useMemo(
      () =>
         filteredContent?.items?.some(
            (item) =>
               item.status &&
               [
                  "pending",
                  "planning",
                  "researching",
                  "writing",
                  "editing",
                  "analyzing",
               ].includes(item.status),
         ) || false,
      [filteredContent?.items],
   );

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {},
         {
            onData(statusData) {
               toast.success(`Content status updated to ${statusData.status}`);
               queryClient.invalidateQueries({
                  queryKey: trpc.content.listAllContent.queryKey({
                     status:
                        selectedStatuses.length > 0
                           ? (selectedStatuses as any)
                           : [
                                "draft",
                                "approved",
                                "pending",
                                "planning",
                                "researching",
                                "writing",
                                "editing",
                                "analyzing",
                                "grammar_checking",
                             ],
                     page,
                     limit,
                  }),
               });
            },
            enabled: hasGeneratingContent,
         },
      ),
   );

   const totalPages = useMemo(() => {
      return Math.ceil(filteredContent.total / limit);
   }, [filteredContent.total, limit]);

   const handlePageChange = useCallback((newPage: number) => {
      setPage(newPage);
   }, []);

   const handleLimitChange = useCallback((newLimit: number) => {
      setLimit(newLimit);
      setPage(1); // Reset to first page when limit changes
   }, []);

   const handleStatusFilterChange = useCallback((statuses: string[]) => {
      setSelectedStatuses(statuses);
      setPage(1); // Reset to first page when filters change
   }, []);

   const handleAgentFilterChange = useCallback((agents: string[]) => {
      setSelectedAgents(agents);
      setPage(1); // Reset to first page when filters change
   }, []);

   const handleSelectAll = useCallback(() => {
      if (selectedItems.length === filteredContent.items.length) {
         setSelectedItems([]);
      } else {
         setSelectedItems(filteredContent.items.map((item) => item.id));
      }
   }, [selectedItems.length, filteredContent.items]);

   const handleBulkApprove = useCallback(() => {
      // TODO: Implement bulk approve logic
      console.log("Bulk approve items:", selectedItems);
      setSelectedItems([]);
   }, [selectedItems]);

   const handleBulkDelete = useCallback(() => {
      // TODO: Implement bulk delete logic
      console.log("Bulk delete items:", selectedItems);
      setSelectedItems([]);
   }, [selectedItems]);

   const handleItemSelection = useCallback((id: string, selected: boolean) => {
      if (selected) {
         setSelectedItems((prev) => [...prev, id]);
      } else {
         setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      }
   }, []);

   const handleViewContent = useCallback((id: string) => {
      // Navigate to content view
      console.log("View content:", id);
   }, []);

   const handleDeleteContent = useCallback((id: string) => {
      // TODO: Implement delete logic
      console.log("Delete content:", id);
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
   }, []);

   const handleApproveContent = useCallback((id: string) => {
      // TODO: Implement approve logic
      console.log("Approve content:", id);
   }, []);

   return (
      <main className="h-full w-full flex flex-col gap-6 p-4">
         <TalkingMascot message="Here you can manage all your content requests. Create, edit, or explore your requests below!" />
         <ContentListToolbar
            page={page}
            totalPages={totalPages}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            selectedStatuses={selectedStatuses}
            selectedAgents={selectedAgents}
            onStatusFilterChange={handleStatusFilterChange}
            onAgentFilterChange={handleAgentFilterChange}
            availableAgents={availableAgents}
            selectedItems={selectedItems}
            totalItems={filteredContent.items.length}
            onSelectAll={handleSelectAll}
            onBulkApprove={handleBulkApprove}
            onBulkDelete={handleBulkDelete}
         />
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.items.map((item) => {
               const isGenerating =
                  item.status &&
                  [
                     "pending",
                     "planning",
                     "researching",
                     "writing",
                     "editing",
                     "analyzing",
                  ].includes(item.status);

               if (isGenerating) {
                  const statusInfo = getStatusDisplay(item.status);
                  return (
                     <LoadingContentCard
                        key={item.id}
                        status={item.status}
                        progress={statusInfo.progress}
                     />
                  );
               }

               return (
                  <ContentRequestCard
                     key={item.id}
                     request={item}
                     isSelected={selectedItems.includes(item.id)}
                     onSelectionChange={handleItemSelection}
                     onView={handleViewContent}
                     onDelete={handleDeleteContent}
                     onApprove={handleApproveContent}
                  />
               );
            })}
         </div>
         {filteredContent.items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
               <p className="text-lg">
                  No content found matching your filters.
               </p>
               <p className="text-sm mt-2">
                  Try adjusting your filter criteria or create new content.
               </p>
            </div>
         )}
      </main>
   );
}
