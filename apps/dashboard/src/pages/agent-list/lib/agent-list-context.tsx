import React, {
   createContext,
   useContext,
   useState,
   useCallback,
   useMemo,
} from "react";
import type { ReactNode } from "react";
import type { RouterOutput } from "@packages/api/client";

interface AgentListContextType {
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
   data?: RouterOutput["agent"]["list"];
   selectableItems: RouterOutput["agent"]["list"]["items"];

   // Constants
   limit: number;
   total: number;
}

const AgentListContext = createContext<AgentListContextType | null>(null);

export const useAgentList = () => {
   const context = useContext(AgentListContext);
   if (!context) {
      throw new Error("useAgentList must be used within an AgentListProvider");
   }
   return context;
};

interface AgentListProviderProps {
   children: ReactNode;
   data?: RouterOutput["agent"]["list"];
}

export function AgentListProvider({ children, data }: AgentListProviderProps) {
   const [page, setPage] = useState(1);
   const [limit] = useState(8);
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

   const totalPages = useMemo(() => {
      return data?.totalPages || 1;
   }, [data?.totalPages]);

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
      return data?.items || [];
   }, [data]);

   const allSelected = useMemo(() => {
      const selectableIds = selectableItems.map(
         (item: RouterOutput["agent"]["list"]["items"][0]) => item.id,
      );
      return (
         selectableIds.length > 0 &&
         selectableIds.every((id: string) => selectedItems.has(id))
      );
   }, [selectableItems, selectedItems]);

   const handleSelectAll = useCallback(() => {
      const selectableIds = selectableItems.map(
         (item: RouterOutput["agent"]["list"]["items"][0]) => item.id,
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

   const value: AgentListContextType = {
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
      data,
      selectableItems,

      // Constants
      limit,
      total: (data as any)?.total || 0,
   };

   return React.createElement(AgentListContext.Provider, { value }, children);
}
