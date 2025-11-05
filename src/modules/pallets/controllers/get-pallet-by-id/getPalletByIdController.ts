import { Request, Response } from "express";
import mongoose from "mongoose";
import { getPalletByIdSchema } from "./schemas/getPalletByIdSchema.js";
import { getPalletUtil } from "./utils/getPalletUtil.js";

export const getPalletByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Валидация входных данных
    const parseResult = getPalletByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const pallet = await getPalletUtil(parseResult.data.id);

    if (!pallet) {
      res.status(200).json({
        exists: false,
        message: "Pallet not found",
        data: null,
      });
      return;
    }

    const palletObj = pallet.toObject();

    res.status(200).json({
      exists: true,
      message: "Pallet retrieved successfully",
      data: palletObj,
    });
  } catch (error: any) {
    console.error("getPalletByIdController error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
};








