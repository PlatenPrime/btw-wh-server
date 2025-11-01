import { Zone } from "../../../models/Zone.js";
export const checkZoneDuplicatesUtil = async (zoneData) => {
    const existingZone = await Zone.findOne({
        $or: [{ title: zoneData.title }, { bar: zoneData.bar }],
    });
    return existingZone;
};
