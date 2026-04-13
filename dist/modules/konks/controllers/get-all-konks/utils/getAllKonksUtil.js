import { Konk } from "../../../models/Konk.js";
export const getAllKonksUtil = async () => {
    const list = await Konk.find().sort({ title: 1 }).lean();
    return list;
};
