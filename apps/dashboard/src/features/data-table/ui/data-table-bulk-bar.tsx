import {
   SelectionActionBar,
   SelectionActionButton,
} from "@packages/ui/components/selection-action-bar";
import type { ReactNode } from "react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import type { DataTableBulkAction } from "../types";

interface DataTableBulkBarProps {
   selectedIds: string[];
   actions: DataTableBulkAction[];
   onClearSelection: () => void;
   /** Optional summary to show (e.g., total value of selected items) */
   summary?: ReactNode;
}

export function DataTableBulkBar({
   selectedIds,
   actions,
   onClearSelection,
   summary,
}: DataTableBulkBarProps) {
   const { openAlertDialog } = useAlertDialog();

   const handleAction = (action: DataTableBulkAction) => {
      if (action.requiresConfirmation && action.confirmationConfig) {
         openAlertDialog({
            title: action.confirmationConfig.title,
            description: action.confirmationConfig.description,
            actionLabel: action.confirmationConfig.actionLabel,
            cancelLabel: "Cancelar",
            variant:
               action.variant === "destructive" ? "destructive" : "default",
            onAction: () => {
               action.onClick(selectedIds);
               onClearSelection();
            },
         });
      } else {
         action.onClick(selectedIds);
         onClearSelection();
      }
   };

   return (
      <SelectionActionBar
         onClear={onClearSelection}
         selectedCount={selectedIds.length}
         summary={summary}
      >
         {actions.map((action) => (
            <SelectionActionButton
               icon={action.icon}
               key={action.id}
               onClick={() => handleAction(action)}
               variant={action.variant}
            >
               {action.label}
            </SelectionActionButton>
         ))}
      </SelectionActionBar>
   );
}
