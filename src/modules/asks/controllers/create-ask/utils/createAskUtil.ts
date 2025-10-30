import { Ask, IAsk } from "../../../models/Ask.js";
import { IUser } from "../../../../auth/models/User.js";

type CreateAskInput = {
  artikul: string;
  nameukr?: string;
  quant?: number;
  com?: string;
  askerData: IUser;
  actions: string[];
};

export const createAskUtil = async ({
  artikul,
  nameukr,
  quant,
  com,
  askerData,
  actions,
}: CreateAskInput): Promise<IAsk> => {
  const ask: IAsk = new Ask({
    artikul,
    nameukr,
    quant,
    com,
    asker: askerData?._id,
    askerData,
    actions,
    status: "new",
  });

  await ask.save();
  return ask as IAsk;
};
