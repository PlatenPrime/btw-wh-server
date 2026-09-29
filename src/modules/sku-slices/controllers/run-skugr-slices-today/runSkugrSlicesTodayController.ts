import type { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { runSkugrSlicesTodaySchema } from "./schemas/runSkugrSlicesTodaySchema.js";
import { runSkuSliceForSkugrTodayUtil } from "./utils/runSkuSliceForSkugrTodayUtil.js";
import {
  releaseSkugrSliceRun,
  tryAcquireSkugrSliceRun,
} from "./utils/skugrSliceRunStatus.js";

/**
 * @desc    Ручной scrape срезов всех SKU товарной группы за сегодня (полная перезапись)
 * @route   POST /api/sku-slices/skugr/:skugrId/run-today
 * @access  ADMIN
 */
export async function runSkugrSlicesTodayController(
  req: Request,
  res: Response
): Promise<void> {
  const parseResult = runSkugrSlicesTodaySchema.safeParse({
    skugrId: req.params.skugrId,
  });
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const { skugrId } = parseResult.data;

  if (!tryAcquireSkugrSliceRun(skugrId)) {
    res.status(409).json({
      message: "Sku slice run already in progress for this product group",
    });
    return;
  }

  try {
    const result = await runSkuSliceForSkugrTodayUtil(parseResult.data);
    if (!result) {
      res.status(404).json({
        message: "Skugr not found",
      });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "sku-slices",
        type: "other",
        description: `Запущено ручний збір зрізів SKU для групи ${result.skugrId} (${result.konkName}) на ${result.sliceDate.toISOString().slice(0, 10)}`,
      });
    }

    res.status(200).json({
      message: "Skugr sku slices for today completed",
      data: {
        skugrId: result.skugrId,
        konkName: result.konkName,
        sliceDate: result.sliceDate.toISOString().slice(0, 10),
        total: result.total,
        count: result.count,
        invalid: result.invalid,
        errors: result.errors,
      },
    });
  } catch (error) {
    logModuleError(
      "sku-slices",
      error,
      "runSkugrSlicesTodayController failed"
    );
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to run skugr sku slices for today",
      });
    }
  } finally {
    releaseSkugrSliceRun(skugrId);
  }
}
