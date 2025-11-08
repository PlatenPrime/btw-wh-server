import { Types } from "mongoose";
export const normalizeObjectId = (id) => {
    if (id instanceof Types.ObjectId) {
        return id;
    }
    return new Types.ObjectId(id);
};
