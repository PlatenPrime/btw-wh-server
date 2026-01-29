import { mapPalletToShortDto } from "../../../pallets/utils/mapPalletToShortDto.js";
import { sortPalletsByTitle } from "../../../pallets/utils/sortPalletsByTitle.js";
import { getFreePalletsUtil } from "./utils/getFreePalletsUtil.js";
export const getFreePalletsController = async (req, res) => {
    try {
        const pallets = await getFreePalletsUtil();
        const copy = [...pallets];
        sortPalletsByTitle(copy);
        const data = copy.map((p) => mapPalletToShortDto(p));
        return res.status(200).json({
            message: "Free pallets fetched successfully",
            data,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch free pallets";
        return res.status(500).json({
            message,
        });
    }
};
