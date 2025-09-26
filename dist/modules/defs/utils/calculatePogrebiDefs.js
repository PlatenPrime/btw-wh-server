import { getPogrebiDefStocks } from "../../poses/utils/getPogrebiDefStocks.js";
import { getSharikStocks, } from "../../poses/utils/getSharikStocks.js";
import { Defcalc } from "../models/Defcalc.js";
import { filterDeficits } from "./filterDeficits.js";
import { getArtLimits } from "./getArtLimits.js";
import { sendDefCalculationCompleteNotification, sendDefCalculationErrorNotification, sendDefCalculationStartNotification, } from "./sendDefNotifications.js";
export async function calculatePogrebiDefs() {
    const pogrebiDefStocks = await getPogrebiDefStocks();
    const artikuls = Object.keys(pogrebiDefStocks);
    const limits = await getArtLimits(artikuls);
    const defs = await getSharikStocks(pogrebiDefStocks, limits);
    const filteredDefs = filterDeficits(defs);
    return filteredDefs;
}
/**
 * Выполняет расчет дефицитов и сохраняет результат в базу данных
 * @returns Promise<IDefcalc> - сохраненный документ с результатами расчета
 * @throws Error - если произошла ошибка при расчете или сохранении
 */
export async function calculateAndSavePogrebiDefs() {
    try {
        // Отправляем уведомление о начале расчета
        await sendDefCalculationStartNotification();
        // Выполняем расчет дефицитов
        const result = await calculatePogrebiDefs();
        // Создаем и сохраняем документ в базу данных
        const defcalc = new Defcalc({
            result,
        });
        const savedDefcalc = await defcalc.save();
        // Отправляем уведомление о завершении с результатами
        await sendDefCalculationCompleteNotification(result);
        return savedDefcalc;
    }
    catch (error) {
        console.error("Error in calculateAndSavePogrebiDefs:", error);
        // Отправляем уведомление об ошибке
        await sendDefCalculationErrorNotification(error);
        throw new Error(`Failed to calculate and save pogrebi deficits: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
