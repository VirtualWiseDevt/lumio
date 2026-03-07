import { useState, useMemo, useCallback, useEffect, useRef } from "react";

export type StatusFilter = "all" | "published" | "draft";
export type ViewMode = "grid" | "table";
export type SortOrder = "asc" | "desc";

export interface ContentFilterState {
  status: StatusFilter;
  category: string | undefined;
  search: string;
  debouncedSearch: string;
  page: number;
  sortBy: string;
  sortOrder: SortOrder;
  viewMode: ViewMode;
}

export interface ContentFilterActions {
  setStatus: (status: StatusFilter) => void;
  setCategory: (category: string | undefined) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  toggleSortOrder: () => void;
  setViewMode: (viewMode: ViewMode) => void;
}

export function useContentFilters(): ContentFilterState & ContentFilterActions {
  const [status, setStatusRaw] = useState<StatusFilter>("all");
  const [category, setCategoryRaw] = useState<string | undefined>(undefined);
  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPageRaw] = useState(1);
  const [sortBy, setSortByRaw] = useState("createdAt");
  const [sortOrder, setSortOrderRaw] = useState<SortOrder>("desc");
  const [viewMode, setViewModeRaw] = useState<ViewMode>("grid");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPageRaw(1); // Reset to first page on search change
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  // Reset page when filters change
  const setStatus = useCallback((s: StatusFilter) => {
    setStatusRaw(s);
    setPageRaw(1);
  }, []);

  const setCategory = useCallback((c: string | undefined) => {
    setCategoryRaw(c);
    setPageRaw(1);
  }, []);

  const setSearch = useCallback((s: string) => {
    setSearchRaw(s);
  }, []);

  const setPage = useCallback((p: number) => {
    setPageRaw(p);
  }, []);

  const setSortBy = useCallback((s: string) => {
    setSortByRaw(s);
    setPageRaw(1);
  }, []);

  const setSortOrder = useCallback((o: SortOrder) => {
    setSortOrderRaw(o);
    setPageRaw(1);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrderRaw((prev) => (prev === "asc" ? "desc" : "asc"));
    setPageRaw(1);
  }, []);

  const setViewMode = useCallback((v: ViewMode) => {
    setViewModeRaw(v);
  }, []);

  return useMemo(
    () => ({
      status,
      category,
      search,
      debouncedSearch,
      page,
      sortBy,
      sortOrder,
      viewMode,
      setStatus,
      setCategory,
      setSearch,
      setPage,
      setSortBy,
      setSortOrder,
      toggleSortOrder,
      setViewMode,
    }),
    [
      status,
      category,
      search,
      debouncedSearch,
      page,
      sortBy,
      sortOrder,
      viewMode,
      setStatus,
      setCategory,
      setSearch,
      setPage,
      setSortBy,
      setSortOrder,
      toggleSortOrder,
      setViewMode,
    ],
  );
}
