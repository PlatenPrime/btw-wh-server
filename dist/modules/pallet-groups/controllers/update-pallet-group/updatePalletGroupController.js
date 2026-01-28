import mongoose from "mongoose";
import { updatePalletGroupSchema } from "./schemas/updatePalletGroupSchema.js";
import { updatePalletGroupUtil } from "./utils/updatePalletGroupUtil.js";
export const updatePalletGroupController = async (req, res) => {
    const body = {
        id: req.params.id,
        ...req.body,
    };
    const parseResult = updatePalletGroupSchema.safeParse(body);
    if (!parseResult.success) {
        return res
            .status(400)
            .json({ message: "Invalid data", errors: parseResult.error.errors });
    }
    const { id, title, order } = parseResult.data;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const updated = await updatePalletGroupUtil({
            id,
            title,
            order,
            session,
        });
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({
            message: "Pallet group updated successfully",
            data: {
                id: updated._id.toString(),
                title: updated.title,
                order: updated.order,
                pallets: updated.pallets.map((palletId) => palletId.toString()),
            },
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: error.message || "Failed to update pallet group",
        });
    }
};
