import { createContext, useContext, useState, type ReactNode } from "react";
import type { RouterOutput } from "@packages/api/client";

interface CompetitorListContextType {
   // Data
   items: RouterOutput["competitor"]["list"]["items"];

   // Pagination
   page: number;
   totalPages: number;
   handlePageChange: (newPage: number) => void;

   // Selection
   selectedItems: Set<string>;
   selectedItemsCount: number;
   allSelectableSelected: boolean;
   handleSelectionChange: (id: string, selected: boolean) => void;
   handleSelectAll: () => void;
   clearSelection: () => void;
}

const CompetitorListContext = createContext<
   CompetitorListContextType | undefined
>(undefined);

interface CompetitorListProviderProps {
   children: ReactNode;
   data: {
      items: RouterOutput["competitor"]["list"]["items"];
      total: number;
      page: number;
      limit: number;
   };
}

export function CompetitorListProvider({
   children,
   data,
}: CompetitorListProviderProps) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

   const totalPages = Math.ceil(data.total / data.limit);
   const page = data.page;

   const handlePageChange = (newPage: number) => {
      const url = new URL(window.location.href);
      url.searchParams.set("page", newPage.toString());
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new PopStateEvent("popstate"));
   };

   const handleSelectionChange = (id: string, selected: boolean) => {
      setSelectedItems((prev) => {
         const newSet = new Set(prev);
         if (selected) {
            newSet.add(id);
         } else {
            newSet.delete(id);
         }
         return newSet;
      });
   };

   const handleSelectAll = () => {
      if (allSelectableSelected) {
         setSelectedItems(new Set());
      } else {
         const allIds = data.items.map((item) => item.id);
         setSelectedItems(new Set(allIds));
      }
   };

   const clearSelection = () => {
      setSelectedItems(new Set());
   };

   const allSelectableSelected =
      selectedItems.size === data.items.length && data.items.length > 0;
   const selectedItemsCount = selectedItems.size;

   return (
      <CompetitorListContext.Provider
         value={{
            items: data.items,
            page,
            totalPages,
            handlePageChange,
            selectedItems,
            selectedItemsCount,
            allSelectableSelected,
            handleSelectionChange,
            handleSelectAll,
            clearSelection,
         }}
      >
         {children}
      </CompetitorListContext.Provider>
   );
}

export function useCompetitorList() {
   const context = useContext(CompetitorListContext);
   if (context === undefined) {
      throw new Error(
         "useCompetitorList must be used within a CompetitorListProvider",
      );
   }
   return context;
}
