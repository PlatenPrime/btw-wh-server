import { Request, Response } from "express";
import Art, { IArt } from "../models/Art";

export const getAllArts = async (req: Request, res: Response): Promise<void> => {
  try {
    const arts: IArt[] = await Art.find(); // Типизируем результат как массив IArt
    res.status(200).json(arts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
