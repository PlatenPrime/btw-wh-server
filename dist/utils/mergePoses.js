import { Pos } from "../modules/poses/models/Pos.js";
/**
 * Объединяет позиции по артикулу, суммируя количество и коробки
 * @param sklad - Склад для фильтрации (по умолчанию "pogrebi")
 * @returns Promise с объектом, где ключи - артикулы, значения - объединенные данные позиций
 */
export async function mergePoses(sklad = "pogrebi") {
    const startTime = performance.now();
    try {
        // Находим все позиции с указанным складом и ненулевым количеством
        const poses = await Pos.find({
            sklad: sklad,
            quant: { $ne: 0, $exists: true },
        }).exec();
        // Группируем позиции по артикулу и суммируем значения
        const mergedPoses = {};
        poses.forEach((pos) => {
            const artikul = pos.artikul;
            if (!mergedPoses[artikul]) {
                // Создаем новую запись для артикула
                mergedPoses[artikul] = {
                    nameukr: pos.nameukr,
                    quant: pos.quant || 0,
                    boxes: pos.boxes || 0,
                };
            }
            else {
                // Суммируем с существующей записью
                mergedPoses[artikul].quant += pos.quant || 0;
                mergedPoses[artikul].boxes += pos.boxes || 0;
                // Если у текущей позиции есть nameukr, а у объединенной нет, используем его
                if (!mergedPoses[artikul].nameukr && pos.nameukr) {
                    mergedPoses[artikul].nameukr = pos.nameukr;
                }
            }
        });
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        console.log(`mergePoses выполнена за ${executionTime.toFixed(2)}ms. Обработано ${poses.length} позиций, объединено в ${Object.keys(mergedPoses).length} уникальных артикулов.`);
        return mergedPoses;
    }
    catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        console.error(`Ошибка при объединении позиций (выполнение заняло ${executionTime.toFixed(2)}ms):`, error);
        throw new Error("Не удалось объединить позиции");
    }
}
