import { Zone } from "../../../models/Zone.js";
export const updateZoneByIdUtil = async ({ id, updateData, }) => {
    const updatedZone = await Zone.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return updatedZone;
};
