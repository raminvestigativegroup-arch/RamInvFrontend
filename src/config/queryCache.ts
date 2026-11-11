import { keepPreviousData } from "@tanstack/react-query";

/**
 * Cache settings for listing queries (tables and card grids with search, filters, sorting, paging).
 *
 * - staleTime: coming back to a list, or revisiting a filter combination, within this window
 *   shows the cached rows without another request. Every create/edit/delete invalidates the
 *   list's key, so changes made in the app show up immediately.
 * - gcTime: how long unused results are kept for revisiting.
 * - keepPreviousData: while a new page, filter or sort loads, the current rows stay on screen
 *   instead of the table flashing to a loading state.
 *
 * Only use this on listing queries with their own key; shared keys can hold differently shaped data.
 */
export const LIST_QUERY_OPTIONS = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  placeholderData: keepPreviousData,
} as const;
