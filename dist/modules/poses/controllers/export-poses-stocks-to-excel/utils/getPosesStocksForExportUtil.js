import { Pos } from "../../../models/Pos.js";
export const getPosesStocksForExportUtil = async (sklad) => {
    const filter = {
        quant: { $gt: 0 },
    };
    if (sklad) {
        filter.sklad = sklad;
    }
    const poses = await Pos.find(filter)
        .select("artikul nameukr quant sklad")
        .lean();
    return poses;
};
