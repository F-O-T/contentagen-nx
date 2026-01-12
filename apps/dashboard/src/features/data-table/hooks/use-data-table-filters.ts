import type { TimePeriod } from "@packages/ui/components/time-period-chips";
import { useCallback, useMemo, useState } from "react";
import type { DataTableFilterState } from "../types";

interface UseDataTableFiltersOptions<TFilters> {
   initialFilters?: Partial<DataTableFilterState<TFilters>>;
   onFiltersChange?: (filters: DataTableFilterState<TFilters>) => void;
}

interface UseDataTableFiltersReturn<TFilters> {
   filters: DataTableFilterState<TFilters>;
   searchTerm: string;
   setSearchTerm: (value: string) => void;
   dateFilter: TimePeriod | null | undefined;
   setDateFilter: (value: TimePeriod | null) => void;
   typeFilter: string | null | undefined;
   setTypeFilter: (value: string | null) => void;
   customFilters: TFilters | undefined;
   setCustomFilter: <K extends keyof TFilters>(
      key: K,
      value: TFilters[K],
   ) => void;
   hasActiveFilters: boolean;
   clearFilters: () => void;
}

const DEFAULT_FILTERS: DataTableFilterState = {
   searchTerm: "",
   dateFilter: null,
   typeFilter: null,
   customFilters: undefined,
};

export function useDataTableFilters<TFilters = Record<string, unknown>>(
   options: UseDataTableFiltersOptions<TFilters> = {},
): UseDataTableFiltersReturn<TFilters> {
   const { initialFilters = {}, onFiltersChange } = options;

   const [filters, setFilters] = useState<DataTableFilterState<TFilters>>({
      ...DEFAULT_FILTERS,
      ...initialFilters,
   } as DataTableFilterState<TFilters>);

   const updateFilters = useCallback(
      (updates: Partial<DataTableFilterState<TFilters>>) => {
         setFilters((prev) => {
            const newFilters = { ...prev, ...updates };
            onFiltersChange?.(newFilters);
            return newFilters;
         });
      },
      [onFiltersChange],
   );

   const setSearchTerm = useCallback(
      (value: string) => updateFilters({ searchTerm: value }),
      [updateFilters],
   );

   const setDateFilter = useCallback(
      (value: TimePeriod | null) => updateFilters({ dateFilter: value }),
      [updateFilters],
   );

   const setTypeFilter = useCallback(
      (value: string | null) => updateFilters({ typeFilter: value }),
      [updateFilters],
   );

   const setCustomFilter = useCallback(
      <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
         updateFilters({
            customFilters: {
               ...filters.customFilters,
               [key]: value,
            } as TFilters,
         });
      },
      [filters.customFilters, updateFilters],
   );

   const hasActiveFilters = useMemo(() => {
      return (
         filters.searchTerm.length > 0 ||
         (filters.dateFilter !== null && filters.dateFilter !== undefined) ||
         (filters.typeFilter !== null && filters.typeFilter !== undefined) ||
         (filters.customFilters !== undefined &&
            filters.customFilters !== null &&
            Object.values(
               filters.customFilters as Record<string, unknown>,
            ).some((v) => v !== undefined && v !== null && v !== "all"))
      );
   }, [filters]);

   const clearFilters = useCallback(() => {
      const clearedFilters = DEFAULT_FILTERS as DataTableFilterState<TFilters>;
      setFilters(clearedFilters);
      onFiltersChange?.(clearedFilters);
   }, [onFiltersChange]);

   return {
      filters,
      searchTerm: filters.searchTerm,
      setSearchTerm,
      dateFilter: filters.dateFilter,
      setDateFilter,
      typeFilter: filters.typeFilter,
      setTypeFilter,
      customFilters: filters.customFilters,
      setCustomFilter,
      hasActiveFilters,
      clearFilters,
   };
}
