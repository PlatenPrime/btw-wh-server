import { Kask } from "../../../models/Kask.js";
export const getKasksByDateUtil = async (date) => {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    return Kask.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });
};
