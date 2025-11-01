import { Pos } from "../../../../poses/models/Pos.js";
import { Row } from "../../../../rows/models/Row.js";
import { Pallet } from "../../../models/Pallet.js";
export const deletePalletUtil = async ({ palletId, session, }) => {
    const pallet = await Pallet.findById(palletId).session(session);
    if (!pallet) {
        throw new Error("Pallet not found");
    }
    // Удаление связанных poses
    if (pallet.poses && pallet.poses.length > 0) {
        await Pos.deleteMany({ _id: { $in: pallet.poses } }).session(session);
    }
    // Обновление Row - удаление ссылки на паллету
    const row = await Row.findById(pallet.row._id).session(session);
    if (row) {
        row.pallets = row.pallets.filter((pid) => pid.toString() !== palletId);
        await row.save({ session });
    }
    // Удаление паллеты
    await Pallet.findByIdAndDelete(palletId).session(session);
};
