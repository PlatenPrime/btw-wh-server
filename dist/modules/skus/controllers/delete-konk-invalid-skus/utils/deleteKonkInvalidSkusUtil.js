import { Sku } from "../../../models/Sku.js";
export async function deleteKonkInvalidSkusUtil(konkName) {
    const res = await Sku.deleteMany({ konkName, isInvalid: true });
    return { deletedCount: res.deletedCount };
}
