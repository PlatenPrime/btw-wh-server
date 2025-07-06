import  { Art, IArt } from "../models/Art.js";
import { Request, Response } from 'express';

export const getArt = async (req: Request, res: Response): Promise<void> => {
    const { artikul } = req.params;
    try {
      const art: IArt | null = await Art.findOne({ artikul: artikul }); 
      if (!art) {
        res.status(404).json({ message: "Art not found" });
        return;
      }
      res.status(200).json(art);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };