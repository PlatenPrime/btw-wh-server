import { Pos } from "../../../../poses/models/Pos.js";
import { Pallet } from "../../../models/Pallet.js";
export const deletePalletPosesUtil = async ({ palletId, session, }) => {
    const pallet = await Pallet.findById(palletId).session(session);
    if (!pallet) {
        throw new Error("Pallet not found");
    }
    if (pallet.poses && pallet.poses.length > 0) {
        await Pos.deleteMany({ _id: { $in: pallet.poses } }).session(session);
        pallet.poses = [];
    }
    await pallet.save({ session });
};
