import mongoose from "mongoose";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { reorderPalletGroupsSchema } from "./schemas/reorderPalletGroupsSchema.js";
import { reorderPalletGroupsUtil } from "./utils/reorderPalletGroupsUtil.js";
export const reorderPalletGroupsController = async (req, res) => {
    const parseResult = reorderPalletGroupsSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res
            .status(400)
            .json({ message: "Invalid data", errors: parseResult.error.errors });
    }
    const { orders } = parseResult.data;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { updatedCount } = await reorderPalletGroupsUtil({
            orders,
            session,
        });
        await session.commitTransaction();
        session.endSession();
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "pallet-groups",
                type: "edit",
                description: `Змінено порядок груп паллет: оновлено ${updatedCount} груп`,
            });
        }
        return res.status(200).json({
            message: "Pallet groups order updated successfully",
            data: { updatedCount },
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        const message = error instanceof Error
            ? error.message
            : "Failed to reorder pallet groups";
        return res.status(400).json({
            message,
        });
    }
};
