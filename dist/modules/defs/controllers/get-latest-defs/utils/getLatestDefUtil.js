import { Def } from "../../../models/Def.js";
/**
 * Получает последнюю запись расчета дефицитов из БД
 * @returns Promise<IDef | null> - последняя запись дефицитов или null если не найдена
 */
export async function getLatestDefUtil() {
    const latestDef = await Def.findOne().sort({ createdAt: -1 }).lean();
    return latestDef;
}
