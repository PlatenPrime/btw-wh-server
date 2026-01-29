import mongoose from "mongoose";
import { calculatePalletsSectorsUtil } from "../../utils/calculatePalletsSectorsUtil.js";
import { getPalletsShortForGroup } from "../../utils/getGroupPalletsShortDtoUtil.js";
import { setPalletsSchema } from "./schemas/setPalletsSchema.js";
import { setPalletsUtil } from "./utils/setPalletsUtil.js";
export const setPalletsController = async (req, res) => {
    const parseResult = setPalletsSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res
            .status(400)
            .json({ message: "Invalid data", errors: parseResult.error.errors });
    }
    const { groupId, palletIds } = parseResult.data;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const group = await setPalletsUtil({
            groupId,
            palletIds,
            session,
        });
        await session.commitTransaction();
        session.endSession();
        await calculatePalletsSectorsUtil({ groupIds: [group._id] });
        const pallets = await getPalletsShortForGroup(group);
        return res.status(200).json({
            message: "Pallets set for group successfully",
            data: {
                id: group._id.toString(),
                title: group.title,
                order: group.order,
                pallets,
            },
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: error.message || "Failed to set pallets for group",
        });
    }
};
