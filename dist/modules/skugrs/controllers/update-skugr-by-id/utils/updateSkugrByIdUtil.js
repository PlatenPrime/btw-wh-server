import { Skugr } from "../../../models/Skugr.js";
export const updateSkugrByIdUtil = async (input) => {
    const update = {};
    if (input.konkName !== undefined)
        update.konkName = input.konkName;
    if (input.prodName !== undefined)
        update.prodName = input.prodName;
    if (input.title !== undefined)
        update.title = input.title;
    if (input.url !== undefined)
        update.url = input.url;
    if (Object.keys(update).length === 0) {
        return Skugr.findById(input.id);
    }
    const skugr = await Skugr.findByIdAndUpdate(input.id, update, {
        new: true,
        runValidators: true,
    });
    return skugr;
};
