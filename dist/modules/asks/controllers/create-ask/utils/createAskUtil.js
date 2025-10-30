import { Ask } from "../../../models/Ask.js";
export const createAskUtil = async ({ artikul, nameukr, quant, com, askerData, actions, }) => {
    const ask = new Ask({
        artikul,
        nameukr,
        quant,
        com,
        asker: askerData?._id,
        askerData,
        actions,
        status: "new",
    });
    await ask.save();
    return ask;
};
