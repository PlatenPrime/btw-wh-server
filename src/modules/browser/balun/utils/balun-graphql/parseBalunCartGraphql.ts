import { tryParseJsonRecord } from "../../../utils/try-parse-json-record/tryParseJsonRecord.js";
import { parseStrippedDecimal } from "../../../utils/parse-stripped-decimal/parseStrippedDecimal.js";

const STOCK_CLAMP_REASON = "EXCEEDS_AMOUNT_OF_PRODUCT_IN_STOCK";

export type BalunAddProductResult =
  | { kind: "success"; cartId: string; unitSellingPrice: number | null }
  | { kind: "notOrderable" }
  | { kind: "error" };

export type BalunChangeQuantityResult =
  | { kind: "recalculated"; quantity: number; unitSellingPrice: number | null }
  | { kind: "set" }
  | { kind: "error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (typeof body === "string") {
    return tryParseJsonRecord(body);
  }
  if (isRecord(body)) {
    return body;
  }
  return null;
}

function readTypename(value: Record<string, unknown>): string | undefined {
  return typeof value.__typename === "string" ? value.__typename : undefined;
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    if (Number.isFinite(value) && value >= 0) return value;
    return null;
  }
  if (typeof value === "string") {
    return parseStrippedDecimal(value);
  }
  return null;
}

function unwrapGraphqlData(body: unknown): Record<string, unknown> | null {
  const record = asRecord(body);
  if (!record) return null;
  return isRecord(record.data) ? record.data : null;
}

function readUnitSelling(item: Record<string, unknown>): number | null {
  if (!isRecord(item.price) || !isRecord(item.price.unit)) return null;
  return parseNonNegativeNumber(item.price.unit.selling);
}

function pickItem(
  items: unknown,
  productId: string
): Record<string, unknown> | undefined {
  if (!Array.isArray(items)) return undefined;
  const records = items.filter(isRecord);
  const matched = records.find((item) => item.productId === productId);
  return matched ?? records[0];
}

function readCarts(payload: Record<string, unknown>): unknown[] {
  if (!isRecord(payload.self) || !isRecord(payload.self.cartList)) return [];
  const carts = payload.self.cartList.carts;
  return Array.isArray(carts) ? carts : [];
}

function readChangeCart(payload: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!isRecord(payload.self) || !isRecord(payload.self.cartList)) return undefined;
  return isRecord(payload.self.cartList.cart) ? payload.self.cartList.cart : undefined;
}

/**
 * Разбирает union `cartAddProduct`.
 */
export function parseBalunAddProductResponse(
  body: unknown,
  productId: string
): BalunAddProductResult {
  const data = unwrapGraphqlData(body);
  if (!data || !isRecord(data.cartAddProduct)) {
    return { kind: "error" };
  }

  const payload = data.cartAddProduct;
  const typename = readTypename(payload);

  if (typename === "CartAddProductSuccess") {
    const carts = readCarts(payload).filter(isRecord);
    const cart = carts[0];
    const cartId = typeof cart?.id === "string" ? cart.id.trim() : "";
    if (!cartId) {
      return { kind: "error" };
    }
    const item = pickItem(cart.items, productId);
    return {
      kind: "success",
      cartId,
      unitSellingPrice: item ? readUnitSelling(item) : null,
    };
  }

  if (
    typename === "ProductNotOrderableError" ||
    typename === "CantAddDeletedProductToCartErrorType"
  ) {
    return { kind: "notOrderable" };
  }

  return { kind: "error" };
}

/**
 * Разбирает union `cartChangeProductQuantity`.
 * Точный остаток — только `RequestedQuantityRecalculatedType` с reason склада.
 */
export function parseBalunChangeQuantityResponse(
  body: unknown,
  productId: string
): BalunChangeQuantityResult {
  const data = unwrapGraphqlData(body);
  if (!data || !isRecord(data.cartChangeProductQuantity)) {
    return { kind: "error" };
  }

  const payload = data.cartChangeProductQuantity;
  const typename = readTypename(payload);

  if (typename === "RequestedQuantitySet") {
    return { kind: "set" };
  }

  if (typename === "RequestedQuantityRecalculatedType") {
    if (payload.recalculatedReason !== STOCK_CLAMP_REASON) {
      return { kind: "error" };
    }
    const quantity = parseNonNegativeNumber(payload.recalculatedQuantity);
    if (quantity === null) {
      return { kind: "error" };
    }
    const cart = readChangeCart(payload);
    const item = cart ? pickItem(cart.items, productId) : undefined;
    return {
      kind: "recalculated",
      quantity,
      unitSellingPrice: item ? readUnitSelling(item) : null,
    };
  }

  return { kind: "error" };
}
