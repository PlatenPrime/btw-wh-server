import { IPallet, Pallet } from "../../../models/Pallet.js";

export const getPalletUtil = async (
  id: string
): Promise<IPallet | null> => {
  const pallet = await Pallet.findById(id).populate({
    path: "poses",
    options: { sort: { artikul: 1 } },
  });

  return pallet;
};


