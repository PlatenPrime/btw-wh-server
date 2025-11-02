import { Request, Response } from "express";
import { Pallet } from "../../models/Pallet.js";
import { sortPalletsByTitle } from "../../utils/sortPalletsByTitle.js";
import { getAllPalletsByRowIdSchema } from "./schemas/getAllPalletsByRowIdSchema.js";

export const getAllPalletsByRowIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { rowId } = req.params;

    // Валидация входных данных
    const parseResult = getAllPalletsByRowIdSchema.safeParse({ rowId });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const pallets = await Pallet.find({
      "rowData._id": parseResult.data.rowId,
    });

    if (!pallets) {
      res.status(200).json([]);
      return;
    }

    const sortedPallets = sortPalletsByTitle(pallets);

    res.status(200).json(sortedPallets);
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
};







