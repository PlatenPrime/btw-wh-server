import mongoose from "mongoose";
import { Seg } from "../../../models/Seg.js";
export const getSegByIdUtil = async ({ id, }) => {
    const objectId = new mongoose.Types.ObjectId(id);
    const seg = await Seg.findById(objectId).exec();
    return seg;
};
