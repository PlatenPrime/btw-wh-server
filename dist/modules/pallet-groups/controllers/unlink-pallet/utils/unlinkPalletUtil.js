import mongoose from "mongoose";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
export const unlinkPalletUtil = async ({ palletId, session, }) => {
    const palletObjectId = new mongoose.Types.ObjectId(palletId);
    const group = await PalletGroup.findOne({
        pallets: palletObjectId,
    }).session(session);
    if (!group) {
        return null;
    }
    group.pallets = group.pallets.filter((id) => !id.equals(palletObjectId));
    await group.save({ session });
    await Pallet.updateOne({ _id: palletObjectId }, {
        $set: { sector: 0 },
        $unset: { palgr: "" },
    }, { session });
    return group;
};
