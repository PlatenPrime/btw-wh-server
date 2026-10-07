import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { runSkuSliceForSkugrTodayUtil } from "../../../sku-slices/controllers/run-skugr-slices-today/utils/runSkuSliceForSkugrTodayUtil.js";
import { runSkuSlicePostCorrectionsUtil } from "../../../sku-slices/utils/runSkuSlicePostCorrectionsUtil.js";
import { postSkuSlicePostCorrectionsSchema } from "../../../sku-slices/controllers/post-sku-slice-post-corrections/schemas/postSkuSlicePostCorrectionsSchema.js";
import { runCompensatingSlicesForKonk } from "../../../slice-compensation/utils/runCompensatingSlicesForKonk.js";
import { fillSkugrSkusFromBrowserUtil } from "../../../skugrs/utils/fillSkugrSkusFromBrowserUtil.js";
import { toSkugrDto } from "../../../skugrs/utils/toSkugrDto.js";
import { UnsupportedKonkForGroupProductsError } from "../../../browser/group-products/fetchGroupProductsByKonkName.js";
import { ServerSkugrFillDisabledError } from "../../../skugrs/utils/serverSkugrFillDisabledError.js";
import { runSkugrSlicesTodaySchema } from "../../../sku-slices/controllers/run-skugr-slices-today/schemas/runSkugrSlicesTodaySchema.js";
import { runCompensatingSliceSchema } from "../../../slice-compensation/controllers/run-compensating-slice/schemas/runCompensatingSliceSchema.js";
import {
  failApiTaskRun,
  okApiTaskRun,
  throwIfAborted,
  type ApiTaskKindRunner,
} from "../apiTaskRunTypes.js";
import { fillSkugrsApiTaskParamsSchema } from "../apiTaskKindDefinitions.js";

export const runSkuSlicesPostCorrectionsRun: ApiTaskKindRunner = async (
  params,
  options,
) => {
  const parsed = postSkuSlicePostCorrectionsSchema.safeParse(params);
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for sku-slices.post-corrections.run");
  }
  throwIfAborted(options?.signal);
  const result = await runSkuSlicePostCorrectionsUtil({
    ...parsed.data,
    onProgress: options?.onProgress,
    signal: options?.signal,
  });
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "sku-slices",
      type: "other",
      description:
        "Post-corrections sku-slices " +
        result.dateFrom +
        "…" +
        result.dateTo +
        (result.apply ? " (apply)" : " (dry-run)"),
    });
  }
  return okApiTaskRun({ ...result });
};

export const runSkuSlicesSkugrRunToday: ApiTaskKindRunner = async (
  params,
  options,
) => {
  const parsed = runSkugrSlicesTodaySchema.safeParse(params);
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for sku-slices.skugr-run-today");
  }
  throwIfAborted(options?.signal);
  const result = await runSkuSliceForSkugrTodayUtil(parsed.data, {
    onProgress: options?.onProgress,
    signal: options?.signal,
  });
  if (!result) {
    return failApiTaskRun("Skugr not found");
  }
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "sku-slices",
      type: "other",
      description:
        "Запущено ручний збір зрізів SKU для групи " +
        result.skugrId +
        " (" +
        result.konkName +
        ") на " +
        result.sliceDate.toISOString().slice(0, 10),
    });
  }
  return okApiTaskRun({
    skugrId: result.skugrId,
    konkName: result.konkName,
    sliceDate: result.sliceDate.toISOString().slice(0, 10),
    total: result.total,
    count: result.count,
    invalid: result.invalid,
    errors: result.errors,
  });
};

export const runSliceCompensationRun: ApiTaskKindRunner = async (
  params,
  options,
) => {
  const parsed = runCompensatingSliceSchema.safeParse(params);
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for slice-compensation.run");
  }
  throwIfAborted(options?.signal);
  const result = await runCompensatingSlicesForKonk(parsed.data.konkName, {
    onProgress: options?.onProgress,
    signal: options?.signal,
  });
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "slice-compensation",
      type: "other",
      description:
        "Запущено позачерговий компенсуючий забір слайсів для конкурента " +
        result.konkName,
    });
  }
  return okApiTaskRun({
    konkName: result.konkName,
    sliceDate: result.sliceDate.toISOString().slice(0, 10),
    analog: result.analog,
    sku: result.sku,
  });
};

export const runSkugrsFillSkus: ApiTaskKindRunner = async (params, options) => {
  const parsed = fillSkugrsApiTaskParamsSchema.safeParse(params);
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for skugrs.fill-skus");
  }
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Fetching group products");
  try {
    const result = await fillSkugrSkusFromBrowserUtil(parsed.data.skugrId, {
      ...(parsed.data.maxPages !== undefined && {
        maxPages: parsed.data.maxPages,
      }),
    });
    if (!result) {
      return failApiTaskRun("Skugr not found");
    }
    options?.onProgress?.(1, 1, "Filled");
    if (options?.userId) {
      await createEventUtil({
        userId: options.userId,
        department: "skugrs",
        type: "edit",
        description:
          'Заповнено товарну групу "' +
          result.skugr.title +
          '" (id: ' +
          String(result.skugr._id) +
          ") sku з парсера: створено " +
          String(result.stats.created) +
          ", прив'язано " +
          String(result.stats.linkedExisting) +
          " шт.",
      });
    }
    return okApiTaskRun({
      skugr: toSkugrDto(result.skugr),
      stats: result.stats,
    });
  } catch (error: unknown) {
    if (error instanceof ServerSkugrFillDisabledError) {
      return failApiTaskRun(error.message);
    }
    if (error instanceof UnsupportedKonkForGroupProductsError) {
      return failApiTaskRun(error.message);
    }
    throw error;
  }
};
