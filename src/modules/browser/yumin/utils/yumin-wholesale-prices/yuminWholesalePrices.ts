import { parseStrippedDecimal } from "../../../utils/parse-stripped-decimal/parseStrippedDecimal.js";

export function parseWholesalePrices(html: string): number[] {
  const prices: number[] = [];
  const re =
    /Від\s+(\d+)\s*шт\.?\s*<\/p>\s*<p[^>]*>([^<]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const value = parseStrippedDecimal(m[2]);
    if (value !== null) {
      prices.push(value);
    }
  }
  return prices;
}
