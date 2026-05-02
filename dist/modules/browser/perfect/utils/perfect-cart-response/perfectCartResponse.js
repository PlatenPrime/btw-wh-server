import { tryParseJsonRecord } from "../../../utils/try-parse-json-record/tryParseJsonRecord.js";
import { parseNumberLike } from "../parse-number-like/parseNumberLike.js";
export function parseCartResponse(raw) {
    const parsed = tryParseJsonRecord(raw);
    return parsed;
}
export function parsePackPrice(product) {
    const direct = parseNumberLike(product.price_without_reduction);
    if (direct !== null)
        return direct;
    const embeddedDirect = parseNumberLike(product.embedded_attributes?.price_without_reduction);
    if (embeddedDirect !== null)
        return embeddedDirect;
    const embeddedText = parseNumberLike(product.embedded_attributes?.price);
    if (embeddedText !== null)
        return embeddedText;
    return parseNumberLike(product.price);
}
