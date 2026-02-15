import { Del, IDel } from "../../../models/Del.js";

export type DelListItem = Pick<IDel, "title" | "createdAt" | "updatedAt"> & {
  _id: IDel["_id"];
};

/**
 * Возвращает список поставок без поля artikuls (только название и даты).
 */
export const getAllDelsUtil = async (): Promise<DelListItem[]> => {
  const list = await Del.find()
    .select("title createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();
  return list as DelListItem[];
};
