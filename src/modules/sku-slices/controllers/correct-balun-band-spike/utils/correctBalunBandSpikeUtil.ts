import {
  BALUN_FAKE_STOCK_KONK_NAME,
  BALUN_MANUAL_BAND_MAX,
  BALUN_MANUAL_BAND_MIN,
} from "../../../../slices/config/balunFakeStockSentinel.js";
import { Sku } from "../../../../skus/models/Sku.js";
import {
  correctBalunManualBandSpikesForRangeUtil,
  type BalunManualBandSkipFinding,
} from "../../../utils/correctBalunManualBandSpikesForRangeUtil.js";
import type { RtlBalunBandSpikeSkipReason } from "../../../utils/computeRtlBalunBandSpikePatches.js";
import type { CorrectBalunBandSpikeInput } from "../schemas/correctBalunBandSpikeSchema.js";

export type CorrectBalunBandSpikePatchFinding = {
  date: string;
  from: number;
  to: number;
};

export type CorrectBalunBandSpikeSkippedFinding = {
  dateFrom: string;
  dateTo: string;
  reason: RtlBalunBandSpikeSkipReason;
};

export type CorrectBalunBandSpikeOkResult = {
  ok: true;
  productId: string;
  window: { dateFrom: string; dateTo: string };
  band: { min: number; max: number };
  patches: CorrectBalunBandSpikePatchFinding[];
  skipped: CorrectBalunBandSpikeSkippedFinding[];
  applied: boolean;
};

export type CorrectBalunBandSpikeFailResult = {
  ok: false;
  code: "SKU_NOT_FOUND" | "NOT_BALUN" | "NO_PRODUCT_ID";
  message: string;
};

export type CorrectBalunBandSpikeResult =
  CorrectBalunBandSpikeOkResult | CorrectBalunBandSpikeFailResult;

function toSkipped(findings: BalunManualBandSkipFinding[]): CorrectBalunBandSpikeSkippedFinding[] {
  return findings.map((s) => ({
    dateFrom: s.dateFrom,
    dateTo: s.dateTo,
    reason: s.reason,
  }));
}

/**
 * Клиентский RTL-corrector sandwich small→[9000,10000]→small для одного balun SKU.
 * Не вызывается из nightly post-pass.
 */
export async function correctBalunBandSpikeUtil(
  input: CorrectBalunBandSpikeInput,
): Promise<CorrectBalunBandSpikeResult> {
  const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
  if (!sku) {
    return { ok: false, code: "SKU_NOT_FOUND", message: "Sku not found" };
  }

  const konkName = (sku.konkName ?? "").trim().toLowerCase();
  if (konkName !== BALUN_FAKE_STOCK_KONK_NAME) {
    return {
      ok: false,
      code: "NOT_BALUN",
      message: "Sku competitor is not balun",
    };
  }

  const productId = (sku.productId ?? "").trim();
  if (!productId) {
    return { ok: false, code: "NO_PRODUCT_ID", message: "Sku has no productId" };
  }

  const apply = input.apply === true;
  const range = await correctBalunManualBandSpikesForRangeUtil({
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    apply,
    productIds: [productId],
  });

  return {
    ok: true,
    productId,
    window: range.window,
    band: { min: BALUN_MANUAL_BAND_MIN, max: BALUN_MANUAL_BAND_MAX },
    patches: range.patched
      .filter((p) => p.productId === productId)
      .map((p) => ({ date: p.date, from: p.from, to: p.to })),
    skipped: toSkipped(range.skipped.filter((s) => s.productId === productId)),
    applied: apply && range.patched.length > 0,
  };
}
