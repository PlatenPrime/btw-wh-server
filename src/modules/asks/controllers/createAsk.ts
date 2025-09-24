import { Request, Response } from "express";
import { Types } from "mongoose";
import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import User from "../../auth/models/User.js";
import { Ask, IAsk } from "../models/Ask.js";

interface CreateAskRequest {
  artikul: string;
  nameukr: string;
  quant: number;
  com: string;
  askerId: Types.ObjectId;
}

export const createAsk = async (req: Request, res: Response) => {
  try {
    const { artikul, nameukr, quant, com, askerId }: CreateAskRequest =
      req.body;

    const asker = await User.findById(askerId);

    if (!asker) {
      return res.status(404).json({ message: "User not found" });
    }

    const time = getCurrentFormattedDateTime();

    const actions = [
      `${time} ${asker?.fullname ?? ""}: необхідно ${nameukr}
      ${quant !== undefined && ", кількість: "}${quant}
      ${com && ", коментарій: "}${com}`,
    ];

    const ask: IAsk = new Ask({
      artikul,
      nameukr,
      quant,
      com,
      asker: askerId,
      askerData: {
        _id: asker._id,
        fullname: asker.fullname,
        telegram: asker.telegram,
        photo: asker.photo,
      },
      actions,
      status: "new",
    });
    await ask.save();
    res.status(201).json(ask);
  } catch (error) {
    console.error("Error creating ask:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
