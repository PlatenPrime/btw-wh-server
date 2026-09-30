import { formatCronErrorReport } from "../../../../cron/analytics-notifications/formatCronReports.js";
import { formatGraboSkuSyncReport } from "../../../../cron/analytics-notifications/formatGraboSkuSyncReport.js";
import { sendCronAnalyticsReport } from "../../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { runGraboSkuSyncUtil } from "../../../grabo-skus/utils/runGraboSkuSyncUtil.js";
import { updateAllBtradeStocksUtil } from "../../../arts/utils/updateAllBtradeStocksUtil.js";
import { updateDelArtikulsByDelIdUtil } from "../../../dels/controllers/update-del-artikuls-by-del-id/utils/updateDelArtikulsByDelIdUtil.js";
import {
  failApiTaskRun,
  okApiTaskRun,
  throwIfAborted,
  type ApiTaskKindRunner,
} from "../apiTaskRunTypes.js";
import { delsArtikulsUpdateAllParamsSchema } from "../apiTaskKindDefinitions.js";

export const runGraboSkusSync: ApiTaskKindRunner = async (_params, options) => {
  throwIfAborted(options?.signal);
  try {
    const stats = await runGraboSkuSyncUtil({
      onProgress: options?.onProgress,
      signal: options?.signal,
    });
    await sendCronAnalyticsReport(formatGraboSkuSyncReport(stats));
    if (options?.userId) {
      await createEventUtil({
        userId: options.userId,
        department: "grabo-skus",
        type: "other",
        description: `Запущено синхронізацію каталогу Grabo: listed ${stats.listed}, created ${stats.created}, updated ${stats.updated}`,
      });
    }
    return okApiTaskRun({ ...stats });
  } catch (error) {
    await sendCronAnalyticsReport(
      formatCronErrorReport("Grabo SKU sync", error),
    );
    throw error;
  }
};

export const runArtsBtradeStockUpdateAll: ApiTaskKindRunner = async (
  _params,
  options,
) => {
  throwIfAborted(options?.signal);
  const result = await updateAllBtradeStocksUtil({
    onProgress: options?.onProgress,
    signal: options?.signal,
  });
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "arts",
      type: "edit",
      description: `Оновлено btradeStock для всіх артикулів: ${result.updated} з ${result.total} шт. (помилок: ${result.errors}, не знайдено: ${result.notFound})`,
    });
  }
  return okApiTaskRun({ ...result });
};

export const runDelsArtikulsUpdateAll: ApiTaskKindRunner = async (
  params,
  options,
) => {
  const parsed = delsArtikulsUpdateAllParamsSchema.safeParse(params);
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for dels.artikuls-update-all");
  }
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Updating del artikuls");
  try {
    const result = await updateDelArtikulsByDelIdUtil(parsed.data.delId);
    options?.onProgress?.(1, 1, "Done");
    if (options?.userId) {
      await createEventUtil({
        userId: options.userId,
        department: "dels",
        type: "edit",
        description: `Оновлено артикули поставки ${parsed.data.delId}: ${result.updated}/${result.total}`,
      });
    }
    return okApiTaskRun({ delId: parsed.data.delId, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "Del not found") {
      return failApiTaskRun("Del not found");
    }
    throw error;
  }
};
