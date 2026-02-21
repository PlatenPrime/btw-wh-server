import { Del, IDel } from "../../../models/Del.js";

export type DelListItem = Pick<
  IDel,
  "title" | "prodName" | "createdAt" | "updatedAt"
> & {
  _id: IDel["_id"];
};

/**
 * Возвращает список поставок без поля artikuls (название, производитель, даты).
 */
export const getAllDelsUtil = async (): Promise<DelListItem[]> => {
  const list = await Del.find()
    .select("title prodName createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();
  return list as DelListItem[];
};
