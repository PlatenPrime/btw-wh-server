import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";
import {
  reviewPackFlipsUtil,
  type PackFlipReviewResult,
} from "../../../utils/reviewPackFlipsUtil.js";
import type { GetPackFlipReviewInput } from "../schemas/getPackFlipReviewSchema.js";

export type PackFlipReviewApiData = Omit<PackFlipReviewResult, "apply">;

export async function getPackFlipReviewUtil(
  input: GetPackFlipReviewInput
): Promise<PackFlipReviewApiData> {
  const dates = enumerateSliceDates(input.dateFrom, input.dateTo);
  const result = await reviewPackFlipsUtil({
    dates,
    apply: false,
    konkName: input.konkName,
  });
  return {
    konkName: result.konkName,
    dates: result.dates,
    patched: result.patched,
    priceOnly: result.priceOnly,
    ambiguous: result.ambiguous,
  };
}
