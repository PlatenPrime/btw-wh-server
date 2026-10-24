import { throwIfAborted } from "../../apitasks/kinds/apiTaskRunTypes.js";
import { packFlipAutoApplyKonks } from "../../slices/config/packFlipAutoApplyKonks.js";
import { afterSkuSliceStockMutation } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import type { PostSkuSlicePostCorrectionsInput } from "../controllers/post-sku-slice-post-corrections/schemas/postSkuSlicePostCorrectionsSchema.js";
import { resolveSkuSliceRollupKonkNames } from "./resolveSkuSliceRollupKonkNames.js";
import {
  packFlipReviewDatesForSliceDay,
  reviewPackFlipsUtil,
  toUtcYmd,
  type PackFlipReviewResult,
} from "./reviewPackFlipsUtil.js";

export type RunSkuSlicePostCorrectionsHooks = {
  onPackFlipSuccess?: (review: PackFlipReviewResult) => Promise<void>;
  onPackFlipError?: (konkName: string, error: unknown) => Promise<void>;
  onRollupError?: (konkName: string, error: unknown) => Promise<void>;
};

export type RunSkuSlicePostCorrectionsInput = PostSkuSlicePostCorrectionsInput & {
  rollupKonkNames?: string[];
  hooks?: RunSkuSlicePostCorrectionsHooks;
  onProgress?: (done: number, total: number, message?: string) => void;
  signal?: AbortSignal;
};

export type PostCorrectionStepError = {
  step: string;
  asOf?: string;
  konkName?: string;
  message: string;
};

export type RunSkuSlicePostCorrectionsDayResult = {
  asOf: string;
  packFlips: Array<{
    konkName: string;
    review?: PackFlipReviewResult;
    error?: string;
  }>;
  rollupErrors: Array<{ konkName: string; message: string }>;
};

export type RunSkuSlicePostCorrectionsResult = {
  apply: boolean;
  dateFrom: string;
  dateTo: string;
  konkName?: string;
  days: RunSkuSlicePostCorrectionsDayResult[];
  errors: PostCorrectionStepError[];
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type StepFlags = {
  packFlipKonks: readonly string[];
  rollupKonks: string[];
};

function resolveStepFlags(konkName: string | undefined, allRollupKonks: string[]): StepFlags {
  if (!konkName) {
    return {
      packFlipKonks: packFlipAutoApplyKonks,
      rollupKonks: allRollupKonks,
    };
  }

  if (packFlipAutoApplyKonks.includes(konkName)) {
    return {
      packFlipKonks: [konkName],
      rollupKonks: [konkName],
    };
  }

  return {
    packFlipKonks: [],
    rollupKonks: [konkName],
  };
}

/**
 * Post-pass после срезов: pack-flip auto-apply (perfect) + manufacturer rollup.
 * Fake-stock / band-spike сюда не входят — только ручной клиентский flow.
 */
export async function runSkuSlicePostCorrectionsUtil(
  input: RunSkuSlicePostCorrectionsInput,
): Promise<RunSkuSlicePostCorrectionsResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const apply = input.apply ?? false;
  const konkName = input.konkName;
  const asOfDates = enumerateReportingDates(dateFrom, dateTo);
  const allRollupKonks = input.rollupKonkNames ?? (await resolveSkuSliceRollupKonkNames());
  const flags = resolveStepFlags(konkName, allRollupKonks);
  const errors: PostCorrectionStepError[] = [];
  const days: RunSkuSlicePostCorrectionsDayResult[] = [];
  const totalSteps = asOfDates.length;

  for (let dayIndex = 0; dayIndex < asOfDates.length; dayIndex++) {
    throwIfAborted(input.signal);
    const asOf = asOfDates[dayIndex]!;
    const asOfYmd = toUtcYmd(asOf);
    input.onProgress?.(
      dayIndex,
      totalSteps,
      `Post-corrections ${asOfYmd} (${dayIndex + 1}/${totalSteps})`,
    );

    const dayResult: RunSkuSlicePostCorrectionsDayResult = {
      asOf: asOfYmd,
      packFlips: [],
      rollupErrors: [],
    };

    for (const packKonk of flags.packFlipKonks) {
      throwIfAborted(input.signal);
      try {
        const review = await reviewPackFlipsUtil({
          dates: packFlipReviewDatesForSliceDay(asOf),
          apply,
          konkName: packKonk,
        });
        dayResult.packFlips.push({ konkName: packKonk, review });
        await input.hooks?.onPackFlipSuccess?.(review);
      } catch (error) {
        const message = errorMessage(error);
        dayResult.packFlips.push({ konkName: packKonk, error: message });
        errors.push({
          step: "pack-flip",
          asOf: asOfYmd,
          konkName: packKonk,
          message,
        });
        await input.hooks?.onPackFlipError?.(packKonk, error);
      }
    }

    throwIfAborted(input.signal);

    for (const rollupKonk of flags.rollupKonks) {
      throwIfAborted(input.signal);
      try {
        await afterSkuSliceStockMutation({ konkName: rollupKonk, dayD: asOf });
      } catch (error) {
        const message = errorMessage(error);
        dayResult.rollupErrors.push({ konkName: rollupKonk, message });
        errors.push({
          step: "rollup",
          asOf: asOfYmd,
          konkName: rollupKonk,
          message,
        });
        await input.hooks?.onRollupError?.(rollupKonk, error);
      }
    }

    days.push(dayResult);
  }

  input.onProgress?.(totalSteps, totalSteps, "Post-corrections completed");

  return {
    apply,
    dateFrom: toUtcYmd(dateFrom),
    dateTo: toUtcYmd(dateTo),
    ...(konkName ? { konkName } : {}),
    days,
    errors,
  };
}
