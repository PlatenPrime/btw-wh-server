import { Request, Response } from "express";
import { getAllBlocksUtil } from "./utils/getAllBlocksUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const getAllBlocks = async (req: Request, res: Response) => {
  try {
    const blocks = await getAllBlocksUtil();

    res.status(200).json({
      exists: blocks.length > 0,
      message: "Blocks retrieved successfully",
      data: blocks,
    });
  } catch (error) {
    logModuleError("blocks", error, "Error fetching all blocks:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

