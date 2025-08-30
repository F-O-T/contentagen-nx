import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@packages/ui/components/dialog";

interface BulkActionsCredenzaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkActionsCredenza({ open, onOpenChange }: BulkActionsCredenzaProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
        </DialogHeader>
        {/* Add bulk actions form here */}
        <div className="p-4">
          <p>Bulk action options go here.</p>
          {/* Example: Add buttons for delete, archive, etc. */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

