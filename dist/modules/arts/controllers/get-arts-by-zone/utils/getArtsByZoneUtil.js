import { Art } from "../../../models/Art.js";
export const getArtsByZoneUtil = async (zone) => {
    const arts = await Art.find({ zone }).sort({ artikul: 1 });
    return arts;
};
