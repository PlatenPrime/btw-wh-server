import { Pallet } from "../../../models/Pallet.js";
import { serializeIds } from "../../../utils/serialize-ids.js";
export const createPalletUtil = async ({ title, rowId, sector, isDef, rowData, session, }) => {
    const created = await Pallet.create([
        {
            title,
            row: rowData._id,
            rowData: { _id: rowData._id, title: rowData.title },
            poses: [],
            sector: sector ?? 0,
            isDef,
        },
    ], { session });
    if (!created || !created[0]) {
        throw new Error("Failed to create pallet");
    }
    rowData.pallets.push(created[0]._id);
    await rowData.save({ session });
    return serializeIds(created[0].toObject());
};
