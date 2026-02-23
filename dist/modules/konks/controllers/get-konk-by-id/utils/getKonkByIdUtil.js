import { Konk } from "../../../models/Konk.js";
export const getKonkByIdUtil = async (id) => {
    const konk = await Konk.findById(id);
    return konk;
};
