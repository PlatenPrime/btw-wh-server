import { Art } from "../../../models/Art.js";
export const updateArtLimitUtil = async ({ id, limit, }) => {
    const updatedArt = await Art.findByIdAndUpdate(id, { limit }, {
        new: true,
        runValidators: true,
        select: "artikul zone namerus nameukr limit marker btradeStock createdAt updatedAt",
    });
    return updatedArt;
};
