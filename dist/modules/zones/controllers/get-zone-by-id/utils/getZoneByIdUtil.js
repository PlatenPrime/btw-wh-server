import { Zone } from "../../../models/Zone.js";
export const getZoneByIdUtil = async (id) => {
    const zone = await Zone.findById(id);
    return zone;
};
