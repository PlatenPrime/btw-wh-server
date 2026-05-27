/** HTML похож на карточку товара PrestaShop (perfectparty), даже при HTTP 500. */
export function isPerfectProductPageHtml(html) {
    if (/id=["']product-details["'][^>]*\bdata-product\b/i.test(html))
        return true;
    if (/id=["']add-to-cart-or-refresh["']/i.test(html))
        return true;
    if (/name=["']id_product["']/i.test(html))
        return true;
    if (/"id_product"\s*:\s*\d+/.test(html))
        return true;
    return false;
}
