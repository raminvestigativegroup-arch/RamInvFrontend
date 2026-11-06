export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export type SortValue = string | number | boolean | null | undefined;

/** Click cycle for a column header: ascending, then descending, then back to the default order. */
export const nextSort = (current: SortState | null, key: string): SortState | null => {
  if (!current || current.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : null;
};

const isBlank = (v: SortValue) => v === null || v === undefined || v === "";

/** Ascending comparison; text ignores case and compares embedded numbers numerically. */
export const compareSortValues = (a: SortValue, b: SortValue): number => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

/** Returns a sorted copy. Blank values always go last, whichever way the column is sorted. */
export function sortRows<T>(
  rows: T[],
  sort: SortState | null,
  getValue: (row: T, key: string) => SortValue,
): T[] {
  if (!sort) return rows;
  const dir = sort.direction === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: getValue(row, sort.key) }))
    .sort((x, y) => {
      const xBlank = isBlank(x.value);
      const yBlank = isBlank(y.value);
      if (xBlank || yBlank) return xBlank === yBlank ? x.index - y.index : xBlank ? 1 : -1;
      return compareSortValues(x.value, y.value) * dir || x.index - y.index;
    })
    .map((entry) => entry.row);
}

export const ariaSort = (sort: SortState | null, key: string): "ascending" | "descending" | "none" =>
  sort?.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
