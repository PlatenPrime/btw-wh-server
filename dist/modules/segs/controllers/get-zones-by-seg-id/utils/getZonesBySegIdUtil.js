import mongoose from "mongoose";
import { Zone } from "../../../../zones/models/Zone.js";
export const getZonesBySegIdUtil = async ({ segId, }) => {
    const objectId = new mongoose.Types.ObjectId(segId);
    const zones = await Zone.find({ "seg.id": objectId }).exec();
    return zones;
};
