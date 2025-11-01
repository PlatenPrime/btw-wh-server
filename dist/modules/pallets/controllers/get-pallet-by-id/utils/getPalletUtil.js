import { Pallet } from "../../../models/Pallet.js";
export const getPalletUtil = async (id) => {
    const pallet = await Pallet.findById(id).populate({
        path: "poses",
        options: { sort: { artikul: 1 } },
    });
    return pallet;
};
