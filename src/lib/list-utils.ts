export type SortDir = "asc" | "desc";

export function sortItems<T>(
  items: T[],
  field: string | undefined,
  dir: SortDir,
  accessors: Record<string, (item: T) => string | number>,
): T[] {
  if (!field || !accessors[field]) return items;
  const get = accessors[field];
  const sign = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
    return String(av).localeCompare(String(bv)) * sign;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pageCount,
    page: safePage,
    start,
    end: Math.min(start + pageSize, items.length),
  };
}