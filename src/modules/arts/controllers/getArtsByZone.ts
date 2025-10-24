import { Request, Response } from "express";
import { Art, IArt } from "../models/Art.js";

export const getArtsByZone = async (
  req: Request<{ zone: string }>,
  res: Response
) => {
  try {
    const { zone } = req.params;

    const arts: IArt[] = await Art.find({ zone }).sort({ artikul: 1 });

    res.status(200).json({
      data: arts,
      total: arts.length,
    });
  } catch (error) {
    console.error("Error fetching arts by zone:", error);
    res.status(500).json({ message: "Server error" });
  }
};
