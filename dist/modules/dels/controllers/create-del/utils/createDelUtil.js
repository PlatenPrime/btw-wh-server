import { Del } from "../../../models/Del.js";
export const createDelUtil = async (input) => {
    const del = await Del.create({
        title: input.title,
        artikuls: input.artikuls ?? {},
    });
    return del;
};
