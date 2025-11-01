import { Pallet } from "../../../models/Pallet.js";
export const getPalletByTitleUtil = async (title) => {
    const pallet = await Pallet.findOne({ title: title.trim() }).populate({
        path: "poses",
        options: { sort: { artikul: 1 } },
    });
    return pallet;
};
