import { Ask, IAsk } from "../../../models/Ask.js";

export const getAsksByArtikulUtil = async (
  artikul: string
): Promise<IAsk[]> => {
  const asks = await Ask.find({
    artikul: artikul,
  }).sort({ createdAt: -1 });

  return asks;
};
