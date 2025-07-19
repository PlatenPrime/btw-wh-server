import { Request, Response } from "express";
import { Types } from "mongoose";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../../rows/models/Row.js";
import { Pos } from "../models/Pos.js";

/**
 * Пополняет отсутствующие palletData и rowData в Pos-документах.
 * Если поле row отсутствует, ищет Row по rowTitle и заполняет row и rowData.
 *
 * @route POST /poses/populate-missing-data
 */
export const populateMissingPosData = async (_req: Request, res: Response) => {
  try {
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

        console.log("pos: " , pos.artikul)
        console.log("palletTitle: " , pos.palletTitle)
        // --- PALLET ---
        const pallet = await Pallet.findById(pos.pallet);
        if (!pallet) {
          errors.push({
            posId: (pos._id as Types.ObjectId).toString(),
            reason: "Pallet not found",
          });
          errorCount++;
          continue;
        }
        pos.palletData = {
          _id: pallet._id as Types.ObjectId,
          title: pallet.title,
          sector: pallet.sector,
        };

        // --- ROW ---
        let rowId = pos.row;
        let rowDoc = null;
        // rowId может быть ObjectId, string или undefined/null
        const rowIdStr = rowId ? rowId.toString() : undefined;
        if (!rowIdStr || !Types.ObjectId.isValid(rowIdStr)) {
          // row отсутствует или невалиден — ищем по rowTitle
          rowDoc = await Row.findOne({ title: pos.rowTitle });
          if (!rowDoc) {
            errors.push({
              posId: (pos._id as Types.ObjectId).toString(),
              reason: `Row not found by rowTitle: ${pos.rowTitle}`,
            });
            errorCount++;
            continue;
          }
          pos.row = rowDoc._id as Types.ObjectId;
        } else {
          rowDoc = await Row.findById(rowIdStr);
          if (!rowDoc) {
            errors.push({
              posId: (pos._id as Types.ObjectId).toString(),
              reason: `Row not found by row ObjectId: ${rowIdStr}`,
            });
            errorCount++;
            continue;
          }
        }
        pos.rowData = {
          _id: rowDoc._id as Types.ObjectId,
          title: rowDoc.title,
        };

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
    return res.json({
      updated: updatedCount,
      errors: errorCount,
      errorDetails: errors,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
};
