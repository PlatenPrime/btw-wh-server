import { logModuleError, logModuleInfo } from "../../../logging/logModuleError.js";
/**
 * Объединяет позиции по артикулу, суммируя количество и коробки
 * @param poses - Массив позиций для объединения
 * @returns Объект, где ключи - артикулы, значения - объединенные данные позиций
 */
export function mergePoses(poses) {
    const startTime = performance.now();
    try {
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
        logModuleInfo("poses", "merge poses completed", {
            executionTimeMs: Number(executionTime.toFixed(2)),
            poseCount: poses.length,
            uniqueArtikulCount: Object.keys(mergedPoses).length,
        });
        return mergedPoses;
    }
    catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        logModuleError("poses", error, "failed to merge poses", {
            executionTimeMs: Number(executionTime.toFixed(2)),
        });
        throw new Error("Не удалось объединить позиции");
    }
}
