import { Request, Response } from "express";
import { Art } from "../models/Art.js";

interface UpdateArtLimitRequest {
  limit: number;
}

export const updateArtLimit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit }: UpdateArtLimitRequest = req.body;

    // Validation
    if (limit === undefined || limit === null) {
      res.status(400).json({ message: "limit is required" });
      return;
    }

    if (typeof limit !== "number" || limit < 0) {
      res.status(400).json({ message: "limit must be a non-negative number" });
      return;
    }

    // Check if art exists
    const existingArt = await Art.findById(id);
    if (!existingArt) {
      res.status(404).json({ message: "Art not found" });
      return;
    }

    // Update only the limit field
    const updatedArt = await Art.findByIdAndUpdate(
      id,
      { limit },
      {
        new: true,
        runValidators: true,
        select:
          "artikul zone namerus nameukr limit marker btradeStock createdAt updatedAt",
      }
    );

    if (!updatedArt) {
      res.status(500).json({ message: "Failed to update art limit" });
      return;
    }

    res.status(200).json(updatedArt);
  } catch (error) {
    console.error("Error updating art limit:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
