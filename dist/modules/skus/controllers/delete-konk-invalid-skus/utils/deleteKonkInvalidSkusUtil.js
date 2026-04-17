import { Sku } from "../../../models/Sku.js";
const ALL_KONKS = "all";
export async function deleteKonkInvalidSkusUtil(konkName) {
    const filter = konkName === ALL_KONKS
        ? { isInvalid: true }
        : { konkName, isInvalid: true };
    const res = await Sku.deleteMany(filter);
    return { deletedCount: res.deletedCount };
}
