import { Konk } from "../../../models/Konk.js";
export const deleteKonkByIdUtil = async (id) => {
    const konk = await Konk.findByIdAndDelete(id);
    return konk;
};
