import { Zone } from "../../../models/Zone.js";
export const checkZoneDuplicatesUpdateUtil = async ({ id, updateData, }) => {
    const duplicateQuery = {
        _id: { $ne: id },
    };
    if (updateData.title) {
        duplicateQuery.title = updateData.title;
    }
    if (updateData.bar !== undefined) {
        duplicateQuery.bar = updateData.bar;
    }
    const duplicateZone = await Zone.findOne(duplicateQuery);
    return duplicateZone;
};
