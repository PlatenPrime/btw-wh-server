import { Request, Response } from "express";
import mongoose from "mongoose";
import { deleteAskByIdSchema } from "./schemas/deleteAskByIdSchema.js";
import { deleteAskUtil } from "./utils/deleteAskUtil.js";

export const deleteAskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    // Валидация параметров
    const parseResult = deleteAskByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    let ask: any = null;

    await session.withTransaction(async () => {
      ask = await deleteAskUtil({
        id: parseResult.data.id,
        session,
      });

      if (!ask) {
        throw new Error("Ask not found");
      }
    });

    res.status(200).json({
      message: "Ask deleted successfully",
      data: { id, artikul: ask.artikul },
    });
  } catch (error) {
    console.error("Error deleting ask by ID:", error);
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Ask not found") {
        res.status(404).json({ message: "Ask not found" });
      } else {
        res.status(500).json({
          message: "Server error while deleting ask",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  } finally {
    await session.endSession();
  }
};

