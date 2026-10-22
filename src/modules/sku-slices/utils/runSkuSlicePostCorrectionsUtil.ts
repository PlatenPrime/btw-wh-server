import { throwIfAborted } from "../../apitasks/kinds/apiTaskRunTypes.js";
import {
  BALUN_FAKE_STOCK_CRON_DAYS_BACK,
  BALUN_FAKE_STOCK_KONK_NAME,
} from "../../slices/config/balunFakeStockSentinel.js";
import { packFlipAutoApplyKonks } from "../../slices/config/packFlipAutoApplyKonks.js";
import {
  SVBUM_FAKE_STOCK_CRON_DAYS_BACK,
  SVBUM_FAKE_STOCK_KONK_NAME,
} from "../../slices/config/svbumFakeStockThreshold.js";
import { afterSkuSliceStockMutation } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import type { PostSkuSlicePostCorrectionsInput } from "../controllers/post-sku-slice-post-corrections/schemas/postSkuSlicePostCorrectionsSchema.js";
import {
  correctBalunFakeStockSpikesUtil,
  type CorrectBalunFakeStockSpikesResult,
} from "./correctBalunFakeStockSpikesUtil.js";
import {
  correctBalunManualBandSpikesForRangeUtil,
  type CorrectBalunManualBandSpikesForRangeResult,
} from "./correctBalunManualBandSpikesForRangeUtil.js";
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
  onBalunManualBandError?: (error: unknown) => Promise<void>;
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
  konkName?: string;
  days: RunSkuSlicePostCorrectionsDayResult[];
  balunManualBand?: CorrectBalunManualBandSpikesForRangeResult | { error: string };
  errors: PostCorrectionStepError[];
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type StepFlags = {
  runBalunLtr: boolean;
  runBalunManualBand: boolean;
  runSvbum: boolean;
  packFlipKonks: readonly string[];
  rollupKonks: string[];
};

function resolveStepFlags(konkName: string | undefined, allRollupKonks: string[]): StepFlags {
  if (!konkName) {
    return {
      runBalunLtr: true,
      runBalunManualBand: false,
      runSvbum: true,
      packFlipKonks: packFlipAutoApplyKonks,
      rollupKonks: allRollupKonks,
    };
  }

  if (konkName === BALUN_FAKE_STOCK_KONK_NAME) {
    return {
      runBalunLtr: true,
      runBalunManualBand: true,
      runSvbum: false,
      packFlipKonks: [],
      rollupKonks: [BALUN_FAKE_STOCK_KONK_NAME],
    };
  }

  if (konkName === SVBUM_FAKE_STOCK_KONK_NAME) {
    return {
      runBalunLtr: false,
      runBalunManualBand: false,
      runSvbum: true,
      packFlipKonks: [],
      rollupKonks: [SVBUM_FAKE_STOCK_KONK_NAME],
    };
  }

  if (packFlipAutoApplyKonks.includes(konkName)) {
    return {
      runBalunLtr: false,
      runBalunManualBand: false,
      runSvbum: false,
      packFlipKonks: [konkName],
      rollupKonks: [konkName],
    };
  }

  return {
    runBalunLtr: false,
    runBalunManualBand: false,
    runSvbum: false,
    packFlipKonks: [],
    rollupKonks: [konkName],
  };
}

async function runBalunStep(
  asOf: Date,
  apply: boolean,
): Promise<CorrectBalunFakeStockSpikesResult> {
  return correctBalunFakeStockSpikesUtil({
    daysBack: BALUN_FAKE_STOCK_CRON_DAYS_BACK,
    asOf,
    apply,
  });
}

async function runSvbumStep(
  asOf: Date,
  apply: boolean,
): Promise<CorrectSvbumFakeStockSpikesResult> {
  return correctSvbumFakeStockSpikesUtil({
    daysBack: SVBUM_FAKE_STOCK_CRON_DAYS_BACK,
    asOf,
    apply,
  });
}

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

    if (flags.runBalunLtr) {
      try {
        dayResult.balun = await runBalunStep(asOf, apply);
      } catch (error) {
        const message = errorMessage(error);
        dayResult.balun = { error: message };
        errors.push({ step: "balun", asOf: asOfYmd, message });
        await input.hooks?.onBalunError?.(error);
      }
    }

    throwIfAborted(input.signal);

    if (flags.runSvbum) {
      try {
        dayResult.svbum = await runSvbumStep(asOf, apply);
      } catch (error) {
        const message = errorMessage(error);
        dayResult.svbum = { error: message };
        errors.push({ step: "svbum", asOf: asOfYmd, message });
        await input.hooks?.onSvbumError?.(error);
      }
    }

    throwIfAborted(input.signal);

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

  let balunManualBand: RunSkuSlicePostCorrectionsResult["balunManualBand"];
  if (flags.runBalunManualBand) {
    throwIfAborted(input.signal);
    input.onProgress?.(totalSteps, totalSteps, "Post-corrections balun manual band RTL");
    try {
      balunManualBand = await correctBalunManualBandSpikesForRangeUtil({
        dateFrom,
        dateTo,
        apply,
      });
    } catch (error) {
      const message = errorMessage(error);
      balunManualBand = { error: message };
      errors.push({ step: "balun-manual-band", message });
      await input.hooks?.onBalunManualBandError?.(error);
    }
  }

  input.onProgress?.(totalSteps, totalSteps, "Post-corrections completed");

  return {
    apply,
    dateFrom: toUtcYmd(dateFrom),
    dateTo: toUtcYmd(dateTo),
    ...(konkName ? { konkName } : {}),
    days,
    ...(balunManualBand ? { balunManualBand } : {}),
    errors,
  };
}
