import { Ask, IAsk } from "../../../models/Ask.js";

export const getAsksByDateUtil = async (date: string): Promise<IAsk[]> => {
  const targetDate = new Date(date);

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const asks = await Ask.find({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ createdAt: -1 });

  return asks;
};

