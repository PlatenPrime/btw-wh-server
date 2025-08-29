import { Request, Response } from "express";
import { Ask, IAsk } from "../models/Ask.js";
import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import User from "../../auth/models/User.js";


export const createAsk = async (req: Request, res: Response) => {
  try {
    const { artikul, nameukr, quant, com, askerId } = req.body;

    const askerData = await User.findById(askerId);

    if (!askerData) {
      return res.status(404).json({ message: "User not found" });
    }

    const time = getCurrentFormattedDateTime();

    const actions = [
      `${time} ${
        askerData?.fullname ?? ""
      }: необхідно ${nameukr} в кількості ${quant} ${
        com && ", коментарій: "
      }${com}`,
    ];

    const ask: IAsk = new Ask({
      artikul,
      nameukr,
      quant,
      com,
      asker: askerId,
      askerData: {
        id: askerData?._id.toString(),
        fullname: askerData?.fullname,
        telegram: askerData?.telegram,
        photo: askerData?.photo,
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
