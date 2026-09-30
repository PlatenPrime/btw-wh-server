import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { calculatePalletsSectorsUtil } from "../../../pallet-groups/utils/calculatePalletsSectorsUtil.js";
import { calculateZonesSectorsUtil } from "../../../blocks/utils/calculateZonesSectorsUtil.js";
import { populateMissingPosDataUtil } from "../../../poses/controllers/populate-missing-pos-data/utils/populateMissingPosDataUtil.js";
import { fixIncorrectSkuDataUtil } from "../../../skus/controllers/fix-incorrect-sku-data/utils/fixIncorrectSkuDataUtil.js";
import { fixIncorrectSkuDataSchema } from "../../../skus/controllers/fix-incorrect-sku-data/schemas/fixIncorrectSkuDataSchema.js";
import { deleteKonkInvalidSkusUtil } from "../../../skus/controllers/delete-konk-invalid-skus/utils/deleteKonkInvalidSkusUtil.js";
import { deleteKonkInvalidSkusParamsSchema } from "../../../skus/controllers/delete-konk-invalid-skus/schemas/deleteKonkInvalidSkusSchema.js";
import { deleteSkusNotInAnySkugrUtil } from "../../../skus/controllers/delete-skus-not-in-any-skugr/utils/deleteSkusNotInAnySkugrUtil.js";
import { deleteSkusNotInAnySkugrQuerySchema } from "../../../skus/controllers/delete-skus-not-in-any-skugr/schemas/deleteSkusNotInAnySkugrQuerySchema.js";
import { deleteArtsWithoutLatestMarkerUtil } from "../../../arts/controllers/delete-arts-without-latest-marker/utils/deleteArtsWithoutLatestMarkerUtil.js";
import {
  failApiTaskRun,
  okApiTaskRun,
  throwIfAborted,
  type ApiTaskKindRunner,
} from "../apiTaskRunTypes.js";

export const runRecalculatePalletsSectors: ApiTaskKindRunner = async (
  _params,
  options,
) => {
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Recalculating pallet sectors");
  const result = await calculatePalletsSectorsUtil();
  options?.onProgress?.(1, 1, "Done");
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "pallet-groups",
      type: "other",
      description:
        "Перераховано сектори паллет: оновлено " +
        String(result.updatedPallets) +
        " паллет у " +
        String(result.groupsProcessed) +
        " групах, " +
        String(result.updatedPositions) +
        " позицій",
    });
  }
  return okApiTaskRun({ ...result });
};

export const runRecalculateZonesSectors: ApiTaskKindRunner = async (
  _params,
  options,
) => {
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Recalculating zone sectors");
  const result = await calculateZonesSectorsUtil();
  options?.onProgress?.(1, 1, "Done");
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "blocks",
      type: "other",
      description:
        "Перераховано сектори зон: оновлено " +
        String(result.updatedZones) +
        " зон у " +
        String(result.blocksProcessed) +
        " блоках",
    });
  }
  return okApiTaskRun({ ...result });
};

export const runPopulateMissingPosData: ApiTaskKindRunner = async (
  _params,
  options,
) => {
  throwIfAborted(options?.signal);
  const result = await populateMissingPosDataUtil({
    onProgress: options?.onProgress,
    signal: options?.signal,
  });
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "poses",
      type: "other",
      description:
        "Заповнено відсутні дані позицій: оновлено " +
        String(result.updated) +
        ", помилок " +
        String(result.errors),
    });
  }
  return okApiTaskRun({
    updated: result.updated,
    errors: result.errors,
    errorDetails: result.errorDetails,
  });
};

export const runFixIncorrectSkuData: ApiTaskKindRunner = async (
  params,
  options,
) => {
  const parsed = fixIncorrectSkuDataSchema.safeParse(params);
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for skus.fix-incorrect-sku-data");
  }
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Fixing SKU data");
  const result = await fixIncorrectSkuDataUtil(parsed.data);
  options?.onProgress?.(1, 1, "Done");
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "skus",
      type: "edit",
      description:
        "Виправлено дані SKU: matched " +
        String(result.matchedCount) +
        ", modified " +
        String(result.modifiedCount),
    });
  }
  return okApiTaskRun({ ...result });
};

export const runDeleteKonkInvalidSkus: ApiTaskKindRunner = async (
  params,
  options,
) => {
  const parsed = deleteKonkInvalidSkusParamsSchema.safeParse(params);
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for skus.delete-konk-invalid");
  }
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Deleting invalid SKUs");
  const result = await deleteKonkInvalidSkusUtil(parsed.data.konkName);
  options?.onProgress?.(1, 1, "Done");
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "skus",
      type: "delete",
      description:
        "Видалено invalid SKU (" +
        parsed.data.konkName +
        "): " +
        String(result.deletedCount),
    });
  }
  return okApiTaskRun({ ...result, konkName: parsed.data.konkName });
};

export const runDeleteSkusNotInAnySkugr: ApiTaskKindRunner = async (
  params,
  options,
) => {
  const parsed = deleteSkusNotInAnySkugrQuerySchema.safeParse(params ?? {});
  if (!parsed.success) {
    return failApiTaskRun("Invalid params for skus.delete-not-in-any-skugr");
  }
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Deleting orphan SKUs");
  const result = await deleteSkusNotInAnySkugrUtil(parsed.data);
  options?.onProgress?.(1, 1, "Done");
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "skus",
      type: "delete",
      description:
        "Видалено sku, що не входять до жодної товарної групи: " +
        String(result.deletedCount) +
        " шт.",
    });
  }
  return okApiTaskRun({ ...result });
};

export const runDeleteArtsWithoutLatestMarker: ApiTaskKindRunner = async (
  _params,
  options,
) => {
  throwIfAborted(options?.signal);
  options?.onProgress?.(0, 1, "Deleting arts without latest marker");
  const result = await deleteArtsWithoutLatestMarkerUtil();
  options?.onProgress?.(1, 1, "Done");
  if (options?.userId) {
    await createEventUtil({
      userId: options.userId,
      department: "arts",
      type: "delete",
      description:
        "Видалено артикули без актуального маркера (маркер: " +
        String(result.latestMarker) +
        "): " +
        String(result.deletedCount) +
        " шт.",
    });
  }
  return okApiTaskRun({ ...result });
};
