import { Art } from "../../../models/Art.js";
export const updateArtByIdUtil = async ({ id, limit, prodName, }) => {
    const $set = {};
    if (limit !== undefined) {
        $set.limit = limit;
    }
    if (prodName !== undefined) {
        $set.prodName = prodName;
    }
    const updatedArt = await Art.findByIdAndUpdate(id, { $set }, {
        new: true,
        runValidators: true,
        select: "artikul prodName zone namerus nameukr limit marker btradeStock createdAt updatedAt",
    });
    return updatedArt;
};
