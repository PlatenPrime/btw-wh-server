import { Zone } from "../../zones/models/Zone.js";
import { Block } from "../models/Block.js";
// Константа для разделения секторов между блоками
const SECTOR_MULTIPLIER = 1000;
/**
 * Рассчитывает и обновляет сектора всех зон на основе позиций блоков и зон внутри них
 * Формула: sector = blockOrder * SECTOR_MULTIPLIER + zoneOrder
 * Зоны без блока получают sector = 0
 */
export const calculateZonesSectorsUtil = async () => {
    // 1. Получить все блоки, отсортированные по order
    const blocks = await Block.find({}).sort({ order: 1 }).exec();
    // 2. Получить все зоны
    const allZones = await Zone.find({}).exec();
    // 3. Подготовить операции для bulkWrite
    const operations = [];
    // 4. Рассчитать сектора для зон в блоках
    for (const block of blocks) {
        // Получить все зоны этого блока, отсортированные по order
        const blockZones = allZones
            .filter((zone) => zone.block?.id &&
            zone.block.id.toString() === block._id.toString() &&
            zone.order !== undefined)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        // Рассчитать сектор для каждой зоны в блоке
        blockZones.forEach((zone, index) => {
            const sector = block.order * SECTOR_MULTIPLIER + index;
            operations.push({
                updateOne: {
                    filter: { _id: zone._id },
                    update: { $set: { sector } },
                },
            });
        });
    }
    // 5. Установить sector = 0 для всех зон без блока
    const zonesWithoutBlock = allZones.filter((zone) => !zone.block || !zone.block.id);
    zonesWithoutBlock.forEach((zone) => {
        operations.push({
            updateOne: {
                filter: { _id: zone._id },
                update: { $set: { sector: 0 } },
            },
        });
    });
    // 6. Выполнить bulkWrite для обновления секторов
    if (operations.length > 0) {
        await Zone.bulkWrite(operations);
    }
    return {
        updatedZones: operations.length,
        blocksProcessed: blocks.length,
    };
};
