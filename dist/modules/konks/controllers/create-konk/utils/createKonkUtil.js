import { Konk } from "../../../models/Konk.js";
export const createKonkUtil = async (input) => {
    const konk = await Konk.create({
        name: input.name,
        title: input.title,
        url: input.url,
        imageUrl: input.imageUrl,
    });
    return konk;
};
