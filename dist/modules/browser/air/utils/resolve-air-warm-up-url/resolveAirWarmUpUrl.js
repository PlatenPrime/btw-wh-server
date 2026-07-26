/**
 * Origin + `/` для warm-up перед product page (session cookies).
 */
export function resolveAirWarmUpUrl(productUrl) {
    const origin = new URL(productUrl).origin;
    return `${origin}/`;
}
