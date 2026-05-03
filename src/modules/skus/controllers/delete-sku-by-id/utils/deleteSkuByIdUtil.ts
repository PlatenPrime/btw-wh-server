import mongoose from "mongoose";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { ISku, Sku } from "../../../models/Sku.js";

export const deleteSkuByIdUtil = async (id: string): Promise<ISku | null> => {
  const session = await mongoose.startSession();
  try {
    let deleted: ISku | null = null;
    await session.withTransaction(async () => {
      const sku = await Sku.findById(id).session(session);
      if (!sku) {
        return;
      }
      await Skugr.updateMany(
        { skus: sku._id },
        { $pull: { skus: sku._id } },
        { session },
      );
      deleted = await Sku.findByIdAndDelete(id).session(session);
    });
    return deleted;
  } finally {
    await session.endSession();
  }
};
