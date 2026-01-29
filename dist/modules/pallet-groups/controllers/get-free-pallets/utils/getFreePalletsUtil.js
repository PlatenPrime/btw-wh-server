import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
const PALLET_PROJECTION = "_id title sector poses isDef";
/**
 * Returns pallets whose _id is not in any PalletGroup.pallets (source of truth: groups).
 */
export const getFreePalletsUtil = async () => {
    const groups = await PalletGroup.find({}).select("pallets").lean().exec();
    const palletIdsInGroups = new Set();
    for (const group of groups) {
        for (const id of group.pallets) {
            palletIdsInGroups.add(id);
        }
    }
    const pallets = await Pallet.find({
        _id: { $nin: Array.from(palletIdsInGroups) },
    })
        .select(PALLET_PROJECTION)
        .lean()
        .exec();
    return pallets;
};
