import { Request, Response } from "express";
import { Types } from "mongoose";
import { sendCompleteAskMesToUser } from "../../../../utils/telegram/asks/sendCompleteAskMesToUser.js";
import User from "../../../auth/models/User.js";
import { Ask } from "../../models/Ask.js";
import { completeAsk } from "./utils/completeAsk.js";

interface CompleteAskRequestData {
  solverId: Types.ObjectId;
}

export const completeAskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { solverId }: CompleteAskRequestData = req.body;

    if (!solverId) {
      return res.status(400).json({ message: "solverId is required" });
    }

    const existingAsk = await Ask.findById(id);
    if (!existingAsk) {
      return res.status(404).json({ message: "Ask not found" });
    }

    const solver = await User.findById(solverId);
    if (!solver) {
      return res.status(404).json({ message: "Solver user not found" });
    }
    
    const updatedAsk = await completeAsk({ solver, ask: existingAsk });

    if (updatedAsk) {
      res.status(200).json(updatedAsk);
      await sendCompleteAskMesToUser(updatedAsk, solver.fullname);
    } else {
      return res.status(500).json({ message: "Failed to complete ask" });
    }
  } catch (error) {
    console.error("Error completing ask:", error);
    res.status(500).json({ message: "Server error", error });
    return;
  }
};
