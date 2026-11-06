import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import StateMessage from "./StateMessage";
import SortButton from "./SortButton";
import { LucideIcon } from "lucide-react";
import { SortState, SortValue, ariaSort, nextSort, sortRows } from "@/lib/tableSort";

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  /** Makes the header clickable to sort by this column */
  sortable?: boolean;
  /** Value used to sort a row in the browser; defaults to item[key] */
  sortValue?: (item: T) => SortValue;
}

interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  emptyIcon?: LucideIcon;
  renderRow: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  footer?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  onRowClick?: (item: T) => void;
  selectedId?: string | null;
  /** Extra header row content rendered after the last column header (for action-column alignment) */
  trailingColumn?: React.ReactNode;
  /**
   * Controlled sort for server-side sorting (tables that are paged by the API).
   * When onSortChange is given, rows are shown in the order received and the parent refetches.
   * Without it, the table sorts the rows it has in the browser.
   */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
}

function DataTable<T = any>({
  columns,
  data,
  isLoading,
  isError,
  isEmpty,
  loadingMessage = "Loading data...",
  emptyTitle = "No records found",
  emptyMessage = "Try adjusting your filters or creating a new entry.",
  errorTitle = "Failed to load data",
  errorMessage = "An unexpected error occurred. Please try again.",
  emptyIcon,
  renderRow,
  footer,
  className,
  tableClassName,
  sort: controlledSort,
  onSortChange,
}: DataTableProps<T>) {
  const isServerSort = !!onSortChange;
  const [localSort, setLocalSort] = useState<SortState | null>(null);
  const sort = isServerSort ? controlledSort ?? null : localSort;

  const rows = useMemo(() => {
    if (isServerSort || !sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    return sortRows(data, sort, (item) => (col.sortValue ? col.sortValue(item) : (item as any)?.[col.key]));
  }, [data, columns, sort, isServerSort]);

  const handleSort = (key: string) => {
    const next = nextSort(sort, key);
    if (isServerSort) onSortChange!(next);
    else setLocalSort(next);
  };

  return (
    <div className={cn("data-table", className)}>
      {isLoading ? (
        <StateMessage type="loading" message={loadingMessage} className="p-8" />
      ) : isError ? (
        <StateMessage
          type="error"
          title={errorTitle}
          message={errorMessage}
          className="p-8"
        />
      ) : isEmpty || data.length === 0 ? (
        <StateMessage
          type="empty"
          title={emptyTitle}
          message={emptyMessage}
          icon={emptyIcon}
          className="p-8"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className={cn("w-full", tableClassName)}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    aria-sort={col.sortable ? ariaSort(sort, col.key) : undefined}
                    className={cn(
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.headerClassName
                    )}
                  >
                    {col.sortable ? (
                      <SortButton
                        label={col.label}
                        direction={sort?.key === col.key ? sort.direction : undefined}
                        onClick={() => handleSort(col.key)}
                      />
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => renderRow(item, index))}
            </tbody>
          </table>
        </div>
      )}
      {footer && (
        <div className="border-t border-border bg-secondary/30 px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}

export default DataTable;
