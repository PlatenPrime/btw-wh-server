export function parseCustomizableOptions(html) {
    const priceMatch = html.match(/:initial-price="([\d.]+)"/);
    const qtyMatch = html.match(/:flat-qty="(\d+)"/);
    if (!priceMatch?.[1] || !qtyMatch?.[1]) {
        return null;
    }
    const initialPrice = parseFloat(priceMatch[1]);
    const flatQty = parseInt(qtyMatch[1], 10);
    if (!Number.isFinite(initialPrice) || !Number.isFinite(flatQty) || flatQty < 0) {
        return null;
    }
    return { initialPrice, flatQty };
}
