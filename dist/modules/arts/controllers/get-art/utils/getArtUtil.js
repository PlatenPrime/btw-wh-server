import { Art } from "../../../models/Art.js";
export const getArtUtil = async (artikul) => {
    const art = await Art.findOne({ artikul: artikul });
    return art;
};
