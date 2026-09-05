import { urlsMatchForClientIngest } from "../../sku-slices/utils/urlsMatchForClientIngest.js";

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * pageUrl — та же категория, что groupUrl: origin + pathname совпадают,
 * query совпадает кроме параметра `page`.
 */
export function isAirListingPageOfGroup(
  pageUrl: string,
  groupUrl: string
): boolean {
  try {
    const page = new URL(pageUrl.trim());
    const group = new URL(groupUrl.trim());
    if (page.origin !== group.origin) {
      return false;
    }
    if (normalizePathname(page.pathname) !== normalizePathname(group.pathname)) {
      return false;
    }

    const groupParams = new URLSearchParams(group.search);
    const pageParams = new URLSearchParams(page.search);

    for (const [key, value] of groupParams) {
      if (key === "page") {
        continue;
      }
      if (pageParams.get(key) !== value) {
        return false;
      }
    }

    for (const [key] of pageParams) {
      if (key === "page") {
        continue;
      }
      if (!groupParams.has(key)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function sourceUrlMatchesSkugrUrl(
  sourceUrl: string,
  skugrUrl: string
): boolean {
  return urlsMatchForClientIngest(sourceUrl, skugrUrl);
}
