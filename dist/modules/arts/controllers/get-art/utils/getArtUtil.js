import { Art } from "../../../models/Art.js";
import { Prod } from "../../../../prods/models/Prod.js";
export const getArtUtil = async (artikul) => {
    const art = await Art.findOne({ artikul }).lean();
    if (!art)
        return null;
    let prod = null;
    const prodName = typeof art.prodName === "string" ? art.prodName.trim() : "";
    if (prodName) {
        const doc = await Prod.findOne({ name: prodName })
            .select("name title imageUrl")
            .lean();
        if (doc) {
            prod = {
                name: doc.name,
                title: doc.title,
                imageUrl: doc.imageUrl,
            };
        }
    }
    return { ...art, prod };
};
