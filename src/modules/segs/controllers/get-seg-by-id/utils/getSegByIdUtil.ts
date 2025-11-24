import mongoose from "mongoose";
import { ISeg, Seg } from "../../../models/Seg.js";

type GetSegByIdInput = {
  id: string;
};

export const getSegByIdUtil = async ({
  id,
}: GetSegByIdInput): Promise<ISeg | null> => {
  const objectId = new mongoose.Types.ObjectId(id);
  const seg = await Seg.findById(objectId).exec();
  return seg;
};

