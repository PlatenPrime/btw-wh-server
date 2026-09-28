/**
 * Предпочитает HTML-цену; иначе finite GraphQL unit selling >= 0.
 * `null` и `undefined` HTML трактуются одинаково (нет цены).
 */
export function resolvePromUaUnitPrice(
  htmlPrice: number | null | undefined,
  graphqlPrice: number | null | undefined
): number | undefined {
  if (htmlPrice != null) {
    return htmlPrice;
  }
  if (
    graphqlPrice != null &&
    Number.isFinite(graphqlPrice) &&
    graphqlPrice >= 0
  ) {
    return graphqlPrice;
  }
  return undefined;
}
