export const PARTNERS_PAGE_SIZE = 20;

export function paginatePartners<T>(items: readonly T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PARTNERS_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, requestedPage));
  const start = (page - 1) * PARTNERS_PAGE_SIZE;
  return { page, totalPages, items: items.slice(start, start + PARTNERS_PAGE_SIZE) };
}