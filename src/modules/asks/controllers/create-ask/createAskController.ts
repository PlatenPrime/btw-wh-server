import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../../../auth/models/User.js";
import { createAskUtil } from "./utils/createAskUtil.js";
import { getCreateAskActionsUtil } from "./utils/getCreateAskActionsUtil.js";
import { getCreateAskMessageUtil } from "./utils/getCreateAskMesUtil.js";
import { sendCreateAskCreateMesUtil } from "./utils/sendCreateAskCreateMesUtil.js";

interface CreateAskRequest {
  artikul: string;
  nameukr: string;
  quant: number;
  com: string;
  askerId: Types.ObjectId;
}

export const createAskController = async (req: Request, res: Response) => {
  try {
    const { artikul, nameukr, quant, com, askerId }: CreateAskRequest =
      req.body;

    const askerData = await User.findById(askerId);

    if (!askerData) {
      return res.status(404).json({ message: "User not found" });
    }

    const actions = getCreateAskActionsUtil({ askerData, nameukr, quant, com });

    const createdAsk = await createAskUtil({
      artikul,
      nameukr,
      quant,
      com,
      askerData,
      actions,
    });

    if (!createdAsk) {
      return res.status(400).json({ message: "Failed to create ask" });
    }

    res.status(201).json(createdAsk);

    const message = getCreateAskMessageUtil({
      askerData,
      artikul,
      nameukr,
      quant,
      com,
    });
    await sendCreateAskCreateMesUtil({ message, askerData });
  } catch (error) {
    console.error("Error creating ask:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
