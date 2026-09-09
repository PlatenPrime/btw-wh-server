import { tryParseJsonRecord } from "../../../utils/try-parse-json-record/tryParseJsonRecord.js";

/** HTML `#product-details` из JSON `action=refresh` PrestaShop. */
export function extractProductDetailsHtmlFromRefreshResponse(
  raw: string
): string | null {
  const parsed = tryParseJsonRecord(raw);
  if (!parsed) return null;
  const details = parsed.product_details;
  if (typeof details !== "string") return null;
  const trimmed = details.trim();
  return trimmed || null;
}
