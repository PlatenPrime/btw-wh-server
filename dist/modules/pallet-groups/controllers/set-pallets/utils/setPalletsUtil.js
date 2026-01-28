import mongoose from "mongoose";
import { PalletGroup, } from "../../../models/PalletGroup.js";
import { calculatePalletsSectorsUtil } from "../../../utils/calculatePalletsSectorsUtil.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
export const setPalletsUtil = async ({ groupId, palletIds, session, }) => {
    const group = await PalletGroup.findById(groupId).session(session);
    if (!group) {
        throw new Error("Pallet group not found");
    }
    const palletObjectIds = palletIds.map((id) => new mongoose.Types.ObjectId(id));
    const pallets = await Pallet.find({
        _id: { $in: palletObjectIds },
    })
        .session(session)
        .exec();
    if (pallets.length !== palletObjectIds.length) {
        throw new Error("One or more pallets not found");
    }
    const conflictingPallets = await Pallet.find({
        _id: { $in: palletObjectIds },
        "palgr.id": { $exists: true, $ne: group._id },
    })
        .session(session)
        .exec();
    if (conflictingPallets.length > 0) {
        const ids = conflictingPallets.map((p) => p._id.toString()).join(", ");
        throw new Error(`Pallets already belong to other groups: ${ids}`);
    }
    const previousPalletIds = group.pallets.map((id) => id.toString());
    group.pallets = palletObjectIds;
    await group.save({ session });
    const removedPalletIds = previousPalletIds.filter((id) => !palletIds.includes(id));
    if (removedPalletIds.length > 0) {
        await Pallet.updateMany({
            _id: {
                $in: removedPalletIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
        }, {
            $set: { sector: 0 },
            $unset: { palgr: "" },
        }, { session });
    }
    await calculatePalletsSectorsUtil({
        groupIds: [group._id],
    });
    return group;
};
