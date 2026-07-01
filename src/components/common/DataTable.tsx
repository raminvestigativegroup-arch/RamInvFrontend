import React from "react";
import { cn } from "@/lib/utils";
import StateMessage from "./StateMessage";
import { LucideIcon } from "lucide-react";

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
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
}: DataTableProps<T>) {
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
                    className={cn(
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.headerClassName
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => renderRow(item, index))}
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
