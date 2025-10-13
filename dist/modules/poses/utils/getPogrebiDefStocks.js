import { Pos } from "../models/Pos.js";
import { mergePoses } from "./mergePoses.js";
/**

 * @returns Объект с объединенными позициями по артикулам
 */
export async function getPogrebiDefStocks() {
    try {
        // Находим все позиции склада с ненулевым количеством
        const poses = await Pos.find({
            sklad: "pogrebi",
            "palletData.isDef": true,
            quant: { $ne: 0 },
        }).exec();
        // Сортируем позиции по артикулу для предсказуемого порядка обработки
        const sortedPoses = poses.sort((a, b) => a.artikul.localeCompare(b.artikul));
        const stocks = mergePoses(sortedPoses);
        return stocks;
    }
    catch (error) {
        console.error(`Ошибка при получении отслеживаемых позиций склада pogrebi:`, error);
        throw error;
    }
}
