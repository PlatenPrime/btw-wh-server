import { Request, Response } from "express";
import { updateArtByIdSchema } from "./schemas/updateArtByIdSchema.js";
import { updateArtByIdUtil } from "./utils/updateArtByIdUtil.js";

export const updateArtByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { limit, prodName } = req.body;

    const parseResult = updateArtByIdSchema.safeParse({ id, limit, prodName });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { id: artId, limit: nextLimit, prodName: nextProdName } =
      parseResult.data;

    const updatedArt = await updateArtByIdUtil({
      id: artId,
      limit: nextLimit,
      prodName: nextProdName,
    });

    if (!updatedArt) {
      res.status(404).json({
        message: "Art not found",
      });
      return;
    }

    res.status(200).json(updatedArt);
  } catch (error) {
    console.error("Error updating art by id:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
