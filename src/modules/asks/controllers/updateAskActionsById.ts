import { Request, Response } from "express";
import { Types } from "mongoose";
import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import User from "../../auth/models/User.js";
import { Ask, IAsk } from "../models/Ask.js";

interface UpdateAskActionsRequestData {
  action: string;
  userId: Types.ObjectId;
}

export const updateAskActionsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, userId }: UpdateAskActionsRequestData = req.body;

    if (!action) {
      return res.status(400).json({ message: "action is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const existingAsk = await Ask.findById(id);
    if (!existingAsk) {
      return res.status(404).json({ message: "Ask not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const time = getCurrentFormattedDateTime();
    const userName = user.fullname;
    const newAction = `${time} ${userName}: ${action}`;
    const updatedActions = [...existingAsk.actions, newAction];

    const updateFields: Partial<IAsk> = {
      actions: updatedActions,
    };

    const updatedAsk = await Ask.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedAsk) {
      return res.status(500).json({ message: "Failed to update ask actions" });
    }

    res.status(200).json(updatedAsk);
  } catch (error) {
    console.error("Error updating ask actions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
