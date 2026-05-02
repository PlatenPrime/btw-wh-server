import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { parseLdJsonProductName } from "../yumin-ld-json-product-name/yuminLdJsonProductName.js";
export function pickTitle($) {
    const h1 = $("h1.text-3xl").first().text().trim();
    if (h1) {
        return h1;
    }
    const og = $('meta[property="og:title"]').attr("content");
    if (og?.trim()) {
        return decodeHtmlEntities(og.trim());
    }
    return parseLdJsonProductName($) ?? "";
}
export function pickNameForPieceCount($) {
    const ld = parseLdJsonProductName($);
    if (ld?.trim()) {
        return ld.trim();
    }
    const h1 = $("h1.text-3xl").first().text().trim();
    if (h1) {
        return h1;
    }
    const og = $('meta[property="og:title"]').attr("content");
    if (og?.trim()) {
        return decodeHtmlEntities(og.trim());
    }
    return "";
}
