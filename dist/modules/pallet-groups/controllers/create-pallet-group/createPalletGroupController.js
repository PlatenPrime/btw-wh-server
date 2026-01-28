import mongoose from "mongoose";
import { createPalletGroupSchema } from "./schemas/createPalletGroupSchema.js";
import { createPalletGroupUtil } from "./utils/createPalletGroupUtil.js";
export const createPalletGroupController = async (req, res) => {
    const parseResult = createPalletGroupSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            message: "Invalid data",
            errors: parseResult.error.errors,
        });
    }
    const { title, order } = parseResult.data;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const group = await createPalletGroupUtil({
            title,
            order,
            session,
        });
        await session.commitTransaction();
        session.endSession();
        return res.status(201).json({
            message: "Pallet group created successfully",
            data: {
                id: group._id.toString(),
                title: group.title,
                order: group.order,
                pallets: [],
            },
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error instanceof Error &&
            error.message === "Pallet group with this title already exists") {
            return res.status(409).json({
                message: error.message,
            });
        }
        return res.status(400).json({
            message: error?.message || "Failed to create pallet group",
        });
    }
};
