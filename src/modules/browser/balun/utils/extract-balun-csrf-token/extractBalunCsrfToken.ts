export const BALUN_CSRF_COOKIE_NAME = "csrf_token_company_site";

const HTML_CSRF_PATTERNS = [
  /<meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']csrf-token["']/i,
  /["']?csrfToken["']?\s*[:=]\s*["']([^"']+)["']/,
  /["']?csrf_token["']?\s*[:=]\s*["']([^"']+)["']/,
];

/**
 * Значение cookie из заголовка `Cookie` (`a=1; b=2`).
 */
export function getCookieValue(
  cookieHeader: string,
  name: string
): string | undefined {
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const pair = part.trim();
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    if (pair.slice(0, eq).trim() !== name) continue;
    const value = pair.slice(eq + 1).trim();
    return value || undefined;
  }
  return undefined;
}

/**
 * CSRF для `x-csrftoken`: сначала HTML (meta / JSON), иначе cookie `csrf_token_company_site`.
 */
export function extractBalunCsrfToken(
  html: string,
  cookieHeader: string
): string | undefined {
  for (const pattern of HTML_CSRF_PATTERNS) {
    const match = html.match(pattern);
    const token = match?.[1]?.trim();
    if (token) return token;
  }
  return getCookieValue(cookieHeader, BALUN_CSRF_COOKIE_NAME);
}
