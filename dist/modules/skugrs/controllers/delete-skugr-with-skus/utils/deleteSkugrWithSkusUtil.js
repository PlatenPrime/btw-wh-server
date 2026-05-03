import mongoose from "mongoose";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";
export const deleteSkugrWithSkusUtil = async (id) => {
    const target = await Skugr.findById(id).select("skus").lean();
    if (!target) {
        return null;
    }
    const skuIds = (target.skus ?? []);
    const targetOid = new mongoose.Types.ObjectId(id);
    const session = await mongoose.startSession();
    try {
        let deletedSkusCount = 0;
        let modifiedSkugrsCount = 0;
        await session.withTransaction(async () => {
            if (skuIds.length > 0) {
                const pullRes = await Skugr.updateMany({ _id: { $ne: targetOid }, skus: { $in: skuIds } }, { $pullAll: { skus: skuIds } }, { session });
                modifiedSkugrsCount = pullRes.modifiedCount ?? 0;
                const delRes = await Sku.deleteMany({ _id: { $in: skuIds } }, { session });
                deletedSkusCount = delRes.deletedCount ?? 0;
            }
            await Skugr.findByIdAndDelete(id).session(session);
        });
        return { deletedSkusCount, modifiedSkugrsCount };
    }
    finally {
        await session.endSession();
    }
};
