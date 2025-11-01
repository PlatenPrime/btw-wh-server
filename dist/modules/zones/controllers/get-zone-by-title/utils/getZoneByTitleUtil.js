import { Zone } from "../../../models/Zone.js";
export const getZoneByTitleUtil = async (title) => {
    const zone = await Zone.findOne({ title: title.trim() });
    return zone;
};
