import { Sku } from "../../../../skus/models/Sku.js";
import {
  correctManualBandSpikesForRangeUtil,
  type ManualBandSkipFinding,
} from "../../../utils/correctManualBandSpikesForRangeUtil.js";
import type { RtlBandSpikeSkipReason } from "../../../utils/computeRtlBandSpikePatches.js";
import type { CorrectBandSpikeInput } from "../schemas/correctBandSpikeSchema.js";

export type CorrectBandSpikePatchFinding = {
  date: string;
  from: number;
  to: number;
};

export type CorrectBandSpikeSkippedFinding = {
  dateFrom: string;
  dateTo: string;
  reason: RtlBandSpikeSkipReason;
};

export type CorrectBandSpikeOkResult = {
  ok: true;
  konkName: string;
  productId: string;
  window: { dateFrom: string; dateTo: string };
  band: { min: number; max: number };
  patches: CorrectBandSpikePatchFinding[];
  skipped: CorrectBandSpikeSkippedFinding[];
  applied: boolean;
};

export type CorrectBandSpikeFailResult = {
  ok: false;
  code: "SKU_NOT_FOUND" | "NO_KONK_NAME" | "NO_PRODUCT_ID";
  message: string;
};

export type CorrectBandSpikeResult = CorrectBandSpikeOkResult | CorrectBandSpikeFailResult;

function toSkipped(findings: ManualBandSkipFinding[]): CorrectBandSpikeSkippedFinding[] {
  return findings.map((s) => ({
    dateFrom: s.dateFrom,
    dateTo: s.dateTo,
    reason: s.reason,
  }));
}

/**
 * Клиентский RTL-corrector sandwich small→[stockMin,stockMax]→small для одного SKU любого конкурента.
 */
export async function correctBandSpikeUtil(
  input: CorrectBandSpikeInput,
): Promise<CorrectBandSpikeResult> {
  const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
  if (!sku) {
    return { ok: false, code: "SKU_NOT_FOUND", message: "Sku not found" };
  }

  const konkName = (sku.konkName ?? "").trim().toLowerCase();
  if (!konkName) {
    return {
      ok: false,
      code: "NO_KONK_NAME",
      message: "Sku has no konkName",
    };
  }

  const productId = (sku.productId ?? "").trim();
  if (!productId) {
    return { ok: false, code: "NO_PRODUCT_ID", message: "Sku has no productId" };
  }

  const apply = input.apply === true;
  const range = await correctManualBandSpikesForRangeUtil({
    konkName,
    stockMin: input.stockMin,
    stockMax: input.stockMax,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    apply,
    productIds: [productId],
  });

  return {
    ok: true,
    konkName,
    productId,
    window: range.window,
    band: range.band,
    patches: range.patched
      .filter((p) => p.productId === productId)
      .map((p) => ({ date: p.date, from: p.from, to: p.to })),
    skipped: toSkipped(range.skipped.filter((s) => s.productId === productId)),
    applied: apply && range.patched.length > 0,
  };
}
