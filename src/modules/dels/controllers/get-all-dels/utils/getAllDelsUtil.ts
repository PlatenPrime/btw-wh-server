import { Del, IDel, IDelProd } from "../../../models/Del.js";

export type DelListItem = Pick<
  IDel,
  "title" | "prodName" | "createdAt" | "updatedAt"
> & {
  _id: IDel["_id"];
  prod?: IDelProd;
};

/**
 * Возвращает список поставок без поля artikuls (название, производитель, даты, prod).
 */
export const getAllDelsUtil = async (): Promise<DelListItem[]> => {
  const list = await Del.find()
    .select("title prodName prod createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();
  return list as DelListItem[];
};
