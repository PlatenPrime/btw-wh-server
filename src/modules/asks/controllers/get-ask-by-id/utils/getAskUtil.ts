import { Ask, IAsk } from "../../../models/Ask.js";

export const getAskUtil = async (id: string): Promise<IAsk | null> => {
  const ask: IAsk | null = await Ask.findById(id);
  return ask;
};

