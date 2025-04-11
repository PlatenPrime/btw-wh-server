import { Request, Response } from "express";
import Fuser from "../../fusers/models/Fuser.js";
import Found from "../models/Found.js";


export const deleteFoundById = async (req: Request, res: Response) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const fuser = await Fuser.findOne({ clerkUserId });
  if (!fuser) {
    res.status(404).json({ message: "Fuser not found!" });
    return;
  }

  const deletedFound = await Found.findByIdAndDelete({
    _id: req.params.id,
    fuser: fuser._id,
  });
  if (!deletedFound) {
    res.status(404).json("Found not found");
    return;
  } else {
    res.json("Found has been deleted");
  }
};
