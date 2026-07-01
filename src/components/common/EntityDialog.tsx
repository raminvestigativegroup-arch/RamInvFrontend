import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  children: React.ReactNode;
  cancelLabel?: string;
  maxWidth?: string;
  isLoading?: boolean;
}

/**
 * EntityDialog — the standard form dialog used throughout the app.
 *
 * Layout:
 *  ┌─────────────────────────┐
 *  │ 3px primary accent bar  │
 *  │─────────────────────────│
 *  │  Title (white, fixed)   │
 *  │─────────────────────────│
 *  │  Form fields (scrolls)  │
 *  │─────────────────────────│
 *  │  Cancel · Submit (white)│
 *  └─────────────────────────┘
 */
const EntityDialog: React.FC<EntityDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel,
  children,
  cancelLabel = "Cancel",
  maxWidth = "sm:max-w-md",
  isLoading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidth}>
        {/* Fixed white header */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Scrollable form body + fixed white footer */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogBody>{children}</DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isLoading} loading={isLoading}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EntityDialog;
