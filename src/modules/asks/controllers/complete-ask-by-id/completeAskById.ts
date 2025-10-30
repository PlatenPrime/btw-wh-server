import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../../../auth/models/User.js";
import { Ask } from "../../models/Ask.js";
import { completeAskUtil } from "./utils/completeAskUtil.js";
import { getCompleteAskMesUtil } from "./utils/getCompleteAskMesUtil.js";
import { sendCompleteAskMesUtil } from "./utils/sendCompleteAskMesUtil.js";

interface CompleteAskRequestData {
  solverId: Types.ObjectId;
}

export const completeAskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { solverId }: CompleteAskRequestData = req.body;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    const existingAsk = await Ask.findById(id);
    if (!existingAsk) {
      return res.status(404).json({ message: "Ask not found" });
    }

    if (!solverId) {
      return res.status(400).json({ message: "solverId is required" });
    }
    const solver = await User.findById(solverId);
    if (!solver) {
      return res.status(404).json({ message: "Solver user not found" });
    }

    const updatedAsk = await completeAskUtil({
      solver,
      solverId,
      ask: existingAsk,
    });

    if (!updatedAsk) {
      return res.status(500).json({ message: "Failed to complete ask" });
    }

    res.status(200).json(updatedAsk);

    if (existingAsk.askerData?.telegram) {
      const message = getCompleteAskMesUtil({
        ask: updatedAsk,
        solverName: solver.fullname,
      });
      await sendCompleteAskMesUtil({
        message,
        telegramChatId: existingAsk.askerData.telegram as string,
      });
    }
  } catch (error) {
    console.error("Error completing ask:", error);
    res.status(500).json({ message: "Server error", error });
    return;
  }
};
