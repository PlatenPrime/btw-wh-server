import { Zone } from "../../../models/Zone.js";
export const deleteZoneByIdUtil = async (id) => {
    const deletedZone = await Zone.findByIdAndDelete(id);
    return deletedZone;
};
