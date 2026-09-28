export function buildYuminProductPageUrl(
  listingPageUrl: string,
  urlKey: string
): string {
  const origin = new URL(listingPageUrl).origin;
  const path = urlKey.replace(/^\/+/, "");
  return new URL(`/${path}`, origin).toString();
}
