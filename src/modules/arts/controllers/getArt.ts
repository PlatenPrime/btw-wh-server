import { Request, Response } from "express";
import { Art, IArt } from "../models/Art.js";

export const getArt = async (req: Request, res: Response): Promise<void> => {
  const { artikul } = req.params;
  try {
    const art: IArt | null = await Art.findOne({ artikul: artikul });
    if (!art) {
      res.status(200).json({
        exists: false,
        message: "Art not found",
        data: null,
      });
      return;
    }
    res.status(200).json({
      exists: true,
      message: "Art retrieved successfully",
      data: art,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
