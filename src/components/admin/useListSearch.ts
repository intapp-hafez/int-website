import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ViewMode } from "./ViewToggle";

export type SortDir = "asc" | "desc";
export type ListSearch = {
  view?: ViewMode;
  page?: number;
  sort?: string;
  dir?: SortDir;
};

export function validateListSearch(s: Record<string, unknown>): ListSearch {
  const view = s.view === "grid" || s.view === "list" || s.view === "table" ? (s.view as ViewMode) : undefined;
  const pageNum = typeof s.page === "number" ? s.page : typeof s.page === "string" ? Number(s.page) : NaN;
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : undefined;
  const sort = typeof s.sort === "string" && s.sort ? s.sort : undefined;
  const dir = s.dir === "asc" || s.dir === "desc" ? (s.dir as SortDir) : undefined;
  return { view, page, sort, dir };
}

export function useListSearch(opts: { defaultView?: ViewMode; defaultSort?: string; defaultDir?: SortDir } = {}) {
  const search = useSearch({ strict: false }) as ListSearch;
  const navigate = useNavigate();
  const view: ViewMode = (search.view as ViewMode) ?? opts.defaultView ?? "table";
  const page = search.page ?? 1;
  const sort = search.sort ?? opts.defaultSort;
  const dir: SortDir = search.dir ?? opts.defaultDir ?? "asc";

  const setSearch = (patch: Partial<ListSearch>) => {
    navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }),
      replace: true,
    } as any);
  };

  const setPage = (p: number) => setSearch({ page: p > 1 ? p : undefined });

  const toggleSort = (field: string) => {
    if (sort !== field) setSearch({ sort: field, dir: "asc", page: undefined });
    else if (dir === "asc") setSearch({ sort: field, dir: "desc", page: undefined });
    else setSearch({ sort: undefined, dir: undefined, page: undefined });
  };

  return { view, page, sort, dir, setSearch, setPage, toggleSort };
}