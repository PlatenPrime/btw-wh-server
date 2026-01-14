import { Ask } from "../../../models/Ask.js";
export const getAsksByArtikulUtil = async (artikul) => {
    const asks = await Ask.find({
        artikul: artikul,
    }).sort({ createdAt: -1 });
    return asks;
};
