import { Request, Response } from "express";
import { Art, IArt } from "../models/Art.js";

export const getArtById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "ID is required" });
    return;
  }

  try {
    const art: IArt | null = await Art.findById(id);
    if (!art) {
      res.status(404).json({ message: "Art not found" });
      return;
    }

    res.status(200).json(art);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
