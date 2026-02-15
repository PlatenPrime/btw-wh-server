import { Del } from "../../../models/Del.js";
/**
 * Возвращает список поставок без поля artikuls (только название и даты).
 */
export const getAllDelsUtil = async () => {
    const list = await Del.find()
        .select("title createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();
    return list;
};
