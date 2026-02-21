import { Prod } from "../../../models/Prod.js";
export const updateProdByIdUtil = async (input) => {
    const update = {};
    if (input.name !== undefined)
        update.name = input.name;
    if (input.title !== undefined)
        update.title = input.title;
    if (input.imageUrl !== undefined)
        update.imageUrl = input.imageUrl;
    if (Object.keys(update).length === 0) {
        return Prod.findById(input.id);
    }
    const prod = await Prod.findByIdAndUpdate(input.id, update, { new: true, runValidators: true });
    return prod;
};
