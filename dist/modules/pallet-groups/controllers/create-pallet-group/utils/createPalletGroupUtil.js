import { PalletGroup } from "../../../models/PalletGroup.js";
export const createPalletGroupUtil = async ({ title, order, session, }) => {
    const existingWithTitle = await PalletGroup.findOne({ title }).session(session);
    if (existingWithTitle) {
        throw new Error("Pallet group with this title already exists");
    }
    const allGroups = await PalletGroup.find({})
        .sort({ order: 1 })
        .session(session);
    const totalGroups = allGroups.length;
    const targetOrder = order && Number.isInteger(order) && order > 0 && order <= totalGroups + 1
        ? order
        : totalGroups + 1;
    const targetIndex = targetOrder - 1;
    if (targetIndex < totalGroups) {
        for (let index = targetIndex; index < totalGroups; index += 1) {
            const group = allGroups[index];
            group.order = group.order + 1;
            await group.save({ session });
        }
    }
    const createdGroup = await PalletGroup.create([
        {
            title,
            order: targetOrder,
            pallets: [],
        },
    ], { session });
    return createdGroup[0];
};
