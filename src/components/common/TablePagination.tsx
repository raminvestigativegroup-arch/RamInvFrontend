import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string; // e.g. "sites", "guards", "records"
}

/**
 * Standardized pagination bar for all listing pages. Renders
 * a "Showing X–Y of Z" summary on the left and page navigation
 * controls on the right.
 */
const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  className,
  itemLabel = "records",
}) => {
  if (totalPages <= 1 && totalItems <= limit) return null;

  const from = Math.min(totalItems, (page - 1) * limit + 1);
  const to = Math.min(totalItems, page * limit);

  /** Generate the visible page numbers (always show first/last + 1 around current) */
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => Math.abs(p - page) <= 1 || p === 1 || p === totalPages
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border bg-secondary/30 px-6 py-3.5",
        className
      )}
    >
      {/* Count summary */}
      <p className="text-xs text-muted-foreground hidden sm:block">
        Showing{" "}
        <span className="font-semibold text-foreground">{from}</span>
        {" – "}
        <span className="font-semibold text-foreground">{to}</span>
        {" of "}
        <span className="font-semibold text-foreground">{totalItems}</span>{" "}
        {itemLabel}
      </p>

      {/* Page controls */}
      <div className="flex gap-1 items-center ml-auto">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {pages.map((p, idx, arr) => {
          const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
          return (
            <React.Fragment key={p}>
              {showEllipsis && (
                <span className="text-muted-foreground text-xs px-0.5">…</span>
              )}
              <Button
                variant={page === p ? "default" : "outline"}
                size="icon"
                className={cn("h-8 w-8 text-xs font-bold", page === p && "pointer-events-none")}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            </React.Fragment>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;
