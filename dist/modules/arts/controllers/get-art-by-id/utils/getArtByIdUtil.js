import { Art } from "../../../models/Art.js";
export const getArtByIdUtil = async (id) => {
    const art = await Art.findById(id);
    return art;
};
