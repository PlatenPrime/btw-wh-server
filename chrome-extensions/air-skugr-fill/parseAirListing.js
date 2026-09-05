/**
 * DOM-парсер карточек Air-листинга для unpacked-расширения.
 * Селекторы держать в синхроне с
 * src/modules/browser/air/group-pages/utils/parseAirGroupListingPage.ts
 */

const LAZY_IMAGE_MARKER = "lazy-image.svg";
const GRID_SEL = "#us-category-products, .us-category-products";
const GRID_CARDS_SEL =
  "#us-category-products div.product-layout[data-pid], .us-category-products div.product-layout[data-pid]";
const CONTENT_CARDS_SEL = "#content div.product-layout[data-pid]";

function resolveHref(href, pageUrl) {
  const trimmed = String(href || "").trim();
  if (!trimmed || trimmed === "#") {
    return null;
  }
  try {
    return new URL(trimmed, pageUrl).toString();
  } catch {
    return null;
  }
}

function pickProductCards(doc) {
  const fromGrid = doc.querySelectorAll(GRID_CARDS_SEL);
  if (fromGrid.length > 0) {
    return fromGrid;
  }
  return doc.querySelectorAll(CONTENT_CARDS_SEL);
}

function extractImageUrl(img, pageUrl) {
  if (!img) {
    return null;
  }
  const src = (img.getAttribute("src") || "").trim();
  const dataSrcset = (img.getAttribute("data-srcset") || "").trim();
  const dataSrc = (img.getAttribute("data-src") || "").trim();

  if (src && !src.includes(LAZY_IMAGE_MARKER)) {
    return resolveHref(src, pageUrl);
  }

  if (dataSrcset) {
    const firstPart = dataSrcset.split(/\s+/)[0]?.trim();
    if (firstPart) {
      const resolved = resolveHref(firstPart, pageUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (dataSrc) {
    return resolveHref(dataSrc, pageUrl);
  }

  if (src) {
    return resolveHref(src, pageUrl);
  }

  return null;
}

function textContent(el) {
  return el && typeof el.textContent === "string" ? el.textContent : "";
}

/**
 * @param {Document | { querySelector: Function, querySelectorAll: Function }} doc
 * @param {string} pageUrl
 */
export function parseAirListingFromDocument(doc, pageUrl) {
  const productsById = new Map();

  pickProductCards(doc).forEach((card) => {
    const productId = (card.getAttribute("data-pid") || "").trim();
    if (!productId) {
      return;
    }

    const img = card.querySelector(".us-module-img img");
    const imageUrl = extractImageUrl(img, pageUrl);

    const titleLink = card.querySelector(".us-module-title a");
    const title = textContent(titleLink).replace(/\s+/g, " ").trim();

    const imgLink = card.querySelector(".us-module-img a");
    const href =
      (imgLink && imgLink.getAttribute("href")) ||
      (titleLink && titleLink.getAttribute("href")) ||
      "";
    const url = resolveHref(href, pageUrl);

    if (!title || !url || !imageUrl) {
      return;
    }

    productsById.set(productId, {
      productId,
      title,
      url,
      imageUrl,
    });
  });

  const nextHref = doc.querySelector('link[rel="next"]');
  const nextRaw = nextHref ? nextHref.getAttribute("href") : null;
  const nextPageUrl = nextRaw ? resolveHref(nextRaw, pageUrl) : null;

  return {
    products: [...productsById.values()],
    nextPageUrl,
    hasListingMarkup: Boolean(doc.querySelector(GRID_SEL)),
  };
}

export function isAirListingPayload(value) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Array.isArray(value.products) &&
    typeof value.hasListingMarkup === "boolean" &&
    (value.nextPageUrl === null || typeof value.nextPageUrl === "string")
  );
}
