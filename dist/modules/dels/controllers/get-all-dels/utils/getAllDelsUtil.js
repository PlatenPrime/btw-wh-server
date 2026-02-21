import { Del } from "../../../models/Del.js";
/**
 * Возвращает список поставок без поля artikuls (название, производитель, даты, prod).
 */
export const getAllDelsUtil = async () => {
    const list = await Del.find()
        .select("title prodName prod createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();
    return list;
};
