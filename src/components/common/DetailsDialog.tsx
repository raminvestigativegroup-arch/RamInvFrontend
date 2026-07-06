import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  closeLabel?: string;
  maxWidth?: string;
  onClose?: () => void;
}

/**
 * DetailsDialog — standard reusable dialog for viewing details.
 */
const DetailsDialog: React.FC<DetailsDialogProps> = ({
  open,
  onOpenChange,
  children,
  closeLabel = "Close",
  maxWidth = "sm:max-w-md",
  onClose,
}) => {
  const handleClose = () => {
    onOpenChange(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidth}>
        <div className="flex flex-col flex-1 min-h-0">
          {children}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            size="sm"
          >
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetailsDialog;
