import type { TimePeriod } from "@packages/ui/components/time-period-chips";
import type { ReactNode } from "react";

/**
 * Action configuration for expanded row actions
 */
export interface DataTableAction<TData> {
   id: string;
   label: string;
   icon: ReactNode;
   onClick: (row: TData) => void;
   variant?: "default" | "destructive" | "secondary";
   /** Condition to show/hide the action */
   isVisible?: (row: TData) => boolean;
   /** Condition to disable the action */
   isDisabled?: (row: TData) => boolean;
}

/**
 * Bulk action configuration
 */
export interface DataTableBulkAction {
   id: string;
   label: string;
   icon: ReactNode;
   onClick: (selectedIds: string[]) => void;
   variant?: "default" | "destructive";
   /** If true, shows confirmation dialog before executing */
   requiresConfirmation?: boolean;
   confirmationConfig?: {
      title: string;
      description: string;
      actionLabel: string;
   };
}

/**
 * Summary card configuration
 */
export interface DataTableSummaryCard {
   id: string;
   title: string;
   description: string;
   value: number | string;
   icon?: ReactNode;
}

/**
 * Filter chip configuration for type filters
 */
export interface DataTableFilterChip<TValue = string> {
   id: string;
   label: string;
   shortLabel?: string;
   value: TValue;
   icon?: ReactNode;
}

/**
 * Filter state for data tables
 */
export interface DataTableFilterState<TFilters = Record<string, unknown>> {
   searchTerm: string;
   dateFilter?: TimePeriod | null;
   typeFilter?: string | null;
   customFilters?: TFilters;
}

/**
 * Selection state helpers
 */
export interface DataTableSelectionState {
   selectedIds: string[];
   selectedCount: number;
   isAllSelected: boolean;
   isSomeSelected: boolean;
}
