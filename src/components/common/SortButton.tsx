import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/lib/tableSort";

interface SortButtonProps {
  label: React.ReactNode;
  /** Direction when this column is the active sort, otherwise undefined */
  direction?: SortDirection;
  onClick: () => void;
  className?: string;
}

/**
 * Header content for a sortable column. Goes inside a <th>, which keeps its own
 * text styling; the button inherits it.
 */
const SortButton = ({ label, direction, onClick, className }: SortButtonProps) => {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 [text-transform:inherit] [letter-spacing:inherit] hover:text-foreground transition-colors",
        direction && "text-foreground",
        className,
      )}
    >
      {label}
      <Icon className={cn("w-3.5 h-3.5 shrink-0", !direction && "opacity-40")} />
    </button>
  );
};

export default SortButton;
