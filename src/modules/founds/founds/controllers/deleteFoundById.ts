import { Request, Response } from "express";
import Found from "../models/Found.js";

export const deleteFoundById = async (req: Request, res: Response) => {
  const deletedFound = await Found.findByIdAndDelete(req.params.id);
  res.json("Found has been deleted");
};
