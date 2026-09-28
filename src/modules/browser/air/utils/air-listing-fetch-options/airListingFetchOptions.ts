import { getAirHttpProxyUrl } from "../getAirHttpProxyUrl.js";

/** Опции Impit fetch для Air listing (Referer на warm-up origin). */
export function airListingFetchOptions(warmUpUrl: string | undefined) {
  const proxyUrl = getAirHttpProxyUrl();
  return {
    konkName: "air" as const,
    transport: "impit" as const,
    proxyUrl,
    ...(warmUpUrl
      ? {
          headers: {
            Referer: warmUpUrl,
            "Sec-Fetch-Site": "same-origin",
          },
        }
      : {}),
  };
}
