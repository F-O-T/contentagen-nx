import React, {
   createContext,
   useContext,
   useState,
   useCallback,
   useMemo,
} from "react";
import type { ReactNode } from "react";
import type { RouterOutput } from "@packages/api/client";
// import { useTRPC } from "@/integrations/clients";
// import { useSubscription } from "@trpc/tanstack-react-query";

interface IdeasListContextType {
   // Pagination state
   page: number;
   totalPages: number;
   setPage: (page: number) => void;
   handlePageChange: (newPage: number) => void;

   // Selection state
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   allSelected: boolean;
   handleSelectAll: () => void;
   selectedItemsCount: number;

   // Data state
   data?: RouterOutput["ideas"]["listAllIdeas"];
   selectableItems: RouterOutput["ideas"]["listAllIdeas"]["items"];

   // Real-time updates
   updateIdeaStatus: (ideaId: string, status: string, message?: string) => void;

   // Filtering state
   agentId?: string;

   // Constants
   limit: number;
   total: number;
}

const IdeasListContext = createContext<IdeasListContextType | null>(null);

export const useIdeasList = () => {
   const context = useContext(IdeasListContext);
   if (!context) {
      throw new Error("useIdeasList must be used within an IdeasListProvider");
   }
   return context;
};

interface IdeasListProviderProps {
   children: ReactNode;
   data?: RouterOutput["ideas"]["listAllIdeas"];
   agentId?: string;
}

export function IdeasListProvider({
   children,
   data,
   agentId,
}: IdeasListProviderProps) {
   const [page, setPage] = useState(1);
   const [limit] = useState(8);
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [ideasData, setIdeasData] = useState(data);
   // const trpc = useTRPC();

   const totalPages = useMemo(() => {
      return Math.ceil((data?.total || 0) / limit);
   }, [data?.total, limit]);

   const handlePageChange = useCallback((newPage: number) => {
      setPage(newPage);
   }, []);

   const handleSelectionChange = useCallback(
      (id: string, selected: boolean) => {
         setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (selected) {
               newSet.add(id);
            } else {
               newSet.delete(id);
            }
            return newSet;
         });
      },
      [],
   );

   const selectableItems = useMemo(() => {
      return ideasData?.items.filter((item) => item.status === "pending") || [];
   }, [ideasData?.items]);

   // Real-time updates
   const updateIdeaStatus = useCallback((ideaId: string, status: string) => {
      setIdeasData((prevData) => {
         if (!prevData) return prevData;
         return {
            ...prevData,
            items: prevData.items.map((item) =>
               item.id === ideaId ? { ...item, status: status as any } : item,
            ),
         };
      });
   }, []);

   // TODO: Add real-time subscription once TRPC client is regenerated
   // useSubscription(
   //    trpc.ideas.onStatusChanged.subscriptionOptions(undefined, {
   //       onData: (event: any) => {
   //          updateIdeaStatus(event.ideaId, event.status, event.message);
   //       },
   //    }),
   // );

   const allSelected = useMemo(() => {
      const selectableIds = selectableItems.map(
         (item: RouterOutput["ideas"]["listAllIdeas"]["items"][0]) => item.id,
      );
      return (
         selectableIds.length > 0 &&
         selectableIds.every((id: string) => selectedItems.has(id))
      );
   }, [selectableItems, selectedItems]);

   const handleSelectAll = useCallback(() => {
      const selectableIds = selectableItems.map(
         (item: RouterOutput["ideas"]["listAllIdeas"]["items"][0]) => item.id,
      );

      setSelectedItems((prev) => {
         if (allSelected) {
            // If all items are selected, deselect all
            return new Set();
         } else {
            // Select all items
            return new Set([...prev, ...selectableIds]);
         }
      });
   }, [selectableItems, allSelected]);

   const value: IdeasListContextType = {
      // Pagination
      page,
      totalPages,
      setPage,
      handlePageChange,

      // Selection
      selectedItems,
      handleSelectionChange,
      allSelected,
      handleSelectAll,
      selectedItemsCount: selectedItems.size,

      // Data
      data: ideasData,
      selectableItems,

      // Real-time updates
      updateIdeaStatus,

      // Filtering
      agentId,

      // Constants
      limit,
      total: ideasData?.total || 0,
   };

   return React.createElement(IdeasListContext.Provider, { value }, children);
}
