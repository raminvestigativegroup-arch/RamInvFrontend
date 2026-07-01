import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode; // filter dropdowns / extra controls
  actions?: React.ReactNode;  // right-side action buttons
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  className?: string;
}

/**
 * Standardized search + filter toolbar used across all listing pages.
 * Renders a single pill-style bar with a search input on the left and
 * filter dropdowns + actions on the right.
 */
const TableToolbar: React.FC<TableToolbarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  actions,
  hasActiveFilters,
  onResetFilters,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-3 items-center justify-between",
        "px-4 py-3 bg-card rounded-xl border border-border shadow-sm",
        className
      )}
    >
      {/* Search */}
      <div className="relative w-full md:w-80 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            "pl-9 pr-9 h-[38px] w-full rounded-lg text-sm",
            "bg-secondary border border-border/60",
            "placeholder:text-muted-foreground",
            "focus:outline-none"
          )}
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
        {children}

        {hasActiveFilters && onResetFilters && (
          <Button
            onClick={onResetFilters}
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground h-[38px]"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}

        {actions && (
          <div className="flex gap-2 items-center border-l border-border/50 pl-2 ml-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableToolbar;
