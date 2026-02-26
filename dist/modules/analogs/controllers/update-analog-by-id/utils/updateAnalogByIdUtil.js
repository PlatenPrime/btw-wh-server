import { Art } from "../../../../arts/models/Art.js";
import { Analog } from "../../../models/Analog.js";
export const updateAnalogByIdUtil = async (input) => {
    const update = {};
    const updatable = [
        "konkName",
        "prodName",
        "artikul",
        "nameukr",
        "url",
        "title",
        "imageUrl",
    ];
    for (const key of updatable) {
        const val = input[key];
        if (val !== undefined)
            update[key] = val;
    }
    if (input.artikul !== undefined && input.artikul.trim() !== "") {
        const art = await Art.findOne({ artikul: input.artikul }).lean();
        update.nameukr = art?.nameukr ?? "";
    }
    if (Object.keys(update).length === 0) {
        return Analog.findById(input.id);
    }
    const analog = await Analog.findByIdAndUpdate(input.id, update, { new: true, runValidators: true });
    return analog;
};
