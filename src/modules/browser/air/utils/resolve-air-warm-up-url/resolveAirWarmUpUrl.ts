/**
 * Origin + "/" для Impit warm-up (cookies в jar до product GET).
 */
export function resolveAirWarmUpUrl(productUrl: string): string | undefined {
  if (!URL.canParse(productUrl)) {
    return undefined;
  }
  return `${new URL(productUrl).origin}/`;
}
