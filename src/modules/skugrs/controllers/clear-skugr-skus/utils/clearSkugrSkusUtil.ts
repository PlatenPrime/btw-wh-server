import { ISkugr, Skugr } from "../../../models/Skugr.js";

export const clearSkugrSkusUtil = async (id: string): Promise<ISkugr | null> => {
  return Skugr.findByIdAndUpdate(
    id,
    { $set: { skus: [] } },
    { returnDocument: "after", runValidators: true },
  );
};
