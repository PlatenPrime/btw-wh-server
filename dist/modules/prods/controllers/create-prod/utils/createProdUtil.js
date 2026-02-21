import { Prod } from "../../../models/Prod.js";
export const createProdUtil = async (input) => {
    const prod = await Prod.create({
        name: input.name,
        title: input.title,
        imageUrl: input.imageUrl,
    });
    return prod;
};
