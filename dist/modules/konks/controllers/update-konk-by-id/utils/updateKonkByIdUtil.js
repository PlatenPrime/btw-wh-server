import { Konk } from "../../../models/Konk.js";
export const updateKonkByIdUtil = async (input) => {
    const update = {};
    if (input.name !== undefined)
        update.name = input.name;
    if (input.title !== undefined)
        update.title = input.title;
    if (input.url !== undefined)
        update.url = input.url;
    if (input.imageUrl !== undefined)
        update.imageUrl = input.imageUrl;
    if (Object.keys(update).length === 0) {
        return Konk.findById(input.id);
    }
    const konk = await Konk.findByIdAndUpdate(input.id, update, { new: true, runValidators: true });
    return konk;
};
