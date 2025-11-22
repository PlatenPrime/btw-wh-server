import mongoose from "mongoose";
import { Zone } from "../../../models/Zone.js";
export const getZonesByBlockIdUtil = async ({ blockId, }) => {
    const objectId = new mongoose.Types.ObjectId(blockId);
    const zones = await Zone.find({ "block.id": objectId })
        .sort({ order: 1 })
        .exec();
    return zones;
};
