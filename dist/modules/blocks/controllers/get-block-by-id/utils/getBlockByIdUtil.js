import mongoose from "mongoose";
import { Block } from "../../../models/Block.js";
export const getBlockByIdUtil = async ({ id, }) => {
    const objectId = new mongoose.Types.ObjectId(id);
    const block = await Block.findById(objectId).exec();
    return block;
};
