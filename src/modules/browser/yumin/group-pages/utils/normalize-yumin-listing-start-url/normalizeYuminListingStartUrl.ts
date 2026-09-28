/** Убирает `page` из query, чтобы crawl начинался с первой страницы листинга. */
export function normalizeYuminListingStartUrl(groupUrl: string): string {
  const u = new URL(groupUrl);
  u.searchParams.delete("page");
  return u.toString();
}
