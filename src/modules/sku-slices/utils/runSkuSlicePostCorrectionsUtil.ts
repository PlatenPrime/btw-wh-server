import { throwIfAborted } from "../../apitasks/kinds/apiTaskRunTypes.js";
import { BALUN_FAKE_STOCK_CRON_DAYS_BACK } from "../../slices/config/balunFakeStockSentinel.js";
import { packFlipAutoApplyKonks } from "../../slices/config/packFlipAutoApplyKonks.js";
import { SVBUM_FAKE_STOCK_CRON_DAYS_BACK } from "../../slices/config/svbumFakeStockThreshold.js";
import { afterSkuSliceStockMutation } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import type { PostSkuSlicePostCorrectionsInput } from "../controllers/post-sku-slice-post-corrections/schemas/postSkuSlicePostCorrectionsSchema.js";
import {
  correctBalunFakeStockSpikesUtil,
  type CorrectBalunFakeStockSpikesResult,
} from "./correctBalunFakeStockSpikesUtil.js";
import {
  correctSvbumFakeStockSpikesUtil,
  type CorrectSvbumFakeStockSpikesResult,
} from "./correctSvbumFakeStockSpikesUtil.js";
import { resolveSkuSliceRollupKonkNames } from "./resolveSkuSliceRollupKonkNames.js";
import {
  packFlipReviewDatesForSliceDay,
  reviewPackFlipsUtil,
  toUtcYmd,
  type PackFlipReviewResult,
} from "./reviewPackFlipsUtil.js";

export type RunSkuSlicePostCorrectionsHooks = {
  onBalunError?: (error: unknown) => Promise<void>;
  onSvbumError?: (error: unknown) => Promise<void>;
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
  balun?: CorrectBalunFakeStockSpikesResult | { error: string };
  svbum?: CorrectSvbumFakeStockSpikesResult | { error: string };
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
  days: RunSkuSlicePostCorrectionsDayResult[];
  errors: PostCorrectionStepError[];
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function runBalunStep(
  asOf: Date,
  apply: boolean
): Promise<CorrectBalunFakeStockSpikesResult> {
  return correctBalunFakeStockSpikesUtil({
    daysBack: BALUN_FAKE_STOCK_CRON_DAYS_BACK,
    asOf,
    apply,
  });
}

async function runSvbumStep(
  asOf: Date,
  apply: boolean
): Promise<CorrectSvbumFakeStockSpikesResult> {
  return correctSvbumFakeStockSpikesUtil({
    daysBack: SVBUM_FAKE_STOCK_CRON_DAYS_BACK,
    asOf,
    apply,
  });
}

export async function runSkuSlicePostCorrectionsUtil(
  input: RunSkuSlicePostCorrectionsInput
): Promise<RunSkuSlicePostCorrectionsResult> {
  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const apply = input.apply ?? false;
  const asOfDates = enumerateReportingDates(dateFrom, dateTo);
  const rollupKonkNames =
    input.rollupKonkNames ?? (await resolveSkuSliceRollupKonkNames());
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
      `Post-corrections ${asOfYmd} (${dayIndex + 1}/${totalSteps})`
    );

    const dayResult: RunSkuSlicePostCorrectionsDayResult = {
      asOf: asOfYmd,
      packFlips: [],
      rollupErrors: [],
    };

    try {
      dayResult.balun = await runBalunStep(asOf, apply);
    } catch (error) {
      const message = errorMessage(error);
      dayResult.balun = { error: message };
      errors.push({ step: "balun", asOf: asOfYmd, message });
      await input.hooks?.onBalunError?.(error);
    }

    throwIfAborted(input.signal);

    try {
      dayResult.svbum = await runSvbumStep(asOf, apply);
    } catch (error) {
      const message = errorMessage(error);
      dayResult.svbum = { error: message };
      errors.push({ step: "svbum", asOf: asOfYmd, message });
      await input.hooks?.onSvbumError?.(error);
    }

    throwIfAborted(input.signal);

    for (const konkName of packFlipAutoApplyKonks) {
      throwIfAborted(input.signal);
      try {
        const review = await reviewPackFlipsUtil({
          dates: packFlipReviewDatesForSliceDay(asOf),
          apply,
          konkName,
        });
        dayResult.packFlips.push({ konkName, review });
        await input.hooks?.onPackFlipSuccess?.(review);
      } catch (error) {
        const message = errorMessage(error);
        dayResult.packFlips.push({ konkName, error: message });
        errors.push({
          step: "pack-flip",
          asOf: asOfYmd,
          konkName,
          message,
        });
        await input.hooks?.onPackFlipError?.(konkName, error);
      }
    }

    throwIfAborted(input.signal);

    for (const konkName of rollupKonkNames) {
      throwIfAborted(input.signal);
      try {
        await afterSkuSliceStockMutation({ konkName, dayD: asOf });
      } catch (error) {
        const message = errorMessage(error);
        dayResult.rollupErrors.push({ konkName, message });
        errors.push({
          step: "rollup",
          asOf: asOfYmd,
          konkName,
          message,
        });
        await input.hooks?.onRollupError?.(konkName, error);
      }
    }

    days.push(dayResult);
  }

  input.onProgress?.(totalSteps, totalSteps, "Post-corrections completed");

  return {
    apply,
    dateFrom: toUtcYmd(dateFrom),
    dateTo: toUtcYmd(dateTo),
    days,
    errors,
  };
}
