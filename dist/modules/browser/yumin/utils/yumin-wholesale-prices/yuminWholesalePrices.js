import { parseStrippedDecimal } from "../../../utils/parse-stripped-decimal/parseStrippedDecimal.js";
export function parseWholesalePrices(html) {
    const prices = [];
    const re = /Від\s+(\d+)\s*шт\.?\s*<\/p>\s*<p[^>]*>([^<]*?)<\/p>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const value = parseStrippedDecimal(m[2]);
        if (value !== null) {
            prices.push(value);
        }
    }
    return prices;
}
