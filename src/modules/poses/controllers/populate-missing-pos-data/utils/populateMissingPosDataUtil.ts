import { Types } from "mongoose";
import { IPos, Pos } from "../../../models/Pos.js";
import { populatePalletDataUtil } from "./populatePalletDataUtil.js";
import { populateRowDataUtil } from "./populateRowDataUtil.js";

type PopulateResult = {
  updated: number;
  errors: number;
  errorDetails: Array<{ posId: string; reason: string }>;
};

/**
 * Находит позиции с отсутствующими palletData, rowData или row
 * и заполняет их соответствующими данными
 */
export const populateMissingPosDataUtil = async (): Promise<PopulateResult> => {
  const missingPoses = await Pos.find({
    $or: [
      { palletData: { $exists: false } },
      { rowData: { $exists: false } },
      { row: { $exists: false } },
    ],
  });

  let updatedCount = 0;
  let errorCount = 0;
  const errors: Array<{ posId: string; reason: string }> = [];

  for (const pos of missingPoses) {
    try {
      // Заполняем palletData
      await populatePalletDataUtil(pos);

      // Заполняем rowData и row
      await populateRowDataUtil(pos);

      await pos.save();
      updatedCount++;
    } catch (err) {
      errors.push({
        posId: (pos._id as Types.ObjectId).toString(),
        reason: (err as Error).message,
      });
      errorCount++;
    }
  }

  return {
    updated: updatedCount,
    errors: errorCount,
    errorDetails: errors,
  };
};

