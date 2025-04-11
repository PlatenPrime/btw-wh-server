import { Request, Response } from "express";
import Found from "../models/Found.js";
import Fuser from "../../fusers/models/Fuser.js";

// interface AuthRequest extends Request {
//   auth: {
//     userId: string;
//   };
// }

export const createFound = async (req:  Request, res: Response) => {

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

  const newfound = new Found({ fuser: fuser._id, ...req.body});
  const found = await newfound.save();
  res.json(found);
};

