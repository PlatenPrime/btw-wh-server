import Art, { IArt } from "../models/Art";
import { Request, Response } from 'express';

export const getArtById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
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