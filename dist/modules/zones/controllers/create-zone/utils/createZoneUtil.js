import { Zone } from "../../../models/Zone.js";
export const createZoneUtil = async (zoneData) => {
    const zone = new Zone(zoneData);
    await zone.save();
    return zone;
};
