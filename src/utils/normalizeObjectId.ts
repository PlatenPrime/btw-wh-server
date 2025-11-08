import { Types } from "mongoose";

export const normalizeObjectId = (
  id: Types.ObjectId | string
): Types.ObjectId => {
  if (id instanceof Types.ObjectId) {
    return id;
  }

  return new Types.ObjectId(id);
};

