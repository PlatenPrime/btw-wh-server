import { Request, Response } from "express";
import { Kask } from "../../models/Kask.js";
import { createKaskSchema } from "./schemas/createKaskSchema.js";
import { getCreateKaskMessageUtil } from "./utils/getCreateKaskMesUtil.js";
import { sendCreateKaskMesUtil } from "./utils/sendCreateKaskMesUtil.js";

export const createKaskController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = createKaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { artikul, nameukr, quant, zone, com } = parseResult.data;
    const created = await Kask.create({
      artikul,
      nameukr,
      quant,
      zone,
      com,
    });

    res.status(201).json(created);

    const message = getCreateKaskMessageUtil({
      artikul,
      nameukr,
      quant,
      zone,
      com,
    });
    await sendCreateKaskMesUtil({ message, role: req.user?.role });
  } catch (error) {
    console.error("Error creating kask:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error while creating kask",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};
