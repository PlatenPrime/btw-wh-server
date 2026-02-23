import { Konk } from "../../../models/Konk.js";
export const getKonkByNameUtil = async (name) => {
    const konk = await Konk.findOne({ name });
    return konk;
};
