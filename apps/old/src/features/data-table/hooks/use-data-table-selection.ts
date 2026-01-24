import type { RowSelectionState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import type { DataTableSelectionState } from "../types";

interface UseDataTableSelectionOptions {
   initialSelection?: RowSelectionState;
   onSelectionChange?: (selection: RowSelectionState) => void;
}

interface UseDataTableSelectionReturn<TData> {
   rowSelection: RowSelectionState;
   setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
   selectionState: DataTableSelectionState;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   getSelectedItems: (data: TData[]) => TData[];
}

export function useDataTableSelection<TData extends { id: string }>(
   options: UseDataTableSelectionOptions = {},
): UseDataTableSelectionReturn<TData> {
   const { initialSelection = {}, onSelectionChange } = options;
   const [rowSelection, setRowSelectionState] =
      useState<RowSelectionState>(initialSelection);

   const selectedIds = useMemo(
      () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
      [rowSelection],
   );

   const selectionState: DataTableSelectionState = useMemo(
      () => ({
         selectedIds,
         selectedCount: selectedIds.length,
         isAllSelected: false,
         isSomeSelected: selectedIds.length > 0,
      }),
      [selectedIds],
   );

   const clearSelection = useCallback(() => {
      setRowSelectionState({});
      onSelectionChange?.({});
   }, [onSelectionChange]);

   const selectAll = useCallback(
      (ids: string[]) => {
         const newSelection = Object.fromEntries(
            ids.map((id) => [id, true]),
         ) as RowSelectionState;
         setRowSelectionState(newSelection);
         onSelectionChange?.(newSelection);
      },
      [onSelectionChange],
   );

   const getSelectedItems = useCallback(
      (data: TData[]) => data.filter((item) => selectedIds.includes(item.id)),
      [selectedIds],
   );

   const setRowSelection = useCallback(
      (updater: React.SetStateAction<RowSelectionState>) => {
         setRowSelectionState((prev) => {
            const newValue =
               typeof updater === "function" ? updater(prev) : updater;
            onSelectionChange?.(newValue);
            return newValue;
         });
      },
      [onSelectionChange],
   );

   return {
      rowSelection,
      setRowSelection,
      selectionState,
      clearSelection,
      selectAll,
      getSelectedItems,
   };
}
